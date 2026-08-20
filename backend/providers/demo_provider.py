import math
import struct
import io
from typing import List, Dict, Any, Optional
from .base import BaseTTSProvider

DEMO_VOICES: List[Dict[str, Any]] = [
    {"id": "demo-kn", "name": "Demo Voice (Kannada)", "language": "kn", "language_name": "Kannada", "region": "Karnataka", "gender": "Neutral", "style": "Demo Tone", "preview_text": "ನಮಸ್ಕಾರ (Demo)", "provider": "demo", "is_neural": False, "is_free": True},
    {"id": "demo-hi", "name": "Demo Voice (Hindi)", "language": "hi", "language_name": "Hindi", "region": "India", "gender": "Neutral", "style": "Demo Tone", "preview_text": "नमस्ते (Demo)", "provider": "demo", "is_neural": False, "is_free": True},
    {"id": "demo-en", "name": "Demo Voice (English)", "language": "en", "language_name": "English", "region": "India", "gender": "Neutral", "style": "Demo Tone", "preview_text": "Hello (Demo)", "provider": "demo", "is_neural": False, "is_free": True},
    {"id": "demo-all", "name": "Demo Voice (All Languages)", "language": "all", "language_name": "Multilingual", "region": "India", "gender": "Neutral", "style": "Demo Tone", "preview_text": "AI Voice India Demo", "provider": "demo", "is_neural": False, "is_free": True}
]

def generate_demo_wav_audio(duration_sec: float = 2.5, frequency: float = 440.0) -> bytes:
    """Generates a pleasant zero-dependency melodic WAV chime for offline demo mode"""
    sample_rate = 22050
    num_samples = int(sample_rate * duration_sec)
    
    # 16-bit PCM WAV Header and data
    buffer = io.BytesIO()
    
    # ChunkID "RIFF"
    buffer.write(b'RIFF')
    # ChunkSize (36 + SubChunk2Size)
    data_size = num_samples * 2
    buffer.write(struct.pack('<I', 36 + data_size))
    # Format "WAVE"
    buffer.write(b'WAVE')
    # Subchunk1ID "fmt "
    buffer.write(b'fmt ')
    # Subchunk1Size (16 for PCM)
    buffer.write(struct.pack('<I', 16))
    # AudioFormat (1 for PCM)
    buffer.write(struct.pack('<H', 1))
    # NumChannels (1 for mono)
    buffer.write(struct.pack('<H', 1))
    # SampleRate
    buffer.write(struct.pack('<I', sample_rate))
    # ByteRate (SampleRate * NumChannels * BitsPerSample/8)
    buffer.write(struct.pack('<I', sample_rate * 2))
    # BlockAlign (NumChannels * BitsPerSample/8)
    buffer.write(struct.pack('<H', 2))
    # BitsPerSample
    buffer.write(struct.pack('<H', 16))
    # Subchunk2ID "data"
    buffer.write(b'data')
    # Subchunk2Size
    buffer.write(struct.pack('<I', data_size))
    
    # Generate pleasant multi-harmonic chord with smooth attack/decay envelope
    for i in range(num_samples):
        t = float(i) / sample_rate
        # Envelope: Attack 0.05s, Decay to 0
        envelope = math.exp(-2.5 * t / duration_sec) * min(1.0, t / 0.05)
        # Harmonized pleasant chime: 440Hz + 554.37Hz (C#) + 659.25Hz (E)
        sample_val = (
            0.5 * math.sin(2.0 * math.pi * frequency * t) +
            0.3 * math.sin(2.0 * math.pi * (frequency * 1.25) * t) +
            0.2 * math.sin(2.0 * math.pi * (frequency * 1.5) * t)
        ) * envelope * 28000.0
        
        sample_val = max(-32768, min(32767, int(sample_val)))
        buffer.write(struct.pack('<h', sample_val))
        
    return buffer.getvalue()

class DemoTTSProvider(BaseTTSProvider):
    """
    Guaranteed Offline Demo Provider.
    Zero network, zero cost, 100% stable fallback.
    """

    @property
    def provider_id(self) -> str:
        return "demo"

    @property
    def display_name(self) -> str:
        return "Zero-Cost Offline Demo Mode"

    @property
    def is_free(self) -> bool:
        return True

    def is_available(self) -> bool:
        return True

    def get_supported_languages(self) -> List[str]:
        return ["en", "hi", "kn", "mr", "ta", "te", "ml", "bn", "gu", "pa", "or", "as", "ur", "kok", "ne", "sa"]

    def get_voices(self, language: Optional[str] = None) -> List[Dict[str, Any]]:
        return DEMO_VOICES

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
        # Approximate duration based on word count
        words = len(text.split())
        duration = max(1.5, min(8.0, words * 0.4 / max(0.5, speed)))
        
        # Slightly modulate pitch based on parameter
        freq = 440.0 * (1.0 + (pitch * 0.2))
        audio_bytes = generate_demo_wav_audio(duration_sec=duration, frequency=freq)
        
        if output_path and audio_bytes:
            with open(output_path, "wb") as f:
                f.write(audio_bytes)
                
        return audio_bytes
