from typing import Any

from pydantic import BaseModel, Field


class SchemeModel(BaseModel):
    id: str | None = Field(default=None, alias="_id")
    scheme_name: str
    description: str
    eligibility: str
    benefits: str
    category: str
    state: str
    official_link: str
    official_department: str
    application_mode: str
    guidance: str
    helpline: str
    required_documents: list[str] = Field(default_factory=list)
    embedding: list[float] = Field(default_factory=list)

    model_config = {"populate_by_name": True}


class SchemeStats(BaseModel):
    total_schemes: int
    categories: dict[str, int]
    states: dict[str, int]


class SearchResult(BaseModel):
    scheme: dict[str, Any]
    score: float
