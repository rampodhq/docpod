from fastapi import APIRouter

from app.api.v1.routes.auth import router as auth_router
from app.api.v1.routes.workspaces import router as workspaces_router
from app.api.v1.routes.templates import router as templates_router

router = APIRouter(prefix="/api/v1")
router.include_router(auth_router)
router.include_router(workspaces_router)
router.include_router(templates_router)