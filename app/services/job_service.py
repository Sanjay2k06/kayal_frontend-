from __future__ import annotations

from datetime import timezone
from uuid import uuid4

from app.database.db import utcnow


class JobService:
    _jobs: dict[str, dict] = {}

    @staticmethod
    def create_job(job_type: str) -> dict:
        job_id = str(uuid4())
        job = {
            "id": job_id,
            "type": job_type,
            "status": "running",
            "started_at": utcnow().astimezone(timezone.utc).isoformat(),
            "finished_at": None,
            "details": {},
        }
        JobService._jobs[job_id] = job
        return job

    @staticmethod
    def finish_job(job_id: str, details: dict | None = None) -> None:
        job = JobService._jobs.get(job_id)
        if not job:
            return
        job["status"] = "completed"
        job["finished_at"] = utcnow().astimezone(timezone.utc).isoformat()
        job["details"] = details or {}

    @staticmethod
    def fail_job(job_id: str, message: str) -> None:
        job = JobService._jobs.get(job_id)
        if not job:
            return
        job["status"] = "failed"
        job["finished_at"] = utcnow().astimezone(timezone.utc).isoformat()
        job["details"] = {"error": message}

    @staticmethod
    def list_jobs() -> list[dict]:
        return sorted(JobService._jobs.values(), key=lambda item: item["started_at"], reverse=True)

    @staticmethod
    def get_job(job_id: str) -> dict | None:
        return JobService._jobs.get(job_id)
