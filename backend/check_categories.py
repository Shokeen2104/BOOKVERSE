import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.database import connect_to_mongo, close_mongo_connection, db_instance

async def check():
    await connect_to_mongo()
    db = db_instance.db
    categories = await db.books.distinct("categories")
    print("Categories in DB:")
    for c in categories:
        print(f"- {c}")
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(check())
