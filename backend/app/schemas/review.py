from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ReviewCreate(BaseModel):
    book_id: str
    rating: int = Field(..., ge=1, le=5)
    title: Optional[str] = ""
    content: Optional[str] = ""

class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    title: Optional[str] = None
    content: Optional[str] = None


class ReviewResponse(BaseModel):
    id: str
    user_id: str
    username: str
    avatar_url: Optional[str] = None
    book_id: str
    rating: int
    title: str
    content: str
    likes_count: int = 0
    is_liked: bool = False
    created_at: datetime
    updated_at: datetime


class ReviewListResponse(BaseModel):
    reviews: List[ReviewResponse]
    total: int
    page: int
    pages: int
