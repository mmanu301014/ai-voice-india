import os
import sys
import re
from pathlib import Path
from typing import Optional
from contextlib import asynccontextmanager

# Add project root and backend dir to sys.path so backend works from any working directory
BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent
for p in (str(ROOT_DIR), str(BASE_DIR)):
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from dotenv import load_dotenv
    for env_file in (ROOT_DIR / ".env", BASE_DIR / ".env"):
        if env_file.exists():
            load_dotenv(dotenv_path=env_file, override=False)
except ImportError:
    pass

from fastapi import FastAPI, HTTPException, Query, Response, Header, Depends, status, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, Field, field_validator

from tts_service import TTSService
from database import init_db
from plans import PLANS, get_plan
from auth import (
    create_user, authenticate_user, create_access_token,
    decode_access_token, get_user_by_email, get_user_by_id, check_and_increment_usage,
    check_character_limit, increment_characters_used
)
try:
    from google.oauth2 import id_token as google_id_token
    from google.auth.transport import requests as google_requests
    _GOOGLE_AUTH_AVAILABLE = True
except ImportError:
    _GOOGLE_AUTH_AVAILABLE = False
    print("[Warning] google-auth not installed. /api/auth/google endpoint will be unavailable. Run: pip install google-auth")
from payments import (
    create_razorpay_order, verify_razorpay_payment, process_razorpay_webhook,
    get_user_payment_history, get_razorpay_key_id, is_live_keys_configured,
    mock_upgrade_user_plan
)

# ── Lifespan: initialise DB on startup ──────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

# Initialize FastAPI App
app = FastAPI(
    title="AI VOICE INDIA API",
    description="Multilingual Indian AI Voice Generation Platform Backend",
    version="1.0.0",
    lifespan=lifespan
)

# ── OAuth2 Bearer scheme (registers /api/auth/login as the token URL) ─────────
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

# Auth dependency helper
async def get_current_user(token: Optional[str] = Depends(oauth2_scheme), request: Request = None) -> dict:
    raw_token = token
    if not raw_token and request:
        auth_hdr = request.headers.get("Authorization") or request.headers.get("authorization") or ""
        if auth_hdr.startswith("Bearer "):
            raw_token = auth_hdr[7:].strip()

    if not raw_token or raw_token.strip() in ("null", "undefined", ""):
        print("[Auth Failure Log] Authentication failed: No Authorization Bearer token provided in request header.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_access_token(raw_token)
    except HTTPException as he:
        print(f"[Auth Failure Log] Authentication failed: Token validation error ({he.detail}).")
        raise he
    except Exception as e:
        print(f"[Auth Failure Log] Authentication failed: Failed to decode token ({type(e).__name__}).")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email = payload.get("sub")
    if not email:
        print("[Auth Failure Log] Authentication failed: Token payload is missing subject claim.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload: missing subject.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await get_user_by_email(email)
    if not user:
        print("[Auth Failure Log] Authentication failed: User account associated with token claim was not found in database.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user

async def get_current_user_optional(request: Request) -> dict:
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            payload = decode_access_token(token)
            email = payload.get("sub")
            if email:
                user = await get_user_by_email(email)
                if user:
                    return user
        except Exception as e:
            print(f"[Auth Header Warning]: {e}")
    return {
        "id": 0,
        "name": "Guest User",
        "email": "guest@aivoiceindia.in",
        "plan": "free",
        "monthly_character_limit": 5000,
        "characters_used": 0
    }

# CORS middleware for frontend access (supporting localhost, local network, mobile devices, and Railway/Cloudflare)
raw_origins = os.environ.get("CORS_ORIGINS", "")
configured_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]
default_local_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]
cors_origins = list(set(default_local_origins + configured_origins))
origin_regex = r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|.*\.railway\.app|.*\.vercel\.app|.*\.onrender\.com)(:\d+)?$"

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Initialize TTS Service with cross-platform cache directory
BASE_DIR = Path(__file__).resolve().parent
AUDIO_CACHE_DIR = BASE_DIR / "audio_cache"
tts_service = TTSService(cache_dir=str(AUDIO_CACHE_DIR))

# ── Request Models (existing) ────────────────────────────────────────────────
class GenerateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000, description="Input text to speak")
    language: str = Field(default="en", description="Language code e.g. 'kn', 'hi', 'en', 'mr', 'ta', 'te', etc.")
    voice_id: str = Field(default="en-IN-NeerjaNeural", description="Selected voice identifier")
    speed: float = Field(default=1.0, ge=0.5, le=2.0, description="Speech rate multiplier (0.5x - 2.0x)")
    pitch: float = Field(default=0.0, ge=-1.0, le=1.0, description="Pitch offset (-1.0 to 1.0)")
    style: Optional[str] = Field(default=None, description="Speaking style/emotion")
    normalize_text: bool = Field(default=True, description="Enable smart Indian text normalization")

class NormalizeRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Raw input text")
    language: str = Field(default="en", description="Language code")

# ── Auth Request / Response Models ───────────────────────────────────────────
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+\-]+@[a-zA-Z0-9\-]+\.[a-zA-Z0-9.\-]+$")

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., min_length=5, max_length=254)
    password: str = Field(..., min_length=6, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        v = v.strip().lower()
        if not EMAIL_REGEX.match(v):
            raise ValueError("Invalid email address.")
        return v

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be empty.")
        return v

class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=1)

class GoogleLoginRequest(BaseModel):
    id_token: str = Field(..., min_length=10, description="Firebase ID token obtained from client-side Google sign-in")

# ── Payment Request Models ───────────────────────────────────────────────────
class CreateOrderRequest(BaseModel):
    plan: str = Field(..., description="Target plan ID ('basic' or 'pro')")

class MockUpgradeRequest(BaseModel):
    plan: str = Field(..., description="Target plan ID ('free', 'basic', 'pro', or 'business')")

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str = Field(..., description="Razorpay Order ID")
    razorpay_payment_id: str = Field(..., description="Razorpay Payment ID")
    razorpay_signature: str = Field(..., description="Razorpay Signature")

# ── Auth Endpoints ────────────────────────────────────────────────────────────

@app.post("/api/auth/register", status_code=201)
async def register(req: RegisterRequest):
    """Register a new user account. Returns JWT on success."""
    clean_email = req.email.strip().lower()
    try:
        if len(req.password) < 6:
            raise HTTPException(status_code=422, detail="Password must be at least 6 characters.")

        user = await create_user(
            name=req.name,
            email=clean_email,
            plain_password=req.password
        )
        print(f"[Auth] Registered new user '{clean_email}' (ID: {user['id']})")
        token = create_access_token({"sub": user["email"]})
        return {
            "message": "Account created successfully.",
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "plan": "free",
                "plan_details": get_plan("free")
            }
        }
    except HTTPException as he:
        print(f"[Auth] Registration rejected for '{clean_email}': HTTP {he.status_code} - {he.detail}")
        raise
    except Exception as e:
        print(f"[Register Error]: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Registration failed due to an internal server error. Please try again."
        )

@app.post("/api/auth/login")
async def login(req: LoginRequest):
    """Authenticate and return a JWT access token."""
    clean_email = req.email.strip().lower()
    try:
        user = await authenticate_user(
            email=clean_email,
            plain_password=req.password
        )
        print(f"[Auth] Successful login for '{clean_email}' (ID: {user['id']})")
        token = create_access_token({"sub": user["email"]})
        return {
            "message": "Login successful.",
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "plan": user.get("plan", "free"),
                "plan_details": get_plan(user.get("plan", "free")),
                "subscription_expiry": user.get("subscription_expiry")
            }
        }
    except HTTPException as he:
        print(f"[Auth] Login failed for '{clean_email}': HTTP {he.status_code} - {he.detail}")
        raise
    except Exception as e:
        print(f"[Login Error]: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Login failed due to an internal server error. Please try again."
        )

@app.post("/api/auth/google", status_code=200)
async def google_login(req: GoogleLoginRequest):
    """
    Verify a Firebase Google ID token and issue a backend JWT.
    Auto-creates a new user account if the email is not registered yet.
    Returns same shape as /api/auth/login.
    """
    if not _GOOGLE_AUTH_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Google authentication is not configured on this server. Please install google-auth."
        )

    # ── 1. Verify the Firebase ID token with Google's public keys ──────────────
    try:
        # google_requests.Request() is a synchronous transport — acceptable here
        # as token verification is a fast network call to Google's JWKS endpoint.
        request = google_requests.Request()
        # audience = Firebase project ID (the token's 'aud' claim must match)
        # We accept any Firebase project — the token's own aud is used as audience.
        id_info = google_id_token.verify_firebase_token(
            id_token=req.id_token,
            request=request,
        )
    except ValueError as ve:
        print(f"[Google Auth] Token verification failed: {ve}")
        raise HTTPException(
            status_code=401,
            detail="Google sign-in token is invalid or expired. Please try signing in again."
        )
    except Exception as e:
        print(f"[Google Auth] Unexpected verification error: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=401,
            detail="Google sign-in failed. Please try again."
        )

    # ── 2. Extract verified user info ─────────────────────────────────────────
    google_email = (id_info.get("email") or "").strip().lower()
    if not google_email:
        raise HTTPException(
            status_code=422,
            detail="Google account does not have a verified email address."
        )
    if not id_info.get("email_verified", False):
        raise HTTPException(
            status_code=422,
            detail="Google account email is not verified. Please verify your Gmail account first."
        )
    google_name = id_info.get("name") or google_email.split("@")[0]

    # ── 3. Upsert user (create if new, fetch if existing) ─────────────────────
    user = await get_user_by_email(google_email)
    if user is None:
        # New user — create account (no password needed for OAuth users)
        import secrets
        random_password = secrets.token_urlsafe(32)  # random, unhashed value acts as a stand-in
        try:
            user = await create_user(
                name=google_name,
                email=google_email,
                plain_password=random_password
            )
            print(f"[Google Auth] New user created via Google: '{google_email}' (ID: {user['id']})")
        except HTTPException as he:
            # 409 means the user was created between our lookup and create (race) — fetch them
            if he.status_code == 409:
                user = await get_user_by_email(google_email)
                if not user:
                    raise
            else:
                raise
    else:
        print(f"[Google Auth] Existing user logged in via Google: '{google_email}' (ID: {user['id']})")

    # ── 4. Issue backend JWT ───────────────────────────────────────────────────
    token = create_access_token({"sub": user["email"]})
    plan_info = get_plan(user.get("plan", "basic"))
    return {
        "message": "Google sign-in successful.",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "plan": user.get("plan", "basic"),
            "plan_details": plan_info,
            "subscription_expiry": user.get("subscription_expiry")
        }
    }

@app.post("/api/auth/logout")
async def logout():
    """Logout endpoint — instructs client to discard token."""
    return {"message": "Logged out successfully."}

@app.get("/api/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Returns current authenticated user info, current plan, and generation limits.
    """
    plan_info = get_plan(current_user.get("plan", "free"))
    total_char_limit = plan_info.get("total_character_limit", 1000)
    characters_used = current_user.get("characters_used", 0)
    return {
        "id": current_user["id"],
        "name": current_user["name"],
        "email": current_user["email"],
        "plan": current_user.get("plan", "free"),
        "plan_details": plan_info,
        "subscription_expiry": current_user.get("subscription_expiry"),
        "daily_usage_count": current_user.get("daily_usage_count", 0),
        "daily_limit": plan_info.get("daily_generation_limit", 15),
        "characters_used": characters_used,
        "character_limit": total_char_limit,
        "characters_remaining": max(0, total_char_limit - characters_used)
    }

# ── Payment Endpoints ────────────────────────────────────────────────────────

@app.get("/api/payments/config")
async def get_payments_config():
    """
    Public endpoint returning available subscription plans and public Razorpay Key ID.
    Does NOT expose Key Secret.
    """
    return {
        "key_id": get_razorpay_key_id(),
        "is_test_mode": not is_live_keys_configured(),
        "currency": "INR",
        "plans": PLANS
    }

@app.post("/api/payments/create-order")
async def create_order(
    req: CreateOrderRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Creates a verified Razorpay order for the authenticated user.
    Validates plan and calculates amount strictly on the server.
    """
    order_data = await create_razorpay_order(current_user, req.plan)
    return order_data

@app.post("/api/payments/verify")
async def verify_payment(
    req: VerifyPaymentRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Verifies Razorpay HMAC signature and upgrades the user's plan.
    """
    verification_result = await verify_razorpay_payment(
        user=current_user,
        razorpay_order_id=req.razorpay_order_id,
        razorpay_payment_id=req.razorpay_payment_id,
        razorpay_signature=req.razorpay_signature
    )
    return verification_result

@app.post("/api/payments/webhook")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(None)
):
    """
    Razorpay Webhook endpoint for automated background payment capture & order processing.
    """
    body_bytes = await request.body()
    result = await process_razorpay_webhook(body_bytes, x_razorpay_signature or "")
    return result

@app.get("/api/payments/history")
async def get_payment_history(current_user: dict = Depends(get_current_user)):
    """
    Returns payment and invoice history for the authenticated user.
    """
    history = await get_user_payment_history(current_user["id"])
    return {"history": history, "total": len(history)}

@app.post("/api/payments/mock-upgrade")
async def mock_upgrade(
    req: MockUpgradeRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Development / Test Mode plan upgrade simulator.
    Instantly activates a subscription plan without real payment.
    Safe for local dev; raises 403 in production with live Razorpay keys.
    """
    if is_live_keys_configured():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Mock upgrades are only available in test/development mode."
        )
    result = await mock_upgrade_user_plan(current_user, req.plan)
    return result

# ── Health & Root Endpoints (unchanged) ──────────────────────────────────────

@app.get("/")
async def root():
    frontend_path = Path(__file__).resolve().parent.parent / "frontend" / "dist" / "index.html"
    if frontend_path.exists():
        return FileResponse(frontend_path)
    return {
        "status": "online",
        "app": "AI VOICE INDIA API",
        "tagline": "Natural AI voices, made for India.",
        "docs": "/docs"
    }

@app.get("/health")
@app.get("/api/health")
async def health_check():
    """Health check endpoint confirming zero-cost operational status"""
    return {
        "status": "online",
        "app": "AI VOICE INDIA",
        "tagline": "Natural AI voices, made for India.",
        "cost_mode": "₹0 Zero-Cost Mode Active",
        "engine": "Neural Edge TTS + Free Google Fallback",
        "requires_card": False,
        "requires_billing": False
    }

@app.get("/api/languages")
async def get_languages():
    """Returns list of supported Indian languages with native scripts & sample greetings"""
    languages = tts_service.get_languages()
    return {"languages": languages, "total": len(languages)}

@app.get("/api/voices")
async def get_voices(language: Optional[str] = Query(None, description="Filter by language code")):
    """Returns available voices filtered by language or all voices"""
    voices = tts_service.get_voices(language=language)
    return {"voices": voices, "total": len(voices), "filter_language": language}

@app.get("/api/providers")
async def get_providers():
    """Returns active TTS providers and zero-cost status"""
    providers = tts_service.get_providers()
    return {"providers": providers}

@app.post("/api/normalize")
async def normalize_text(req: NormalizeRequest):
    """Normalizes Indian text for speech synthesis"""
    normalized = tts_service.normalize(req.text, req.language)
    return {
        "original_text": req.text,
        "normalized_text": normalized,
        "language": req.language
    }

@app.post("/api/pdf/extract")
async def extract_pdf_text(file: UploadFile = File(...)):
    """
    Extracts text and page count from an uploaded PDF file using PyMuPDF (fitz).
    Returns PDF metadata and extracted text.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload a valid PDF document (.pdf)."
        )

    try:
        contents = await file.read()
        if not contents or len(contents) == 0:
            raise HTTPException(
                status_code=400,
                detail="The uploaded PDF file is empty."
            )

        import fitz  # PyMuPDF
        doc = fitz.open(stream=contents, filetype="pdf")
        page_count = doc.page_count

        extracted_text_pages = []
        for page_num in range(page_count):
            page = doc.load_page(page_num)
            text = page.get_text("text")
            if text and text.strip():
                extracted_text_pages.append(text.strip())

        doc.close()

        full_text = "\n\n".join(extracted_text_pages).strip()

        if not full_text:
            raise HTTPException(
                status_code=400,
                detail="No readable text could be extracted from this PDF. It may contain scanned images or be password-protected."
            )

        return {
            "filename": file.filename,
            "page_count": page_count,
            "text": full_text,
            "character_count": len(full_text)
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[PDF Extract Error]: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to parse the PDF document. Please ensure it is a valid PDF file."
        )


@app.post("/api/generate")
async def generate_speech(
    req: GenerateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generates natural-sounding speech for input text in the specified Indian language.
    Requires authentication and enforces per-plan character limits server-side.
    Characters are only deducted AFTER successful audio generation.
    Returns audio URL and metadata.
    """
    # Count actual submitted characters (server-side, cannot be spoofed)
    submitted_text = req.text
    char_count = len(submitted_text)

    # ── SERVER-SIDE: Check character limit BEFORE generating ────────────────
    await check_character_limit(current_user["id"], char_count)

    # ── Generate audio (only deduct if this succeeds) ───────────────────────
    try:
        result = await tts_service.generate_speech(
            text=submitted_text,
            voice_id=req.voice_id,
            language=req.language,
            speed=req.speed,
            pitch=req.pitch,
            style=req.style,
            normalize_text_flag=req.normalize_text
        )
    except ValueError as ve:
        print(f"[Generate Validation Error]: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        import traceback
        print(f"[Generate Execution Error]: {e}\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Something went wrong while generating the audio: {str(e)}"
        )

    # ── SUCCESS: Only now deduct characters ─────────────────────────────────
    usage = await increment_characters_used(current_user["id"], char_count)
    print(f"[Generate] User '{current_user['email']}' used {char_count} chars. "
          f"Total used: {usage['characters_used']}/{usage['character_limit']}")

    # Attach usage info to response
    result["usage"] = usage
    return result

@app.get("/api/audio/{filename}")
async def get_audio_file(filename: str):
    """Serves generated audio MP3/WAV file"""
    # Sanitize filename
    clean_name = os.path.basename(filename)
    file_path = os.path.join(tts_service.cache_dir, clean_name)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Audio file not found or expired.")

    return FileResponse(
        path=file_path,
        media_type="audio/mpeg" if clean_name.endswith(".mp3") else "audio/wav",
        filename=clean_name
    )

# ── AI Assistant Chat Endpoint ────────────────────────────────────────────────
import json
import urllib.request
import urllib.error

class AIChatMessageInput(BaseModel):
    role: Optional[str] = "user"
    content: str

class AIChatRequestInput(BaseModel):
    message: Optional[str] = None
    messages: Optional[list[AIChatMessageInput]] = None
    history: Optional[list[dict]] = None

def generate_ai_response_gemini(prompt: str, history: list, api_key: str) -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    contents = []
    system_instruction = "You are AI Voice India Assistant, a helpful, friendly, and expert AI assistant. Provide concise, clear, and informative answers suitable for reading or converting to natural AI voices."
    
    for m in history:
        r = "user" if m.get("role") in ("user", "human") else "model"
        text_content = m.get("content") or m.get("text") or ""
        if text_content:
            contents.append({"role": r, "parts": [{"text": text_content}]})
    
    if not contents or contents[-1]["parts"][0]["text"] != prompt:
        contents.append({"role": "user", "parts": [{"text": prompt}]})

    payload = {
        "system_instruction": {"parts": [{"text": system_instruction}]},
        "contents": contents,
        "generationConfig": {
            "maxOutputTokens": 1024,
            "temperature": 0.7
        }
    }
    
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        res_data = json.loads(resp.read().decode("utf-8"))
        candidates = res_data.get("candidates", [])
        if candidates and "content" in candidates[0]:
            parts = candidates[0]["content"].get("parts", [])
            if parts:
                return parts[0].get("text", "")
    return ""

def generate_ai_response_openai(prompt: str, history: list, api_key: str) -> str:
    url = "https://api.openai.com/v1/chat/completions"
    messages = [{"role": "system", "content": "You are AI Voice India Assistant. Provide clear, concise, informative answers suitable for voice synthesis."}]
    for m in history:
        r = "user" if m.get("role") in ("user", "human") else "assistant"
        text_content = m.get("content") or m.get("text") or ""
        if text_content:
            messages.append({"role": r, "content": text_content})
    if not history or messages[-1]["content"] != prompt:
        messages.append({"role": "user", "content": prompt})

    payload = {
        "model": "gpt-3.5-turbo",
        "messages": messages,
        "max_tokens": 1000
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    })
    with urllib.request.urlopen(req, timeout=15) as resp:
        res_data = json.loads(resp.read().decode("utf-8"))
        choices = res_data.get("choices", [])
        if choices and "message" in choices[0]:
            return choices[0]["message"].get("content", "")
    return ""

def generate_ai_fallback_response(prompt: str, history: list) -> str:
    p_lower = prompt.lower().strip()
    
    if "python" in p_lower:
        if any(w in p_lower for w in ["used for", "use", "it", "usage", "why"]):
            return "Python is widely used for:\n1. Artificial Intelligence & Machine Learning (TensorFlow, PyTorch)\n2. Web Development (Django, FastAPI, Flask)\n3. Data Analysis & Visualization (Pandas, NumPy)\n4. Automation & Scripting\n5. Scientific Computing & API Backends."
        return "Python is a high-level, general-purpose programming language known for its clear syntax, readability, and versatile ecosystem of libraries. It is one of the most popular languages for AI, web development, and data science."
    
    if "artificial intelligence" in p_lower or "ai" in p_lower:
        return "Artificial Intelligence (AI) refers to computer systems engineered to simulate human intelligence—including learning, reasoning, problem solving, and language understanding. In modern voice tech, neural AI powers hyper-realistic speech synthesis across multilingual accents."

    if "short story" in p_lower or "story" in p_lower:
        return "Once upon a time in a bustling Indian tech hub, a group of visionaries embarked on a mission to bring natural Indian voice technology to everyone. Through innovative AI neural modeling, AI Voice India emerged—allowing voices across 15+ Indian languages to speak with life and clarity."

    if "summarize" in p_lower or "summary" in p_lower:
        return "Summarizing key text involves distilling long articles, reports, or stories down to their essential points. You can type or paste any prompt here, generate an instant AI summary, and click 'Generate Voice' to hear it spoken live!"

    return f"Here is an overview of '{prompt}':\n\nArtificial Intelligence and neural speech technologies enable seamless text processing, automated scripting, and knowledge assistance. AI Voice India provides state-of-the-art natural Indian AI voices in Hindi, Tamil, Telugu, Kannada, English, and more.\n\nYou can click 'Copy' to use this response or click 'Generate Voice' below to immediately convert this answer into realistic speech!"

@app.post("/api/ai/chat")
async def ai_chat_endpoint(req: AIChatRequestInput):
    """Secure AI Assistant Endpoint"""
    prompt = req.message or ""
    history_list = []
    if req.messages:
        history_list = [m.model_dump() for m in req.messages]
    elif req.history:
        history_list = req.history
    
    if not prompt and history_list:
        prompt = history_list[-1].get("content", "")

    if not prompt or not prompt.strip():
        raise HTTPException(status_code=400, detail="Message prompt cannot be empty.")

    gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    openai_key = os.environ.get("OPENAI_API_KEY")

    answer = ""
    if gemini_key:
        try:
            answer = generate_ai_response_gemini(prompt, history_list, gemini_key)
        except Exception as e:
            print(f"[AI Chat Gemini Error]: {e}")
    
    if not answer and openai_key:
        try:
            answer = generate_ai_response_openai(prompt, history_list, openai_key)
        except Exception as e:
            print(f"[AI Chat OpenAI Error]: {e}")

    if not answer:
        answer = generate_ai_fallback_response(prompt, history_list)

    return {"answer": answer}

# ── Help & Support Endpoints ────────────────────────────────────────────────

class SupportSubmitRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=5000)
    user_name: Optional[str] = Field(default="Guest User")
    user_email: Optional[str] = Field(default="")
    user_id: Optional[int] = Field(default=None)

class UpdateSupportStatusRequest(BaseModel):
    status: str = Field(..., description="Target status ('New', 'In Progress', 'Resolved')")

@app.post("/api/support/submit")
async def submit_support_request(req: SupportSubmitRequest):
    """Submit a support request to the backend."""
    now = datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%I:%M %p")
    
    db = await get_db()
    try:
        cursor = await db.execute("""
            INSERT INTO support_requests (user_id, user_name, user_email, message, date_str, time_str, status)
            VALUES (?, ?, ?, ?, ?, ?, 'New')
        """, (req.user_id, req.user_name, req.user_email, req.message.strip(), date_str, time_str))
        await db.commit()
        request_id = cursor.lastrowid
        return {
            "status": "success",
            "message": "Your support request has been sent successfully.",
            "request_id": request_id,
            "data": {
                "id": request_id,
                "user_id": req.user_id,
                "user_name": req.user_name,
                "user_email": req.user_email,
                "message": req.message.strip(),
                "date_str": date_str,
                "time_str": time_str,
                "status": "New"
            }
        }
    finally:
        await db.close()

@app.get("/api/support/requests")
async def get_support_requests():
    """Retrieve all submitted support requests for the Admin Support Inbox."""
    db = await get_db()
    try:
        async with db.execute("""
            SELECT id, user_id, user_name, user_email, message, date_str, time_str, status, created_at
            FROM support_requests
            ORDER BY id DESC
        """) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]
    finally:
        await db.close()

@app.patch("/api/support/requests/{request_id}/status")
async def update_support_status(request_id: int, req: UpdateSupportStatusRequest):
    """Update support request status (New, In Progress, Resolved)."""
    db = await get_db()
    try:
        await db.execute("""
            UPDATE support_requests SET status = ? WHERE id = ?
        """, (req.status, request_id))
        await db.commit()
        return {"status": "success", "message": f"Request status updated to {req.status}"}
    finally:
        await db.close()

@app.delete("/api/support/requests/{request_id}")
async def delete_support_request(request_id: int):
    """Delete a support request by ID."""
    db = await get_db()
    try:
        await db.execute("DELETE FROM support_requests WHERE id = ?", (request_id,))
        await db.commit()
        return {"status": "success", "message": "Support request deleted."}
    finally:
        await db.close()

# ── Settings & User Preferences Endpoints ────────────────────────────────────

from auth import hash_password, verify_password

class SaveSettingsRequest(BaseModel):
    settings: dict

class ChangePasswordRequestInput(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6)

@app.get("/api/user/settings")
async def get_user_settings(user: dict = Depends(get_current_user)):
    """Fetch user settings JSON."""
    db = await get_db()
    try:
        async with db.execute("SELECT settings, api_key FROM users WHERE id = ?", (user["id"],)) as cursor:
            row = await cursor.fetchone()
            import json
            settings_data = {}
            if row and row["settings"]:
                try:
                    settings_data = json.loads(row["settings"])
                except Exception:
                    pass
            api_key = row["api_key"] if row and row["api_key"] else f"aivi_live_{user['id']}8x92k7m3"
            return {"settings": settings_data, "api_key": api_key}
    finally:
        await db.close()

@app.post("/api/user/settings")
async def save_user_settings(req: SaveSettingsRequest, user: dict = Depends(get_current_user)):
    """Save user settings JSON."""
    import json
    settings_json = json.dumps(req.settings)
    db = await get_db()
    try:
        await db.execute("UPDATE users SET settings = ? WHERE id = ?", (settings_json, user["id"]))
        await db.commit()
        return {"status": "success", "message": "Settings saved successfully."}
    finally:
        await db.close()

@app.post("/api/auth/change-password")
async def change_password(req: ChangePasswordRequestInput, user: dict = Depends(get_current_user)):
    """Change user account password."""
    db = await get_db()
    try:
        async with db.execute("SELECT hashed_password FROM users WHERE id = ?", (user["id"],)) as cursor:
            row = await cursor.fetchone()
            if not row or not verify_password(req.current_password, row["hashed_password"]):
                raise HTTPException(status_code=400, detail="Current password is incorrect.")

        new_hashed = hash_password(req.new_password)
        await db.execute("UPDATE users SET hashed_password = ? WHERE id = ?", (new_hashed, user["id"]))
        await db.commit()
        return {"status": "success", "message": "Password updated successfully."}
    finally:
        await db.close()

@app.delete("/api/user/account")
async def delete_account(user: dict = Depends(get_current_user)):
    """Delete user account."""
    db = await get_db()
    try:
        await db.execute("DELETE FROM users WHERE id = ?", (user["id"],))
        await db.commit()
        return {"status": "success", "message": "Account deleted successfully."}
    finally:
        await db.close()

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)
