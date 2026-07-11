from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# ─── Auth Schemas ───────────────────────────────────────────

class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    refresh_token: str


# ─── User Schemas ───────────────────────────────────────────

class UserProfile(BaseModel):
    id: str
    username: str
    email: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    favorite_genres: List[str] = []
    created_at: datetime


class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=30)
    bio: Optional[str] = Field(None, max_length=500)
    avatar_url: Optional[str] = None
    favorite_genres: Optional[List[str]] = None
