from fastapi import APIRouter

from app.api.v1.routes.auth import router as auth_router
from app.api.v1.routes.contact import router as contact_router
from app.api.v1.routes.documents import router as documents_router
from app.api.v1.routes.generations import router as generations_router
from app.api.v1.routes.workspaces import router as workspaces_router
from app.api.v1.routes.templates import router as templates_router

router = APIRouter(prefix="/api/v1")
router.include_router(auth_router)
router.include_router(contact_router)
router.include_router(workspaces_router)
router.include_router(templates_router)
router.include_router(generations_router)
router.include_router(documents_router)
