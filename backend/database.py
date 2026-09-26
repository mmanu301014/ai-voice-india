"""
AI VOICE INDIA — Database Setup
Lightweight SQLite database using aiosqlite for async operations.
Stores user accounts with hashed passwords, billing cycle info, and usage metrics.
"""

import os
import aiosqlite
from pathlib import Path
from datetime import datetime, timezone, timedelta

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent


def get_db_path() -> Path:
    """Resolve the authoritative SQLite database path."""
    db_env = os.environ.get("DB_PATH")
    if db_env:
        return Path(db_env).resolve()
    if (ROOT_DIR / "auth.db").exists():
        return (ROOT_DIR / "auth.db").resolve()
    if (BASE_DIR / "auth.db").exists():
        return (BASE_DIR / "auth.db").resolve()
    if (ROOT_DIR / "README.md").exists() or (ROOT_DIR / "frontend").exists():
        return (ROOT_DIR / "auth.db").resolve()
    return (BASE_DIR / "auth.db").resolve()


DB_PATH = get_db_path()


async def get_db():
    """Return an aiosqlite connection to the auth database."""
    db_path = get_db_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    db = await aiosqlite.connect(str(db_path))
    db.row_factory = aiosqlite.Row
    return db


async def init_db():
    """Create database tables and run lightweight migrations if they don't already exist."""
    print(f"[Auth & Payment DB] Initializing SQLite database at: {DB_PATH}")
    db = await get_db()
    try:
        # 1. Base Users Table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                hashed_password TEXT NOT NULL,
                plan TEXT NOT NULL DEFAULT 'basic',
                subscription_expiry TIMESTAMP,
                daily_usage_count INTEGER NOT NULL DEFAULT 0,
                last_usage_date TEXT NOT NULL DEFAULT '',
                characters_used INTEGER NOT NULL DEFAULT 0,
                billing_period_start TIMESTAMP,
                billing_period_end TIMESTAMP,
                subscription_status TEXT NOT NULL DEFAULT 'active',
                monthly_character_limit INTEGER NOT NULL DEFAULT 1000,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Schema migrations for existing user databases: check and add missing columns
        async with db.execute("PRAGMA table_info(users)") as cursor:
            existing_cols = {row["name"] for row in await cursor.fetchall()}

        if "plan" not in existing_cols:
            await db.execute("ALTER TABLE users ADD COLUMN plan TEXT NOT NULL DEFAULT 'free'")
        if "subscription_expiry" not in existing_cols:
            await db.execute("ALTER TABLE users ADD COLUMN subscription_expiry TIMESTAMP")
        if "daily_usage_count" not in existing_cols:
            await db.execute("ALTER TABLE users ADD COLUMN daily_usage_count INTEGER NOT NULL DEFAULT 0")
        if "last_usage_date" not in existing_cols:
            await db.execute("ALTER TABLE users ADD COLUMN last_usage_date TEXT NOT NULL DEFAULT ''")
        if "characters_used" not in existing_cols:
            await db.execute("ALTER TABLE users ADD COLUMN characters_used INTEGER NOT NULL DEFAULT 0")
        if "billing_period_start" not in existing_cols:
            await db.execute("ALTER TABLE users ADD COLUMN billing_period_start TIMESTAMP")
        if "billing_period_end" not in existing_cols:
            await db.execute("ALTER TABLE users ADD COLUMN billing_period_end TIMESTAMP")
        if "subscription_status" not in existing_cols:
            await db.execute("ALTER TABLE users ADD COLUMN subscription_status TEXT NOT NULL DEFAULT 'active'")
        if "monthly_character_limit" not in existing_cols:
            await db.execute("ALTER TABLE users ADD COLUMN monthly_character_limit INTEGER NOT NULL DEFAULT 1000")
        if "settings" not in existing_cols:
            await db.execute("ALTER TABLE users ADD COLUMN settings TEXT DEFAULT '{}'")
        if "api_key" not in existing_cols:
            await db.execute("ALTER TABLE users ADD COLUMN api_key TEXT DEFAULT ''")

        # 2. Payments & Orders Table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                user_email TEXT NOT NULL,
                plan TEXT NOT NULL,
                amount INTEGER NOT NULL,
                currency TEXT NOT NULL DEFAULT 'INR',
                razorpay_order_id TEXT NOT NULL UNIQUE,
                razorpay_payment_id TEXT,
                razorpay_signature TEXT,
                status TEXT NOT NULL DEFAULT 'created',
                error_code TEXT,
                error_description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        """)

        # 3. Support Requests Table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS support_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                user_name TEXT NOT NULL,
                user_email TEXT NOT NULL,
                message TEXT NOT NULL,
                date_str TEXT NOT NULL,
                time_str TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'New',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        await db.commit()
        print(f"[Auth & Payment DB] Database tables & migrations ready at: {DB_PATH}")
    finally:
        await db.close()
