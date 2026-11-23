from fastapi import APIRouter, Header, HTTPException, status
from app.schemas.auth import UserProfile, UserProfileUpdate
from app.schemas.common import APIResponse
from app.services.auth_service import auth_service
from app.core.security import decode_token

router = APIRouter(prefix="/users", tags=["Users"])


def get_current_user_id(authorization: str = Header(None)) -> str:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Header Authorization Bearer token diperlukan."
        )
    token = authorization.replace("Bearer ", "").strip()
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid atau telah kedaluwarsa."
        )
    return payload["sub"]


@router.get("/me", response_model=APIResponse[UserProfile])
async def get_me(authorization: str = Header(None)):
    user_id = get_current_user_id(authorization)
    profile = auth_service.get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profil pengguna tidak ditemukan.")
    return APIResponse(success=True, data=profile)


@router.patch("/me", response_model=APIResponse[UserProfile])
async def update_me(update: UserProfileUpdate, authorization: str = Header(None)):
    user_id = get_current_user_id(authorization)
    try:
        profile = auth_service.update_profile(user_id, update.model_dump(exclude_unset=True))
        return APIResponse(success=True, data=profile)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
