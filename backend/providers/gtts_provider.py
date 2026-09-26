import asyncio
import io
from typing import List, Dict, Any, Optional
from gtts import gTTS
from .base import BaseTTSProvider

GTTS_VOICES: List[Dict[str, Any]] = [
    {"id": "gtts-en", "name": "Google English (India)", "language": "en", "language_name": "English", "region": "India", "gender": "Female", "style": "Standard", "preview_text": "Hello, welcome to AI Voice India.", "provider": "gtts", "is_neural": False, "is_free": True},
    {"id": "gtts-hi", "name": "Google Hindi", "language": "hi", "language_name": "Hindi", "region": "India", "gender": "Female", "style": "Standard", "preview_text": "नमस्ते! भारत में आपका स्वागत है।", "provider": "gtts", "is_neural": False, "is_free": True},
    {"id": "gtts-kn", "name": "Google Kannada", "language": "kn", "language_name": "Kannada", "region": "Karnataka, India", "gender": "Female", "style": "Standard", "preview_text": "ನಮಸ್ಕಾರ! ಭಾರತಕ್ಕೆ ಸ್ವಾಗತ.", "provider": "gtts", "is_neural": False, "is_free": True},
    {"id": "gtts-ta", "name": "Google Tamil", "language": "ta", "language_name": "Tamil", "region": "Tamil Nadu, India", "gender": "Female", "style": "Standard", "preview_text": "வணக்கம்! இந்தியாவிற்கு வரவேற்கிறோம்.", "provider": "gtts", "is_neural": False, "is_free": True},
    {"id": "gtts-te", "name": "Google Telugu", "language": "te", "language_name": "Telugu", "region": "Andhra / Telangana, India", "gender": "Female", "style": "Standard", "preview_text": "నమస్కారం! భారతదేశానికి స్వాగతం.", "provider": "gtts", "is_neural": False, "is_free": True},
    {"id": "gtts-mr", "name": "Google Marathi", "language": "mr", "language_name": "Marathi", "region": "Maharashtra, India", "gender": "Female", "style": "Standard", "preview_text": "नमस्कार! भारतात आपले स्वागत आहे.", "provider": "gtts", "is_neural": False, "is_free": True},
    {"id": "gtts-ml", "name": "Google Malayalam", "language": "ml", "language_name": "Malayalam", "region": "Kerala, India", "gender": "Female", "style": "Standard", "preview_text": "നമസ്കാരം! ഇന്ത്യയിലേക്ക് സ്വാഗതം.", "provider": "gtts", "is_neural": False, "is_free": True},
    {"id": "gtts-bn", "name": "Google Bengali", "language": "bn", "language_name": "Bengali", "region": "West Bengal, India", "gender": "Female", "style": "Standard", "preview_text": "নমস্কার! ভারতে আপনাকে স্বাগতম।", "provider": "gtts", "is_neural": False, "is_free": True},
    {"id": "gtts-gu", "name": "Google Gujarati", "language": "gu", "language_name": "Gujarati", "region": "Gujarat, India", "gender": "Female", "style": "Standard", "preview_text": "નમસ્તે! ભારતમાં આપનું સ્વાગત છે.", "provider": "gtts", "is_neural": False, "is_free": True},
    {"id": "gtts-pa", "name": "Google Punjabi", "language": "pa", "language_name": "Punjabi", "region": "Punjab, India", "gender": "Female", "style": "Standard", "preview_text": "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਭਾਰਤ ਵਿੱਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ।", "provider": "gtts", "is_neural": False, "is_free": True},
    {"id": "gtts-ur", "name": "Google Urdu", "language": "ur", "language_name": "Urdu", "region": "India", "gender": "Female", "style": "Standard", "preview_text": "السلام علیکم! ہندوستان میں آپ کا خیر مقدم ہے۔", "provider": "gtts", "is_neural": False, "is_free": True},
    {"id": "gtts-ne", "name": "Google Nepali", "language": "ne", "language_name": "Nepali", "region": "India / Nepal", "gender": "Female", "style": "Standard", "preview_text": "नमस्ते! स्वागत छ।", "provider": "gtts", "is_neural": False, "is_free": True}
]

class GTTSProvider(BaseTTSProvider):
    """
    Free fallback Google Translate TTS provider.
    Zero-cost, no API key.
    """

    @property
    def provider_id(self) -> str:
        return "gtts"

    @property
    def display_name(self) -> str:
        return "Google Free TTS (Fallback)"

    @property
    def is_free(self) -> bool:
        return True

    def is_available(self) -> bool:
        return True

    def get_supported_languages(self) -> List[str]:
        return list(set(v["language"] for v in GTTS_VOICES))

    def get_voices(self, language: Optional[str] = None) -> List[Dict[str, Any]]:
        if not language:
            return GTTS_VOICES
        lang_clean = language.lower()
        return [v for v in GTTS_VOICES if v["language"] == lang_clean]

    async def synthesize(
        self,
        text: str,
        voice_id: str,
        language: str,
        speed: float = 1.0,
        pitch: float = 0.0,
        style: Optional[str] = None,
        output_path: Optional[str] = None
    ) -> bytes:
        lang_code = language.lower()
        slow = speed < 0.85

        def _generate():
            fp = io.BytesIO()
            try:
                tts = gTTS(text=text, lang=lang_code, slow=slow, tld="co.in")
                tts.write_to_fp(fp)
            except Exception as e:
                print(f"[gTTS Warning] tld='co.in' failed for lang='{lang_code}': {e}. Retrying standard gTTS...")
                fp = io.BytesIO()
                try:
                    tts = gTTS(text=text, lang=lang_code, slow=slow)
                    tts.write_to_fp(fp)
                except Exception as e2:
                    print(f"[gTTS Warning] lang='{lang_code}' failed: {e2}. Falling back to English gTTS...")
                    fp = io.BytesIO()
                    tts = gTTS(text=text, lang="en", slow=slow)
                    tts.write_to_fp(fp)
            fp.seek(0)
            return fp.read()

        loop = asyncio.get_event_loop()
        audio_bytes = await loop.run_in_executor(None, _generate)

        if output_path and audio_bytes:
            with open(output_path, "wb") as f:
                f.write(audio_bytes)

        return audio_bytes
