import os
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

from backend.tts_service import TTSService

# Initialize FastAPI App
app = FastAPI(
    title="AI VOICE INDIA API",
    description="Multilingual Indian AI Voice Generation Platform Backend — Zero-Cost Architecture",
    version="1.0.0"
)

# CORS middleware for frontend access
raw_origins = os.environ.get("CORS_ORIGINS", "*")
allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]
cors_origins = ["*"] if ("*" in allowed_origins or not allowed_origins) else allowed_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize TTS Service with cross-platform cache directory
BASE_DIR = Path(__file__).resolve().parent
AUDIO_CACHE_DIR = BASE_DIR / "audio_cache"
tts_service = TTSService(cache_dir=str(AUDIO_CACHE_DIR))

# Request Models
class GenerateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000, description="Input text to speak")
    language: str = Field(default="en", description="Language code e.g. 'kn', 'hi', 'en', 'mr', 'ta', 'te', etc.")
    voice_id: str = Field(default="en-IN-NeerjaNeural", description="Selected voice identifier")
    speed: float = Field(default=1.0, ge=0.5, le=2.0, description="Speech rate multiplier (0.5x - 2.0x)")
    pitch: float = Field(default=0.0, ge=-1.0, le=1.0, description="Pitch offset (-1.0 to 1.0)")
    style: Optional[str] = Field(default=None, description="Speaking style/emotion")
    normalize_text: bool = Field(default=True, description="Enable smart Indian text normalization")

class NormalizeRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Raw input text")
    language: str = Field(default="en", description="Language code")

# --- Health & Root Endpoints ---


@app.get("/")
async def root():
    frontend_path = Path(__file__).resolve().parent.parent / "frontend" / "dist" / "index.html"
    return FileResponse(frontend_path)

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
async def generate_speech(req: GenerateRequest):
    """
    Generates natural-sounding speech for input text in the specified Indian language.
    Returns audio URL and metadata.
    """
    try:
        result = await tts_service.generate_speech(
            text=req.text,
            voice_id=req.voice_id,
            language=req.language,
            speed=req.speed,
            pitch=req.pitch,
            style=req.style,
            normalize_text_flag=req.normalize_text
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        # User-friendly error message without raw internal stack leaks
        print(f"[Generate Error]: {e}")
        raise HTTPException(
            status_code=500,
            detail="Something went wrong while generating the audio. Please try again."
        )

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
    uvicorn.run("backend.app:app", host=host, port=port, reload=False)
