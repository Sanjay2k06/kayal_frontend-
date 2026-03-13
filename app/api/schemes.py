from fastapi import APIRouter, HTTPException, Query

from app.schemas.scheme_schema import SchemeListOut, SchemeOut
from app.services.scheme_service import SchemeService

router = APIRouter(tags=["schemes"])


@router.get("/schemes", response_model=SchemeListOut)
async def list_schemes(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    category: str | None = None,
    state: str | None = None,
    search: str | None = None,
):
    return await SchemeService.list_schemes(page=page, limit=limit, category=category, state=state, search=search)


@router.get("/schemes/{scheme_id}", response_model=SchemeOut)
async def get_scheme(scheme_id: str):
    scheme = await SchemeService.get_scheme(scheme_id)
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return scheme
