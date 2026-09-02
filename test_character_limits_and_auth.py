import asyncio
import os
import sys
from pathlib import Path

# Add backend to sys.path
BASE_DIR = Path(__file__).resolve().parent / "backend"
sys.path.insert(0, str(BASE_DIR))

from database import init_db, get_db
from auth import (
    create_user, authenticate_user, create_access_token,
    get_user_by_email, get_user_by_id, check_character_limit, increment_characters_used
)
from plans import get_plan
from fastapi import HTTPException


async def test_full_character_limit_lifecycle():
    print("\n" + "="*60)
    print("AI VOICE INDIA — Character Limit & Backend Security Test")
    print("="*60)

    # Step 0: Init DB and migrations
    await init_db()
    print("[PASS] Step 0: Database initialized & schema migrations executed")

    # Step 1: Create a test user
    test_email = f"test_limit_{int(asyncio.get_event_loop().time() * 1000)}@example.com"
    user = await create_user(
        name="Limit Test User",
        email=test_email,
        plain_password="SecretPassword123!"
    )
    print(f"[PASS] Step 1: Registered new user: {user['email']} (ID: {user['id']})")
    assert user["plan"] == "free", f"Expected plan 'free', got {user['plan']}"
    assert user["characters_used"] == 0, f"Expected 0 characters used, got {user['characters_used']}"

    # Step 2: Verify user from DB
    db_user = await get_user_by_email(test_email)
    assert db_user is not None
    assert db_user["characters_used"] == 0
    print(f"[PASS] Step 2: Verified user record in DB: plan={db_user['plan']}, characters_used={db_user['characters_used']}")

    # Step 3: Check initial limit check (allowed for 50 chars)
    check1 = await check_character_limit(user["id"], 50)
    assert check1["allowed"] is True
    assert check1["characters_remaining"] == 200
    print(f"[PASS] Step 3: Pre-check for 50 chars allowed. Remaining: {check1['characters_remaining']}")

    # Step 4: Simulate successful audio generation (deduct 50 chars)
    usage1 = await increment_characters_used(user["id"], 50)
    assert usage1["characters_used"] == 50
    assert usage1["characters_remaining"] == 150
    print(f"[PASS] Step 4: Deducted 50 chars. Used: {usage1['characters_used']}/200, Remaining: {usage1['characters_remaining']}")

    # Step 5: Simulate another successful generation (deduct 100 chars)
    check2 = await check_character_limit(user["id"], 100)
    assert check2["allowed"] is True
    usage2 = await increment_characters_used(user["id"], 100)
    assert usage2["characters_used"] == 150
    assert usage2["characters_remaining"] == 50
    print(f"[PASS] Step 5: Deducted 100 chars. Used: {usage2['characters_used']}/200, Remaining: {usage2['characters_remaining']}")

    # Step 6: Attempt request of 51 chars (exceeds remaining 50) -> MUST be blocked with CHARACTER_LIMIT_EXCEEDED
    blocked_51 = False
    try:
        await check_character_limit(user["id"], 51)
    except HTTPException as he:
        if he.status_code == 400 and isinstance(he.detail, dict) and he.detail.get("error") == "CHARACTER_LIMIT_EXCEEDED":
            blocked_51 = True
            print(f"[PASS] Step 6: Correctly blocked 51 chars request (HTTP 400 - CHARACTER_LIMIT_EXCEEDED): {he.detail['message']}")
    assert blocked_51, "Expected HTTP 400 CHARACTER_LIMIT_EXCEEDED for 51 char request"

    # Verify characters_used did NOT change after failed attempt
    user_after_block = await get_user_by_id(user["id"])
    assert user_after_block["characters_used"] == 150, "Failed request must not deduct characters!"
    print(f"[PASS] Step 6b: Verified characters_used is still {user_after_block['characters_used']} (NO character leakage on failure)")

    # Step 7: Generate exactly remaining 50 chars -> MUST succeed
    check3 = await check_character_limit(user["id"], 50)
    assert check3["allowed"] is True
    usage3 = await increment_characters_used(user["id"], 50)
    assert usage3["characters_used"] == 200
    assert usage3["characters_remaining"] == 0
    print(f"[PASS] Step 7: Generated exactly 50 chars. Used: {usage3['characters_used']}/200, Remaining: {usage3['characters_remaining']}")

    # Step 8: Attempt generation when remaining is 0 -> MUST be blocked with FREE_LIMIT_REACHED (HTTP 429)
    blocked_zero = False
    try:
        await check_character_limit(user["id"], 5)
    except HTTPException as he:
        if he.status_code == 429 and isinstance(he.detail, dict) and he.detail.get("error") == "FREE_LIMIT_REACHED":
            blocked_zero = True
            print(f"[PASS] Step 8: Correctly blocked request when 0 remaining (HTTP 429 - FREE_LIMIT_REACHED): {he.detail['message']}")
    assert blocked_zero, "Expected HTTP 429 FREE_LIMIT_REACHED when 0 characters remaining"

    # Step 9: Verify authenticate_user returns accurate character usage
    auth_user = await authenticate_user(test_email, "SecretPassword123!")
    assert auth_user["characters_used"] == 200
    print("[PASS] Step 9: Auth login returns updated characters_used=" + str(auth_user['characters_used']))

    print("\n" + "="*60)
    print("ALL 9 VERIFICATION TESTS PASSED SUCCESSFULLY! [PASS]")
    print("="*60 + "\n")


if __name__ == "__main__":
    asyncio.run(test_full_character_limit_lifecycle())
