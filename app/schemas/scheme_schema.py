from pydantic import BaseModel, Field, HttpUrl


class SchemeBase(BaseModel):
    scheme_name: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10)
    eligibility: str = Field(min_length=10)
    benefits: str = Field(min_length=10)
    category: str = Field(min_length=2, max_length=80)
    state: str = Field(min_length=2, max_length=80)
    official_link: HttpUrl
    official_department: str = Field(min_length=2, max_length=160)
    application_mode: str = Field(min_length=2, max_length=80)
    guidance: str = Field(min_length=10)
    helpline: str = Field(min_length=3, max_length=40)
    required_documents: list[str] = Field(default_factory=list)


class SchemeCreate(SchemeBase):
    pass


class SchemeUpdate(BaseModel):
    scheme_name: str | None = None
    description: str | None = None
    eligibility: str | None = None
    benefits: str | None = None
    category: str | None = None
    state: str | None = None
    official_link: HttpUrl | None = None
    official_department: str | None = None
    application_mode: str | None = None
    guidance: str | None = None
    helpline: str | None = None
    required_documents: list[str] | None = None


class SchemeOut(SchemeBase):
    id: str
    score: float | None = None


class SchemeListOut(BaseModel):
    page: int
    limit: int
    total: int
    items: list[SchemeOut]


class ChatRequest(BaseModel):
    query: str = Field(min_length=2, max_length=500)


class ChatResponse(BaseModel):
    response: str
    recommended_schemes: list[SchemeOut]


class ChatDiagnosticsAttempt(BaseModel):
    model: str
    api_version: str
    status_code: int | None = None
    ok: bool
    error: str | None = None


class ChatDiagnosticsResponse(BaseModel):
    key_configured: bool
    models_tried: list[str]
    success: bool
    active_model: str | None = None
    attempts: list[ChatDiagnosticsAttempt]
    message: str


class EligibilityRequest(BaseModel):
    age: int = Field(ge=0, le=120)
    gender: str
    occupation: str
    income: float = Field(ge=0)
    state: str
    district: str | None = None
    education_level: str | None = None
    social_category: str | None = None
    residence_type: str | None = None
    marital_status: str | None = None
    disability_status: str | None = None
    minority_status: str | None = None


class EligibilityResponse(BaseModel):
    eligible_schemes: list[SchemeOut]
