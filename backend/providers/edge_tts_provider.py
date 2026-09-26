import asyncio
import io
from typing import List, Dict, Any, Optional
import edge_tts
from .base import BaseTTSProvider

# Curated High-Quality Neural Voices for Indian Languages (100% Free)
EDGE_INDIAN_VOICES: List[Dict[str, Any]] = [
    # --- KANNADA ---
    {
        "id": "kn-IN-GaganNeural",
        "name": "Gagan (ಗಗನ್)",
        "language": "kn",
        "language_name": "Kannada",
        "region": "Karnataka, India",
        "gender": "Male",
        "style": "Conversational / News",
        "preview_text": "ನಮಸ್ಕಾರ, ನಾನು ಗಗನ್. ನಿಮ್ಮ ಕನ್ನಡ ಧ್ವನಿ ಸಹಾಯಕ.",
        "emotions": ["Natural", "Professional", "Enthusiastic"],
        "provider": "edge_tts",
        "is_neural": True,
        "is_free": True
    },
    {
        "id": "kn-IN-SapnaNeural",
        "name": "Sapna (ಸ್ವಪ್ನ)",
        "language": "kn",
        "language_name": "Kannada",
        "region": "Karnataka, India",
        "gender": "Female",
        "style": "Warm / Storytelling",
        "preview_text": "ನಮಸ್ಕಾರ, ನಾನು ಸ್ವಪ್ನ. ನೈಸರ್ಗಿಕ ಮತ್ತು ಸುಂದರ ಧ್ವನಿ.",
        "emotions": ["Warm", "Friendly", "Calm"],
        "provider": "edge_tts",
        "is_neural": True,
        "is_free": True
    },
    # --- HINDI ---
    {
        "id": "hi-IN-MadhurNeural",
        "name": "Madhur (मधुर)",
        "language": "hi",
        "language_name": "Hindi",
        "region": "India",
        "gender": "Male",
        "style": "Natural / Friendly",
        "preview_text": "नमस्ते! मैं मधुर हूँ। भारत की आवाज़ में आपका स्वागत है।",
        "emotions": ["Conversational", "Friendly", "Storytelling"],
        "provider": "edge_tts",
        "is_neural": True,
        "is_free": True
    },
    {
        "id": "hi-IN-SwaraNeural",
        "name": "Swara (स्वरा)",
        "language": "hi",
        "language_name": "Hindi",
        "region": "India",
        "gender": "Female",
        "style": "Professional / News",
        "preview_text": "नमस्कार! मैं स्वरा हूँ। स्पष्ट और स्वाभाविक हिंदी आवाज़।",
        "emotions": ["Professional", "Warm", "News"],
        "provider": "edge_tts",
        "is_neural": True,
        "is_free": True
    },
    # --- MARATHI ---
    {
        "id": "mr-IN-ManoharNeural",
        "name": "Manohar (मनोहर)",
        "language": "mr",
        "language_name": "Marathi",
        "region": "Maharashtra, India",
        "gender": "Male",
        "style": "Professional / Warm",
        "preview_text": "नमस्कार! मी मनोहर आहे. मराठीतील स्पष्ट आणि अस्सल संवाद.",
        "emotions": ["Professional", "Conversational"],
        "provider": "edge_tts",
        "is_neural": True,
        "is_free": True
    },
    {
        "id": "mr-IN-AarohiNeural",
        "name": "Aarohi (आरोही)",
        "language": "mr",
        "language_name": "Marathi",
        "region": "Maharashtra, India",
        "gender": "Female",
        "style": "Conversational / Storytelling",
        "preview_text": "नमस्कार! मी आरोही. मनमोಹक आणि नैसर्गिक मराठी आवाज.",
        "emotions": ["Warm", "Friendly", "Storytelling"],
        "provider": "edge_tts",
        "is_neural": True,
        "is_free": True
    },
    # --- TAMIL ---
    {
        "id": "ta-IN-ValluvarNeural",
        "name": "Valluvar (வள்ளுவர்)",
        "language": "ta",
        "language_name": "Tamil",
        "region": "Tamil Nadu, India",
        "gender": "Male",
        "style": "Conversational / Professional",
        "preview_text": "வணக்கம்! நான் வள்ளுவர். தமிழ் மொழியில் தெளிவான குரல்.",
        "emotions": ["Clear", "Professional", "Conversational"],
        "provider": "edge_tts",
        "is_neural": True,
        "is_free": True
    },
    {
        "id": "ta-IN-PallaviNeural",
        "name": "Pallavi (பல்லவி)",
        "language": "ta",
        "language_name": "Tamil",
        "region": "Tamil Nadu, India",
        "gender": "Female",
        "style": "Natural / Friendly",
        "preview_text": "வணக்கம்! நான் பல்லவி. இயல்பான மற்றும் இனிமையான தமிழ் குரல்.",
        "emotions": ["Warm", "Friendly", "Melodious"],
        "provider": "edge_tts",
        "is_neural": True,
        "is_free": True
    },
    # --- TELUGU ---
    {
        "id": "te-IN-MohanNeural",
        "name": "Mohan (మోహన్)",
        "language": "te",
        "language_name": "Telugu",
        "region": "Andhra Pradesh / Telangana, India",
        "gender": "Male",
        "style": "Natural / News",
        "preview_text": "నమస్కారం! నేను మోహన్. స్పష్టమైన తెలుగు సంభాషణ.",
        "emotions": ["Confident", "Professional"],
        "provider": "edge_tts",
        "is_neural": True,
        "is_free": True
    },
    {
        "id": "te-IN-ShrutiNeural",
        "name": "Shruti (శ్రుతి)",
        "language": "te",
        "language_name": "Telugu",
        "region": "Andhra Pradesh / Telangana, India",
        "gender": "Female",
        "style": "Warm / Conversational",
        "preview_text": "నమస్కారం! నేను శ్రుతి. సహజమైన మరియు మధురమైన తెలుగు స్వరం.",
        "emotions": ["Warm", "Friendly", "Storytelling"],
        "provider": "edge_tts",
        "is_neural": True,
        "is_free": True
    },
    # --- MALAYALAM ---
    {
        "id": "ml-IN-MidhunNeural",
        "name": "Midhun (മിഥുൻ)",
        "language": "ml",
        "language_name": "Malayalam",
        "region": "Kerala, India",
        "gender": "Male",
        "style": "Natural / Educational",
        "preview_text": "നമസ്കാരം! ഞാൻ മിഥുൻ. സ്വാഭാവികമായ മലയാള ശബ്ദം.",
        "emotions": ["Natural", "Informative"],
        "provider": "edge_tts",
        "is_neural": True,
        "is_free": True
    },
    {
        "id": "ml-IN-SobhanaNeural",
        "name": "Sobhana (ശോഭന)",
        "language": "ml",
        "language_name": "Malayalam",
        "region": "Kerala, India",
        "gender": "Female",
        "style": "Conversational / Friendly",
        "preview_text": "നമസ്കാരം! ഞാൻ ശോഭന. ഹൃദ്യമായ സംഭാഷണ ശൈലി.",
        "emotions": ["Warm", "Storytelling"],
        "provider": "edge_tts",
        "is_neural": True,
        "is_free": True
    },
    # --- BENGALI ---
    {
        "id": "bn-IN-BashkarNeural",
        "name": "Bashkar (ভাস্কর)",
        "language": "bn",
        "language_name": "Bengali",
        "region": "West Bengal, India",
        "gender": "Male",
        "style": "Warm / News",
        "preview_text": "নমস্কার! আমি ভাস্কর। বাংলা ভাষায় স্পষ্ট ও সুন্দর কণ্ঠ।",
        "emotions": ["Professional", "Conversational"],
        "provider": "edge_tts",
        "is_neural": True,
        "is_free": True
    },
    {
        "id": "bn-IN-TanishaaNeural",
        "name": "Tanishaa (তানিশা)",
        "language": "bn",
        "language_name": "Bengali",
        "region": "West Bengal, India",
        "gender": "Female",
        "style": "Natural / Storytelling",
        "preview_text": "নমস্কার! আমি তানিশা। মিষ্টি এবং সাবলীল বাংলা স্বর।",
        "emotions": ["Warm", "Friendly"],
        "provider": "edge_tts",
        "is_neural": True,
        "is_free": True
    },
    # --- GUJARATI ---
    {
        "id": "gu-IN-NiranjanNeural",
        "name": "Niranjan (નિરંજન)",
        "language": "gu",
        "language_name": "Gujarati",
        "region": "Gujarat, India",
        "gender": "Male",
        "style": "Professional / Clear",
        "preview_text": "નમસ્તે! હું નિરંજન છું. ગુજરાતીમાં સચોટ અને સ્પષ્ટ વાણી.",
        "emotions": ["Professional", "Direct"],
        "provider": "edge_tts",
        "is_neural": True,
        "is_free": True
    },
    {
        "id": "gu-IN-DhwaniNeural",
        "name": "Dhwani (ધ્વનિ)",
        "language": "gu",
        "language_name": "Gujarati",
        "region": "Gujarat, India",
        "gender": "Female",
        "style": "Conversational / Friendly",
        "preview_text": "નમસ્તે! હું ધ્વનિ છું. મધુર અને સાહજિક ગુજરાતી અવાજ.",
        "emotions": ["Friendly", "Warm"],
        "provider": "edge_tts",
        "is_neural": True,
        "is_free": True
    },
    # --- PUNJABI ---
    {
        "id": "pa-IN-GurpreetNeural",
        "name": "Gurpreet (ਗੁਰਪ੍ਰੀਤ)",
        "language": "pa",
        "language_name": "Punjabi",
        "region": "Punjab, India",
        "gender": "Male",
        "style": "Warm / Conversational",
        "preview_text": "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਗੁਰਪ੍ਰੀਤ ਹਾਂ। ਕੁਦਰਤੀ ਅਤੇ ਜੋਸ਼ੀਲੀ ਪੰਜਾਬੀ ਆਵਾਜ਼।",
        "emotions": ["Enthusiastic", "Warm"],
        "provider": "edge_tts",
        "is_neural": True,
        "is_free": True
    },
    # --- URDU ---
    {
        "id": "ur-IN-SalmanNeural",
        "name": "Salman (سلمان)",
        "language": "ur",
        "language_name": "Urdu",
        "region": "India",
        "gender": "Male",
        "style": "Poetic / Expressive",
        "preview_text": "السلام علیکم! میں سلمان ہوں۔ شائستہ اور پروقار اردو آواز۔",
        "emotions": ["Poetic", "Gentle"],
        "provider": "edge_tts",
        "is_neural": True,
        "is_free": True
    },
    {
        "id": "ur-IN-GulNeural",
        "name": "Gul (گل)",
        "language": "ur",
        "language_name": "Urdu",
        "region": "India",
        "gender": "Female",
        "style": "Conversational / Warm",
        "preview_text": "السلام علیکم! میں گل ہوں۔ نرم اور باوقار اردو لہجہ।",
        "emotions": ["Warm", "Conversational"],
        "provider": "edge_tts",
        "is_neural": True,
        "is_free": True
    },
    # --- ENGLISH (INDIA & GLOBAL) ---
    {
        "id": "en-IN-NeerjaNeural",
        "name": "Neerja",
        "language": "en",
        "language_name": "English (India)",
        "region": "India",
        "gender": "Female",
        "style": "Natural Indian English",
        "preview_text": "Hello! I am Neerja, bringing you natural Indian English voice synthesis.",
        "emotions": ["Professional", "Friendly", "Customer Support"],
        "provider": "edge_tts",
        "is_neural": True,
        "is_free": True
    },
    {
        "id": "en-IN-PrabhatNeural",
        "name": "Prabhat",
        "language": "en",
        "language_name": "English (India)",
        "region": "India",
        "gender": "Male",
        "style": "Executive / Corporate",
        "preview_text": "Hello! I am Prabhat, delivering polished and authentic Indian English voice.",
        "emotions": ["Executive", "News", "Educational"],
        "provider": "edge_tts",
        "is_neural": True,
        "is_free": True
    },
    {
        "id": "en-US-AriaNeural",
        "name": "Aria (Global)",
        "language": "en",
        "language_name": "English (Global)",
        "region": "International",
        "gender": "Female",
        "style": "Global English / Studio",
        "preview_text": "Hello and welcome to AI Voice India, the premier multilingual voice studio.",
        "emotions": ["Warm", "Commercial", "YouTube"],
        "provider": "edge_tts",
        "is_neural": True,
        "is_free": True
    }
]

class EdgeTTSProvider(BaseTTSProvider):
    """
    100% Free Neural Voice Provider powered by Edge-TTS.
    Zero billing, zero credit card, pristine quality.
    """

    @property
    def provider_id(self) -> str:
        return "edge_tts"

    @property
    def display_name(self) -> str:
        return "Free Neural Engine (Zero Cost)"

    @property
    def is_free(self) -> bool:
        return True

    def is_available(self) -> bool:
        return True

    def get_supported_languages(self) -> List[str]:
        return list(set(v["language"] for v in EDGE_INDIAN_VOICES))

    def get_voices(self, language: Optional[str] = None) -> List[Dict[str, Any]]:
        if not language:
            return EDGE_INDIAN_VOICES
        lang_clean = language.lower()
        return [v for v in EDGE_INDIAN_VOICES if v["language"] == lang_clean]

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
        # Calculate speed rate offset e.g. "+20%", "-10%"
        rate_percent = int(round((speed - 1.0) * 100))
        rate_str = f"{rate_percent:+d}%"

        # Calculate pitch offset e.g. "+5Hz", "-5Hz"
        # If pitch is passed as multiplier (e.g. 0.5 to 5.0, where 1.0 is neutral)
        if pitch > 0:
            pitch_hz = int(round((pitch - 1.0) * 20))
        else:
            pitch_hz = int(round(pitch * 20))
        pitch_str = f"{pitch_hz:+d}Hz"

        # Select matching or fallback voice ID
        selected_voice = voice_id or "kn-IN-GaganNeural"
        
        # Verify voice exists or fallback
        valid_ids = [v["id"] for v in EDGE_INDIAN_VOICES]
        if selected_voice not in valid_ids:
            # Pick first for language
            lang_voices = self.get_voices(language)
            if lang_voices:
                selected_voice = lang_voices[0]["id"]
            else:
                selected_voice = "hi-IN-SwaraNeural"

        communicate = edge_tts.Communicate(
            text=text,
            voice=selected_voice,
            rate=rate_str,
            pitch=pitch_str
        )

        audio_buffer = bytearray()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_buffer.extend(chunk["data"])

        audio_bytes = bytes(audio_buffer)

        if output_path and audio_bytes:
            with open(output_path, "wb") as f:
                f.write(audio_bytes)

        return audio_bytes
