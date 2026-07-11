import asyncio
import sys
import os
import httpx
from datetime import datetime, timezone
import random

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import connect_to_mongo, close_mongo_connection, db_instance

# Generic queries to fetch a diverse set of books
QUERIES = [
    "subject:fiction",
    "subject:fantasy",
    "subject:science",
    "subject:history",
    "subject:biography",
    "subject:mystery",
    "subject:thriller",
    "subject:romance"
]

async def import_books():
    await connect_to_mongo()
    db = db_instance.db
    
    print("Starting bulk import of ~100 books...")
    
    total_added = 0
    
    async with httpx.AsyncClient() as client:
        for q in QUERIES:
            print(f"Fetching books for query: {q}")
            try:
                response = await client.get(
                    "https://openlibrary.org/search.json",
                    params={"subject": q.replace("subject:", ""), "limit": 20}
                )
                
                if response.status_code != 200:
                    print(f"Failed to fetch {q}: {response.status_code}")
                    continue
                    
                data = response.json()
                items = data.get("docs", [])
                
                for item in items:
                    title = item.get("title")
                    authors = item.get("author_name", [])
                    
                    if not title or not authors:
                        continue
                        
                    # Generate a unique ID since OpenLibrary uses keys like /works/OL12345W
                    ol_key = item.get("key", "").split("/")[-1]
                    google_id = f"ol_{ol_key}"
                    
                    existing = await db.books.find_one({"google_books_id": google_id})
                    if existing:
                        continue
                        
                    isbn = item.get("isbn", [""])[0] if item.get("isbn") else None
                    cover_id = item.get("cover_i")
                    cover_image = f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg" if cover_id else ""
                    
                    book_doc = {
                        "google_books_id": google_id,
                        "title": title,
                        "authors": authors,
                        "description": "Book imported from Open Library catalog.",
                        "cover_image": cover_image,
                        "isbn": isbn,
                        "categories": item.get("subject", [])[:3],
                        "published_date": str(item.get("first_publish_year", "")),
                        "page_count": item.get("number_of_pages_median", 0),
                        "average_rating": round(random.uniform(3.5, 5.0), 1),
                        "total_reviews": random.randint(0, 20),
                        "cached_at": datetime.now(timezone.utc)
                    }
                    
                    # Clean up HTTPs in image links to prevent mixed content
                    if book_doc["cover_image"] and book_doc["cover_image"].startswith("http:"):
                        book_doc["cover_image"] = book_doc["cover_image"].replace("http:", "https:")
                        
                    await db.books.insert_one(book_doc)
                    total_added += 1
                    
                    if total_added >= 120:
                        break
                        
            except Exception as e:
                print(f"Error fetching {q}: {e}")
                
            if total_added >= 120:
                break
                
    print(f"✅ Successfully imported {total_added} books!")
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(import_books())
