import asyncio
import sys
import os
from datetime import datetime, timezone
from bson import ObjectId

# Add the parent directory to sys.path so we can import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import connect_to_mongo, close_mongo_connection, db_instance, connect_to_redis, close_redis_connection
from app.services.auth_service import register_user
from app.services.review_service import _update_book_rating

BOOKS = [
    {
        "google_books_id": "hobbit_id",
        "title": "The Hobbit",
        "authors": ["J.R.R. Tolkien"],
        "description": "Bilbo Baggins is a hobbit who enjoys a comfortable, unambitious life, rarely traveling any farther than his pantry or cellar. But his contentment is disturbed when the wizard Gandalf and a company of dwarves arrive on his doorstep one day to enlist him on an adventure.",
        "cover_image": "https://covers.openlibrary.org/b/isbn/9780261103344-L.jpg",
        "isbn": "9780261103344",
        "categories": ["Fantasy", "Adventure"],
        "published_date": "1937",
        "page_count": 310
    },
    {
        "google_books_id": "hp1_id",
        "title": "Harry Potter and the Sorcerer's Stone",
        "authors": ["J.K. Rowling"],
        "description": "Harry Potter has no idea how famous he is. That's because he's being raised by his miserable aunt and uncle who are terrified of Harry's monstrous power. But everything changes when Harry is summoned to attend a school for wizards, and he begins to discover some clues about his illustrious pedigree.",
        "cover_image": "https://covers.openlibrary.org/b/isbn/9780590353427-L.jpg",
        "isbn": "9780590353427",
        "categories": ["Fantasy", "Fiction"],
        "published_date": "1997",
        "page_count": 309
    },
    {
        "google_books_id": "1984_id",
        "title": "1984",
        "authors": ["George Orwell"],
        "description": "Winston Smith reins in his rebellion against the Party's control. But his desire to remain human in a world where individuality is a state crime leads him to commit thoughtcrime, and eventually to fall in love with Julia.",
        "cover_image": "https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg",
        "isbn": "9780451524935",
        "categories": ["Fiction", "Dystopian", "Classics"],
        "published_date": "1949",
        "page_count": 328
    },
    {
        "google_books_id": "gatsby_id",
        "title": "The Great Gatsby",
        "authors": ["F. Scott Fitzgerald"],
        "description": "The story of the mysteriously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan, The Great Gatsby is a classic of twentieth-century literature.",
        "cover_image": "https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg",
        "isbn": "9780743273565",
        "categories": ["Fiction", "Classics"],
        "published_date": "1925",
        "page_count": 180
    },
    {
        "google_books_id": "mockingbird_id",
        "title": "To Kill a Mockingbird",
        "authors": ["Harper Lee"],
        "description": "The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it, To Kill a Mockingbird became both an instant bestseller and a critical success.",
        "cover_image": "https://covers.openlibrary.org/b/isbn/9780446310789-L.jpg",
        "isbn": "9780446310789",
        "categories": ["Fiction", "Classics"],
        "published_date": "1960",
        "page_count": 281
    },
    {
        "google_books_id": "dune_id",
        "title": "Dune",
        "authors": ["Frank Herbert"],
        "description": "Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world where the only thing of value is the 'spice' melange.",
        "cover_image": "https://covers.openlibrary.org/b/isbn/9780441172719-L.jpg",
        "isbn": "9780441172719",
        "categories": ["Science Fiction", "Adventure"],
        "published_date": "1965",
        "page_count": 604
    },
    {
        "google_books_id": "pride_id",
        "title": "Pride and Prejudice",
        "authors": ["Jane Austen"],
        "description": "The romantic clash between the opinionated Elizabeth Bennet and her proud suitor, Mr. Darcy, is a splendid performance of civilized sparring.",
        "cover_image": "https://covers.openlibrary.org/b/isbn/9780679783268-L.jpg",
        "isbn": "9780679783268",
        "categories": ["Fiction", "Romance", "Classics"],
        "published_date": "1813",
        "page_count": 279
    },
    {
        "google_books_id": "sapiens_id",
        "title": "Sapiens: A Brief History of Humankind",
        "authors": ["Yuval Noah Harari"],
        "description": "Destined to become a modern classic, Sapiens is a thrilling and provocative recount of the history of humankind, from the evolutionary stages of early hominids to the present day.",
        "cover_image": "https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg",
        "isbn": "9780062316097",
        "categories": ["History", "Science", "Nonfiction"],
        "published_date": "2011",
        "page_count": 512
    }
]

USERS = [
    {"username": "alice", "email": "alice@bookverse.com", "password": "password123"},
    {"username": "bob", "email": "bob@bookverse.com", "password": "password123"},
    {"username": "charlie", "email": "charlie@bookverse.com", "password": "password123"},
    {"username": "diana", "email": "diana@bookverse.com", "password": "password123"}
]

REVIEWS = [
    {
        "book_google_id": "hobbit_id",
        "username": "alice",
        "rating": 5,
        "title": "A timeless fantasy masterpiece!",
        "content": "J.R.R. Tolkien creates a magical world that is cozy, thrilling, and profoundly moving. Bilbo's journey is the ultimate adventure, and the characters are so dear to me."
    },
    {
        "book_google_id": "hobbit_id",
        "username": "bob",
        "rating": 4,
        "title": "Fantastic world building and cozy adventure",
        "content": "Love the lore, the dwarves, and the riddles in the dark. It is a bit lighter than The Lord of the Rings, but just as immersive."
    },
    {
        "book_google_id": "1984_id",
        "username": "charlie",
        "rating": 5,
        "title": "Incredibly chilling and relevant",
        "content": "George Orwell's vision of totalitarian control is a dark, powerful warning. Winston's struggle to remain human is painful but brilliantly told."
    },
    {
        "book_google_id": "1984_id",
        "username": "diana",
        "rating": 4,
        "title": "A haunting read",
        "content": "The ending stays with you forever. It is an intense, bleak book but absolutely required reading for anyone."
    },
    {
        "book_google_id": "dune_id",
        "username": "alice",
        "rating": 5,
        "title": "The pinnacle of science fiction",
        "content": "Frank Herbert built an absolute marvel with Arrakis. The politics, ecology, and mythos are incredibly deep. Highly recommended!"
    },
    {
        "book_google_id": "dune_id",
        "username": "bob",
        "rating": 5,
        "title": "Unparalleled world building",
        "content": "The spice must flow! Paul Atreides' transformation from a young noble to a prophet is one of the best character arcs ever written."
    },
    {
        "book_google_id": "hp1_id",
        "username": "diana",
        "rating": 5,
        "title": "Pure magic and nostalgia",
        "content": "Re-reading this as an adult is just as satisfying as reading it the first time. The wizarding world is so beautifully designed."
    },
    {
        "book_google_id": "gatsby_id",
        "username": "charlie",
        "rating": 4,
        "title": "Beautifully written tragedy",
        "content": "Fitzgerald's prose is gorgeous. A sharp look at the American Dream and the illusions of wealth and love."
    },
    {
        "book_google_id": "mockingbird_id",
        "username": "alice",
        "rating": 5,
        "title": "Deeply moving and important",
        "content": "Atticus Finch is a legendary character, and Scout's narration brings a unique innocence to heavy themes like racism and justice."
    },
    {
        "book_google_id": "pride_id",
        "username": "diana",
        "rating": 5,
        "title": "Witty, romantic, and perfect",
        "content": "Jane Austen's best work. The chemistry between Elizabeth and Darcy is legendary, and the social satire is incredibly sharp."
    }
]

async def seed():
    await connect_to_mongo()
    await connect_to_redis()
    
    db = db_instance.db
    redis = db_instance.redis
    
    print("🧹 Cleaning existing collections...")
    await db.books.delete_many({})
    await db.users.delete_many({})
    await db.reviews.delete_many({})
    await db.reading_lists.delete_many({})
    
    if redis:
        print("🧹 Clearing Redis cache...")
        await redis.flushall()
        
    print("👤 Registering seed users...")
    user_map = {}
    for user_info in USERS:
        res = await register_user(db, user_info)
        if "error" in res:
            print(f"   ❌ Error registering {user_info['username']}: {res['error']}")
        else:
            user_map[user_info["username"]] = res["user"]["id"]
            print(f"   ✅ Registered: {user_info['username']}")
            
    print("📚 Seeding books...")
    book_map = {}
    for book_info in BOOKS:
        doc = {
            **book_info,
            "average_rating": 0.0,
            "total_reviews": 0,
            "cached_at": datetime.now(timezone.utc)
        }
        res = await db.books.insert_one(doc)
        book_id = str(res.inserted_id)
        book_map[book_info["google_books_id"]] = book_id
        print(f"   ✅ Seeded book: {book_info['title']}")
        
    print("✍️ Seeding reviews...")
    for rev in REVIEWS:
        user_id = user_map.get(rev["username"])
        book_id = book_map.get(rev["book_google_id"])
        
        if not user_id or not book_id:
            print(f"   ⚠️ Skipping review by {rev['username']} for {rev['book_google_id']} - user/book not found")
            continue
            
        now = datetime.now(timezone.utc)
        review_doc = {
            "user_id": ObjectId(user_id),
            "book_id": ObjectId(book_id),
            "rating": rev["rating"],
            "title": rev["title"],
            "content": rev["content"],
            "likes": [],
            "created_at": now,
            "updated_at": now
        }
        await db.reviews.insert_one(review_doc)
        print(f"   ✅ Added review by {rev['username']} for book ID: {book_id}")
        
    print("🔄 Recalculating book ratings...")
    for b_id in book_map.values():
        await _update_book_rating(db, b_id)
        
    print("✨ Seeding completed successfully!")
    await close_redis_connection()
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(seed())
