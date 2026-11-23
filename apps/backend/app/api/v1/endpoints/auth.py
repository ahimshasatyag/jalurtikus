from fastapi import APIRouter, HTTPException, status
from app.schemas.auth import UserRegister, UserLogin, UserProfile, Token
from app.schemas.common import APIResponse
from app.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=APIResponse[UserProfile])
async def register(req: UserRegister):
    try:
        user = auth_service.register(req)
        return APIResponse(success=True, data=user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login", response_model=APIResponse[Token])
async def login(req: UserLogin):
    try:
        token = auth_service.login(req)
        return APIResponse(success=True, data=token)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

