from typing import Optional
from pydantic import BaseModel, EmailStr


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    vehicle_type: Optional[str] = "motorcycle"  # motorcycle / car


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserProfile(BaseModel):
    id: str
    email: str
    full_name: str
    role: str = "user"  # guest / user / admin
    vehicle_type: str = "motorcycle"
    route_preference: str = "fastest"


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    vehicle_type: Optional[str] = None
    route_preference: Optional[str] = None

