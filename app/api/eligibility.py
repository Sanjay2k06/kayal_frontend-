from fastapi import APIRouter

from app.schemas.scheme_schema import EligibilityRequest, EligibilityResponse, HeroSimulationRequest, HeroSimulationResponse
from app.services.eligibility_service import EligibilityService

router = APIRouter(tags=["eligibility"])


@router.post("/eligibility", response_model=EligibilityResponse)
async def check_eligibility(payload: EligibilityRequest):
    ranked = await EligibilityService.evaluate(payload.model_dump())
    return {"eligible_schemes": ranked}


@router.post("/eligibility/hero", response_model=HeroSimulationResponse)
async def run_hero_simulation(payload: HeroSimulationRequest):
    return await EligibilityService.run_hero_flow(payload.profile.model_dump(), payload.what_if.model_dump())
