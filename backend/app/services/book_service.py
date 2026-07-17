import httpx
import json
import math
from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId
from app.core.config import settings


async def search_books_openlibrary(query: str, max_results: int = 12, start_index: int = 0) -> list:
    """Search books via Open Library API and return formatted results."""
    page = (start_index // max_results) + 1
    params = {
        "q": query,
        "limit": max_results,
        "page": page
    }

    async with httpx.AsyncClient() as client:
        response = await client.get("https://openlibrary.org/search.json", params=params)
        if response.status_code != 200:
            return {"books": [], "total": 0}
        data = response.json()

    items = data.get("docs", [])
    total = data.get("numFound", 0)
    books = []

    for item in items:
        title = item.get("title", "Unknown Title")
        authors = item.get("author_name", ["Unknown Author"])
        
        ol_key = item.get("key", "").split("/")[-1]
        google_id = f"ol_{ol_key}"
        
        isbn = item.get("isbn", [""])[0] if item.get("isbn") else None
        cover_id = item.get("cover_i")
        cover_image = f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg" if cover_id else ""
        
        books.append({
            "google_books_id": google_id,
            "title": title,
            "authors": authors,
            "description": "Book imported from Open Library catalog.",
            "cover_image": cover_image,
            "isbn": isbn,
            "categories": item.get("subject", [])[:3],
            "published_date": str(item.get("first_publish_year", "")),
            "page_count": item.get("number_of_pages_median", 0),
        })

    return {"books": books, "total": total}


def _extract_isbn(identifiers: list) -> str:
    """Extract ISBN-13 or ISBN-10 from industry identifiers."""
    for ident in identifiers:
        if ident.get("type") == "ISBN_13":
            return ident.get("identifier", "")
    for ident in identifiers:
        if ident.get("type") == "ISBN_10":
            return ident.get("identifier", "")
    return ""


async def get_or_create_book(db, google_books_id: str, book_data: dict = None) -> dict:
    """Get book from MongoDB cache or create from Google Books data."""
    book = await db.books.find_one({"google_books_id": google_books_id})
    if book:
        book["id"] = str(book["_id"])
        return book

    # If book_data not provided, fetch from Open Library
    if not book_data:
        async with httpx.AsyncClient() as client:
            ol_key = google_books_id.replace("ol_", "")
            url = f"https://openlibrary.org/works/{ol_key}.json"
            response = await client.get(url)
            if response.status_code != 200:
                return None
                
            item = response.json()
            title = item.get("title", "Unknown Title")
            desc = item.get("description", "Book imported from Open Library catalog.")
            if isinstance(desc, dict):
                desc = desc.get("value", desc)
                
            authors = ["Unknown Author"]
            
            covers = item.get("covers", [])
            cover_id = covers[0] if covers else None
            cover_image = f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg" if cover_id else ""
            
            book_data = {
                "google_books_id": google_books_id,
                "title": title,
                "authors": authors,
                "description": desc,
                "cover_image": cover_image,
                "isbn": None,
                "categories": item.get("subjects", [])[:3],
                "published_date": str(item.get("first_publish_date", "")),
                "page_count": 0,
            }

    # Insert into MongoDB
    doc = {
        **book_data,
        "average_rating": 0.0,
        "total_reviews": 0,
        "cached_at": datetime.now(timezone.utc),
        "curated": book_data.get("curated", False),
    }
    result = await db.books.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    
    # Enforce bounded LRU cache for non-curated books (max 12)
    non_curated_count = await db.books.count_documents({"curated": False})
    if non_curated_count > 12:
        num_to_delete = non_curated_count - 12
        oldest_books = db.books.find({"curated": False}).sort("cached_at", 1).limit(num_to_delete)
        async for old_book in oldest_books:
            await db.books.delete_one({"_id": old_book["_id"]})
            
    return doc


async def get_book_by_id(db, book_id: str) -> Optional[dict]:
    """Get a single book by its MongoDB ID."""
    try:
        book = await db.books.find_one({"_id": ObjectId(book_id)})
    except Exception:
        return None
    if book:
        book["id"] = str(book["_id"])
    return book


async def browse_books(db, redis, page: int = 1, limit: int = 12,
                       category: str = None, sort_by: str = "newest", q: str = None) -> dict:
    """Browse cached books with filtering and pagination."""
    cache_key = f"browse:{category}:{sort_by}:{page}:{limit}:{q}"

    # Try Redis cache
    if redis:
        cached = await redis.get(cache_key)
        if cached:
            return json.loads(cached)

    # Build query
    query = {}
    if category:
        query["categories"] = {"$regex": category, "$options": "i"}
    if q:
        query["$text"] = {"$search": q}

    # Sort
    sort_map = {
        "newest": [("cached_at", -1)],
        "rating": [("average_rating", -1)],
        "title": [("title", 1)],
    }
    sort = sort_map.get(sort_by, [("cached_at", -1)])

    # Pagination
    skip = (page - 1) * limit
    total = await db.books.count_documents(query)
    pages = math.ceil(total / limit) if total > 0 else 1

    cursor = db.books.find(query).sort(sort).skip(skip).limit(limit)
    books = []
    async for book in cursor:
        book["id"] = str(book["_id"])
        del book["_id"]
        if "cached_at" in book and isinstance(book["cached_at"], datetime):
            book["cached_at"] = book["cached_at"].isoformat()
        books.append(book)

    result = {"books": books, "total": total, "page": page, "pages": pages}

    # Cache for 10 minutes
    if redis:
        await redis.set(cache_key, json.dumps(result, default=str), ex=600)

    return result


async def get_trending_books(db, redis, limit: int = 10) -> list:
    """Get trending books (most reviewed recently) — Redis cached."""
    cache_key = "trending_books"

    if redis:
        cached = await redis.get(cache_key)
        if cached:
            return json.loads(cached)

    # Get top books by review count and rating
    cursor = db.books.find(
        {"total_reviews": {"$gt": 0}}
    ).sort([
        ("total_reviews", -1),
        ("average_rating", -1)
    ]).limit(limit)

    books = []
    async for book in cursor:
        book["id"] = str(book["_id"])
        del book["_id"]
        if "cached_at" in book and isinstance(book["cached_at"], datetime):
            book["cached_at"] = book["cached_at"].isoformat()
        books.append(book)

    if redis and books:
        await redis.set(cache_key, json.dumps(books, default=str), ex=3600)

    return books
