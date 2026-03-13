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
    source_name: str | None = None
    source_last_verified_at: str | None = None
    deadline: str | None = None


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
    confidence_score: float | None = None
    why_matched: list[str] = Field(default_factory=list)
    why_not_matched: list[str] = Field(default_factory=list)
    source_freshness_days: int | None = None
    source_freshness_status: str | None = None
    duplicate_of: str | None = None
    link_status: str | None = None
    approval_status: str | None = None


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


class HeroSimulationRequest(BaseModel):
    profile: EligibilityRequest
    what_if: EligibilityRequest


class HeroRecommendation(BaseModel):
    scheme: SchemeOut
    base_score: float
    simulated_score: float
    score_delta: float
    success_probability: float
    missing_documents: list[str] = Field(default_factory=list)
    action_plan: list[str] = Field(default_factory=list)


class HeroSimulationResponse(BaseModel):
    baseline_top_schemes: list[SchemeOut]
    simulated_top_schemes: list[HeroRecommendation]
    summary: str


class WorkflowChecklistItem(BaseModel):
    id: str
    label: str
    done: bool
    scheme_id: str | None = None


class WorkflowReminderItem(BaseModel):
    scheme_id: str
    scheme_name: str
    deadline: str
    days_left: int


class WorkflowInsightResponse(BaseModel):
    checklist: list[WorkflowChecklistItem]
    reminders: list[WorkflowReminderItem]
    missing_documents: list[str]


class SchemeChangeRequestOut(BaseModel):
    id: str
    scheme_id: str
    scheme_name: str
    status: str
    requested_by: str
    requested_at: str
    updates: dict
    diff_preview: dict


class AdminBulkPreviewRequest(BaseModel):
    scheme_id: str
    updates: dict


class AdminBulkPreviewResponse(BaseModel):
    scheme_id: str
    scheme_name: str
    changes: dict


class DataTrustReportItem(BaseModel):
    scheme_id: str
    scheme_name: str
    duplicate_of: str | None = None
    link_status: str
    source_freshness_days: int | None = None
    source_freshness_status: str | None = None


class BackgroundJobOut(BaseModel):
    id: str
    type: str
    status: str
    started_at: str
    finished_at: str | None = None
    details: dict = Field(default_factory=dict)


class AdminWhatsAppStatusResponse(BaseModel):
    status: str
    webhook_path: str
    twilio_configured: bool
    from_number: str | None = None
    default_to_number: str | None = None
    ngrok_running: bool
    ngrok_public_url: str | None = None
    webhook_url: str | None = None
    health_url: str | None = None
