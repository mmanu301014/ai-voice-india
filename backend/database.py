"""
AI VOICE INDIA — Database Setup
Lightweight SQLite database using aiosqlite for async operations.
Stores user accounts with hashed passwords.
"""

import os
import aiosqlite
from pathlib import Path

# Database file is stored in project root (when local) or backend dir (when deployed)
BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent

DB_PATH_ENV = os.environ.get("DB_PATH")
if DB_PATH_ENV:
    DB_PATH = Path(DB_PATH_ENV)
elif (ROOT_DIR / "auth.db").exists() or (ROOT_DIR / "README.md").exists():
    DB_PATH = ROOT_DIR / "auth.db"
else:
    DB_PATH = BASE_DIR / "auth.db"


async def get_db():
    """Return an aiosqlite connection to the auth database."""
    db = await aiosqlite.connect(str(DB_PATH))
    db.row_factory = aiosqlite.Row
    return db


async def init_db():
    """Create database tables and run lightweight migrations if they don't already exist."""
    db = await get_db()
    try:
        # 1. Base Users Table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                hashed_password TEXT NOT NULL,
                plan TEXT NOT NULL DEFAULT 'free',
                subscription_expiry TIMESTAMP,
                daily_usage_count INTEGER NOT NULL DEFAULT 0,
                last_usage_date TEXT NOT NULL DEFAULT '',
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

        await db.commit()
        print("[Auth & Payment DB] Database tables & migrations ready.")
    finally:
        await db.close()
