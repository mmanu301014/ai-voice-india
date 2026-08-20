import os
from typing import List, Dict, Any, Optional
from .base import BaseTTSProvider
from .edge_tts_provider import EdgeTTSProvider
from .gtts_provider import GTTSProvider
from .demo_provider import DemoTTSProvider

class ProviderManager:
    """
    Manages TTS providers with priority:
    1. EdgeTTSProvider (Free Neural Indian Voices)
    2. GTTSProvider (Free Google Fallback)
    3. DemoTTSProvider (Offline Tone Synthesizer)
    """

    def __init__(self):
        self.providers: Dict[str, BaseTTSProvider] = {
            "edge_tts": EdgeTTSProvider(),
            "gtts": GTTSProvider(),
            "demo": DemoTTSProvider()
        }
        self.default_provider_id = "edge_tts"

    def get_provider(self, provider_id: Optional[str] = None) -> BaseTTSProvider:
        if provider_id and provider_id in self.providers:
            return self.providers[provider_id]
        return self.providers[self.default_provider_id]

    def list_providers(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": p.provider_id,
                "name": p.display_name,
                "is_free": p.is_free,
                "is_available": p.is_available(),
                "cost": "₹0 (Free / Open Source)" if p.is_free else "Paid (Not Required)"
            }
            for p in self.providers.values()
        ]

    def get_all_voices(self, language: Optional[str] = None) -> List[Dict[str, Any]]:
        # Aggregate voices from active providers
        voices: List[Dict[str, Any]] = []
        # Primary: edge_tts
        edge_voices = self.providers["edge_tts"].get_voices(language)
        voices.extend(edge_voices)
        
        # Fallback/alternative gtts voices
        gtts_voices = self.providers["gtts"].get_voices(language)
        voices.extend(gtts_voices)

        return voices

    async def synthesize(
        self,
        text: str,
        voice_id: str,
        language: str,
        speed: float = 1.0,
        pitch: float = 0.0,
        style: Optional[str] = None,
        output_path: Optional[str] = None,
        provider_preference: Optional[str] = None
    ) -> (bytes, str):
        """
        Attempts synthesis with requested/best provider with automatic fallback.
        Returns tuple of (audio_bytes, provider_used)
        """
        provider_order = []
        if provider_preference and provider_preference in self.providers:
            provider_order.append(self.providers[provider_preference])
        
        # Add remaining providers in prioritized order
        for pid in ["edge_tts", "gtts", "demo"]:
            p = self.providers[pid]
            if p not in provider_order:
                provider_order.append(p)

        last_error = None
        for prov in provider_order:
            try:
                audio = await prov.synthesize(
                    text=text,
                    voice_id=voice_id,
                    language=language,
                    speed=speed,
                    pitch=pitch,
                    style=style,
                    output_path=output_path
                )
                if audio and len(audio) > 0:
                    return audio, prov.provider_id
            except Exception as e:
                print(f"[TTS Provider Error] Provider {prov.provider_id} failed: {e}. Falling back...")
                last_error = e

        # Final safety net: Demo provider
        demo_prov = self.providers["demo"]
        audio = await demo_prov.synthesize(
            text=text,
            voice_id=voice_id,
            language=language,
            speed=speed,
            pitch=pitch,
            style=style,
            output_path=output_path
        )
        return audio, "demo"
