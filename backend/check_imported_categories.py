import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.database import connect_to_mongo, close_mongo_connection, db_instance

async def check():
    await connect_to_mongo()
    db = db_instance.db
    
    # Get 5 imported books
    cursor = db.books.find({"description": "Book imported from Open Library catalog."}).limit(5)
    async for b in cursor:
        print(f"Title: {b.get('title')}, Categories: {b.get('categories')}")
        
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(check())
