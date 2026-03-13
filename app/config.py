from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "CiviX Backend"
    app_env: str = "development"
    debug: bool = False

    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db: str = "civix"

    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    refresh_token_expire_minutes: int = 60 * 24 * 14

    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"
    gemini_api_base_url: str = "https://generativelanguage.googleapis.com"
    gemini_model_fallbacks: str = "gemini-2.0-flash,gemini-1.5-flash-latest"
    gemini_quota_cooldown_seconds: int = 600

    embedding_model_name: str = "all-MiniLM-L6-v2"
    whisper_model_name: str = "base"

    cors_origins: List[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:8080",
            "http://localhost:4173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:8080",
            "http://127.0.0.1:4173",
        ]
    )
    cors_origin_regex: str = r"https?://(localhost|127\.0\.0\.1)(:\d+)?$"
    rate_limit: str = "100/minute"

    admin_emails: List[str] = Field(default_factory=list)

    demo_account_enabled: bool = True
    demo_account_name: str = "Demo User"
    demo_account_email: str = "demo@civixapp.com"
    demo_account_password: str = "Demo@12345"
    demo_account_age: int = 24
    demo_account_gender: str = "Female"
    demo_account_occupation: str = "Student"
    demo_account_income: float = 200000
    demo_account_state: str = "Maharashtra"
    demo_account_district: str = "Pune"
    demo_account_education_level: str = "Graduate"
    demo_account_social_category: str = "OBC"
    demo_account_residence_type: str = "Urban"
    demo_account_marital_status: str = "Single"
    demo_account_disability_status: str = "no"
    demo_account_minority_status: str = "no"

    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_whatsapp_from: str = "whatsapp:+14155238886"
    twilio_whatsapp_to_default: str = "whatsapp:+917200809026"
    whatsapp_bot_number: str = "+14155238886"


@lru_cache
def get_settings() -> Settings:
    return Settings()
