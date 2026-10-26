from pydantic import BaseModel, Field
from typing import List, Optional


class MetricDetail(BaseModel):
    score: int = Field(..., ge=1, le=10, description="Score on a scale from 1 to 10")
    label: str = Field(..., description="Short descriptive label (e.g., 'Fast-Paced', 'Slow Burn')")
    description: str = Field(..., description="1-2 sentences explaining why this score was assigned")


class BookAnalytics(BaseModel):
    pacing: MetricDetail
    plot_complexity: MetricDetail
    character_depth: MetricDetail
    emotional_intensity: MetricDetail
    accessibility: MetricDetail


class AIBookInsights(BaseModel):
    executive_summary: str = Field(..., description="Spoiler-free, captivating summary highlighting the core premise")
    key_themes: List[str] = Field(default_factory=list, description="3-5 central thematic topics explored in the book")
    mood_atmosphere: List[str] = Field(default_factory=list, description="3-5 descriptive mood words (e.g., 'Atmospheric', 'Grim', 'Witty')")
    target_audience: str = Field(..., description="Who would enjoy this book the most (e.g., fans of specific authors/tropes)")
    analytics: BookAnalytics
    notable_tropes: List[str] = Field(default_factory=list, description="2-4 popular book tropes or narrative devices present")
    content_notes: Optional[str] = Field(None, description="Helpful content tone or advisory notes")


class AIInsightResponse(BaseModel):
    book_id: str
    insights: AIBookInsights
    is_cached: bool = False
    source: str = "gemini"


class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str = Field(..., min_length=1)


class AIChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., min_length=1)
    context_book_id: Optional[str] = Field(None, description="Optional book currently being viewed for context")


class BookSuggestion(BaseModel):
    title: str
    author: str
    reason: str
    genre: Optional[str] = None
    book_id: Optional[str] = None


class AIChatResponse(BaseModel):
    reply: str
    book_suggestions: List[BookSuggestion] = Field(default_factory=list)

