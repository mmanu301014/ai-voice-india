import os
import hashlib
import time
from typing import List, Dict, Any, Optional
from .normalizer import normalize_indian_text
from .providers.manager import ProviderManager

# Master Language Registry for AI VOICE INDIA
INDIAN_LANGUAGES: List[Dict[str, Any]] = [
    {
        "code": "en",
        "name": "English (India)",
        "native_name": "English",
        "sample": "Hello! Welcome to AI Voice India, natural speech made for India.",
        "region": "Pan-India",
        "family": "Indo-European",
        "is_default": False
    },
    {
        "code": "hi",
        "name": "Hindi",
        "native_name": "हिन्दी",
        "sample": "नमस्ते! भारत में आपका स्वागत है।",
        "region": "North & Central India",
        "family": "Indo-Aryan",
        "is_default": False
    },
    {
        "code": "kn",
        "name": "Kannada",
        "native_name": "ಕನ್ನಡ",
        "sample": "ನಮಸ್ಕಾರ! ಭಾರತಕ್ಕೆ ಸ್ವಾಗತ.",
        "region": "Karnataka",
        "family": "Dravidian",
        "is_default": False
    },
    {
        "code": "mr",
        "name": "Marathi",
        "native_name": "मराठी",
        "sample": "नमस्कार! भारतात आपले स्वागत आहे.",
        "region": "Maharashtra",
        "family": "Indo-Aryan",
        "is_default": False
    },
    {
        "code": "ta",
        "name": "Tamil",
        "native_name": "தமிழ்",
        "sample": "வணக்கம்! இந்தியாவிற்கு வரவேற்கிறோம்.",
        "region": "Tamil Nadu & Puducherry",
        "family": "Dravidian",
        "is_default": False
    },
    {
        "code": "te",
        "name": "Telugu",
        "native_name": "తెలుగు",
        "sample": "నమస్కారం! భారతదేశానికి స్వాగతం.",
        "region": "Andhra Pradesh & Telangana",
        "family": "Dravidian",
        "is_default": False
    },
    {
        "code": "ml",
        "name": "Malayalam",
        "native_name": "മലയാളം",
        "sample": "നമസ്കാരം! ഇന്ത്യയിലേക്ക് സ്വാഗതം.",
        "region": "Kerala & Lakshadweep",
        "family": "Dravidian",
        "is_default": False
    },
    {
        "code": "bn",
        "name": "Bengali",
        "native_name": "বাংলা",
        "sample": "নমস্কার! ভারতে আপনাকে স্বাগতম।",
        "region": "West Bengal & Tripura",
        "family": "Indo-Aryan",
        "is_default": False
    },
    {
        "code": "gu",
        "name": "Gujarati",
        "native_name": "ગુજરાતી",
        "sample": "નમસ્તે! ભારતમાં આપનું સ્વાગત છે.",
        "region": "Gujarat",
        "family": "Indo-Aryan",
        "is_default": False
    },
    {
        "code": "pa",
        "name": "Punjabi",
        "native_name": "ਪੰਜਾਬੀ",
        "sample": "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਭਾਰਤ ਵਿੱਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ।",
        "region": "Punjab",
        "family": "Indo-Aryan",
        "is_default": False
    },
    {
        "code": "ur",
        "name": "Urdu",
        "native_name": "اردو",
        "sample": "السلام علیکم! ہندوستان میں آپ کا خیر مقدم ہے۔",
        "region": "Pan-India",
        "family": "Indo-Aryan",
        "is_default": False
    },
    {
        "code": "or",
        "name": "Odia",
        "native_name": "ଓଡ଼ିଆ",
        "sample": "ନମସ୍କାର! ଭାରତକୁ ସ୍ୱାଗତ।",
        "region": "Odisha",
        "family": "Indo-Aryan",
        "is_default": False
    },
    {
        "code": "as",
        "name": "Assamese",
        "native_name": "অসমীয়া",
        "sample": "নমস্কাৰ! ভাৰতলৈ আপোনাক স্বাগতম।",
        "region": "Assam",
        "family": "Indo-Aryan",
        "is_default": False
    },
    {
        "code": "kok",
        "name": "Konkani",
        "native_name": "कोंकणी",
        "sample": "नमस्कार! कोंकणी भाशेंत तुमकां येवकार.",
        "region": "Goa & Coastal Karnataka",
        "family": "Indo-Aryan",
        "is_default": False
    },
    {
        "code": "ne",
        "name": "Nepali",
        "native_name": "नेपाली",
        "sample": "नमस्ते! नेपाल तथा भारतमा तपाईंलाई स्वागत छ।",
        "region": "Sikkim & North Bengal",
        "family": "Indo-Aryan",
        "is_default": False
    },
    {
        "code": "sa",
        "name": "Sanskrit",
        "native_name": "संस्कृतम्",
        "sample": "सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः।",
        "region": "Pan-India Classical",
        "family": "Indo-Aryan Classical",
        "is_default": False
    }
]

class TTSService:
    def __init__(self, cache_dir: str = "audio_cache"):
        self.provider_manager = ProviderManager()
        self.cache_dir = cache_dir
        os.makedirs(self.cache_dir, exist_ok=True)

    def get_languages(self) -> List[Dict[str, Any]]:
        return INDIAN_LANGUAGES

    def get_voices(self, language: Optional[str] = None) -> List[Dict[str, Any]]:
        return self.provider_manager.get_all_voices(language)

    def get_providers(self) -> List[Dict[str, Any]]:
        return self.provider_manager.list_providers()

    def normalize(self, text: str, language: str = "en") -> str:
        return normalize_indian_text(text, language)

    async def generate_speech(
        self,
        text: str,
        voice_id: str,
        language: str,
        speed: float = 1.0,
        pitch: float = 0.0,
        style: Optional[str] = None,
        normalize_text_flag: bool = True
    ) -> Dict[str, Any]:
        """
        Orchestrates normalization, caching, synthesis, and returns audio metadata.
        """
        if not text or not text.strip():
            raise ValueError("Input text cannot be empty.")

        raw_text = text.strip()
        processed_text = normalize_indian_text(raw_text, language) if normalize_text_flag else raw_text

        # Compute deterministic cache key
        cache_str = f"{processed_text}|{voice_id}|{language}|{speed:.2f}|{pitch:.2f}|{style or ''}"
        cache_hash = hashlib.sha256(cache_str.encode('utf-8')).hexdigest()[:16]
        filename = f"audio_{cache_hash}.mp3"
        output_file = os.path.join(self.cache_dir, filename)

        # If already cached and exists
        if os.path.exists(output_file) and os.path.getsize(output_file) > 0:
            return {
                "success": True,
                "audio_url": f"/api/audio/{filename}",
                "filename": filename,
                "provider": "cache (neural)",
                "character_count": len(raw_text),
                "word_count": len(raw_text.split()),
                "cached": True
            }

        # Synthesize via provider manager
        start_time = time.time()
        audio_bytes, provider_used = await self.provider_manager.synthesize(
            text=processed_text,
            voice_id=voice_id,
            language=language,
            speed=speed,
            pitch=pitch,
            style=style,
            output_path=output_file
        )
        elapsed = time.time() - start_time

        return {
            "success": True,
            "audio_url": f"/api/audio/{filename}",
            "filename": filename,
            "provider": provider_used,
            "character_count": len(raw_text),
            "word_count": len(raw_text.split()),
            "generation_time_sec": round(elapsed, 2),
            "cached": False
        }
