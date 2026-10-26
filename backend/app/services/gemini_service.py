import json
import logging
from typing import Dict, Any, List, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

JSON_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "executive_summary": {"type": "STRING"},
        "key_themes": {"type": "ARRAY", "items": {"type": "STRING"}},
        "mood_atmosphere": {"type": "ARRAY", "items": {"type": "STRING"}},
        "target_audience": {"type": "STRING"},
        "analytics": {
            "type": "OBJECT",
            "properties": {
                "pacing": {
                    "type": "OBJECT",
                    "properties": {
                        "score": {"type": "INTEGER"},
                        "label": {"type": "STRING"},
                        "description": {"type": "STRING"},
                    },
                    "required": ["score", "label", "description"],
                },
                "plot_complexity": {
                    "type": "OBJECT",
                    "properties": {
                        "score": {"type": "INTEGER"},
                        "label": {"type": "STRING"},
                        "description": {"type": "STRING"},
                    },
                    "required": ["score", "label", "description"],
                },
                "character_depth": {
                    "type": "OBJECT",
                    "properties": {
                        "score": {"type": "INTEGER"},
                        "label": {"type": "STRING"},
                        "description": {"type": "STRING"},
                    },
                    "required": ["score", "label", "description"],
                },
                "emotional_intensity": {
                    "type": "OBJECT",
                    "properties": {
                        "score": {"type": "INTEGER"},
                        "label": {"type": "STRING"},
                        "description": {"type": "STRING"},
                    },
                    "required": ["score", "label", "description"],
                },
                "accessibility": {
                    "type": "OBJECT",
                    "properties": {
                        "score": {"type": "INTEGER"},
                        "label": {"type": "STRING"},
                        "description": {"type": "STRING"},
                    },
                    "required": ["score", "label", "description"],
                },
            },
            "required": [
                "pacing",
                "plot_complexity",
                "character_depth",
                "emotional_intensity",
                "accessibility",
            ],
        },
        "notable_tropes": {"type": "ARRAY", "items": {"type": "STRING"}},
        "content_notes": {"type": "STRING"},
    },
    "required": [
        "executive_summary",
        "key_themes",
        "mood_atmosphere",
        "target_audience",
        "analytics",
        "notable_tropes",
    ],
}


def _build_fallback_insights(book: Dict[str, Any]) -> Dict[str, Any]:
    """Provide a reliable fallback when Gemini API key is missing or offline."""
    title = book.get("title", "this book")
    categories = book.get("categories", [])
    primary_category = categories[0] if categories else "General Fiction"

    return {
        "executive_summary": (
            f"'{title}' is a captivating exploration within {primary_category}. "
            "It offers readers an engaging journey balancing thought-provoking narrative with memorable dynamics."
        ),
        "key_themes": [
            "Human Nature & Choice",
            "Personal Transformation",
            "Social Dynamics",
        ],
        "mood_atmosphere": ["Engaging", "Immersive", "Atmospheric"],
        "target_audience": f"Ideal for readers who appreciate well-crafted {primary_category.lower()} and immersive storytelling.",
        "analytics": {
            "pacing": {
                "score": 7,
                "label": "Balanced",
                "description": "Steadily builds momentum, giving space for world-building while maintaining steady narrative drive.",
            },
            "plot_complexity": {
                "score": 7,
                "label": "Multi-Layered",
                "description": "Features intertwining subplots and character choices that reward thoughtful reading.",
            },
            "character_depth": {
                "score": 8,
                "label": "Nuanced",
                "description": "Protagonists and supporting figures exhibit realistic flaws, motivations, and internal conflict.",
            },
            "emotional_intensity": {
                "score": 6,
                "label": "Moderate",
                "description": "Delivers resonant emotional beats without overwhelming reader comfort.",
            },
            "accessibility": {
                "score": 8,
                "label": "Accessible",
                "description": "Approachable prose that welcomes both casual and avid readers.",
            },
        },
        "notable_tropes": ["Hero's Journey", "Inner Conflict"],
        "content_notes": "Generally suitable for general adult and young adult audiences.",
    }


async def generate_book_insights(
    book: Dict[str, Any],
    reviews: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Generate deep book insights, summary, and parameter analytics using Google Gemini API.
    Uses structured JSON schema generation.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key or api_key.strip() == "" or api_key == "your_gemini_api_key_here":
        logger.warning("GEMINI_API_KEY is not configured in .env. Returning intelligent fallback analytics.")
        return _build_fallback_insights(book)

    model = getattr(settings, "GEMINI_MODEL", "gemini-1.5-flash")
    url = f"{GEMINI_API_URL.format(model=model)}?key={api_key}"

    # Prepare prompt data
    title = book.get("title", "Unknown Title")
    authors = ", ".join(book.get("authors", [])) or "Unknown Author"
    categories = ", ".join(book.get("categories", [])) or "General"
    description = book.get("description", "No synopsis provided.")
    page_count = book.get("page_count", "N/A")

    review_snippets = ""
    if reviews:
        extracted = [
            f"- ({r.get('rating', 5)}/5 stars) {r.get('title', '')}: {r.get('content', '')[:120]}"
            for r in reviews[:5] if r.get("content")
        ]
        if extracted:
            review_snippets = "\nReader Reviews for context:\n" + "\n".join(extracted)

    prompt = f"""
You are a master literary critic, book analyst, and recommendation engine for BookVerse.
Analyze the following book and generate insightful, objective analytics and a crisp summary.

Book Details:
- Title: {title}
- Author(s): {authors}
- Categories / Genres: {categories}
- Page Count: {page_count}
- Synopsis: {description}
{review_snippets}

Evaluation Guidelines:
1. Executive Summary: Keep it spoiler-free, exciting, and concise (2-3 sentences max).
2. Pacing (1-10): 1 = extremely slow contemplative burn, 10 = non-stop breathless action.
3. Plot Complexity (1-10): 1 = straightforward linear, 10 = mind-bending, multiple unreliable threads.
4. Character Depth (1-10): 1 = archetype/plot-driven, 10 = profound psychological character study.
5. Emotional Intensity (1-10): 1 = cozy & lighthearted, 10 = gut-wrenching, dark, or deeply harrowing.
6. Accessibility (1-10): 1 = very dense/academic/difficult, 10 = ultra-smooth page-turner for any reader.
7. Notable Tropes: Give 2-4 recognizable book tropes or motifs.
8. Target Audience: Mention specific reader tastes, author comparisons, or moods.
"""

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}],
            }
        ],
        "generationConfig": {
            "temperature": 0.3,
            "responseMimeType": "application/json",
            "responseSchema": JSON_SCHEMA,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            response = await client.post(url, json=payload)
            
            if response.status_code != 200:
                logger.error(f"Gemini API returned status {response.status_code}: {response.text}")
                return _build_fallback_insights(book)
                
            data = response.json()
            candidates = data.get("candidates", [])
            if not candidates:
                return _build_fallback_insights(book)

            text_content = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            if not text_content:
                return _build_fallback_insights(book)

            parsed_json = json.loads(text_content)
            return parsed_json

    except Exception as e:
        logger.error(f"Error calling Gemini API: {e}", exc_info=True)
        return _build_fallback_insights(book)


CHAT_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "reply": {
            "type": "STRING",
            "description": "Engaging, conversational, markdown-formatted response.",
        },
        "book_suggestions": {
            "type": "ARRAY",
            "description": "List of recommended books mentioned in the response (up to 3). Empty if conversational only.",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "title": {"type": "STRING"},
                    "author": {"type": "STRING"},
                    "reason": {"type": "STRING"},
                    "genre": {"type": "STRING"},
                },
                "required": ["title", "author", "reason"],
            },
        },
    },
    "required": ["reply", "book_suggestions"],
}


async def chat_with_assistant(
    messages: List[Dict[str, str]],
    context_book: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Conduct multi-turn chat with BookVerse AI Assistant, supporting book context
    and structured recommendations.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key or api_key.strip() == "" or api_key == "your_gemini_api_key_here":
        return {
            "reply": "Hello! I am your **BookVerse AI Assistant**. Please make sure the `GEMINI_API_KEY` is configured in your `.env` file so I can give you personalized real-time recommendations and literary insights!",
            "book_suggestions": [
                {
                    "title": "Project Hail Mary",
                    "author": "Andy Weir",
                    "reason": "An exhilarating sci-fi adventure full of clever problem-solving and boundless optimism.",
                    "genre": "Science Fiction",
                },
                {
                    "title": "Tomorrow, and Tomorrow, and Tomorrow",
                    "author": "Gabrielle Zevin",
                    "reason": "A deeply human, layered journey through art, friendship, and identity.",
                    "genre": "Contemporary Fiction",
                },
            ],
        }

    model = getattr(settings, "GEMINI_MODEL", "gemini-1.5-flash")
    url = f"{GEMINI_API_URL.format(model=model)}?key={api_key}"

    # Build system instruction
    system_text = (
        "You are BookVerse AI, an enthusiastic, erudite, and friendly literary companion and recommendation matchmaker. "
        "You help readers discover books, compare novels, discuss character dynamics, explain themes, and analyze literature. "
        "Keep your tone warm, insightful, and knowledgeable. Always warn before sharing spoilers. "
        "When recommending books, always explain thoughtfully why they fit the user's taste, and provide structured suggestions in book_suggestions."
    )

    if context_book:
        title = context_book.get("title", "Unknown")
        authors = ", ".join(context_book.get("authors", [])) or "Unknown"
        categories = ", ".join(context_book.get("categories", [])) or "General"
        description = context_book.get("description", "No description provided.")
        system_text += (
            f"\n\nCURRENT BOOK CONTEXT (the user is viewing this book page):\n"
            f"- Title: {title}\n"
            f"- Author(s): {authors}\n"
            f"- Genres: {categories}\n"
            f"- Synopsis: {description}\n"
            "If the user asks questions referring to 'this book', 'the plot', 'the ending', etc., utilize this context to provide accurate, grounded answers."
        )

    # Convert messages for Gemini
    formatted_contents = []
    for msg in messages:
        role = "user" if msg.get("role") == "user" else "model"
        formatted_contents.append({
            "role": role,
            "parts": [{"text": msg.get("content", "")}],
        })

    payload = {
        "contents": formatted_contents,
        "systemInstruction": {
            "parts": [{"text": system_text}]
        },
        "generationConfig": {
            "temperature": 0.5,
            "responseMimeType": "application/json",
            "responseSchema": CHAT_SCHEMA,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload)
            if response.status_code != 200:
                logger.error(f"Gemini Chat API returned status {response.status_code}: {response.text}")
                return {
                    "reply": "I'm having a little trouble connecting to my literary archives right now. Please try asking again in a moment!",
                    "book_suggestions": [],
                }

            data = response.json()
            candidates = data.get("candidates", [])
            if not candidates:
                return {
                    "reply": "I couldn't compose a reply for that query. Could you rephrase your question?",
                    "book_suggestions": [],
                }

            text_content = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            return json.loads(text_content)

    except Exception as e:
        logger.error(f"Error calling Gemini Chat: {e}", exc_info=True)
        return {
            "reply": "An error occurred while generating a response. Please check your network and API key configuration.",
            "book_suggestions": [],
        }

