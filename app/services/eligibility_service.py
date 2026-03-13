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
    def _explain_scheme(scheme: dict[str, Any], profile: dict[str, Any], score: float) -> tuple[list[str], list[str], float]:
        eligibility_text = f"{scheme['eligibility']} {scheme['description']} {scheme['benefits']} {scheme['category']}".lower()
        matched: list[str] = []
        not_matched: list[str] = []

        checks: list[tuple[str, bool]] = [
            ("Occupation aligned with scheme criteria", profile["occupation"].lower() in eligibility_text),
            ("State eligibility aligned", profile["state"].lower() in scheme["state"].lower() or scheme["state"].lower() in ["all", "india", "pan india"]),
            ("Income fit appears eligible", EligibilityService._income_bucket(profile["income"]) in eligibility_text),
            ("Gender condition appears supported", profile["gender"].lower() in eligibility_text if profile.get("gender") else False),
        ]

        for label, ok in checks:
            if ok:
                matched.append(label)
            else:
                not_matched.append(label)

        if profile.get("social_category"):
            category_text = profile["social_category"].lower()
            if category_text in eligibility_text:
                matched.append("Social category support found")
            else:
                not_matched.append("Social category criteria not explicit")

        if profile.get("minority_status") == "yes" and "minority" not in eligibility_text:
            not_matched.append("Minority-specific criteria not explicit")

        confidence = min(99.0, max(20.0, round(score * 0.92 + len(matched) * 1.5, 2)))
        return matched[:5], not_matched[:5], confidence

    @staticmethod
    def _available_documents_from_profile(profile: dict[str, Any]) -> set[str]:
        available: set[str] = {"mobile number"}
        if profile.get("state"):
            available.add("domicile certificate")
        if profile.get("income") is not None:
            available.add("income certificate")
        if profile.get("social_category"):
            available.add("caste certificate")
        if profile.get("occupation") == "Student":
            available.add("student id")
        return available

    @staticmethod
    def _predict_success_probability(scheme: dict[str, Any], simulated_score: float, confidence_score: float, profile: dict[str, Any]) -> tuple[float, list[str]]:
        required_documents = [doc.strip() for doc in scheme.get("required_documents", []) if isinstance(doc, str)]
        available_documents = EligibilityService._available_documents_from_profile(profile)
        missing_documents = [doc for doc in required_documents if doc.lower() not in available_documents]

        document_readiness = 100.0
        if required_documents:
            document_readiness = max(10.0, round((1 - (len(missing_documents) / len(required_documents))) * 100, 2))

        probability = round(min(97.0, max(15.0, (simulated_score * 0.55) + (confidence_score * 0.3) + (document_readiness * 0.15))), 2)
        return probability, missing_documents

    @staticmethod
    def _build_action_plan(scheme: dict[str, Any], missing_documents: list[str], score_delta: float) -> list[str]:
        plan: list[str] = [
            f"Review official eligibility once on {scheme.get('official_link', 'the official portal')}",
            "Complete profile details and verify income/state fields are accurate",
        ]
        if missing_documents:
            plan.append("Collect missing documents: " + ", ".join(missing_documents[:5]))
        if scheme.get("deadline"):
            plan.append(f"Submit before deadline: {scheme['deadline']}")
        if score_delta < 0:
            plan.append("Try an alternative profile scenario (income/state/occupation) to improve match")
        else:
            plan.append("Proceed with application since this scenario improved match potential")
        return plan

    @staticmethod
    async def evaluate(profile: dict[str, Any], top_k: int = 10) -> list[dict[str, Any]]:
        schemes_payload = await SchemeService.list_schemes(page=1, limit=5000, category=None, state=None, search=None)
        schemes = schemes_payload["items"]

        ranked = []
        for scheme in schemes:
            match_score = round(EligibilityService._score_scheme(scheme, profile), 2)
            why_matched, why_not_matched, confidence = EligibilityService._explain_scheme(scheme, profile, match_score)
            scheme_with_score = {
                **scheme,
                "score": match_score,
                "confidence_score": confidence,
                "why_matched": why_matched,
                "why_not_matched": why_not_matched,
            }
            ranked.append(scheme_with_score)

        ranked.sort(key=lambda item: item["score"], reverse=True)
        return ranked[:top_k]

    @staticmethod
    async def run_hero_flow(profile: dict[str, Any], what_if: dict[str, Any], top_k: int = 5) -> dict[str, Any]:
        baseline = await EligibilityService.evaluate(profile, top_k=top_k)
        simulated = await EligibilityService.evaluate(what_if, top_k=top_k)

        baseline_scores = {item["id"]: float(item.get("score", 0)) for item in baseline}
        hero_recommendations: list[dict[str, Any]] = []

        for item in simulated:
            base_score = baseline_scores.get(item["id"], 0.0)
            simulated_score = float(item.get("score", 0.0))
            score_delta = round(simulated_score - base_score, 2)
            confidence_score = float(item.get("confidence_score", simulated_score))
            success_probability, missing_documents = EligibilityService._predict_success_probability(
                item,
                simulated_score=simulated_score,
                confidence_score=confidence_score,
                profile=what_if,
            )
            action_plan = EligibilityService._build_action_plan(item, missing_documents=missing_documents, score_delta=score_delta)

            hero_recommendations.append(
                {
                    "scheme": item,
                    "base_score": round(base_score, 2),
                    "simulated_score": round(simulated_score, 2),
                    "score_delta": score_delta,
                    "success_probability": success_probability,
                    "missing_documents": missing_documents,
                    "action_plan": action_plan,
                }
            )

        hero_recommendations.sort(
            key=lambda rec: (rec["success_probability"], rec["simulated_score"], rec["score_delta"]),
            reverse=True,
        )

        improved_count = len([rec for rec in hero_recommendations if rec["score_delta"] > 0])
        summary = (
            f"What-if simulation complete. {improved_count} of top {len(hero_recommendations)} schemes improved under the simulated profile. "
            "Use the action plan to maximize application success."
        )

        return {
            "baseline_top_schemes": baseline,
            "simulated_top_schemes": hero_recommendations,
            "summary": summary,
        }
