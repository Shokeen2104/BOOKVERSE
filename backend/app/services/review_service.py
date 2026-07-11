import math
from datetime import datetime, timezone
from bson import ObjectId


async def create_review(db, user_id: str, review_data: dict) -> dict:
    """Create a new review for a book."""
    book_id = review_data["book_id"]

    # Check if user already reviewed this book
    existing = await db.reviews.find_one({
        "user_id": ObjectId(user_id),
        "book_id": ObjectId(book_id),
    })
    if existing:
        return {"error": "You have already reviewed this book"}

    # Verify book exists
    book = await db.books.find_one({"_id": ObjectId(book_id)})
    if not book:
        return {"error": "Book not found"}

    now = datetime.now(timezone.utc)
    review_doc = {
        "user_id": ObjectId(user_id),
        "book_id": ObjectId(book_id),
        "rating": review_data["rating"],
        "title": review_data["title"],
        "content": review_data["content"],
        "likes": [],
        "created_at": now,
        "updated_at": now,
    }

    result = await db.reviews.insert_one(review_doc)

    # Update book average rating
    await _update_book_rating(db, book_id)

    review_doc["id"] = str(result.inserted_id)
    return review_doc


async def get_reviews_for_book(db, book_id: str, page: int = 1, limit: int = 10,
                                current_user_id: str = None) -> dict:
    """Get paginated reviews for a book with user info."""
    skip = (page - 1) * limit
    total = await db.reviews.count_documents({"book_id": ObjectId(book_id)})
    pages = math.ceil(total / limit) if total > 0 else 1

    pipeline = [
        {"$match": {"book_id": ObjectId(book_id)}},
        {"$sort": {"created_at": -1}},
        {"$skip": skip},
        {"$limit": limit},
        {
            "$lookup": {
                "from": "users",
                "localField": "user_id",
                "foreignField": "_id",
                "as": "user",
            }
        },
        {"$unwind": "$user"},
        {
            "$project": {
                "id": {"$toString": "$_id"},
                "user_id": {"$toString": "$user_id"},
                "username": "$user.username",
                "avatar_url": "$user.avatar_url",
                "book_id": {"$toString": "$book_id"},
                "rating": 1,
                "title": 1,
                "content": 1,
                "likes_count": {"$size": "$likes"},
                "likes": 1,
                "created_at": 1,
                "updated_at": 1,
            }
        },
    ]

    reviews = []
    async for review in db.reviews.aggregate(pipeline):
        if current_user_id:
            review["is_liked"] = ObjectId(current_user_id) in review.get("likes", [])
        else:
            review["is_liked"] = False
        review.pop("likes", None)
        review.pop("_id", None)
        reviews.append(review)

    return {"reviews": reviews, "total": total, "page": page, "pages": pages}


async def update_review(db, review_id: str, user_id: str, update_data: dict) -> dict:
    """Update a user's own review."""
    review = await db.reviews.find_one({
        "_id": ObjectId(review_id),
        "user_id": ObjectId(user_id),
    })
    if not review:
        return {"error": "Review not found or unauthorized"}

    update_fields = {k: v for k, v in update_data.items() if v is not None}
    update_fields["updated_at"] = datetime.now(timezone.utc)

    await db.reviews.update_one(
        {"_id": ObjectId(review_id)},
        {"$set": update_fields},
    )

    # Recalculate rating if changed
    if "rating" in update_fields:
        await _update_book_rating(db, str(review["book_id"]))

    updated = await db.reviews.find_one({"_id": ObjectId(review_id)})
    updated["id"] = str(updated["_id"])
    return updated


async def delete_review(db, review_id: str, user_id: str) -> dict:
    """Delete a user's own review."""
    review = await db.reviews.find_one({
        "_id": ObjectId(review_id),
        "user_id": ObjectId(user_id),
    })
    if not review:
        return {"error": "Review not found or unauthorized"}

    book_id = str(review["book_id"])
    await db.reviews.delete_one({"_id": ObjectId(review_id)})

    # Recalculate rating
    await _update_book_rating(db, book_id)

    return {"message": "Review deleted successfully"}


async def toggle_like_review(db, review_id: str, user_id: str) -> dict:
    """Toggle like on a review."""
    review = await db.reviews.find_one({"_id": ObjectId(review_id)})
    if not review:
        return {"error": "Review not found"}

    user_oid = ObjectId(user_id)
    if user_oid in review.get("likes", []):
        await db.reviews.update_one(
            {"_id": ObjectId(review_id)},
            {"$pull": {"likes": user_oid}},
        )
        return {"liked": False}
    else:
        await db.reviews.update_one(
            {"_id": ObjectId(review_id)},
            {"$addToSet": {"likes": user_oid}},
        )
        return {"liked": True}


async def get_user_reviews(db, user_id: str, page: int = 1, limit: int = 10) -> dict:
    """Get all reviews by a specific user."""
    skip = (page - 1) * limit
    total = await db.reviews.count_documents({"user_id": ObjectId(user_id)})
    pages = math.ceil(total / limit) if total > 0 else 1

    pipeline = [
        {"$match": {"user_id": ObjectId(user_id)}},
        {"$sort": {"created_at": -1}},
        {"$skip": skip},
        {"$limit": limit},
        {
            "$lookup": {
                "from": "books",
                "localField": "book_id",
                "foreignField": "_id",
                "as": "book",
            }
        },
        {"$unwind": {"path": "$book", "preserveNullAndEmptyArrays": True}},
        {
            "$lookup": {
                "from": "users",
                "localField": "user_id",
                "foreignField": "_id",
                "as": "user",
            }
        },
        {"$unwind": "$user"},
        {
            "$project": {
                "id": {"$toString": "$_id"},
                "user_id": {"$toString": "$user_id"},
                "username": "$user.username",
                "avatar_url": "$user.avatar_url",
                "book_id": {"$toString": "$book_id"},
                "book_title": "$book.title",
                "book_cover": "$book.cover_image",
                "rating": 1,
                "title": 1,
                "content": 1,
                "likes_count": {"$size": "$likes"},
                "created_at": 1,
                "updated_at": 1,
            }
        },
    ]

    reviews = []
    async for review in db.reviews.aggregate(pipeline):
        review.pop("_id", None)
        reviews.append(review)

    return {"reviews": reviews, "total": total, "page": page, "pages": pages}


async def _update_book_rating(db, book_id: str):
    """Recalculate and update average rating for a book."""
    pipeline = [
        {"$match": {"book_id": ObjectId(book_id)}},
        {
            "$group": {
                "_id": None,
                "avg_rating": {"$avg": "$rating"},
                "count": {"$sum": 1},
            }
        },
    ]

    result = None
    async for doc in db.reviews.aggregate(pipeline):
        result = doc

    if result:
        await db.books.update_one(
            {"_id": ObjectId(book_id)},
            {
                "$set": {
                    "average_rating": round(result["avg_rating"], 1),
                    "total_reviews": result["count"],
                }
            },
        )
    else:
        await db.books.update_one(
            {"_id": ObjectId(book_id)},
            {"$set": {"average_rating": 0.0, "total_reviews": 0}},
        )
