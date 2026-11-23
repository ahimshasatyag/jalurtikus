import uuid
import hashlib
from typing import Optional, Dict, Any
from app.database.repositories.user_repository import user_repository
from app.schemas.auth import UserRegister, UserLogin, UserProfile, Token
from app.core.security import create_access_token


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


class AuthService:
    def register(self, req: UserRegister) -> UserProfile:
        existing = user_repository.find_by_email(req.email)
        if existing:
            raise ValueError("Email sudah terdaftar.")

        user_id = f"usr_{uuid.uuid4().hex[:8]}"
        user_data = {
            "id": user_id,
            "email": req.email,
            "full_name": req.full_name,
            "password_hash": hash_password(req.password),
            "role": "user",
            "vehicle_type": req.vehicle_type or "motorcycle",
            "route_preference": "fastest"
        }
        user_repository.save(user_id, user_data)

        return UserProfile(
            id=user_id,
            email=req.email,
            full_name=req.full_name,
            role="user",
            vehicle_type=user_data["vehicle_type"],
            route_preference=user_data["route_preference"]
        )

    def login(self, req: UserLogin) -> Token:
        user = user_repository.find_by_email(req.email)
        if not user or user.get("password_hash") != hash_password(req.password):
            raise ValueError("Email atau password tidak valid.")

        token = create_access_token({"sub": user["id"], "role": user.get("role", "user")})
        return Token(access_token=token, expires_in=60 * 24 * 7 * 60)

    def get_profile(self, user_id: str) -> Optional[UserProfile]:
        user = user_repository.find_by_id(user_id)
        if not user:
            return None
        return UserProfile(
            id=user["id"],
            email=user["email"],
            full_name=user["full_name"],
            role=user.get("role", "user"),
            vehicle_type=user.get("vehicle_type", "motorcycle"),
            route_preference=user.get("route_preference", "fastest")
        )

    def update_profile(self, user_id: str, updates: Dict[str, Any]) -> UserProfile:
        user = user_repository.find_by_id(user_id)
        if not user:
            raise ValueError(f"User {user_id} tidak ditemukan.")
        for k, v in updates.items():
            if v is not None:
                user[k] = v
        user_repository.save(user_id, user)
        return UserProfile(**user)


auth_service = AuthService()
