"""
AI VOICE INDIA — Authentication & Subscription Service
Handles password hashing (bcrypt), JWT creation/verification,
user CRUD operations, monthly billing cycles, and credit-based quota enforcement.
"""

import os
import sys
from pathlib import Path
from datetime import datetime, timedelta, timezone
from typing import Optional

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent
for p in (str(ROOT_DIR), str(BASE_DIR)):
    if p not in sys.path:
        sys.path.insert(0, p)

from jose import JWTError, jwt
from fastapi import HTTPException, status

from database import get_db
from plans import get_plan, PLANS

# ── Password Hashing ────────────────────────────────────────────────────────
import bcrypt as _bcrypt


def hash_password(plain: str) -> str:
    """Hash a plaintext password using bcrypt with 12 work factor rounds."""
    if isinstance(plain, str):
        plain_bytes = plain.encode("utf-8")
    else:
        plain_bytes = plain
    salt = _bcrypt.gensalt(rounds=12)
    return _bcrypt.hashpw(plain_bytes, salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plaintext password against its bcrypt hash."""
    try:
        if not plain or not hashed:
            return False
        hashed_bytes = hashed.strip().encode("utf-8") if isinstance(hashed, str) else hashed
        plain_bytes = plain.encode("utf-8") if isinstance(plain, str) else plain
        return _bcrypt.checkpw(plain_bytes, hashed_bytes)
    except Exception as err:
        print(f"[Auth] Password verification error: {type(err).__name__}: {err}")
        return False


# ── JWT Config ───────────────────────────────────────────────────────────────
def _get_secret() -> str:
    secret = os.environ.get("JWT_SECRET_KEY", "")
    if not secret:
        print("[WARNING] JWT_SECRET_KEY is not set in .env. Using default fallback key.")
        return "aivoiceindia-default-secret-key-change-in-production"
    return secret


JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.environ.get("JWT_EXPIRE_MINUTES", "10080")  # 7 days
)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, _get_secret(), algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """
    Decode and verify a JWT access token.
    Raises HTTPException 401 if invalid or expired.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, _get_secret(), algorithms=[JWT_ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            raise credentials_exception
        return payload
    except JWTError:
        raise credentials_exception


# ── User CRUD & Monthly Billing Lifecycle ───────────────────────────────────

async def _process_user_billing_reset(user_dict: dict) -> dict:
    """
    Inspects user's billing period and subscription expiry.
    If the monthly period has rolled over (now >= billing_period_end):
      - Resets characters_used = 0
      - Advances billing_period_start and billing_period_end (30-day window)
      - If subscription has expired, transitions plan to 'free'
    Persists updates to database and returns updated dictionary.
    """
    now = datetime.now(timezone.utc)
    needs_db_update = False

    plan_id = user_dict.get("plan", "free")
    subscription_status = user_dict.get("subscription_status", "free" if plan_id == "free" else "active")
    characters_used = user_dict.get("characters_used", 0)

    # 1. Check if subscription period has expired (for paid plans)
    if user_dict.get("subscription_expiry"):
        try:
            exp_dt = datetime.fromisoformat(user_dict["subscription_expiry"].replace("Z", "+00:00"))
            if now > exp_dt:
                plan_id = "free"
                subscription_status = "expired"
                needs_db_update = True
        except Exception:
            pass

    # 2. Check billing cycle rollover
    billing_start_str = user_dict.get("billing_period_start")
    billing_end_str = user_dict.get("billing_period_end")

    if not billing_start_str or not billing_end_str:
        billing_start_str = now.isoformat()
        billing_end_str = (now + timedelta(days=30)).isoformat()
        needs_db_update = True
    else:
        try:
            end_dt = datetime.fromisoformat(billing_end_str.replace("Z", "+00:00"))
            if now >= end_dt:
                # Billing period has concluded -> perform monthly character reset!
                print(f"[Billing] Monthly reset triggered for user ID {user_dict['id']}. Previous usage: {characters_used}")
                characters_used = 0
                while now >= end_dt:
                    end_dt = end_dt + timedelta(days=30)
                billing_start_str = (end_dt - timedelta(days=30)).isoformat()
                billing_end_str = end_dt.isoformat()
                needs_db_update = True
        except Exception as e:
            billing_start_str = now.isoformat()
            billing_end_str = (now + timedelta(days=30)).isoformat()
            needs_db_update = True

    plan_info = get_plan(plan_id)
    monthly_limit = plan_info.get("monthly_character_limit", 200)

    user_dict["plan"] = plan_id
    user_dict["subscription_status"] = subscription_status
    user_dict["characters_used"] = characters_used
    user_dict["billing_period_start"] = billing_start_str
    user_dict["billing_period_end"] = billing_end_str
    user_dict["monthly_character_limit"] = monthly_limit
    user_dict["character_limit"] = monthly_limit
    user_dict["characters_remaining"] = max(0, monthly_limit - characters_used)

    if needs_db_update:
        db = await get_db()
        try:
            await db.execute(
                """UPDATE users
                   SET plan = ?,
                       subscription_status = ?,
                       characters_used = ?,
                       billing_period_start = ?,
                       billing_period_end = ?,
                       monthly_character_limit = ?
                   WHERE id = ?""",
                (plan_id, subscription_status, characters_used, billing_start_str, billing_end_str, monthly_limit, user_dict["id"])
            )
            await db.commit()
        finally:
            await db.close()

    return user_dict


async def get_user_by_email(email: str) -> Optional[dict]:
    """Fetch a user record by email including subscription plan & live limits. Returns None if not found."""
    clean_email = (email or "").strip().lower()
    if not clean_email:
        return None
    db = await get_db()
    try:
        async with db.execute(
            """SELECT id, name, email, hashed_password, plan, subscription_expiry,
                      daily_usage_count, last_usage_date, characters_used,
                      billing_period_start, billing_period_end, subscription_status,
                      monthly_character_limit, created_at
               FROM users WHERE LOWER(TRIM(email)) = ?""",
            (clean_email,)
        ) as cursor:
            row = await cursor.fetchone()
            if row:
                user_dict = dict(row)
                return await _process_user_billing_reset(user_dict)
            return None
    finally:
        await db.close()


async def get_user_by_id(user_id: int) -> Optional[dict]:
    """Fetch a user record by ID. Returns None if not found."""
    db = await get_db()
    try:
        async with db.execute(
            """SELECT id, name, email, hashed_password, plan, subscription_expiry,
                      daily_usage_count, last_usage_date, characters_used,
                      billing_period_start, billing_period_end, subscription_status,
                      monthly_character_limit, created_at
               FROM users WHERE id = ?""",
            (user_id,)
        ) as cursor:
            row = await cursor.fetchone()
            if row:
                user_dict = dict(row)
                return await _process_user_billing_reset(user_dict)
            return None
    finally:
        await db.close()


async def update_user_plan(user_id: int, plan_id: str, days: int = 30) -> dict:
    """Update user's subscription tier, calculate expiry, and reset billing window."""
    clean_plan = (plan_id or "free").lower().strip()
    plan_info = get_plan(clean_plan)
    now = datetime.now(timezone.utc)
    expiry_date = now + timedelta(days=days)
    expiry_iso = expiry_date.isoformat()
    period_start = now.isoformat()
    period_end = expiry_iso
    monthly_limit = plan_info.get("monthly_character_limit", 200)
    status_str = "active" if clean_plan not in ["free", "basic"] else "active"

    db = await get_db()
    try:
        await db.execute(
            """UPDATE users
               SET plan = ?,
                   subscription_expiry = ?,
                   billing_period_start = ?,
                   billing_period_end = ?,
                   subscription_status = ?,
                   monthly_character_limit = ?
               WHERE id = ?""",
            (clean_plan, expiry_iso, period_start, period_end, status_str, monthly_limit, user_id)
        )
        await db.commit()
        return {
            "plan": clean_plan,
            "subscription_expiry": expiry_iso,
            "billing_period_start": period_start,
            "billing_period_end": period_end,
            "subscription_status": status_str,
            "monthly_character_limit": monthly_limit,
            "character_limit": monthly_limit
        }
    finally:
        await db.close()


async def check_and_increment_usage(user_id: int, text_length: int) -> dict:
    """
    Validates that user hasn't exceeded plan limits and increments daily usage.
    """
    user = await get_user_by_id(user_id)
    if not user:
        return {}

    plan_info = get_plan(user.get("plan", "free"))
    max_chars = plan_info.get("max_characters_per_gen", 500)
    daily_limit = plan_info.get("daily_generation_limit", 15)

    if text_length > max_chars:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Character limit exceeded. Your {plan_info['name']} allows up to {max_chars:,} characters per generation. Please upgrade your plan for higher limits."
        )

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    current_count = user.get("daily_usage_count", 0)
    last_date = user.get("last_usage_date", "")

    if last_date != today_str:
        current_count = 0

    if current_count >= daily_limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Daily generation limit reached ({daily_limit}/{daily_limit} used today on {plan_info['name']}). Upgrade your plan for higher limits."
        )

    new_count = current_count + 1
    db = await get_db()
    try:
        await db.execute(
            "UPDATE users SET daily_usage_count = ?, last_usage_date = ? WHERE id = ?",
            (new_count, today_str, user_id)
        )
        await db.commit()
        return {
            "daily_usage_count": new_count,
            "daily_limit": daily_limit,
            "remaining": daily_limit - new_count
        }
    finally:
        await db.close()


async def check_character_limit(user_id: int, char_count: int) -> dict:
    """
    Server-side character limit check for all subscription tiers.
    Validates that user has enough remaining monthly credits BEFORE audio generation.
    Returns usage info if allowed, raises HTTPException 400 if credits are insufficient.
    """
    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found."
        )

    plan_info = get_plan(user.get("plan", "basic"))
    monthly_limit = plan_info.get("monthly_character_limit", 200)
    characters_used = user.get("characters_used", 0)
    characters_remaining = max(0, monthly_limit - characters_used)

    # If insufficient credits to complete this generation request
    if characters_used + char_count > monthly_limit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "INSUFFICIENT_CREDITS",
                "message": "You have reached your monthly voice-generation limit. Please upgrade your plan.",
                "remaining_characters": characters_remaining,
                "characters_used": characters_used,
                "character_limit": monthly_limit,
                "characters_requested": char_count,
                "plan": user.get("plan", "free")
            }
        )

    return {
        "characters_used": characters_used,
        "character_limit": monthly_limit,
        "characters_remaining": characters_remaining,
        "allowed": True
    }


async def increment_characters_used(user_id: int, char_count: int) -> dict:
    """
    Increments the characters_used counter ONLY after successful audio generation.
    Must be called after TTS succeeds — never before.
    """
    db = await get_db()
    try:
        await db.execute(
            "UPDATE users SET characters_used = characters_used + ? WHERE id = ?",
            (char_count, user_id)
        )
        await db.commit()

        user = await get_user_by_id(user_id)
        plan_info = get_plan(user.get("plan", "basic"))
        monthly_limit = plan_info.get("monthly_character_limit", 200)
        new_used = user.get("characters_used", 0)
        return {
            "characters_used": new_used,
            "character_limit": monthly_limit,
            "characters_remaining": max(0, monthly_limit - new_used),
            "plan": user.get("plan", "basic")
        }
    finally:
        await db.close()


async def create_user(name: str, email: str, plain_password: str) -> dict:
    """
    Create a new user with 500 free monthly characters and active billing window.
    Raises HTTPException 409 if email already exists.
    """
    email_clean = (email or "").strip().lower()
    if not email_clean:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A valid email is required."
        )

    # Check for duplicate
    existing = await get_user_by_email(email_clean)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists."
        )

    hashed = hash_password(plain_password)
    now = datetime.now(timezone.utc)
    period_start = now.isoformat()
    period_end = (now + timedelta(days=30)).isoformat()
    plan_info = get_plan("basic")
    monthly_limit = plan_info.get("monthly_character_limit", 200)

    db = await get_db()
    try:
        cursor = await db.execute(
            """INSERT INTO users (
                   name, email, hashed_password, plan, characters_used,
                   billing_period_start, billing_period_end, subscription_status, monthly_character_limit
               ) VALUES (?, ?, ?, 'basic', 0, ?, ?, 'active', ?)""",
            (name.strip(), email_clean, hashed, period_start, period_end, monthly_limit)
        )
        await db.commit()
        user_id = cursor.lastrowid
        return {
            "id": user_id,
            "name": name.strip(),
            "email": email_clean,
            "plan": "basic",
            "characters_used": 0,
            "character_limit": monthly_limit,
            "characters_remaining": monthly_limit,
            "billing_period_start": period_start,
            "billing_period_end": period_end,
            "subscription_status": "active"
        }
    finally:
        await db.close()


async def authenticate_user(email: str, plain_password: str) -> dict:
    """
    Verify credentials and return user profile with live credit balance.
    Raises HTTPException 401 if invalid.
    """
    clean_email = (email or "").strip().lower()
    user = await get_user_by_email(clean_email)
    if not user:
        print(f"[Auth] Login failed: User '{clean_email}' does not exist in database.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )
    if not verify_password(plain_password, user["hashed_password"]):
        print(f"[Auth] Login failed: Password verification failed for user '{clean_email}'.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )
    plan_info = get_plan(user.get("plan", "basic"))
    monthly_limit = plan_info.get("monthly_character_limit", 200)
    characters_used = user.get("characters_used", 0)

    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "plan": user.get("plan", "basic"),
        "plan_details": plan_info,
        "characters_used": characters_used,
        "character_limit": monthly_limit,
        "characters_remaining": max(0, monthly_limit - characters_used),
        "billing_period_start": user.get("billing_period_start"),
        "billing_period_end": user.get("billing_period_end"),
        "subscription_status": user.get("subscription_status", "active"),
        "subscription_expiry": user.get("subscription_expiry")
    }
