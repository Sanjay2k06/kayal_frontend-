from datetime import datetime, timedelta, timezone
import uuid

from jose import JWTError, jwt

from app.config import get_settings


class JWTHandler:
    def __init__(self) -> None:
        self.settings = get_settings()

    def create_access_token(self, subject: str) -> str:
        expire_at = datetime.now(timezone.utc) + timedelta(minutes=self.settings.access_token_expire_minutes)
        payload = {
            "sub": subject,
            "exp": expire_at,
            "type": "access",
            "jti": str(uuid.uuid4()),
        }
        return jwt.encode(payload, self.settings.jwt_secret_key, algorithm=self.settings.jwt_algorithm)

    def create_refresh_token(self, subject: str) -> str:
        expire_at = datetime.now(timezone.utc) + timedelta(minutes=self.settings.refresh_token_expire_minutes)
        payload = {
            "sub": subject,
            "exp": expire_at,
            "type": "refresh",
            "jti": str(uuid.uuid4()),
        }
        return jwt.encode(payload, self.settings.jwt_secret_key, algorithm=self.settings.jwt_algorithm)

    def decode_token(self, token: str) -> dict | None:
        try:
            payload = jwt.decode(token, self.settings.jwt_secret_key, algorithms=[self.settings.jwt_algorithm])
            return payload
        except JWTError:
            return None


jwt_handler = JWTHandler()
