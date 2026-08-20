# AI VOICE INDIA 🇮🇳

> **Natural AI voices, made for India.**

AI VOICE INDIA is a production-quality, multilingual AI voice studio engineered to generate authentic, human-like speech across **16 Indian regional languages and English**.

Built with a strict **₹0 Zero-Cost Architecture** requiring **zero credit cards, zero UPI, and zero paid subscriptions**.

---

## 🌟 Key Features

- 🌐 **16 Supported Indian Languages**: Kannada, Hindi, Marathi, Tamil, Telugu, Malayalam, Bengali, Gujarati, Punjabi, Odia, Assamese, Urdu, Konkani, Nepali, Sanskrit, and Indian English.
- 🎙️ **Authentic Regional Pronunciation**: Regional neural voice models with natural cadence, word stress, intonation, and conversational delivery.
- 🎭 **Voice Personalities & Styles**: Conversational, Professional, News & Broadcast, Storytelling, Customer Support, Educational, and Friendly.
- 🇮🇳 **Smart Indian Text Normalization**: Automatic speech-friendly conversion for Indian Rupee (`₹`, `Rs.`), numbering systems (`Lakhs`, `Crores`), abbreviations (`Dr.`, `ISRO`, `UPI`), dates, and URLs.
- 🎛️ **Voice Settings**: Speed multiplier (0.5x – 2.0x), pitch offset, emotion, and playback scrubbing.
- 🎧 **Studio Audio Player**: Scrubbable audio waveform, variable playback rate, volume control, and instant MP3 download.
- 🛡️ **Zero-Cost Development Mode**: Powered by free neural synthesis (`edge-tts`), Google TTS fallback (`gTTS`), and offline tone synthesis.

---

## 🚀 Quick Start (Local Run)

### 1. Install Backend Dependencies
```bash
python -m pip install -r backend/requirements.txt
```

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### 3. Run Both Servers
You can double-click `start.bat` on Windows or run in separate terminals:

**Terminal 1 (Backend):**
```bash
python -m uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 📡 API Endpoints (FastAPI)

- `GET /api/health` — Service health & zero-cost engine status.
- `GET /api/languages` — List 16 Indian languages with native scripts & sample prompts.
- `GET /api/voices?language=kn` — List filtered neural voice models.
- `GET /api/providers` — Active TTS provider status.
- `POST /api/normalize` — Smart text preprocessing for Indian numbering & currency.
- `POST /api/generate` — Synthesize speech and get streamable/downloadable MP3 URL.
- `GET /api/audio/{filename}` — Audio streaming endpoint.

---

## 🔒 Security & Privacy

- No API keys in frontend React code.
- No payment credentials or cloud billing requirements.
- Clean environment variable handling via `.env`.
