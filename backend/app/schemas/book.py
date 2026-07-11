from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class BookBase(BaseModel):
    title: str
    authors: List[str] = []
    description: Optional[str] = None
    cover_image: Optional[str] = None
    isbn: Optional[str] = None
    categories: List[str] = []
    published_date: Optional[str] = None
    page_count: Optional[int] = None


class BookResponse(BookBase):
    id: str
    google_books_id: str
    average_rating: float = 0.0
    total_reviews: int = 0


class BookDetailResponse(BookResponse):
    cached_at: Optional[datetime] = None


class BookSearchQuery(BaseModel):
    q: str = Field(..., min_length=1)
    category: Optional[str] = None
    min_rating: Optional[float] = Field(None, ge=0, le=5)
    sort_by: Optional[str] = Field("relevance", pattern="^(relevance|rating|newest)$")
    page: int = Field(1, ge=1)
    limit: int = Field(12, ge=1, le=50)


class BookListResponse(BaseModel):
    books: List[BookResponse]
    total: int
    page: int
    pages: int
