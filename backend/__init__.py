# AI VOICE INDIA — Backend Package
# Load .env variables at package import time so all modules have access.
import os
from pathlib import Path

try:
    from dotenv import load_dotenv
    env_path = Path(__file__).resolve().parent.parent / ".env"
    load_dotenv(dotenv_path=env_path, override=False)
except ImportError:
    pass  # python-dotenv not installed; env vars must be set externally
