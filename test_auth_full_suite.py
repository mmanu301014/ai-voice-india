import requests
import json
import time
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000"

def test_full_auth_suite():
    print("=" * 70)
    print("AI VOICE INDIA — Comprehensive Auth Suite Verification")
    print("=" * 70)

    # 1. Health check
    print("\n[TEST 1] GET /api/health")
    r = requests.get(f"{BASE_URL}/api/health")
    assert r.status_code == 200, f"Health check failed: {r.status_code}"
    data = r.json()
    assert data.get("status") == "online"
    print("  -> Health Check Passed! Status: online")

    # 2. Register new user
    ts = int(time.time() * 1000)
    test_email = f"SuiteTester_{ts}@Example.COM"
    test_password = "StrongPassword@123!"
    print(f"\n[TEST 2] POST /api/auth/register with mixed-case email: {test_email}")
    r = requests.post(f"{BASE_URL}/api/auth/register", json={
        "name": "Suite Tester",
        "email": test_email,
        "password": test_password
    })
    assert r.status_code == 201, f"Registration failed ({r.status_code}): {r.text}"
    reg_data = r.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == test_email.strip().lower()
    print("  -> Registration Passed! User ID:", reg_data["user"]["id"])

    # 3. Duplicate registration check (409 Conflict)
    print("\n[TEST 3] Duplicate Registration Check")
    r_dup = requests.post(f"{BASE_URL}/api/auth/register", json={
        "name": "Duplicate Tester",
        "email": f"  {test_email.lower()}  ",
        "password": "AnotherPassword456!"
    })
    assert r_dup.status_code == 409, f"Expected 409 Conflict, got {r_dup.status_code}: {r_dup.text}"
    print("  -> Duplicate registration correctly rejected with HTTP 409:", r_dup.json().get("detail"))

    # 4. Short password check (422)
    print("\n[TEST 4] Short password validation (< 6 chars)")
    r_short = requests.post(f"{BASE_URL}/api/auth/register", json={
        "name": "Short Pass User",
        "email": f"short_{ts}@example.com",
        "password": "123"
    })
    assert r_short.status_code == 422, f"Expected 422 for short password, got {r_short.status_code}"
    print("  -> Short password correctly rejected with HTTP 422")

    # 5. Signin with exact email and password
    print("\n[TEST 5] Signin with exact registered password")
    r_login = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": test_email,
        "password": test_password
    })
    assert r_login.status_code == 200, f"Login failed: {r_login.text}"
    token = r_login.json()["access_token"]
    assert token, "Token not returned"
    print("  -> Signin Successful! JWT token received.")

    # 6. Signin with lowercase trimmed email
    print("\n[TEST 6] Signin with lowercased and padded email")
    r_login_pad = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": f"  {test_email.lower()}  ",
        "password": test_password
    })
    assert r_login_pad.status_code == 200, f"Padded email login failed: {r_login_pad.text}"
    print("  -> Signin with trimmed lowercase email succeeded!")

    # 7. Signin with incorrect password -> 401
    print("\n[TEST 7] Signin with wrong password")
    r_wrong_pass = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": test_email,
        "password": "WrongPassword999!"
    })
    assert r_wrong_pass.status_code == 401, f"Expected 401, got {r_wrong_pass.status_code}"
    assert "Incorrect email or password." in r_wrong_pass.json().get("detail", "")
    print("  -> Wrong password correctly rejected with HTTP 401:", r_wrong_pass.json().get("detail"))

    # 8. Signin with non-existent email -> 401
    print("\n[TEST 8] Signin with non-existent email")
    r_no_user = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "non_existent_user_99999@domain.com",
        "password": "SomePassword123!"
    })
    assert r_no_user.status_code == 401, f"Expected 401, got {r_no_user.status_code}"
    assert "Incorrect email or password." in r_no_user.json().get("detail", "")
    print("  -> Non-existent email correctly rejected with HTTP 401:", r_no_user.json().get("detail"))

    # 9. Fetch profile with token -> 200
    print("\n[TEST 9] GET /api/auth/me with Bearer token")
    r_me = requests.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r_me.status_code == 200, f"Auth me failed: {r_me.text}"
    user_me = r_me.json()
    assert user_me["email"] == test_email.strip().lower()
    print("  -> Profile verified:", user_me["email"], "| Plan:", user_me["plan"], "| Characters Remaining:", user_me["characters_remaining"])

    # 10. Logout
    print("\n[TEST 10] POST /api/auth/logout")
    r_logout = requests.post(f"{BASE_URL}/api/auth/logout")
    assert r_logout.status_code == 200
    print("  -> Logout response:", r_logout.json())

    print("\n" + "=" * 70)
    print("ALL 10 TEST SUITE CASES PASSED WITH ZERO ERRORS!")
    print("=" * 70)

if __name__ == "__main__":
    test_full_auth_suite()
