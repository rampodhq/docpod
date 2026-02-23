from __future__ import annotations

import os
import secrets
from pathlib import Path

from fastapi import UploadFile


class StorageService:
    def __init__(self, base_path: str) -> None:
        self._base_path = Path(base_path)
        self._profiles_path = self._base_path / "profiles"
        self._profiles_path.mkdir(parents=True, exist_ok=True)

    async def save_profile_image(self, file: UploadFile) -> str:
        ext = Path(file.filename or "").suffix.lower()
        if ext not in {".jpg", ".jpeg", ".png", ".webp"}:
            ext = ".jpg"

        filename = f"{secrets.token_hex(16)}{ext}"
        abs_path = self._profiles_path / filename

        content = await file.read()
        with abs_path.open("wb") as out:
            out.write(content)

        return os.path.join("profiles", filename)
