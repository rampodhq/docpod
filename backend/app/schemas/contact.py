from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class ContactRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    workflow: str = Field(min_length=1, max_length=5000)


class ContactResponse(BaseModel):
    message: str
