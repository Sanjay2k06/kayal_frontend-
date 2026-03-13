import httpx
from time import monotonic

from app.config import get_settings


class GeminiClient:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._quota_blocked_until: dict[str, float] = {}

    @staticmethod
    def _normalize_model(model: str) -> str:
        normalized = model.strip()
        if normalized.startswith("models/"):
            normalized = normalized[len("models/") :]
        return normalized

    def _candidate_models(self) -> list[str]:
        configured = [self.settings.gemini_model]
        fallback_config = self.settings.gemini_model_fallbacks.strip()
        if fallback_config:
            configured.extend([item.strip() for item in fallback_config.split(",") if item.strip()])

        candidates: list[str] = []
        seen: set[str] = set()
        for raw in configured:
            model = self._normalize_model(raw)
            if model and model not in seen:
                seen.add(model)
                candidates.append(model)
        return candidates

    def _is_quota_blocked(self, model: str) -> bool:
        blocked_until = self._quota_blocked_until.get(model)
        if blocked_until is None:
            return False
        if monotonic() >= blocked_until:
            self._quota_blocked_until.pop(model, None)
            return False
        return True

    def _mark_quota_blocked(self, model: str) -> None:
        cooldown = max(0, int(self.settings.gemini_quota_cooldown_seconds))
        if cooldown == 0:
            return
        self._quota_blocked_until[model] = monotonic() + cooldown

    def _prioritized_models(self) -> list[str]:
        models = self._candidate_models()
        available = [model for model in models if not self._is_quota_blocked(model)]
        return available if available else models

    def _candidate_urls(self, model: str) -> list[str]:
        base = self.settings.gemini_api_base_url.rstrip("/")
        return [
            f"{base}/v1beta/models/{model}:generateContent?key={self.settings.gemini_api_key}",
            f"{base}/v1/models/{model}:generateContent?key={self.settings.gemini_api_key}",
        ]

    @staticmethod
    def _extract_text(data: dict) -> str:
        candidates = data.get("candidates", [])
        if not candidates:
            return ""

        parts = candidates[0].get("content", {}).get("parts", [])
        texts = [part.get("text", "") for part in parts if part.get("text")]
        return "\n".join(texts).strip()

    @staticmethod
    def _safe_error_text(response: httpx.Response) -> str:
        try:
            body = response.json()
            if isinstance(body, dict):
                error_info = body.get("error", {})
                if isinstance(error_info, dict):
                    message = error_info.get("message")
                    if isinstance(message, str) and message.strip():
                        return message.strip()[:300]
            text = response.text.strip()
            return text[:300] if text else "HTTP error"
        except ValueError:
            text = response.text.strip()
            return text[:300] if text else "HTTP error"

    async def diagnose(self) -> dict:
        models = self._prioritized_models()
        diagnostics = {
            "key_configured": bool(self.settings.gemini_api_key),
            "models_tried": self._candidate_models(),
            "success": False,
            "active_model": None,
            "attempts": [],
            "message": "",
        }

        if not diagnostics["key_configured"]:
            diagnostics["message"] = "GEMINI_API_KEY is missing."
            return diagnostics

        payload = {
            "contents": [{"parts": [{"text": "Say: diagnostics-ok"}]}],
            "generationConfig": {"temperature": 0, "maxOutputTokens": 16},
        }

        async with httpx.AsyncClient(timeout=20) as client:
            for model in models:
                for url in self._candidate_urls(model):
                    api_version = "v1" if "/v1/" in url else "v1beta"
                    try:
                        response = await client.post(url, json=payload)
                    except httpx.RequestError as exc:
                        diagnostics["attempts"].append(
                            {
                                "model": model,
                                "api_version": api_version,
                                "status_code": None,
                                "ok": False,
                                "error": f"Network error: {str(exc)[:220]}",
                            }
                        )
                        continue

                    if response.is_success:
                        diagnostics["success"] = True
                        diagnostics["active_model"] = model
                        diagnostics["attempts"].append(
                            {
                                "model": model,
                                "api_version": api_version,
                                "status_code": response.status_code,
                                "ok": True,
                                "error": None,
                            }
                        )
                        diagnostics["message"] = "Gemini endpoint reachable and responding."
                        return diagnostics

                    diagnostics["attempts"].append(
                        {
                            "model": model,
                            "api_version": api_version,
                            "status_code": response.status_code,
                            "ok": False,
                            "error": self._safe_error_text(response),
                        }
                    )
                    if response.status_code == 429:
                        self._mark_quota_blocked(model)

        diagnostics["message"] = "All configured Gemini model endpoints failed."
        return diagnostics

    async def generate(self, prompt: str) -> str:
        if not self.settings.gemini_api_key:
            return ""
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "topP": 0.95,
                "maxOutputTokens": 1024,
            },
        }

        async with httpx.AsyncClient(timeout=30) as client:
            for model in self._prioritized_models():
                for url in self._candidate_urls(model):
                    try:
                        response = await client.post(url, json=payload)
                    except httpx.RequestError:
                        continue

                    if response.status_code == 404:
                        continue

                    if response.status_code == 429:
                        self._mark_quota_blocked(model)
                        continue

                    try:
                        response.raise_for_status()
                        data = response.json()
                    except (httpx.HTTPStatusError, ValueError):
                        continue

                    text = self._extract_text(data)
                    if text:
                        return text

        return ""


gemini_client = GeminiClient()
