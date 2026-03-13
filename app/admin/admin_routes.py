import asyncio
from datetime import timezone

import httpx
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.api.auth import require_admin
from app.config import get_settings
from app.database.db import get_db, utcnow
from app.schemas.scheme_schema import (
    AdminBulkPreviewRequest,
    AdminBulkPreviewResponse,
    AdminWhatsAppStatusResponse,
    BackgroundJobOut,
    DataTrustReportItem,
    SchemeChangeRequestOut,
    SchemeCreate,
    SchemeOut,
    SchemeUpdate,
)
from app.services.job_service import JobService
from app.services.scheme_service import SchemeService

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.post("/add-scheme", response_model=SchemeOut)
async def add_scheme(payload: SchemeCreate):
    data = payload.model_dump()
    data["embedding"] = []
    return await SchemeService.create_scheme(data)


@router.put("/update-scheme/{scheme_id}", response_model=SchemeOut)
async def update_scheme(scheme_id: str, payload: SchemeUpdate, admin: dict = Depends(require_admin)):
    db = get_db()
    existing = await SchemeService.get_scheme(scheme_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Scheme not found")

    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        return existing

    diff_preview = {
        key: {"from": existing.get(key), "to": value}
        for key, value in updates.items()
        if existing.get(key) != value
    }

    change_request = {
        "scheme_id": scheme_id,
        "scheme_name": existing.get("scheme_name", ""),
        "requested_by": str(admin["_id"]),
        "requested_at": utcnow(),
        "status": "pending",
        "updates": updates,
        "diff_preview": diff_preview,
    }
    result = await db.scheme_change_requests.insert_one(change_request)
    await db.schemes.update_one(
        {"_id": ObjectId(scheme_id)},
        {"$set": {"approval_status": "pending", "change_request_id": str(result.inserted_id)}},
    )

    pending_view = await SchemeService.get_scheme(scheme_id)
    return pending_view if pending_view else existing


@router.delete("/delete-scheme/{scheme_id}")
async def delete_scheme(scheme_id: str):
    deleted = await SchemeService.delete_scheme(scheme_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return {"message": "Scheme deleted"}


@router.get("/stats")
async def admin_stats():
    return await SchemeService.stats()


@router.get("/pending-changes", response_model=list[SchemeChangeRequestOut])
async def list_pending_changes():
    db = get_db()
    rows = await db.scheme_change_requests.find({"status": "pending"}).sort("requested_at", -1).to_list(length=200)
    return [
        SchemeChangeRequestOut(
            id=str(item["_id"]),
            scheme_id=item["scheme_id"],
            scheme_name=item.get("scheme_name", ""),
            status=item.get("status", "pending"),
            requested_by=item.get("requested_by", ""),
            requested_at=item.get("requested_at", utcnow()).astimezone(timezone.utc).isoformat(),
            updates=item.get("updates", {}),
            diff_preview=item.get("diff_preview", {}),
        )
        for item in rows
    ]


@router.post("/preview-diff", response_model=AdminBulkPreviewResponse)
async def preview_diff(payload: AdminBulkPreviewRequest):
    existing = await SchemeService.get_scheme(payload.scheme_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Scheme not found")

    changes = {
        key: {"from": existing.get(key), "to": value}
        for key, value in payload.updates.items()
        if existing.get(key) != value
    }
    return AdminBulkPreviewResponse(scheme_id=payload.scheme_id, scheme_name=existing.get("scheme_name", ""), changes=changes)


@router.post("/approve-change/{change_id}", response_model=SchemeOut)
async def approve_change(change_id: str, admin: dict = Depends(require_admin)):
    _ = admin
    db = get_db()
    try:
        change_obj = ObjectId(change_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid change id") from exc

    change = await db.scheme_change_requests.find_one({"_id": change_obj, "status": "pending"})
    if not change:
        raise HTTPException(status_code=404, detail="Pending change not found")

    scheme = await SchemeService.get_scheme(change["scheme_id"])
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    await db.scheme_revision_history.insert_one(
        {
            "scheme_id": change["scheme_id"],
            "snapshot": scheme,
            "created_at": utcnow(),
        }
    )

    updated = await SchemeService.update_scheme(change["scheme_id"], {**change.get("updates", {}), "approval_status": "approved"})
    await db.scheme_change_requests.update_one({"_id": change_obj}, {"$set": {"status": "approved", "approved_at": utcnow()}})
    if not updated:
        raise HTTPException(status_code=404, detail="Scheme not found after approval")
    return updated


@router.post("/reject-change/{change_id}")
async def reject_change(change_id: str):
    db = get_db()
    try:
        change_obj = ObjectId(change_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid change id") from exc

    change = await db.scheme_change_requests.find_one({"_id": change_obj, "status": "pending"})
    if not change:
        raise HTTPException(status_code=404, detail="Pending change not found")

    await db.scheme_change_requests.update_one({"_id": change_obj}, {"$set": {"status": "rejected", "rejected_at": utcnow()}})
    await db.schemes.update_one({"_id": ObjectId(change["scheme_id"])}, {"$set": {"approval_status": "approved"}})
    return {"message": "Change rejected"}


@router.post("/rollback/{scheme_id}", response_model=SchemeOut)
async def rollback_scheme(scheme_id: str):
    db = get_db()
    snapshot = await db.scheme_revision_history.find_one({"scheme_id": scheme_id}, sort=[("created_at", -1)])
    if not snapshot:
        raise HTTPException(status_code=404, detail="No revision history found for this scheme")

    restored_payload = {**snapshot["snapshot"]}
    restored_payload.pop("id", None)
    restored_payload.pop("_id", None)

    restored = await SchemeService.update_scheme(scheme_id, restored_payload)
    if not restored:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return restored


@router.post("/scan-data-trust")
async def scan_data_trust():
    job = JobService.create_job("data_trust_scan")

    async def _run_scan() -> None:
        try:
            report = await SchemeService.detect_duplicates_and_links(limit=500)
            JobService.finish_job(job["id"], {"items_scanned": len(report)})
        except Exception as exc:
            JobService.fail_job(job["id"], str(exc))

    asyncio.create_task(_run_scan())
    return job


@router.get("/data-trust-report", response_model=list[DataTrustReportItem])
async def get_data_trust_report():
    report = await SchemeService.detect_duplicates_and_links(limit=200)
    return [DataTrustReportItem(**item) for item in report]


@router.get("/jobs", response_model=list[BackgroundJobOut])
async def list_jobs():
    return [BackgroundJobOut(**item) for item in JobService.list_jobs()]


@router.get("/whatsapp-status", response_model=AdminWhatsAppStatusResponse)
async def whatsapp_status():
    settings = get_settings()
    webhook_path = "/whatsapp/webhook"
    ngrok_public_url: str | None = None

    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.get("http://127.0.0.1:4040/api/tunnels")
            response.raise_for_status()
            tunnels = response.json().get("tunnels", [])
    except Exception:
        tunnels = []

    for tunnel in tunnels:
        public_url = tunnel.get("public_url")
        if isinstance(public_url, str) and public_url.startswith("https://"):
            ngrok_public_url = public_url.rstrip("/")
            break

    webhook_url = f"{ngrok_public_url}{webhook_path}" if ngrok_public_url else None
    health_url = f"{ngrok_public_url}/whatsapp/health" if ngrok_public_url else None

    return AdminWhatsAppStatusResponse(
        status="ok",
        webhook_path=webhook_path,
        twilio_configured=bool(settings.twilio_account_sid and settings.twilio_auth_token),
        from_number=settings.twilio_whatsapp_from,
        default_to_number=settings.twilio_whatsapp_to_default,
        ngrok_running=bool(ngrok_public_url),
        ngrok_public_url=ngrok_public_url,
        webhook_url=webhook_url,
        health_url=health_url,
    )
