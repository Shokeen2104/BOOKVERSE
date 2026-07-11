import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import connect_to_mongo, close_mongo_connection, db_instance

async def check():
    await connect_to_mongo()
    db = db_instance.db
    
    count = await db.books.count_documents({})
    print(f"Total books in DB: {count}")
    
    cursor = db.books.find({})
    async for book in cursor:
        print(f"- {book.get('title')} (Google ID: {book.get('google_books_id')}, ID: {book.get('_id')})")
        
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(check())
