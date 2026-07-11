from datetime import datetime, timezone
from bson import ObjectId


async def get_user_lists(db, user_id: str) -> list:
    """Get all reading lists for a user."""
    cursor = db.reading_lists.find({"user_id": ObjectId(user_id)}).sort("created_at", 1)
    lists = []
    async for lst in cursor:
        lst["id"] = str(lst["_id"])
        lst["user_id"] = str(lst["user_id"])
        lst["book_count"] = len(lst.get("books", []))
        del lst["_id"]
        # Don't include full books array in list view
        lst.pop("books", None)
        lists.append(lst)
    return lists


async def get_list_detail(db, list_id: str, user_id: str) -> dict:
    """Get a single reading list with populated book data."""
    reading_list = await db.reading_lists.find_one({
        "_id": ObjectId(list_id),
        "user_id": ObjectId(user_id),
    })
    if not reading_list:
        return {"error": "Reading list not found"}

    # Populate book data
    book_ids = reading_list.get("books", [])
    books = []
    if book_ids:
        cursor = db.books.find({"_id": {"$in": book_ids}})
        async for book in cursor:
            book["id"] = str(book["_id"])
            del book["_id"]
            if "cached_at" in book and isinstance(book["cached_at"], datetime):
                book["cached_at"] = book["cached_at"].isoformat()
            books.append(book)

    return {
        "id": str(reading_list["_id"]),
        "user_id": str(reading_list["user_id"]),
        "name": reading_list["name"],
        "books": books,
        "book_count": len(books),
        "is_default": reading_list.get("is_default", False),
        "created_at": reading_list["created_at"],
    }


async def create_list(db, user_id: str, name: str) -> dict:
    """Create a custom reading list."""
    doc = {
        "user_id": ObjectId(user_id),
        "name": name,
        "books": [],
        "is_default": False,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.reading_lists.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc["user_id"] = str(doc["user_id"])
    doc["book_count"] = 0
    return doc


async def add_book_to_list(db, list_id: str, user_id: str, book_id: str) -> dict:
    """Add a book to a reading list."""
    reading_list = await db.reading_lists.find_one({
        "_id": ObjectId(list_id),
        "user_id": ObjectId(user_id),
    })
    if not reading_list:
        return {"error": "Reading list not found"}

    # Check if book exists
    book = await db.books.find_one({"_id": ObjectId(book_id)})
    if not book:
        return {"error": "Book not found"}

    # Check if already in list
    if ObjectId(book_id) in reading_list.get("books", []):
        return {"error": "Book already in this list"}

    await db.reading_lists.update_one(
        {"_id": ObjectId(list_id)},
        {"$push": {"books": ObjectId(book_id)}},
    )

    return {"message": "Book added to list"}


async def remove_book_from_list(db, list_id: str, user_id: str, book_id: str) -> dict:
    """Remove a book from a reading list."""
    reading_list = await db.reading_lists.find_one({
        "_id": ObjectId(list_id),
        "user_id": ObjectId(user_id),
    })
    if not reading_list:
        return {"error": "Reading list not found"}

    await db.reading_lists.update_one(
        {"_id": ObjectId(list_id)},
        {"$pull": {"books": ObjectId(book_id)}},
    )

    return {"message": "Book removed from list"}


async def delete_list(db, list_id: str, user_id: str) -> dict:
    """Delete a custom reading list (not default ones)."""
    reading_list = await db.reading_lists.find_one({
        "_id": ObjectId(list_id),
        "user_id": ObjectId(user_id),
    })
    if not reading_list:
        return {"error": "Reading list not found"}

    if reading_list.get("is_default"):
        return {"error": "Cannot delete default reading lists"}

    await db.reading_lists.delete_one({"_id": ObjectId(list_id)})
    return {"message": "Reading list deleted"}


async def get_book_list_status(db, user_id: str, book_id: str) -> list:
    """Check which lists a book is in for the current user."""
    cursor = db.reading_lists.find({"user_id": ObjectId(user_id)})
    statuses = []
    async for lst in cursor:
        statuses.append({
            "list_id": str(lst["_id"]),
            "name": lst["name"],
            "contains_book": ObjectId(book_id) in lst.get("books", []),
        })
    return statuses
