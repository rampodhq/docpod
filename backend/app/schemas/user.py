from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserRead(BaseModel):
    id: uuid.UUID
    full_name: str
    email: EmailStr
    account_type: str
    organization_name: str | None = None
    image_url: str | None = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
