import requests
import json
import time
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def run_tests():
    print("="*60)
    print("AI VOICE INDIA — Complete Auth & API Verification")
    print("="*60)

    # 1. Health check
    print("\n1. Testing GET /api/health:")
    r = requests.get('http://127.0.0.1:8000/api/health')
    print(f"Status: {r.status_code} | Body: {r.json()}")
    assert r.status_code == 200, "Health check failed"

    # 2. OpenAPI routes check
    print("\n2. Testing /openapi.json for Auth Routes:")
    r_open = requests.get('http://127.0.0.1:8000/openapi.json')
    assert r_open.status_code == 200
    paths = list(r_open.json().get('paths', {}).keys())
    required_routes = ['/api/auth/register', '/api/auth/login', '/api/auth/logout', '/api/auth/me', '/api/generate', '/api/voices', '/api/languages']
    for p in required_routes:
        found = p in paths
        print(f"  {p:<24} -> {'FOUND [OK]' if found else 'MISSING [FAIL]'}")
        assert found, f"Route {p} missing from OpenAPI schema!"

    # 3. Register a test user
    print("\n3. Testing POST /api/auth/register:")
    test_email = f"auth_test_{int(time.time() * 1000)}@example.com"
    r_reg = requests.post('http://127.0.0.1:8000/api/auth/register', json={
        'name': 'Verification Tester',
        'email': test_email,
        'password': 'SecureTestPassword123'
    })
    print(f"Register status: {r_reg.status_code}")
    reg_data = r_reg.json()
    print(f"Register message: {reg_data.get('message')}")
    print(f"Registered user: {reg_data.get('user')}")
    assert r_reg.status_code == 201, f"Registration failed: {reg_data}"

    # 4. Login with the user
    print("\n4. Testing POST /api/auth/login:")
    r_login = requests.post('http://127.0.0.1:8000/api/auth/login', json={
        'email': test_email,
        'password': 'SecureTestPassword123'
    })
    print(f"Login status: {r_login.status_code}")
    login_data = r_login.json()
    assert r_login.status_code == 200, f"Login failed: {login_data}"
    token = login_data.get('access_token')
    print(f"JWT access token received: {token[:30]}...")

    # 5. Fetch /api/auth/me
    print("\n5. Testing GET /api/auth/me with Bearer token:")
    r_me = requests.get('http://127.0.0.1:8000/api/auth/me', headers={
        'Authorization': f"Bearer {token}"
    })
    print(f"Auth me status: {r_me.status_code}")
    me_data = r_me.json()
    print(f"User profile response: {json.dumps(me_data, indent=2)}")
    assert r_me.status_code == 200, f"Auth me failed: {me_data}"
    assert me_data['email'] == test_email
    assert me_data['plan'] == 'free'
    assert me_data['characters_used'] == 0
    assert me_data['character_limit'] == 200
    assert me_data['characters_remaining'] == 200

    print("\n" + "="*60)
    print("ALL AUTHENTICATION & API CHECKS PASSED PERFECTLY! [PASS]")
    print("="*60)

if __name__ == '__main__':
    run_tests()
