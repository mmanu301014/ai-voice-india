import sys
import time
import requests

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000"

def test_monetization_exact_tiers():
    print("=" * 70)
    print("AI VOICE INDIA — 3-TIER PRICING & ENFORCEMENT TEST SUITE")
    print("=" * 70)

    # 1. Health check
    res = requests.get(f"{BASE_URL}/api/health")
    assert res.status_code == 200, f"Health check failed: {res.status_code}"
    print("✓ 1. Backend Health Check OK")

    # 2. Payment Config check for the 3 tiers
    res = requests.get(f"{BASE_URL}/api/payments/config")
    assert res.status_code == 200, f"Payment config failed: {res.status_code}"
    cfg = res.json()
    plans = cfg["plans"]
    assert "basic" in plans and plans["basic"]["monthly_character_limit"] == 200 and plans["basic"]["price_inr"] == 99
    assert "pro" in plans and plans["pro"]["monthly_character_limit"] == 1000 and plans["pro"]["price_inr"] == 199
    assert "business" in plans and plans["business"]["monthly_character_limit"] == 5000 and plans["business"]["price_inr"] == 999
    print("✓ 2. 3-Tier Plans Config Verified (Basic: 200 @ Rs.99, Pro: 1,000 @ Rs.199, Business: 5,000 @ Rs.999)")

    # 3. Create a test user
    ts = int(time.time() * 1000)
    email = f"pricing_tester_{ts}@example.com"
    password = "SecurePassword123!"
    reg_res = requests.post(f"{BASE_URL}/api/auth/register", json={
        "name": "Pricing Tester",
        "email": email,
        "password": password
    })
    assert reg_res.status_code == 201, f"Register failed: {reg_res.text}"
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"✓ 3. Registered test user '{email}'")

    # 4. Check initial Basic quota (200 characters)
    me_res = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["plan"] == "basic"
    assert me_data["character_limit"] == 200
    assert me_data["characters_used"] == 0
    assert me_data["characters_remaining"] == 200
    print(f"✓ 4. Initial Basic Quota Verified: 0 / 200 used, 200 remaining this month")

    # 5. Generate audio within limit (20 chars)
    gen_text = "Namaste India! Hello"
    char_len = len(gen_text)
    gen_res = requests.post(f"{BASE_URL}/api/generate", json={
        "text": gen_text,
        "language": "hi",
        "voice_id": "hi-IN-SwaraNeural"
    }, headers=headers)
    assert gen_res.status_code == 200, f"Generate failed: {gen_res.text}"
    gen_data = gen_res.json()
    assert "audio_url" in gen_data
    assert "usage" in gen_data
    assert gen_data["usage"]["characters_used"] == char_len
    assert gen_data["usage"]["characters_remaining"] == 200 - char_len
    print(f"✓ 5. Voice Generation Success: Used {char_len} chars, Remaining: {gen_data['usage']['characters_remaining']}")

    # 6. Test Exceeding Basic Limit (Request 250 chars when only ~180 left)
    large_text = "A" * 250
    over_res = requests.post(f"{BASE_URL}/api/generate", json={
        "text": large_text,
        "language": "en",
        "voice_id": "en-IN-NeerjaNeural"
    }, headers=headers)
    assert over_res.status_code == 400, f"Expected 400 Bad Request, got {over_res.status_code}"
    print(f"✓ 6. 200-Char Limit Strict Enforcement Verified: Blocked 250 char request with 400 Bad Request")

    # 7. Upgrade to PRO (1,000 chars / month)
    upg_pro = requests.post(f"{BASE_URL}/api/payments/mock-upgrade", json={"plan": "pro"}, headers=headers)
    assert upg_pro.status_code == 200, f"Upgrade to pro failed: {upg_pro.text}"
    pro_res = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
    pro_data = pro_res.json()
    assert pro_data["plan"] == "pro"
    assert pro_data["character_limit"] == 1000
    assert pro_data["characters_remaining"] >= 980
    print(f"✓ 7. Upgraded to PRO: Plan = {pro_data['plan']}, Limit = {pro_data['character_limit']:,} chars, Price = Rs.199")

    # 8. Upgrade to BUSINESS (5,000 chars / month)
    upg_biz = requests.post(f"{BASE_URL}/api/payments/mock-upgrade", json={"plan": "business"}, headers=headers)
    assert upg_biz.status_code == 200, f"Upgrade to business failed: {upg_biz.text}"
    biz_res = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
    biz_data = biz_res.json()
    assert biz_data["plan"] == "business"
    assert biz_data["character_limit"] == 5000
    print(f"✓ 8. Upgraded to BUSINESS: Plan = {biz_data['plan']}, Limit = {biz_data['character_limit']:,} chars, Price = Rs.999")

    # 9. Check Payment History
    hist_res = requests.get(f"{BASE_URL}/api/payments/history", headers=headers)
    assert hist_res.status_code == 200
    hist = hist_res.json()["history"]
    assert len(hist) >= 2
    print(f"✓ 9. Payment History Verified: {len(hist)} recorded mock transactions")

    print("=" * 70)
    print("ALL 9 PRICING & ENFORCEMENT TEST CASES PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    test_monetization_exact_tiers()
