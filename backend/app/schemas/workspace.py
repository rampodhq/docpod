from __future__ import annotations

import uuid
from datetime import datetime
from pydantic import BaseModel


class WorkspaceRead(BaseModel):
    id: uuid.UUID
    name: str
    type: str
    owner_user_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True