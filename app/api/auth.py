from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import get_settings
from app.database.db import get_db, utcnow
from app.schemas.user_schema import LogoutRequest, RefreshTokenRequest, TokenResponse, UserLogin, UserOut, UserRegister
from app.security.hash import hash_password, verify_password
from app.security.jwt_handler import jwt_handler

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()


def _serialize_user(user: dict) -> UserOut:
    return UserOut(
        id=str(user["_id"]),
        email=user["email"],
        is_admin=user.get("is_admin", False),
        name=user.get("name"),
        age=user.get("age"),
        gender=user.get("gender"),
        occupation=user.get("occupation"),
        income=user.get("income"),
        state=user.get("state"),
        district=user.get("district"),
        education_level=user.get("education_level"),
        social_category=user.get("social_category"),
        residence_type=user.get("residence_type"),
        marital_status=user.get("marital_status"),
        disability_status=user.get("disability_status"),
        minority_status=user.get("minority_status"),
    )


@router.post("/register", response_model=UserOut)
async def register(payload: UserRegister):
    db = get_db()
    settings = get_settings()
    existing = await db.users.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")

    doc = {
        "email": payload.email.lower(),
        "password": hash_password(payload.password),
        "is_admin": payload.email.lower() in {email.lower() for email in settings.admin_emails},
        "name": payload.name.strip(),
        "age": None,
        "gender": None,
        "occupation": None,
        "income": None,
        "state": None,
        "district": None,
        "education_level": None,
        "social_category": None,
        "residence_type": None,
        "marital_status": None,
        "disability_status": None,
        "minority_status": None,
        "created_at": utcnow(),
    }
    result = await db.users.insert_one(doc)
    user = await db.users.find_one({"_id": result.inserted_id})
    return _serialize_user(user)


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin):
    db = get_db()
    user = await db.users.find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    access_token = jwt_handler.create_access_token(str(user["_id"]))
    refresh_token = jwt_handler.create_refresh_token(str(user["_id"]))

    refresh_decoded = jwt_handler.decode_token(refresh_token)
    if refresh_decoded and refresh_decoded.get("jti") and refresh_decoded.get("exp"):
        refresh_expires = datetime.fromtimestamp(refresh_decoded["exp"], tz=timezone.utc)
        await db.user_sessions.update_one(
            {"jti": refresh_decoded["jti"]},
            {
                "$set": {
                    "user_id": str(user["_id"]),
                    "jti": refresh_decoded["jti"],
                    "expires_at": refresh_expires,
                    "revoked": False,
                    "created_at": utcnow(),
                }
            },
            upsert=True,
        )

    return TokenResponse(access_token=access_token, refresh_token=refresh_token, user=_serialize_user(user))


@router.post("/refresh", response_model=TokenResponse)
async def refresh(payload: RefreshTokenRequest):
    db = get_db()
    decoded = jwt_handler.decode_token(payload.refresh_token)
    if not decoded or decoded.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    jti = decoded.get("jti")
    if not jti:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    revoked = await db.revoked_tokens.find_one({"jti": jti})
    if revoked:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token revoked")

    session = await db.user_sessions.find_one({"jti": jti})
    if not session or session.get("revoked"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh session expired")

    user_id = str(decoded.get("sub"))
    from bson import ObjectId
    try:
        obj_id = ObjectId(user_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject") from exc

    user = await db.users.find_one({"_id": obj_id})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    if session.get("user_id") != str(user["_id"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh session mismatch")

    access_token = jwt_handler.create_access_token(str(user["_id"]))
    refresh_token = jwt_handler.create_refresh_token(str(user["_id"]))

    exp_ts = decoded.get("exp")
    if exp_ts:
        expires_at = datetime.fromtimestamp(exp_ts, tz=timezone.utc)
        await db.revoked_tokens.update_one(
            {"jti": jti},
            {"$set": {"jti": jti, "expires_at": expires_at}},
            upsert=True,
        )
        await db.user_sessions.update_one(
            {"jti": jti},
            {"$set": {"revoked": True, "revoked_at": utcnow()}},
            upsert=False,
        )

    new_refresh_decoded = jwt_handler.decode_token(refresh_token)
    if new_refresh_decoded and new_refresh_decoded.get("jti") and new_refresh_decoded.get("exp"):
        new_refresh_expires = datetime.fromtimestamp(new_refresh_decoded["exp"], tz=timezone.utc)
        await db.user_sessions.update_one(
            {"jti": new_refresh_decoded["jti"]},
            {
                "$set": {
                    "user_id": str(user["_id"]),
                    "jti": new_refresh_decoded["jti"],
                    "expires_at": new_refresh_expires,
                    "revoked": False,
                    "created_at": utcnow(),
                }
            },
            upsert=True,
        )

    return TokenResponse(access_token=access_token, refresh_token=refresh_token, user=_serialize_user(user))


@router.post("/logout")
async def logout(payload: LogoutRequest, credentials: HTTPAuthorizationCredentials = Depends(security)):
    db = get_db()

    access_decoded = jwt_handler.decode_token(credentials.credentials)
    if access_decoded and access_decoded.get("jti") and access_decoded.get("exp"):
        access_expires = datetime.fromtimestamp(access_decoded["exp"], tz=timezone.utc)
        await db.revoked_tokens.update_one(
            {"jti": access_decoded["jti"]},
            {"$set": {"jti": access_decoded["jti"], "expires_at": access_expires}},
            upsert=True,
        )

    if payload.refresh_token:
        refresh_decoded = jwt_handler.decode_token(payload.refresh_token)
        if refresh_decoded and refresh_decoded.get("jti") and refresh_decoded.get("exp"):
            refresh_expires = datetime.fromtimestamp(refresh_decoded["exp"], tz=timezone.utc)
            await db.revoked_tokens.update_one(
                {"jti": refresh_decoded["jti"]},
                {"$set": {"jti": refresh_decoded["jti"], "expires_at": refresh_expires}},
                upsert=True,
            )
            await db.user_sessions.update_one(
                {"jti": refresh_decoded["jti"]},
                {"$set": {"revoked": True, "revoked_at": utcnow()}},
                upsert=False,
            )

    return {"message": "Logged out"}


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    db = get_db()
    decoded = jwt_handler.decode_token(credentials.credentials)
    if not decoded or decoded.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    jti = decoded.get("jti")
    if jti:
        revoked = await db.revoked_tokens.find_one({"jti": jti})
        if revoked:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token revoked")

    user_id = str(decoded.get("sub"))

    from bson import ObjectId

    try:
        obj_id = ObjectId(user_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject") from exc

    user = await db.users.find_one({"_id": obj_id})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if not user.get("is_admin", False):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user
