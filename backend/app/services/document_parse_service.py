from __future__ import annotations

from pathlib import Path


class DocumentParseService:
    def parse_path(self, path_like: str) -> str:
        path = Path(path_like)
        if not path.exists() or not path.is_file():
            return ""

        suffix = path.suffix.lower()
        if suffix == ".pdf":
            return self._parse_pdf(path)
        if suffix == ".docx":
            return self._parse_docx(path)
        if suffix in {".txt", ".md", ".csv", ".json", ".log"}:
            return self._parse_text(path)
        return self._parse_text(path)

    def _parse_pdf(self, path: Path) -> str:
        try:
            from pypdf import PdfReader  # type: ignore
        except Exception:
            return ""

        try:
            reader = PdfReader(str(path))
            pages = [page.extract_text() or "" for page in reader.pages]
            return "\n".join(pages).strip()
        except Exception:
            return ""

    def _parse_docx(self, path: Path) -> str:
        try:
            from docx import Document  # type: ignore
        except Exception:
            return ""

        try:
            doc = Document(str(path))
            return "\n".join([p.text for p in doc.paragraphs if p.text]).strip()
        except Exception:
            return ""

    def _parse_text(self, path: Path) -> str:
        try:
            return path.read_text(encoding="utf-8", errors="ignore").strip()
        except Exception:
            return ""
