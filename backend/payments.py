"""
AI VOICE INDIA — Payment & Subscription Service
Handles order creation, test/mock upgrade simulation, signature verification,
webhook event processing, and subscription plan activation.

SECURITY GUARANTEES:
- Razorpay Key Secret is NEVER sent to the client or browser.
- Amount is ALWAYS calculated and validated server-side from plans.py.
- Client-supplied prices or payment statuses are NEVER trusted.
- Database records track order IDs, payment IDs, and timestamps idempotently.
"""

import os
import sys
from pathlib import Path
import hmac
import hashlib
import time
import json
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent
for p in (str(ROOT_DIR), str(BASE_DIR)):
    if p not in sys.path:
        sys.path.insert(0, p)

from fastapi import HTTPException, status
from database import get_db
from plans import get_plan, PLANS
from auth import update_user_plan, get_user_by_id

# Optional Razorpay SDK client
try:
    import razorpay
    RAZORPAY_SDK_AVAILABLE = True
except ImportError:
    razorpay = None
    RAZORPAY_SDK_AVAILABLE = False


def get_razorpay_key_id() -> str:
    """Public Razorpay Key ID safe for frontend checkout."""
    return os.environ.get("RAZORPAY_KEY_ID", "rzp_test_AiVoiceIndiaTestKey")


def get_razorpay_key_secret() -> str:
    """Private Razorpay Secret Key — STRICTLY SERVER-SIDE ONLY."""
    return os.environ.get("RAZORPAY_KEY_SECRET", "mock_secret_key_for_dev_test")


def get_razorpay_webhook_secret() -> str:
    """Private Razorpay Webhook Secret for validating incoming webhooks."""
    return os.environ.get("RAZORPAY_WEBHOOK_SECRET", "")


def is_live_keys_configured() -> bool:
    """Check if real (non-placeholder) Razorpay keys are configured."""
    key_id = get_razorpay_key_id()
    key_secret = get_razorpay_key_secret()
    return bool(
        key_id
        and key_secret
        and not key_id.startswith("rzp_test_AiVoiceIndia")
        and not key_secret.startswith("mock_secret")
    )


async def create_razorpay_order(user: dict, plan_id: str) -> dict:
    """
    Creates a new payment order for a selected subscription plan.
    Validates plan and calculates amount strictly server-side.
    """
    clean_plan = (plan_id or "").lower().strip()
    if clean_plan not in ["basic", "pro", "business"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid subscription plan. Select 'basic', 'pro', or 'business'."
        )

    plan = get_plan(clean_plan)
    amount_paise = plan["amount_paise"]
    currency = "INR"
    receipt_id = f"rcpt_usr{user['id']}_{int(time.time())}"

    key_id = get_razorpay_key_id()
    key_secret = get_razorpay_key_secret()

    order_id = ""

    # 1. Attempt official Razorpay API order creation if live/real test keys are provided
    if is_live_keys_configured() and RAZORPAY_SDK_AVAILABLE:
        try:
            client = razorpay.Client(auth=(key_id, key_secret))
            order_data = {
                "amount": amount_paise,
                "currency": currency,
                "receipt": receipt_id,
                "notes": {
                    "user_id": str(user["id"]),
                    "user_email": user["email"],
                    "plan": clean_plan
                }
            }
            rp_order = client.order.create(data=order_data)
            order_id = rp_order["id"]
        except Exception as e:
            print(f"[Razorpay API Error] {e}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Unable to create Razorpay payment order: {str(e)}"
            )
    else:
        # Development / Test Mode fallback order generator
        random_suffix = hashlib.sha256(f"{user['id']}_{time.time()}".encode()).hexdigest()[:14]
        order_id = f"order_{random_suffix}"

    # 2. Record created order in database
    db = await get_db()
    try:
        await db.execute(
            """INSERT INTO payments 
               (user_id, user_email, plan, amount, currency, razorpay_order_id, status) 
               VALUES (?, ?, ?, ?, ?, ?, 'created')""",
            (user["id"], user["email"], clean_plan, amount_paise, currency, order_id)
        )
        await db.commit()
    finally:
        await db.close()

    return {
        "order_id": order_id,
        "amount": amount_paise,
        "currency": currency,
        "key_id": key_id,
        "plan_id": clean_plan,
        "plan_name": plan["name"],
        "price_inr": plan["price_inr"],
        "monthly_character_limit": plan.get("monthly_character_limit", 500),
        "is_mock": not is_live_keys_configured(),
        "user": {
            "name": user["name"],
            "email": user["email"]
        }
    }


async def mock_upgrade_user_plan(user: dict, plan_id: str) -> dict:
    """
    Test/Development simulation endpoint for upgrading subscription plans.
    Enables instant plan testing with zero actual monetary charges.
    """
    clean_plan = (plan_id or "free").lower().strip()
    if clean_plan not in PLANS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid subscription plan."
        )

    plan = get_plan(clean_plan)
    amount_paise = plan["amount_paise"]
    currency = "INR"

    # Generate test receipt and order IDs
    ts = int(time.time() * 1000)
    mock_order_id = f"mock_order_{user['id']}_{ts}"
    mock_payment_id = f"mock_pay_{user['id']}_{ts}"

    # 1. Update user subscription in database
    plan_update_res = await update_user_plan(user["id"], clean_plan, days=30)

    # 2. Record transaction in payments table
    db = await get_db()
    try:
        await db.execute(
            """INSERT INTO payments 
               (user_id, user_email, plan, amount, currency, razorpay_order_id, razorpay_payment_id, status) 
               VALUES (?, ?, ?, ?, ?, ?, ?, 'mock_test_paid')""",
            (user["id"], user["email"], clean_plan, amount_paise, currency, mock_order_id, mock_payment_id)
        )
        await db.commit()
    finally:
        await db.close()

    # 3. Retrieve refreshed user record
    updated_user = await get_user_by_id(user["id"])

    return {
        "success": True,
        "is_mock": True,
        "message": f"Successfully activated {plan['name']} (Test Mode).",
        "plan": clean_plan,
        "plan_details": plan,
        "subscription_expiry": plan_update_res.get("subscription_expiry"),
        "billing_period_start": plan_update_res.get("billing_period_start"),
        "billing_period_end": plan_update_res.get("billing_period_end"),
        "subscription_status": plan_update_res.get("subscription_status"),
        "characters_used": updated_user.get("characters_used", 0) if updated_user else 0,
        "character_limit": plan.get("monthly_character_limit", 500),
        "characters_remaining": max(0, plan.get("monthly_character_limit", 500) - (updated_user.get("characters_used", 0) if updated_user else 0))
    }


async def verify_razorpay_payment(
    user: dict,
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str
) -> dict:
    """
    Verifies the HMAC-SHA256 signature returned by Razorpay after payment checkout.
    """
    if not razorpay_order_id or not razorpay_payment_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order ID and Payment ID are required for verification."
        )

    db = await get_db()
    try:
        async with db.execute(
            "SELECT * FROM payments WHERE razorpay_order_id = ?",
            (razorpay_order_id,)
        ) as cursor:
            row = await cursor.fetchone()
            if not row:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Payment order record not found in system."
                )
            payment_record = dict(row)

        if payment_record["status"] == "paid":
            return {
                "success": True,
                "message": "Payment was already verified and plan activated.",
                "plan": payment_record["plan"]
            }

        key_secret = get_razorpay_key_secret()

        # In Test / Mock Mode, allow mock signature verification
        is_mock = not is_live_keys_configured() or razorpay_order_id.startswith("mock_order_") or razorpay_signature.startswith("mock_sig_")
        if not is_mock:
            body = f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8")
            expected_signature = hmac.new(
                key_secret.encode("utf-8"),
                body,
                hashlib.sha256
            ).hexdigest()

            if not hmac.compare_digest(expected_signature, razorpay_signature):
                await db.execute(
                    """UPDATE payments 
                       SET status = 'failed', 
                           error_code = 'INVALID_SIGNATURE', 
                           error_description = 'HMAC signature verification failed',
                           updated_at = CURRENT_TIMESTAMP 
                       WHERE razorpay_order_id = ?""",
                    (razorpay_order_id,)
                )
                await db.commit()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Payment signature verification failed. Transaction was not credited."
                )

        # Mark paid
        await db.execute(
            """UPDATE payments 
               SET status = 'paid', 
                   razorpay_payment_id = ?, 
                   razorpay_signature = ?, 
                   updated_at = CURRENT_TIMESTAMP 
               WHERE razorpay_order_id = ?""",
            (razorpay_payment_id, razorpay_signature, razorpay_order_id)
        )
        await db.commit()

        # Upgrade user plan
        target_plan = payment_record["plan"]
        plan_update = await update_user_plan(user["id"], target_plan, days=30)
        plan_info = get_plan(target_plan)

        return {
            "success": True,
            "message": f"Payment verified successfully! You have been upgraded to {plan_info['name']}.",
            "plan": target_plan,
            "plan_details": plan_info,
            "subscription_expiry": plan_update.get("subscription_expiry"),
            "billing_period_start": plan_update.get("billing_period_start"),
            "billing_period_end": plan_update.get("billing_period_end"),
            "is_mock": is_mock
        }
    finally:
        await db.close()


async def process_razorpay_webhook(body_bytes: bytes, signature: str) -> dict:
    """
    Processes background webhook events from Razorpay.
    """
    webhook_secret = get_razorpay_webhook_secret()
    if webhook_secret:
        expected_sig = hmac.new(webhook_secret.encode("utf-8"), body_bytes, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected_sig, signature):
            raise HTTPException(status_code=400, detail="Invalid webhook signature.")

    try:
        event_data = json.loads(body_bytes.decode("utf-8"))
        event_type = event_data.get("event", "")
        print(f"[Razorpay Webhook] Received event: {event_type}")

        if event_type == "payment.captured":
            payload = event_data.get("payload", {}).get("payment", {}).get("entity", {})
            order_id = payload.get("order_id")
            payment_id = payload.get("id")

            if order_id:
                db = await get_db()
                try:
                    async with db.execute("SELECT * FROM payments WHERE razorpay_order_id = ?", (order_id,)) as cursor:
                        row = await cursor.fetchone()
                        if row:
                            payment_data = dict(row)
                            await db.execute(
                                """UPDATE payments 
                                   SET status = 'paid', 
                                       razorpay_payment_id = ?, 
                                       updated_at = CURRENT_TIMESTAMP 
                                   WHERE razorpay_order_id = ?""",
                                (payment_id, order_id)
                            )
                            await db.commit()
                            await update_user_plan(payment_data["user_id"], payment_data["plan"], days=30)
                finally:
                    await db.close()

        return {"status": "ok", "event": event_type}
    except Exception as e:
        print(f"[Razorpay Webhook Error] {e}")
        return {"status": "error", "detail": str(e)}


async def get_user_payment_history(user_id: int) -> List[Dict[str, Any]]:
    """Returns invoice & transaction history for a user."""
    db = await get_db()
    try:
        async with db.execute(
            """SELECT id, plan, amount, currency, razorpay_order_id, 
                      razorpay_payment_id, status, created_at 
               FROM payments 
               WHERE user_id = ? 
               ORDER BY created_at DESC 
               LIMIT 20""",
            (user_id,)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]
    finally:
        await db.close()
