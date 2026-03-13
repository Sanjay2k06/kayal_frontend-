from datetime import timezone

from fastapi import APIRouter, Depends, HTTPException

from app.api.auth import get_current_user
from app.database.db import get_db, utcnow
from app.schemas.scheme_schema import WorkflowChecklistItem, WorkflowInsightResponse, WorkflowReminderItem
from app.schemas.user_schema import BookmarkPayload, ChatHistoryItem, ChecklistToggleRequest, UserOut, UserProfileUpdate
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


def _infer_available_documents(user: dict) -> set[str]:
    provided: set[str] = set()
    if user.get("name"):
        provided.add("passport-size photograph")
    if user.get("state"):
        provided.add("domicile certificate")
    if user.get("income") is not None:
        provided.add("income certificate")
    if user.get("social_category"):
        provided.add("caste certificate")
    provided.add("mobile number")
    return provided


@router.get("/workflow", response_model=WorkflowInsightResponse)
async def get_workflow(user: dict = Depends(get_current_user)):
    db = get_db()
    bookmarks = await db.bookmarks.find({"user_id": str(user["_id"])}).sort("created_at", -1).to_list(length=30)
    scheme_ids = [bookmark["scheme_id"] for bookmark in bookmarks]
    schemes = await SchemeService.get_schemes_by_ids(scheme_ids)

    available_docs = _infer_available_documents(user)
    missing_documents: set[str] = set()
    checklist: list[WorkflowChecklistItem] = []
    reminders: list[WorkflowReminderItem] = []

    checklist_state = await db.user_checklist.find({"user_id": str(user["_id"])}).to_list(length=1000)
    checklist_lookup = {item.get("item_id"): bool(item.get("done")) for item in checklist_state}

    for scheme in schemes[:15]:
        for document in scheme.get("required_documents", [])[:4]:
            doc_normalized = document.strip().lower()
            item_id = f"{scheme['id']}::{doc_normalized}"
            checklist.append(
                WorkflowChecklistItem(
                    id=item_id,
                    label=f"Prepare {document} for {scheme['scheme_name']}",
                    done=checklist_lookup.get(item_id, False),
                    scheme_id=scheme["id"],
                )
            )
            if doc_normalized not in available_docs:
                missing_documents.add(document)

        deadline = scheme.get("deadline")
        if isinstance(deadline, str) and deadline:
            try:
                from datetime import date

                deadline_date = deadline[:10]
                left = (date.fromisoformat(deadline_date) - utcnow().date()).days
                if left >= 0 and left <= 90:
                    reminders.append(
                        WorkflowReminderItem(
                            scheme_id=scheme["id"],
                            scheme_name=scheme["scheme_name"],
                            deadline=deadline_date,
                            days_left=left,
                        )
                    )
            except ValueError:
                continue

    reminders.sort(key=lambda item: item.days_left)
    return WorkflowInsightResponse(
        checklist=checklist[:40],
        reminders=reminders[:10],
        missing_documents=sorted(missing_documents),
    )


@router.post("/workflow/checklist")
async def toggle_checklist_item(payload: ChecklistToggleRequest, user: dict = Depends(get_current_user)):
    db = get_db()
    await db.user_checklist.update_one(
        {"user_id": str(user["_id"]), "item_id": payload.item_id},
        {"$set": {"done": payload.done, "updated_at": utcnow()}},
        upsert=True,
    )
    return {"message": "Checklist updated"}
