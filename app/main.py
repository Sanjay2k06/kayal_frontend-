from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from app.admin.admin_routes import router as admin_router
from app.api.auth import router as auth_router
from app.api.chat import router as chat_router
from app.api.eligibility import router as eligibility_router
from app.api.schemes import router as schemes_router
from app.api.user import router as user_router
from app.api.voice import router as voice_router
from app.config import get_settings
from app.database.db import close_db, connect_db
from app.services.demo_account_service import ensure_demo_account

settings = get_settings()
limiter = Limiter(key_func=get_remote_address, default_limits=[settings.rate_limit])

app = FastAPI(title=settings.app_name, version="1.0.0", debug=settings.debug)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(schemes_router)
app.include_router(eligibility_router)
app.include_router(voice_router)
app.include_router(user_router)
app.include_router(admin_router)


@app.get("/")
async def root():
    return {"status": "ok", "service": "CiviX Backend"}


@app.on_event("startup")
async def on_startup() -> None:
    await connect_db()
    await ensure_demo_account()


@app.on_event("shutdown")
async def on_shutdown() -> None:
    await close_db()
