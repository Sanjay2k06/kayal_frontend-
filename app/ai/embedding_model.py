from functools import lru_cache
import hashlib

try:
    from sentence_transformers import SentenceTransformer
except Exception:
    SentenceTransformer = None

from app.config import get_settings


@lru_cache
def get_embedding_model() -> SentenceTransformer | None:
    settings = get_settings()
    if SentenceTransformer is None:
        return None
    return SentenceTransformer(settings.embedding_model_name)


def _fallback_embed_text(text: str, size: int = 384) -> list[float]:
    digest = hashlib.sha256(text.encode("utf-8")).digest()
    seed = list(digest)
    values = [(seed[i % len(seed)] / 255.0) for i in range(size)]
    norm = sum(v * v for v in values) ** 0.5
    if norm == 0:
        return values
    return [v / norm for v in values]


def embed_text(text: str) -> list[float]:
    model = get_embedding_model()
    if model is None:
        return _fallback_embed_text(text)
    vector = model.encode(text, normalize_embeddings=True)
    return vector.tolist()
