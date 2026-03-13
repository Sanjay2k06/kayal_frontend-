from typing import Any

from bson import ObjectId

from app.database.db import get_db


def _serialize_scheme(doc: dict[str, Any], score: float | None = None) -> dict[str, Any]:
    return {
        "id": str(doc["_id"]),
        "scheme_name": doc["scheme_name"],
        "description": doc["description"],
        "eligibility": doc["eligibility"],
        "benefits": doc["benefits"],
        "category": doc["category"],
        "state": doc["state"],
        "official_link": doc["official_link"],
        "official_department": doc.get("official_department", "Government of India"),
        "application_mode": doc.get("application_mode", "Online"),
        "guidance": doc.get("guidance", "Refer to the official portal for the latest instructions."),
        "helpline": doc.get("helpline", "1800-000-000"),
        "required_documents": doc.get("required_documents", []),
        "score": score,
    }


class SchemeService:
    @staticmethod
    def _cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
        if not vec_a or not vec_b or len(vec_a) != len(vec_b):
            return 0.0
        dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
        norm_a = sum(a * a for a in vec_a) ** 0.5
        norm_b = sum(b * b for b in vec_b) ** 0.5
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot_product / (norm_a * norm_b)

    @staticmethod
    async def list_schemes(page: int, limit: int, category: str | None, state: str | None, search: str | None) -> dict[str, Any]:
        db = get_db()
        query: dict[str, Any] = {}
        if category:
            query["category"] = category
        if state:
            query["state"] = state
        if search:
            query["$text"] = {"$search": search}

        total = await db.schemes.count_documents(query)
        cursor = db.schemes.find(query).skip((page - 1) * limit).limit(limit)
        docs = await cursor.to_list(length=limit)

        return {
            "page": page,
            "limit": limit,
            "total": total,
            "items": [_serialize_scheme(doc) for doc in docs],
        }

    @staticmethod
    async def get_scheme(scheme_id: str) -> dict[str, Any] | None:
        db = get_db()
        try:
            doc = await db.schemes.find_one({"_id": ObjectId(scheme_id)})
        except Exception:
            return None
        return _serialize_scheme(doc) if doc else None

    @staticmethod
    async def get_schemes_by_ids(scheme_ids: list[str]) -> list[dict[str, Any]]:
        db = get_db()
        object_ids: list[ObjectId] = []
        for scheme_id in scheme_ids:
            try:
                object_ids.append(ObjectId(scheme_id))
            except Exception:
                continue

        if not object_ids:
            return []

        docs = await db.schemes.find({"_id": {"$in": object_ids}}).to_list(length=len(object_ids))
        order = {str(object_id): index for index, object_id in enumerate(object_ids)}
        serialized = [_serialize_scheme(doc) for doc in docs]
        serialized.sort(key=lambda item: order.get(item["id"], 10_000))
        return serialized

    @staticmethod
    async def create_scheme(payload: dict[str, Any]) -> dict[str, Any]:
        db = get_db()
        result = await db.schemes.insert_one(payload)
        inserted = await db.schemes.find_one({"_id": result.inserted_id})
        return _serialize_scheme(inserted)

    @staticmethod
    async def update_scheme(scheme_id: str, payload: dict[str, Any]) -> dict[str, Any] | None:
        db = get_db()
        try:
            obj_id = ObjectId(scheme_id)
        except Exception:
            return None

        await db.schemes.update_one({"_id": obj_id}, {"$set": payload})
        updated = await db.schemes.find_one({"_id": obj_id})
        return _serialize_scheme(updated) if updated else None

    @staticmethod
    async def delete_scheme(scheme_id: str) -> bool:
        db = get_db()
        try:
            obj_id = ObjectId(scheme_id)
        except Exception:
            return False
        result = await db.schemes.delete_one({"_id": obj_id})
        return result.deleted_count > 0

    @staticmethod
    async def semantic_search(query_embedding: list[float], top_k: int = 5) -> list[dict[str, Any]]:
        db = get_db()
        docs = await db.schemes.find({"embedding": {"$exists": True, "$ne": []}}).to_list(length=5000)
        if not docs:
            return []

        scored: list[tuple[float, dict[str, Any]]] = []
        for doc in docs:
            emb = doc.get("embedding", [])
            similarity = SchemeService._cosine_similarity(emb, query_embedding)
            scored.append((similarity, doc))

        scored.sort(key=lambda x: x[0], reverse=True)
        top = scored[:top_k]
        return [_serialize_scheme(doc, score=round(score * 100, 2)) for score, doc in top]

    @staticmethod
    async def stats() -> dict[str, Any]:
        db = get_db()
        total_schemes = await db.schemes.count_documents({})
        total_users = await db.users.count_documents({})

        categories_cursor = db.schemes.aggregate([
            {"$group": {"_id": "$category", "count": {"$sum": 1}}}
        ])
        states_cursor = db.schemes.aggregate([
            {"$group": {"_id": "$state", "count": {"$sum": 1}}}
        ])

        categories = {item["_id"]: item["count"] async for item in categories_cursor}
        states = {item["_id"]: item["count"] async for item in states_cursor}

        return {
            "total_schemes": total_schemes,
            "total_users": total_users,
            "categories": categories,
            "states": states,
        }
