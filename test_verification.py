import sys
import io
import requests

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 1. Test Frontend HTTP
fe = requests.get('http://127.0.0.1:5173')
print('Frontend Status:', fe.status_code, '| HTML Title contains AI VOICE INDIA:', 'AI VOICE INDIA' in fe.text)

# 2. Test 10 Languages
all_langs = [
    ('kn', 'kn-IN-GaganNeural', 'ನಮಸ್ಕಾರ! ಭಾರತಕ್ಕೆ ಸ್ವಾಗತ.'),
    ('hi', 'hi-IN-MadhurNeural', 'नमस्ते! भारत में आपका स्वागत है।'),
    ('mr', 'mr-IN-ManoharNeural', 'नमस्कार! भारतात आपले स्वागत आहे.'),
    ('ta', 'ta-IN-ValluvarNeural', 'வணக்கம்! இந்தியாவிற்கு வரவேற்கிறோம்.'),
    ('te', 'te-IN-MohanNeural', 'నమస్కారం! భారతదేశానికి స్వాగతం.'),
    ('ml', 'ml-IN-MidhunNeural', 'നമസ്കാരം! ഇന്ത്യയിലേക്ക് സ്വാഗതം.'),
    ('bn', 'bn-IN-BashkarNeural', 'নমস্কার! ভারতে আপনাকে স্বাগতম।'),
    ('gu', 'gu-IN-NiranjanNeural', 'નમસ્તે! ભારતમાં આપનું સ્વાગત છે.'),
    ('pa', 'pa-IN-GurpreetNeural', 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਭਾਰਤ ਵਿੱਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ।'),
    ('en', 'en-IN-NeerjaNeural', 'Hello! Welcome to India.')
]

print('\nTesting Full Speech Generation Across 10 Languages:')
passed = 0
for code, voice, sample in all_langs:
    resp = requests.post('http://127.0.0.1:8000/api/generate', json={'text': sample, 'language': code, 'voice_id': voice, 'speed': 1.0})
    data = resp.json()
    audio_url = data.get('audio_url', '')
    audio_status = requests.get('http://127.0.0.1:8000' + audio_url).status_code if audio_url else 500
    is_ok = data.get('success') and audio_status == 200
    if is_ok:
        passed += 1
    print(f"[{code.upper()}] Success: {data.get('success')} | Provider: {data.get('provider')} | Audio HTTP: {audio_status} | File: {data.get('filename')}")

print(f"\nVerification Result: {passed}/{len(all_langs)} languages generated and streamable!")
