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

from fastapi import FastAPI, HTTPException, Query, Response, Header, Depends, status, Request
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
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Auth dependency helper
async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    payload = decode_access_token(token)
    email = payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload: missing subject.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = await get_user_by_email(email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

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
    total_char_limit = plan_info.get("total_character_limit", 200)
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
        # Do NOT deduct characters — generation failed
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        # Do NOT deduct characters — generation failed
        print(f"[Generate Error]: {e}")
        raise HTTPException(
            status_code=500,
            detail="Something went wrong while generating the audio. Please try again."
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

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)
