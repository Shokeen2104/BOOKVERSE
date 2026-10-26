from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from datetime import datetime, timezone
from bson import ObjectId

from app.core.database import get_db, get_redis
from app.services import book_service, gemini_service
from app.schemas.ai import (
    AIInsightResponse,
    AIBookInsights,
    AIChatRequest,
    AIChatResponse,
    BookSuggestion,
)

router = APIRouter(prefix="/api/ai", tags=["AI Insights"])


@router.post("/chat", response_model=AIChatResponse)
async def chat_with_book_assistant(
    request: AIChatRequest,
    db=Depends(get_db),
):
    """
    Conversational AI assistant for book recommendations, comparisons,
    and contextual inquiries about specific books.
    """
    context_book = None
    if request.context_book_id:
        book_id = request.context_book_id
        try:
            if ObjectId.is_valid(book_id):
                context_book = await db.books.find_one({"_id": ObjectId(book_id)})
        except Exception:
            pass

        if not context_book:
            context_book = await db.books.find_one({"google_books_id": book_id})

    # Call Gemini chat service
    result = await gemini_service.chat_with_assistant(
        messages=[{"role": m.role, "content": m.content} for m in request.messages],
        context_book=context_book,
    )

    # Process and match book suggestions with DB if possible
    raw_suggestions = result.get("book_suggestions", [])
    suggestions = []
    for s in raw_suggestions:
        title = s.get("title", "")
        author = s.get("author", "")
        reason = s.get("reason", "")
        genre = s.get("genre", "")
        matched_id = None

        if title:
            # Look up in DB for matching book to make it directly linkable
            try:
                db_book = await db.books.find_one(
                    {"title": {"$regex": f"^{title}$", "$options": "i"}}
                )
                if db_book:
                    matched_id = str(db_book["_id"])
            except Exception:
                pass

        suggestions.append(
            BookSuggestion(
                title=title,
                author=author,
                reason=reason,
                genre=genre,
                book_id=matched_id,
            )
        )

    return AIChatResponse(
        reply=result.get("reply", ""),
        book_suggestions=suggestions,
    )



@router.get("/book-insights/{book_id}", response_model=AIInsightResponse)
async def get_book_ai_insights(
    book_id: str,
    refresh: bool = Query(False, description="Force re-generation of AI analytics"),
    db=Depends(get_db),
    redis=Depends(get_redis),
):
    """
    Retrieve AI-powered literary analytics and summary for a book using Gemini.
    Results are cached in MongoDB for instant subsequent retrievals.
    """
    # 1. Fetch book from database (support MongoDB ObjectId or google_books_id/ol_id)
    book = None
    try:
        if ObjectId.is_valid(book_id):
            book = await db.books.find_one({"_id": ObjectId(book_id)})
    except Exception:
        pass

    if not book:
        book = await db.books.find_one({"google_books_id": book_id})

    if not book and book_id.startswith("ol_"):
        book = await book_service.get_or_create_book(db, book_id)

    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    mongo_id = book.get("_id")
    string_id = str(mongo_id) if mongo_id else book_id

    # 2. Check if cached AI insights exist and refresh wasn't requested
    existing_insights = book.get("ai_insights")
    if existing_insights and not refresh:
        return AIInsightResponse(
            book_id=string_id,
            insights=AIBookInsights(**existing_insights),
            is_cached=True,
            source="cache",
        )

    # 3. Retrieve recent user reviews for rich context
    reviews = []
    try:
        cursor = db.reviews.find({"book_id": string_id}).sort("created_at", -1).limit(5)
        reviews = await cursor.to_list(length=5)
    except Exception:
        reviews = []

    # 4. Generate fresh insights via Gemini API
    raw_insights = await gemini_service.generate_book_insights(book, reviews)

    # Validate against Pydantic model
    validated_insights = AIBookInsights(**raw_insights)

    # 5. Persist the generated insights into MongoDB on the book document
    if mongo_id:
        await db.books.update_one(
            {"_id": mongo_id},
            {
                "$set": {
                    "ai_insights": validated_insights.model_dump(),
                    "ai_insights_updated_at": datetime.now(timezone.utc),
                }
            },
        )

    return AIInsightResponse(
        book_id=string_id,
        insights=validated_insights,
        is_cached=False,
        source="gemini",
    )
