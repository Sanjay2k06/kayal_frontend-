import asyncio
import os
import tempfile

from fastapi import APIRouter, File, HTTPException, UploadFile

try:
    import whisper
except Exception:
    whisper = None

from app.config import get_settings
from app.services.rag_service import RagService

router = APIRouter(tags=["voice"])
settings = get_settings()
_whisper_model = None


def get_whisper_model():
    if whisper is None:
        raise HTTPException(status_code=503, detail="Whisper model is not installed")
    global _whisper_model
    if _whisper_model is None:
        _whisper_model = whisper.load_model(settings.whisper_model_name)
    return _whisper_model


async def _transcribe_audio(path: str) -> str:
    model = get_whisper_model()
    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(None, lambda: model.transcribe(path))
    return result.get("text", "").strip()


@router.post("/voice-query")
async def voice_query(audio: UploadFile = File(...)):
    suffix = os.path.splitext(audio.filename or "audio.wav")[1] or ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        content = await audio.read()
        temp_file.write(content)
        temp_path = temp_file.name

    try:
        query = await _transcribe_audio(temp_path)
        if not query:
            raise HTTPException(status_code=400, detail="Could not transcribe audio")
        rag_result = await RagService.answer_query(query)
        return {
            "query": query,
            "response": rag_result["response"],
            "recommended_schemes": rag_result["recommended_schemes"],
        }
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
