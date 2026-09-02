"""
AI VOICE INDIA — Subscription Plans Configuration
Defines pricing, limits, and feature lists for all subscription tiers.
Updated according to platform specifications:
- BASIC CREATOR: ₹99/month, 200 characters/month
- PRO: ₹199/month, 1,000 characters/month
- BUSINESS: ₹999/month, 5,000 characters/month
"""

# ── Monthly Character Limit Config ──────────────────────────────────────────
BASIC_MONTHLY_CHAR_LIMIT    = 200         # 200 characters / month
PRO_MONTHLY_CHAR_LIMIT      = 1_000       # 1,000 characters / month
BUSINESS_MONTHLY_CHAR_LIMIT = 5_000       # 5,000 characters / month

# Backward compatibility alias
FREE_MONTHLY_CHAR_LIMIT     = BASIC_MONTHLY_CHAR_LIMIT
FREE_TOTAL_CHAR_LIMIT       = BASIC_MONTHLY_CHAR_LIMIT
BASIC_TOTAL_CHAR_LIMIT      = BASIC_MONTHLY_CHAR_LIMIT
PRO_TOTAL_CHAR_LIMIT        = PRO_MONTHLY_CHAR_LIMIT

PLANS = {
    "basic": {
        "id": "basic",
        "name": "Basic Creator",
        "shortName": "Basic",
        "price_inr": 99,
        "amount_paise": 9900,
        "period": "/month",
        "billing_cycle": "Monthly",
        "daily_generation_limit": 50,
        "max_characters_per_gen": 200,
        "monthly_character_limit": BASIC_MONTHLY_CHAR_LIMIT,
        "total_character_limit": BASIC_MONTHLY_CHAR_LIMIT,
        "badge": "MOST POPULAR",
        "accent": "orange",
        "description": "Ideal for getting started with AI Indian voices and personal projects.",
        "features": [
            "200 characters/month",
            "All 16 Indian languages & voices",
            "Standard voice quality",
            "Email support"
        ]
    },
    "free": {
        "id": "free",
        "name": "Basic Creator",
        "shortName": "Basic",
        "price_inr": 99,
        "amount_paise": 9900,
        "period": "/month",
        "billing_cycle": "Monthly",
        "daily_generation_limit": 50,
        "max_characters_per_gen": 200,
        "monthly_character_limit": BASIC_MONTHLY_CHAR_LIMIT,
        "total_character_limit": BASIC_MONTHLY_CHAR_LIMIT,
        "badge": "MOST POPULAR",
        "accent": "orange",
        "description": "Ideal for getting started with AI Indian voices and personal projects.",
        "features": [
            "200 characters/month",
            "All 16 Indian languages & voices",
            "Standard voice quality",
            "Email support"
        ]
    },
    "pro": {
        "id": "pro",
        "name": "Pro",
        "shortName": "Pro",
        "price_inr": 199,
        "amount_paise": 19900,
        "period": "/month",
        "billing_cycle": "Monthly",
        "daily_generation_limit": 200,
        "max_characters_per_gen": 1000,
        "monthly_character_limit": PRO_MONTHLY_CHAR_LIMIT,
        "total_character_limit": PRO_MONTHLY_CHAR_LIMIT,
        "badge": "BEST VALUE",
        "accent": "purple",
        "description": "Optimized for active YouTube creators, Reels narrators, and podcasts.",
        "features": [
            "1,000 characters/month",
            "All 16 Indian languages & voices",
            "High quality voices",
            "Priority support",
            "Commercial license"
        ]
    },
    "business": {
        "id": "business",
        "name": "Business",
        "shortName": "Business",
        "price_inr": 999,
        "amount_paise": 99900,
        "period": "/month",
        "billing_cycle": "Monthly",
        "daily_generation_limit": 1000,
        "max_characters_per_gen": 5000,
        "monthly_character_limit": BUSINESS_MONTHLY_CHAR_LIMIT,
        "total_character_limit": BUSINESS_MONTHLY_CHAR_LIMIT,
        "badge": "FOR BUSINESS",
        "accent": "blue",
        "description": "Designed for brands, agencies, and professional production teams.",
        "features": [
            "5,000 characters/month",
            "All 16 Indian languages & voices",
            "Priority voice processing",
            "Commercial license",
            "Custom voice cloning (optional)"
        ]
    }
}


def get_plan(plan_id: str) -> dict:
    """Fetch plan details by id. Defaults to basic if not found."""
    if not plan_id:
        return PLANS["basic"]
    clean = str(plan_id).lower().strip()
    return PLANS.get(clean, PLANS["basic"])
