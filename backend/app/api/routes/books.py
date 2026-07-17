from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.database import get_db, get_redis
from app.core.security import get_current_user
from app.services import book_service, recommendation_service

router = APIRouter(prefix="/api/books", tags=["Books"])


@router.get("/search")
async def search_books(
    q: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
    db=Depends(get_db),
):
    """Search books via Google Books API."""
    start_index = (page - 1) * limit
    result = await book_service.search_books_openlibrary(q, max_results=limit, start_index=start_index)

    if not isinstance(result, dict):
        result = {"books": [], "total": 0}

    # We no longer cache books globally during search to prevent DB pollution.

    return result


@router.get("/browse")
async def browse_books(
    q: str = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
    category: str = Query(None),
    sort_by: str = Query("newest"),
    db=Depends(get_db),
    redis=Depends(get_redis),
):
    """Browse cached books with filtering and pagination."""
    return await book_service.browse_books(db, redis, page, limit, category, sort_by, q)


@router.get("/trending")
async def get_trending(
    limit: int = Query(10, ge=1, le=20),
    db=Depends(get_db),
    redis=Depends(get_redis),
):
    """Get trending books (most reviewed, highest rated)."""
    books = await book_service.get_trending_books(db, redis, limit)
    return {"books": books}


@router.get("/recommendations")
async def get_recommendations(
    limit: int = Query(10, ge=1, le=20),
    db=Depends(get_db),
    redis=Depends(get_redis),
    current_user=Depends(get_current_user),
):
    """Get personalized book recommendations (auth required)."""
    books = await recommendation_service.get_recommendations(
        db, redis, current_user["id"], limit
    )
    return {"books": books}


@router.get("/{book_id}")
async def get_book_detail(
    book_id: str,
    db=Depends(get_db),
):
    """Get detailed information about a single book."""
    book = await book_service.get_book_by_id(db, book_id)
    if not book and book_id.startswith("ol_"):
        book = await book_service.get_or_create_book(db, book_id)
        
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    # Remove internal fields
    book.pop("_id", None)
    return book


@router.post("/cache")
async def cache_book(
    google_books_id: str,
    db=Depends(get_db),
):
    """Cache a book from Google Books into MongoDB."""
    book = await book_service.get_or_create_book(db, google_books_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found on Google Books")
    book.pop("_id", None)
    book["id"] = book.get("id", "")
    return book
