from app.config import get_settings
from app.database.db import get_db, utcnow
from app.security.hash import hash_password


async def ensure_demo_account() -> None:
    settings = get_settings()
    if not settings.demo_account_enabled:
        return

    db = get_db()
    email = settings.demo_account_email.lower().strip()

    doc = {
        "email": email,
        "password": hash_password(settings.demo_account_password),
        "is_admin": False,
        "name": settings.demo_account_name,
        "age": settings.demo_account_age,
        "gender": settings.demo_account_gender,
        "occupation": settings.demo_account_occupation,
        "income": settings.demo_account_income,
        "state": settings.demo_account_state,
        "district": settings.demo_account_district,
        "education_level": settings.demo_account_education_level,
        "social_category": settings.demo_account_social_category,
        "residence_type": settings.demo_account_residence_type,
        "marital_status": settings.demo_account_marital_status,
        "disability_status": settings.demo_account_disability_status,
        "minority_status": settings.demo_account_minority_status,
    }

    await db.users.update_one(
        {"email": email},
        {"$set": doc, "$setOnInsert": {"created_at": utcnow()}},
        upsert=True,
    )
