import json
from bson import ObjectId


async def get_recommendations(db, redis, user_id: str, limit: int = 10) -> list:
    """Get personalized book recommendations based on user preferences and review history."""
    cache_key = f"recommendations:{user_id}"

    # Try cache first
    if redis:
        cached = await redis.get(cache_key)
        if cached:
            return json.loads(cached)

    # Get user's favorite genres
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    favorite_genres = user.get("favorite_genres", []) if user else []

    # Get genres from user's highly-rated reviews
    pipeline = [
        {"$match": {"user_id": ObjectId(user_id), "rating": {"$gte": 4}}},
        {
            "$lookup": {
                "from": "books",
                "localField": "book_id",
                "foreignField": "_id",
                "as": "book",
            }
        },
        {"$unwind": "$book"},
        {"$unwind": "$book.categories"},
        {"$group": {"_id": "$book.categories", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5},
    ]

    reviewed_genres = []
    async for doc in db.reviews.aggregate(pipeline):
        reviewed_genres.append(doc["_id"])

    # Combine genres
    all_genres = list(set(favorite_genres + reviewed_genres))

    # Get books the user has already reviewed
    reviewed_book_ids = []
    async for review in db.reviews.find({"user_id": ObjectId(user_id)}, {"book_id": 1}):
        reviewed_book_ids.append(review["book_id"])

    # Find books matching genres, not already reviewed, with good ratings
    query = {"_id": {"$nin": reviewed_book_ids}}
    if all_genres:
        query["categories"] = {"$in": all_genres}

    cursor = db.books.find(query).sort([
        ("average_rating", -1),
        ("total_reviews", -1),
    ]).limit(limit)

    books = []
    async for book in cursor:
        book["id"] = str(book["_id"])
        del book["_id"]
        if "cached_at" in book:
            from datetime import datetime
            if isinstance(book["cached_at"], datetime):
                book["cached_at"] = book["cached_at"].isoformat()
        books.append(book)

    # If not enough recommendations, fill with popular books
    if len(books) < limit:
        fill_query = {
            "_id": {"$nin": reviewed_book_ids + [ObjectId(b["id"]) for b in books]},
            "total_reviews": {"$gt": 0},
        }
        fill_cursor = db.books.find(fill_query).sort([
            ("average_rating", -1),
        ]).limit(limit - len(books))

        async for book in fill_cursor:
            book["id"] = str(book["_id"])
            del book["_id"]
            if "cached_at" in book:
                from datetime import datetime
                if isinstance(book["cached_at"], datetime):
                    book["cached_at"] = book["cached_at"].isoformat()
            books.append(book)

    # Cache for 30 minutes
    if redis and books:
        await redis.set(cache_key, json.dumps(books, default=str), ex=1800)

    return books
