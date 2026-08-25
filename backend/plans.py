"""
AI VOICE INDIA — Subscription Plans Configuration
Defines pricing, limits, and feature lists for all subscription tiers.
Centralized so prices and limits can be easily updated in one place.
"""

PLANS = {
    "free": {
        "id": "free",
        "name": "Free / Starter",
        "price_inr": 0,
        "amount_paise": 0,
        "period": "Forever Free",
        "daily_generation_limit": 15,
        "max_characters_per_gen": 2000,
        "badge": "Current Plan",
        "description": "Zero-cost voice generation for personal experimentation and regional speech testing.",
        "features": [
            "16 Indian regional languages & English",
            "15 voice generations per day",
            "Up to 2,000 characters per generation",
            "High-quality Neural Voices (Edge TTS)",
            "Standard MP3 audio download",
            "Smart Indian text normalizer (₹, Lakhs, Crores)",
            "Full Unicode native script support"
        ]
    },
    "basic": {
        "id": "basic",
        "name": "Basic Creator",
        "price_inr": 49,
        "amount_paise": 4900,
        "period": "1 Month",
        "daily_generation_limit": 100,
        "max_characters_per_gen": 5000,
        "badge": "Popular",
        "description": "Optimized for YouTube creators, Instagram Reels, and short-form video narrators.",
        "features": [
            "Everything in Free plan",
            "100 voice generations per day",
            "Up to 5,000 characters per generation",
            "Full HD broadcast audio exports",
            "Fast generation queue priority",
            "Commercial creator rights for YouTube & Reels",
            "Priority discord/email support"
        ]
    },
    "pro": {
        "id": "pro",
        "name": "Pro Studio",
        "price_inr": 99,
        "amount_paise": 9900,
        "period": "1 Month",
        "daily_generation_limit": 500,
        "max_characters_per_gen": 10000,
        "badge": "Best Value",
        "description": "Maximum power for agencies, podcasters, EdTech educators, & commercial brands.",
        "features": [
            "Everything in Basic plan",
            "500 voice generations per day",
            "Up to 10,000 characters per generation",
            "Ultra-low latency synthesis engine",
            "Commercial broadcast licensing rights",
            "Unlimited MP3 downloads & disk cache",
            "Dedicated 24/7 creator priority support"
        ]
    }
}


def get_plan(plan_id: str) -> dict:
    """Fetch plan details by id. Defaults to free if not found."""
    return PLANS.get(plan_id.lower().strip(), PLANS["free"])
