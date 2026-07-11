import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import connect_to_mongo, close_mongo_connection, db_instance

async def check():
    await connect_to_mongo()
    db = db_instance.db
    
    # Check with regex
    regex_cursor = db.books.find({"title": {"$regex": "harry", "$options": "i"}})
    print("Regex 'harry' matches:")
    async for book in regex_cursor:
        print(f"- {book.get('title')}")
        
    # Check with text search
    try:
        text_cursor = db.books.find({"$text": {"$search": "harry"}})
        print("\nText search 'harry' matches:")
        async for book in text_cursor:
            print(f"- {book.get('title')}")
    except Exception as e:
        print(f"\nText search error: {e}")
        
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(check())
