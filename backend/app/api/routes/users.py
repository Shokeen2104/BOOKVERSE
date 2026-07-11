from fastapi import APIRouter, Depends, HTTPException, Query
from bson import ObjectId
from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.auth import UserUpdate, UserProfile
from app.services import review_service

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/me")
async def get_profile(current_user=Depends(get_current_user)):
    """Get current user's profile."""
    return {
        "id": current_user["id"],
        "username": current_user["username"],
        "email": current_user["email"],
        "avatar_url": current_user.get("avatar_url"),
        "bio": current_user.get("bio"),
        "favorite_genres": current_user.get("favorite_genres", []),
        "created_at": current_user.get("created_at"),
    }


@router.put("/me")
async def update_profile(
    update_data: UserUpdate,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Update current user's profile."""
    update_fields = update_data.model_dump(exclude_none=True)
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Check username uniqueness if being updated
    if "username" in update_fields:
        existing = await db.users.find_one({
            "username": update_fields["username"],
            "_id": {"$ne": ObjectId(current_user["id"])},
        })
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")

    await db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": update_fields},
    )

    return {"message": "Profile updated successfully"}


@router.get("/{user_id}/reviews")
async def get_user_reviews(
    user_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db=Depends(get_db),
):
    """Get all public reviews by a user."""
    return await review_service.get_user_reviews(db, user_id, page, limit)


@router.get("/me/stats")
async def get_user_stats(
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get reading statistics for current user."""
    user_id = ObjectId(current_user["id"])

    # Count reviews
    total_reviews = await db.reviews.count_documents({"user_id": user_id})

    # Count books in reading lists
    lists = await db.reading_lists.find({"user_id": user_id}).to_list(length=100)
    total_books = sum(len(lst.get("books", [])) for lst in lists)

    # Average rating given
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": None, "avg": {"$avg": "$rating"}}},
    ]
    avg_rating = 0
    async for doc in db.reviews.aggregate(pipeline):
        avg_rating = round(doc["avg"], 1)

    # Books by list
    list_stats = []
    for lst in lists:
        list_stats.append({
            "name": lst["name"],
            "count": len(lst.get("books", [])),
        })

    return {
        "total_reviews": total_reviews,
        "total_books_in_lists": total_books,
        "average_rating_given": avg_rating,
        "lists": list_stats,
    }
