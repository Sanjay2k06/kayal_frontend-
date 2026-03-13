from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserModel(BaseModel):
    id: str | None = Field(default=None, alias="_id")
    email: EmailStr
    password: str
    is_admin: bool = False
    created_at: datetime

    model_config = {"populate_by_name": True}
