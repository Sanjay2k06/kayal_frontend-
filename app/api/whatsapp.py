from __future__ import annotations

from typing import Any
from xml.sax.saxutils import escape

from fastapi import APIRouter, Form, Response

from app.config import get_settings
from app.database.db import get_db, utcnow
from app.services.eligibility_service import EligibilityService

router = APIRouter(tags=["whatsapp"])

_REQUIRED_FIELDS: list[tuple[str, str]] = [
    ("name", "Hi, I am CiviX Assistant. First, what is your name?"),
    ("age", "Thanks. What is your age? For example: 28."),
    ("gender", "Got it. What is your gender? You can reply with Male, Female, or Other."),
    ("occupation", "What do you do currently? For example: Student, Farmer, Salaried, Self-employed."),
    ("income", "What is your approximate annual income in INR? For example: 250000."),
    ("state", "Which state do you live in? For example: Maharashtra."),
    ("district", "Which district do you live in? For example: Pune."),
]


def _twiml_message(message: str) -> Response:
    safe_message = escape(message)
    xml = f"<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response><Message>{safe_message}</Message></Response>"
    return Response(content=xml, media_type="application/xml")


def _normalise_value(field: str, value: str) -> Any:
    value = value.strip()
    if field == "name":
        if len(value) < 2:
            raise ValueError("Invalid name")
        return value
    if field == "age":
        parsed = int(value)
        if parsed <= 0 or parsed > 120:
            raise ValueError("Invalid age")
        return parsed
    if field == "income":
        parsed = float(value)
        if parsed < 0:
            raise ValueError("Invalid income")
        return parsed
    return value


@router.get("/whatsapp/health")
async def whatsapp_health() -> dict[str, Any]:
    settings = get_settings()
    return {
        "status": "ok",
        "webhook_path": "/whatsapp/webhook",
        "twilio_configured": bool(settings.twilio_account_sid and settings.twilio_auth_token),
        "from_number": settings.twilio_whatsapp_from,
        "default_to_number": settings.twilio_whatsapp_to_default,
    }


@router.post("/whatsapp/webhook")
async def whatsapp_webhook(
    Body: str = Form(default=""),
    From: str = Form(default=""),
    To: str = Form(default=""),
):
    db = get_db()
    incoming = (Body or "").strip()
    phone = (From or "").strip()

    if not phone:
        return _twiml_message("Unable to identify sender number.")

    session = await db.whatsapp_sessions.find_one({"phone": phone})

    # Start / restart flow
    if incoming.lower() in {"hi", "hello", "start", "restart", "reset"} or not session:
        session = {
            "phone": phone,
            "to_number": To,
            "step_index": 0,
            "profile": {
                "name": "",
                "education_level": "",
                "social_category": "",
                "residence_type": "",
                "marital_status": "",
                "disability_status": "no",
                "minority_status": "no",
            },
            "updated_at": utcnow(),
        }
        await db.whatsapp_sessions.update_one(
            {"phone": phone},
            {"$set": session},
            upsert=True,
        )
        return _twiml_message(_REQUIRED_FIELDS[0][1])

    step_index = int(session.get("step_index", 0))
    profile: dict[str, Any] = session.get("profile", {})

    if step_index < len(_REQUIRED_FIELDS):
        field, _ = _REQUIRED_FIELDS[step_index]
        try:
            profile[field] = _normalise_value(field, incoming)
        except Exception:
            friendly_labels = {
                "name": "name",
                "age": "age",
                "gender": "gender",
                "occupation": "occupation",
                "income": "income",
                "state": "state",
                "district": "district",
            }
            return _twiml_message(f"I could not understand your {friendly_labels.get(field, field)}. {_REQUIRED_FIELDS[step_index][1]}")

        step_index += 1
        await db.whatsapp_sessions.update_one(
            {"phone": phone},
            {"$set": {"profile": profile, "step_index": step_index, "updated_at": utcnow()}},
            upsert=True,
        )

        if step_index < len(_REQUIRED_FIELDS):
            return _twiml_message(_REQUIRED_FIELDS[step_index][1])

    # Build final payload with optional fields defaults
    complete_profile = {
        "name": str(profile.get("name", "")),
        "age": int(profile.get("age", 0)),
        "gender": str(profile.get("gender", "")),
        "occupation": str(profile.get("occupation", "")),
        "income": float(profile.get("income", 0.0)),
        "state": str(profile.get("state", "")),
        "district": str(profile.get("district", "")),
        "education_level": str(profile.get("education_level", "")),
        "social_category": str(profile.get("social_category", "")),
        "residence_type": str(profile.get("residence_type", "")),
        "marital_status": str(profile.get("marital_status", "")),
        "disability_status": str(profile.get("disability_status", "no")),
        "minority_status": str(profile.get("minority_status", "no")),
    }

    recommendations = await EligibilityService.evaluate(complete_profile, top_k=3)

    if not recommendations:
        await db.whatsapp_sessions.update_one(
            {"phone": phone},
            {"$set": {"step_index": 0, "updated_at": utcnow()}},
            upsert=True,
        )
        return _twiml_message(
            "I could not find a strong match right now. Send START and we can try again with a different profile."
        )

    name = complete_profile.get("name") or "there"
    lines = [f"{name}, your best matches:"]
    for index, scheme in enumerate(recommendations, start=1):
        scheme_name = str(scheme.get("scheme_name", "Scheme"))
        if len(scheme_name) > 52:
            scheme_name = f"{scheme_name[:49].rstrip()}..."
        lines.append(
            "\n".join(
                [
                    f"{index}. {scheme_name}",
                    f"Match: {round(float(scheme.get('score', 0)), 1)}%",
                    f"Apply: {scheme.get('official_link')}",
                ]
            )
        )

    lines.append("Reply START to check again.")

    await db.whatsapp_sessions.update_one(
        {"phone": phone},
        {
            "$set": {
                "last_recommendations": recommendations,
                "step_index": 0,
                "updated_at": utcnow(),
            }
        },
        upsert=True,
    )

    return _twiml_message("\n".join(lines))
