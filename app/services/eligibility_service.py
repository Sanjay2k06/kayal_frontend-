from typing import Any

from app.services.scheme_service import SchemeService


class EligibilityService:
    @staticmethod
    def _income_bucket(income: float) -> str:
        if income < 100000:
            return "low"
        if income < 500000:
            return "middle"
        return "high"

    @staticmethod
    def _score_scheme(scheme: dict[str, Any], profile: dict[str, Any]) -> float:
        score = 20.0

        eligibility_text = f"{scheme['eligibility']} {scheme['description']} {scheme['benefits']} {scheme['category']}".lower()
        occupation = profile["occupation"].lower()
        state = profile["state"].lower()
        gender = profile["gender"].lower()
        income_bucket = EligibilityService._income_bucket(profile["income"])
        district = (profile.get("district") or "").lower()
        education_level = (profile.get("education_level") or "").lower()
        social_category = (profile.get("social_category") or "").lower()
        residence_type = (profile.get("residence_type") or "").lower()
        marital_status = (profile.get("marital_status") or "").lower()
        disability_status = (profile.get("disability_status") or "").lower()
        minority_status = (profile.get("minority_status") or "").lower()

        if occupation in eligibility_text:
            score += 30
        if state in scheme["state"].lower() or scheme["state"].lower() in ["all", "india", "pan india"]:
            score += 20
        if gender in eligibility_text:
            score += 10
        if income_bucket in eligibility_text:
            score += 10

        age = profile["age"]
        if "senior" in eligibility_text and age >= 60:
            score += 10
        elif "student" in occupation and 16 <= age <= 30:
            score += 10
        elif "farmer" in occupation and "farmer" in eligibility_text:
            score += 10

        for keyword, bonus in [
            (education_level, 8),
            (social_category, 10),
            (residence_type, 8),
            (marital_status, 6),
        ]:
            if keyword and keyword not in ["general", "not applicable", "prefer not to say"] and keyword in eligibility_text:
                score += bonus

        if district and district in eligibility_text:
            score += 6
        if disability_status == "yes" and any(word in eligibility_text for word in ["disability", "disabled", "divyang"]):
            score += 12
        if minority_status == "yes" and "minority" in eligibility_text:
            score += 10

        return min(score, 99.0)

    @staticmethod
    async def evaluate(profile: dict[str, Any], top_k: int = 10) -> list[dict[str, Any]]:
        schemes_payload = await SchemeService.list_schemes(page=1, limit=5000, category=None, state=None, search=None)
        schemes = schemes_payload["items"]

        ranked = []
        for scheme in schemes:
            match_score = round(EligibilityService._score_scheme(scheme, profile), 2)
            scheme_with_score = {**scheme, "score": match_score}
            ranked.append(scheme_with_score)

        ranked.sort(key=lambda item: item["score"], reverse=True)
        return ranked[:top_k]
