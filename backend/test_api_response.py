import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import connect_to_mongo, connect_to_redis, close_mongo_connection, close_redis_connection, db_instance
from app.services import book_service

async def check():
    await connect_to_mongo()
    await connect_to_redis()
    
    db = db_instance.db
    redis = db_instance.redis
    
    print("Running browse_books with q='harry':")
    res = await book_service.browse_books(db, redis, q="harry")
    print(res)
    
    print("\nRunning browse_books with no query:")
    res_all = await book_service.browse_books(db, redis)
    print(f"Total books found: {len(res_all.get('books', []))}")
    for b in res_all.get("books", []):
        print(f"- {b['title']}")
        
    await close_redis_connection()
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(check())
