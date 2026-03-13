from datetime import timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.api.auth import get_current_user
from app.database.db import get_db, utcnow
from app.schemas.user_schema import BookmarkPayload, ChatHistoryItem, UserOut, UserProfileUpdate
from app.services.scheme_service import SchemeService

router = APIRouter(tags=["user"])


def _serialize_user(user: dict) -> UserOut:
    return UserOut(
        id=str(user["_id"]),
        email=user["email"],
        is_admin=user.get("is_admin", False),
        name=user.get("name"),
        age=user.get("age"),
        gender=user.get("gender"),
        occupation=user.get("occupation"),
        income=user.get("income"),
        state=user.get("state"),
        district=user.get("district"),
        education_level=user.get("education_level"),
        social_category=user.get("social_category"),
        residence_type=user.get("residence_type"),
        marital_status=user.get("marital_status"),
        disability_status=user.get("disability_status"),
        minority_status=user.get("minority_status"),
    )


@router.get("/me", response_model=UserOut)
async def get_me(user: dict = Depends(get_current_user)):
    return _serialize_user(user)


@router.put("/me", response_model=UserOut)
async def update_me(payload: UserProfileUpdate, user: dict = Depends(get_current_user)):
    db = get_db()
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}

    if updates:
        await db.users.update_one({"_id": user["_id"]}, {"$set": updates})

    updated = await db.users.find_one({"_id": user["_id"]})
    return _serialize_user(updated)


@router.get("/bookmarks")
async def list_bookmarks(user: dict = Depends(get_current_user)):
    db = get_db()
    bookmarks = await db.bookmarks.find({"user_id": str(user["_id"])}).sort("created_at", -1).to_list(length=500)
    scheme_ids = [bookmark["scheme_id"] for bookmark in bookmarks]
    schemes = await SchemeService.get_schemes_by_ids(scheme_ids)
    return {"items": schemes}


@router.post("/bookmarks")
async def add_bookmark(payload: BookmarkPayload, user: dict = Depends(get_current_user)):
    db = get_db()

    scheme = await SchemeService.get_scheme(payload.scheme_id)
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    await db.bookmarks.update_one(
        {"user_id": str(user["_id"]), "scheme_id": payload.scheme_id},
        {"$setOnInsert": {"created_at": utcnow()}},
        upsert=True,
    )

    return {"message": "Bookmarked"}


@router.delete("/bookmarks/{scheme_id}")
async def remove_bookmark(scheme_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    await db.bookmarks.delete_one({"user_id": str(user["_id"]), "scheme_id": scheme_id})
    return {"message": "Removed"}


@router.get("/chat/history", response_model=list[ChatHistoryItem])
async def get_chat_history(user: dict = Depends(get_current_user)):
    db = get_db()
    rows = await db.chat_history.find({"user_id": str(user["_id"])}).sort("created_at", -1).limit(50).to_list(length=50)

    return [
        ChatHistoryItem(
            id=str(item["_id"]),
            query=item.get("query", ""),
            response=item.get("response", ""),
            created_at=item.get("created_at", utcnow()).astimezone(timezone.utc).isoformat(),
        )
        for item in rows
    ]
