from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserOut(BaseModel):
    id: str
    email: EmailStr
    is_admin: bool
    name: str | None = None
    age: int | None = None
    gender: str | None = None
    occupation: str | None = None
    income: float | None = None
    state: str | None = None
    district: str | None = None
    education_level: str | None = None
    social_category: str | None = None
    residence_type: str | None = None
    marital_status: str | None = None
    disability_status: str | None = None
    minority_status: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str | None = None


class UserProfileUpdate(BaseModel):
    name: str | None = None
    age: int | None = Field(default=None, ge=0, le=120)
    gender: str | None = None
    occupation: str | None = None
    income: float | None = Field(default=None, ge=0)
    state: str | None = None
    district: str | None = None
    education_level: str | None = None
    social_category: str | None = None
    residence_type: str | None = None
    marital_status: str | None = None
    disability_status: str | None = None
    minority_status: str | None = None


class BookmarkPayload(BaseModel):
    scheme_id: str


class ChatHistoryItem(BaseModel):
    id: str
    query: str
    response: str
    created_at: str
