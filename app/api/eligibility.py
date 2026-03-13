from fastapi import APIRouter

from app.schemas.scheme_schema import EligibilityRequest, EligibilityResponse
from app.services.eligibility_service import EligibilityService

router = APIRouter(tags=["eligibility"])


@router.post("/eligibility", response_model=EligibilityResponse)
async def check_eligibility(payload: EligibilityRequest):
    ranked = await EligibilityService.evaluate(payload.model_dump())
    return {"eligible_schemes": ranked}
