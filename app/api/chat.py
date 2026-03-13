from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.ai.gemini_client import gemini_client
from app.api.auth import get_current_user
from app.database.db import get_db, utcnow
from app.security.jwt_handler import jwt_handler

from app.schemas.scheme_schema import ChatDiagnosticsResponse, ChatRequest, ChatResponse
from app.services.rag_service import RagService

router = APIRouter(tags=["chat"])
security_optional = HTTPBearer(auto_error=False)


@router.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest, credentials: HTTPAuthorizationCredentials | None = Depends(security_optional)):
    result = await RagService.answer_query(payload.query)

    if credentials:
        decoded = jwt_handler.decode_token(credentials.credentials)
        if decoded and decoded.get("type") == "access":
            user_id = str(decoded.get("sub"))
            db = get_db()
            await db.chat_history.insert_one(
                {
                    "user_id": user_id,
                    "query": payload.query,
                    "response": result["response"],
                    "recommended_scheme_ids": [item["id"] for item in result.get("recommended_schemes", [])],
                    "created_at": utcnow(),
                }
            )

    return result


@router.get("/chat/diagnostics", response_model=ChatDiagnosticsResponse)
async def chat_diagnostics(user: dict = Depends(get_current_user)):
    _ = user
    return await gemini_client.diagnose()
