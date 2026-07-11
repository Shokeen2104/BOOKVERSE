from fastapi import APIRouter, Depends, HTTPException
from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.reading_list import ReadingListCreate, ReadingListAddBook
from app.services import reading_list_service

router = APIRouter(prefix="/api/reading-lists", tags=["Reading Lists"])


@router.get("")
async def get_my_lists(
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get all reading lists for the current user."""
    return await reading_list_service.get_user_lists(db, current_user["id"])


@router.get("/{list_id}")
async def get_list_detail(
    list_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get a single reading list with all books."""
    result = await reading_list_service.get_list_detail(db, list_id, current_user["id"])
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.post("", status_code=201)
async def create_list(
    list_data: ReadingListCreate,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Create a new custom reading list."""
    result = await reading_list_service.create_list(db, current_user["id"], list_data.name)
    return result


@router.post("/{list_id}/books")
async def add_book(
    list_id: str,
    book_data: ReadingListAddBook,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Add a book to a reading list."""
    result = await reading_list_service.add_book_to_list(
        db, list_id, current_user["id"], book_data.book_id
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.delete("/{list_id}/books/{book_id}")
async def remove_book(
    list_id: str,
    book_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Remove a book from a reading list."""
    result = await reading_list_service.remove_book_from_list(
        db, list_id, current_user["id"], book_id
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.delete("/{list_id}")
async def delete_list(
    list_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Delete a custom reading list."""
    result = await reading_list_service.delete_list(db, list_id, current_user["id"])
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/book-status/{book_id}")
async def get_book_status(
    book_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Check which reading lists contain a specific book."""
    return await reading_list_service.get_book_list_status(
        db, current_user["id"], book_id
    )
