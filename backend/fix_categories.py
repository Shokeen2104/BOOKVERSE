import asyncio
import sys
import os
import random

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.database import connect_to_mongo, close_mongo_connection, db_instance

GENRES = ["Fiction", "Biography", "History", "Science", "Fantasy", "Mystery"]

async def fix():
    await connect_to_mongo()
    db = db_instance.db
    
    # Find books with empty categories or categories that don't overlap well with our UI
    cursor = db.books.find({"description": "Book imported from Open Library catalog."})
    count = 0
    async for b in cursor:
        current_cats = b.get("categories", [])
        if not current_cats:
            num_genres = random.choice([1, 2])
            new_cats = random.sample(GENRES, num_genres)
            await db.books.update_one({"_id": b["_id"]}, {"$set": {"categories": new_cats}})
            count += 1
        else:
            # If they have weird OpenLibrary categories, append a standard one so they work with UI filters
            if not any(g in current_cats for g in GENRES):
                new_cat = random.choice(GENRES)
                current_cats.append(new_cat)
                await db.books.update_one({"_id": b["_id"]}, {"$set": {"categories": current_cats}})
                count += 1
        
    print(f"Fixed categories for {count} books.")
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(fix())
