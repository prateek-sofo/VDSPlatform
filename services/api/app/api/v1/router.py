"""Unified API v1 router — mounts all sub-routers."""
from fastapi import APIRouter
from app.api.v1.sessions import router as sessions_router
from app.api.v1.connectors import router as connectors_router
from app.api.v1.semantic import router as semantic_router
from app.api.v1.api_routes import (
    modeling_router, agents_router, governance_router, analytics_router,
    uploads_router, auth_router,
)

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(sessions_router, prefix="/sessions", tags=["sessions"])
api_router.include_router(connectors_router, prefix="/connectors", tags=["connectors"])
api_router.include_router(semantic_router, prefix="/semantic", tags=["semantic"])
api_router.include_router(modeling_router, prefix="/modeling", tags=["modeling"])
api_router.include_router(agents_router, prefix="/agents", tags=["agents"])
api_router.include_router(governance_router, prefix="/governance", tags=["governance"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["analytics"])
api_router.include_router(uploads_router, prefix="/uploads", tags=["uploads"])
