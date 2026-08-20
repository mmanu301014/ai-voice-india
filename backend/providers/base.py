from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class BaseTTSProvider(ABC):
    """
    Abstract Base Class for all TTS Providers.
    Ensures modularity and zero-cost switching.
    """
    
    @property
    @abstractmethod
    def provider_id(self) -> str:
        """Unique identifier for provider e.g. 'edge_tts', 'gtts', 'demo', 'google'"""
        pass

    @property
    @abstractmethod
    def display_name(self) -> str:
        """Human-readable provider name"""
        pass

    @property
    @abstractmethod
    def is_free(self) -> bool:
        """True if the provider operates with ₹0 cost and no API keys required"""
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Check if provider dependencies/credentials are ready"""
        pass

    @abstractmethod
    def get_supported_languages(self) -> List[str]:
        """List of supported language codes e.g. ['kn', 'hi', 'en', 'mr', 'ta', 'te', ...]"""
        pass

    @abstractmethod
    def get_voices(self, language: Optional[str] = None) -> List[Dict[str, Any]]:
        """List available voices for a given language or all languages"""
        pass

    @abstractmethod
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
        """
        Synthesizes speech from text.
        Returns audio bytes (mp3/wav) and optionally saves to output_path.
        """
        pass
