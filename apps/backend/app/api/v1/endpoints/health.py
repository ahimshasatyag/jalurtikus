from fastapi import APIRouter
from app.schemas.common import APIResponse
from app.core.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=APIResponse[dict])
async def health_check():
    return APIResponse(
        success=True,
        data={
            "status": "healthy",
            "service": "jalurtikus-backend",
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT
        }
    )

