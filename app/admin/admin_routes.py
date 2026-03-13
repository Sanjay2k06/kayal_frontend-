from fastapi import APIRouter, Depends, HTTPException

from app.api.auth import require_admin
from app.schemas.scheme_schema import SchemeCreate, SchemeOut, SchemeUpdate
from app.services.scheme_service import SchemeService

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.post("/add-scheme", response_model=SchemeOut)
async def add_scheme(payload: SchemeCreate):
    data = payload.model_dump()
    data["embedding"] = []
    return await SchemeService.create_scheme(data)


@router.put("/update-scheme/{scheme_id}", response_model=SchemeOut)
async def update_scheme(scheme_id: str, payload: SchemeUpdate):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    updated = await SchemeService.update_scheme(scheme_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return updated


@router.delete("/delete-scheme/{scheme_id}")
async def delete_scheme(scheme_id: str):
    deleted = await SchemeService.delete_scheme(scheme_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return {"message": "Scheme deleted"}


@router.get("/stats")
async def admin_stats():
    return await SchemeService.stats()
