from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ReadingListCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class ReadingListResponse(BaseModel):
    id: str
    user_id: str
    name: str
    book_count: int = 0
    is_default: bool = False
    created_at: datetime


class ReadingListDetailResponse(ReadingListResponse):
    books: List[dict] = []


class ReadingListAddBook(BaseModel):
    book_id: str
