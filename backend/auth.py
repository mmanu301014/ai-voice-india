"""
AI VOICE INDIA — Authentication Module
Handles password hashing (bcrypt), JWT creation/verification,
and user CRUD operations.
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
    """Hash a plaintext password using bcrypt."""
    return _bcrypt.hashpw(plain.encode("utf-8"), _bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plaintext password against its bcrypt hash."""
    try:
        if not plain or not hashed:
            return False
        hashed_bytes = hashed.strip().encode("utf-8") if isinstance(hashed, str) else hashed
        plain_bytes = plain.encode("utf-8") if isinstance(plain, str) else plain
        return _bcrypt.checkpw(plain_bytes, hashed_bytes)
    except Exception as err:
        print(f"[Auth] Password verification error: {err}")
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


# ── User CRUD ────────────────────────────────────────────────────────────────
async def get_user_by_email(email: str) -> Optional[dict]:
    """Fetch a user record by email including subscription plan. Returns None if not found."""
    clean_email = (email or "").strip().lower()
    if not clean_email:
        return None
    db = await get_db()
    try:
        async with db.execute(
            """SELECT id, name, email, hashed_password, plan, subscription_expiry, 
                      daily_usage_count, last_usage_date, created_at 
               FROM users WHERE LOWER(TRIM(email)) = ?""",
            (clean_email,)
        ) as cursor:
            row = await cursor.fetchone()
            if row:
                user_dict = dict(row)
                # Check if subscription expired
                if user_dict.get("subscription_expiry"):
                    try:
                        exp_dt = datetime.fromisoformat(user_dict["subscription_expiry"].replace("Z", "+00:00"))
                        if datetime.now(timezone.utc) > exp_dt:
                            user_dict["plan"] = "free"
                    except Exception:
                        pass
                return user_dict
            return None
    finally:
        await db.close()


async def get_user_by_id(user_id: int) -> Optional[dict]:
    """Fetch a user record by ID. Returns None if not found."""
    db = await get_db()
    try:
        async with db.execute(
            """SELECT id, name, email, hashed_password, plan, subscription_expiry, 
                      daily_usage_count, last_usage_date, created_at 
               FROM users WHERE id = ?""",
            (user_id,)
        ) as cursor:
            row = await cursor.fetchone()
            if row:
                return dict(row)
            return None
    finally:
        await db.close()


async def update_user_plan(user_id: int, plan_id: str, days: int = 30) -> dict:
    """Update user's subscription tier and calculate expiry."""
    expiry_date = datetime.now(timezone.utc) + timedelta(days=days)
    expiry_iso = expiry_date.isoformat()
    db = await get_db()
    try:
        await db.execute(
            "UPDATE users SET plan = ?, subscription_expiry = ? WHERE id = ?",
            (plan_id, expiry_iso, user_id)
        )
        await db.commit()
        return {"plan": plan_id, "subscription_expiry": expiry_iso}
    finally:
        await db.close()


async def check_and_increment_usage(user_id: int, text_length: int) -> dict:
    """
    Validates that user hasn't exceeded plan limits and increments daily usage.
    Raises HTTPException 429 if daily limit is reached or 400 if character limit exceeded.
    """
    user = await get_user_by_id(user_id)
    if not user:
        return {}

    plan_info = get_plan(user.get("plan", "free"))
    max_chars = plan_info.get("max_characters_per_gen", 2000)
    daily_limit = plan_info.get("daily_generation_limit", 15)

    if text_length > max_chars:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Character limit exceeded. Your {plan_info['name']} allows up to {max_chars:,} characters per generation. Please upgrade your plan for higher limits."
        )

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    current_count = user.get("daily_usage_count", 0)
    last_date = user.get("last_usage_date", "")

    # Reset daily count if date rolled over
    if last_date != today_str:
        current_count = 0

    if current_count >= daily_limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Daily generation limit reached ({daily_limit}/{daily_limit} used today on {plan_info['name']}). Upgrade to Basic or Pro for higher limits."
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


async def create_user(name: str, email: str, plain_password: str) -> dict:
    """
    Create a new user. Returns the created user dict (no password).
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
    db = await get_db()
    try:
        cursor = await db.execute(
            "INSERT INTO users (name, email, hashed_password, plan) VALUES (?, ?, ?, 'free')",
            (name.strip(), email_clean, hashed)
        )
        await db.commit()
        user_id = cursor.lastrowid
        return {"id": user_id, "name": name.strip(), "email": email_clean, "plan": "free"}
    finally:
        await db.close()


async def authenticate_user(email: str, plain_password: str) -> dict:
    """
    Verify credentials. Returns user dict on success.
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
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "plan": user.get("plan", "free"),
        "subscription_expiry": user.get("subscription_expiry")
    }

