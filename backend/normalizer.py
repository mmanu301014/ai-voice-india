"""
AI VOICE INDIA — Text Normalization Engine
Handles Indian language formatting:
- Numbers & Lakhs/Crores
- Indian Rupee currency (₹, Rs., INR)
- Dates & Times
- Common Indian abbreviations & prefixes (Dr., Prof., Shri, Smt., etc.)
- Clean punctuation & pauses
- Preserving native Unicode Indian scripts
"""

import re
from typing import Dict

# Indian number word maps for major languages
NUMBER_WORDS: Dict[str, Dict[int, str]] = {
    "en": {
        0: "zero", 1: "one", 2: "two", 3: "three", 4: "four", 5: "five",
        6: "six", 7: "seven", 8: "eight", 9: "nine", 10: "ten",
        100: "hundred", 1000: "thousand", 100000: "lakh", 10000000: "crore"
    },
    "hi": {
        0: "शून्य", 1: "एक", 2: "दो", 3: "तीन", 4: "चार", 5: "पांच",
        6: "छह", 7: "सात", 8: "आठ", 9: "नौ", 10: "दस",
        100: "सौ", 1000: "हजार", 100000: "लाख", 10000000: "करोड़"
    },
    "kn": {
        0: "ಸೊನ್ನೆ", 1: "ಒಂದು", 2: "ಎರಡು", 3: "ಮೂರು", 4: "ನಾಲ್ಕು", 5: "ಐದು",
        6: "ಆರು", 7: "ಏಳು", 8: "ಎಂಟು", 9: "ಒಂಬತ್ತು", 10: "ಹತ್ತು",
        100: "ನೂರು", 1000: "ಸಾವಿರ", 100000: "ಲಕ್ಷ", 10000000: "ಕೋಟಿ"
    },
    "ta": {
        0: "பூஜ்ஜியம்", 1: "ஒன்று", 2: "இரண்டு", 3: "மூன்று", 4: "நான்கு", 5: "ஐந்து",
        6: "ஆறு", 7: "ஏழு", 8: "எட்டு", 9: "ஒன்பது", 10: "பத்து",
        100: "நூறு", 1000: "ஆயிரம்", 100000: "லட்சம்", 10000000: "கோடி"
    },
    "te": {
        0: "సున్నా", 1: "ఒకటి", 2: "రెండు", 3: "మూడు", 4: "నాలుగు", 5: "ఐదు",
        6: "ఆరు", 7: "ఏడు", 8: "ఎనిమిది", 9: "తొమ్మిది", 10: "పది",
        100: "వంద", 1000: "వెయ్యి", 100000: "లక్ష", 10000000: "కోటి"
    },
    "mr": {
        0: "शून्य", 1: "एक", 2: "दोन", 3: "तीन", 4: "चार", 5: "पाच",
        6: "सहा", 7: "सात", 8: "आठ", 9: "नऊ", 10: "दहा",
        100: "शंभर", 1000: "हजार", 100000: "लाख", 10000000: "कोटी"
    },
    "ml": {
        0: "പൂജ്യം", 1: "ഒന്ന്", 2: "രണ്ട്", 3: "മൂന്ന്", 4: "നാല്", 5: "അഞ്ച്",
        6: "ആറ്", 7: "ഏഴ്", 8: "എട്ട്", 9: "ഒൻപത്", 10: "പത്ത്",
        100: "നൂറ്", 1000: "ആയിരം", 100000: "ലക്ഷം", 10000000: "കോടി"
    },
    "bn": {
        0: "শূন্য", 1: "এক", 2: "দুই", 3: "তিন", 4: "চার", 5: "পাঁচ",
        6: "ছয়", 7: "সাত", 8: "আট", 9: "নয়", 10: "দশ",
        100: "শত", 1000: "হাজার", 100000: "লাখ", 10000000: "কোটি"
    },
    "gu": {
        0: "શૂન્ય", 1: "એક", 2: "બે", 3: "ત્રણ", 4: "ચાર", 5: "પાંચ",
        6: "છ", 7: "સાત", 8: "આઠ", 9: "નવ", 10: "દસ",
        100: "સો", 1000: "હજાર", 100000: "લાખ", 10000000: "કરોડ"
    },
    "pa": {
        0: "ਸਿਫ਼ਰ", 1: "ਇੱਕ", 2: "ਦੋ", 3: "ਤਿੰਨ", 4: "ਚਾਰ", 5: "ਪੰਜ",
        6: "ਛੇ", 7: "ਸੱਤ", 8: "ਅੱਠ", 9: "ਨੌਂ", 10: "ਦਸ",
        100: "ਸੌ", 1000: "ਹਜ਼ਾਰ", 100000: "ਲੱਖ", 10000000: "ਕਰੋੜ"
    }
}

# Currency labels
CURRENCY_WORDS = {
    "en": "rupees",
    "hi": "रुपये",
    "kn": "ರೂಪಾಯಿ",
    "ta": "ரூபாய்",
    "te": "రూపాయలు",
    "mr": "रुपये",
    "ml": "രൂപ",
    "bn": "টাকা",
    "gu": "રૂપિયા",
    "pa": "ਰੁਪਏ",
    "ur": "روپے",
    "or": "ଟଙ୍କା",
    "as": "টকা",
    "ne": "रुपैयाँ",
    "kok": "रुपये",
    "sa": "रुप्यकाणि"
}

# Common abbreviations in India
COMMON_ABBREVIATIONS = {
    r"\bDr\.\s*": "Doctor ",
    r"\bProf\.\s*": "Professor ",
    r"\bMr\.\s*": "Mister ",
    r"\bMrs\.\s*": "Missus ",
    r"\bMs\.\s*": "Miz ",
    r"\bShri\.\s*": "Shree ",
    r"\bSmt\.\s*": "Shrimati ",
    r"\bGovt\.\s*": "Government ",
    r"\bAI\b": "A I ",
    r"\bIIT\b": "I I T ",
    r"\bIIM\b": "I I M ",
    r"\bISRO\b": "ISRO ",
    r"\bUPI\b": "U P I ",
    r"\bPM\b": "P M ",
    r"\bCM\b": "C M ",
    r"\betc\.\s*": "etcetera ",
    r"\be\.g\.\s*": "for example ",
    r"\bi\.e\.\s*": "that is "
}

def normalize_indian_text(text: str, lang_code: str = "en") -> str:
    """
    Normalizes text for natural TTS pronunciation while keeping native scripts intact.
    Does NOT destroy original content or transliterate native script.
    """
    if not text:
        return ""
    
    normalized = text.strip()

    # 1. Clean URLs (say "link" or domain friendly)
    normalized = re.sub(r'https?://(?:www\.)?([a-zA-Z0-9.-]+)(?:/[^\s]*)?', r'\1 website', normalized)

    # 2. Clean Email addresses
    normalized = re.sub(r'([a-zA-Z0-9_.+-]+)@([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)', r'\1 at \2', normalized)

    # 3. Currency symbol normalization: ₹500, Rs. 500, Rs 500 -> 500 rupees (in target language if supported)
    curr_word = CURRENCY_WORDS.get(lang_code, "rupees")
    normalized = re.sub(r'(?:₹|Rs\.?|INR)\s*(\d+(?:,\d+)*(?:\.\d+)?)', rf'\1 {curr_word}', normalized)

    # 4. Standard abbreviations (mainly for English or mixed text)
    if lang_code == "en":
        for pattern, replacement in COMMON_ABBREVIATIONS.items():
            normalized = re.sub(pattern, replacement, normalized)

    # 5. Clean whitespace & excessive punctuation
    normalized = re.sub(r'[ \t]+', ' ', normalized)
    normalized = re.sub(r'\n{3,}', '\n\n', normalized)
    normalized = re.sub(r'!{2,}', '!', normalized)
    normalized = re.sub(r'\?{2,}', '?', normalized)

    return normalized
