from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.review import ReviewCreate, ReviewUpdate
from app.services import review_service

router = APIRouter(prefix="/api/reviews", tags=["Reviews"])


@router.post("", status_code=201)
async def create_review(
    review_data: ReviewCreate,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Create a new review for a book (auth required)."""
    result = await review_service.create_review(
        db, current_user["id"], review_data.model_dump()
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return {
        "id": result["id"],
        "message": "Review created successfully",
    }


@router.get("/book/{book_id}")
async def get_book_reviews(
    book_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db=Depends(get_db),
):
    """Get all reviews for a specific book."""
    return await review_service.get_reviews_for_book(db, book_id, page, limit)


@router.put("/{review_id}")
async def update_review(
    review_id: str,
    review_data: ReviewUpdate,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Update your own review (auth required)."""
    result = await review_service.update_review(
        db, review_id, current_user["id"],
        review_data.model_dump(exclude_none=True),
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return {"message": "Review updated successfully"}


@router.delete("/{review_id}")
async def delete_review(
    review_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Delete your own review (auth required)."""
    result = await review_service.delete_review(db, review_id, current_user["id"])
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.post("/{review_id}/like")
async def toggle_like(
    review_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Toggle like on a review (auth required)."""
    result = await review_service.toggle_like_review(db, review_id, current_user["id"])
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result
