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
        "google_books_id": "ol_OL66554W",
        "title": "Pride and Prejudice",
        "authors": [
            "Jane Austen"
        ],
        "description": "A highly rated fiction book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/14348537-L.jpg",
        "isbn": None,
        "categories": [
            "Fiction"
        ],
        "published_date": "1813",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL138052W",
        "title": "Alice's Adventures in Wonderland",
        "authors": [
            "Lewis Carroll"
        ],
        "description": "A highly rated fiction book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/10527843-L.jpg",
        "isbn": None,
        "categories": [
            "Fiction"
        ],
        "published_date": "1865",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL32466W",
        "title": "A Christmas Carol",
        "authors": [
            "Charles Dickens"
        ],
        "description": "A highly rated fiction book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/12875748-L.jpg",
        "isbn": None,
        "categories": [
            "Fiction"
        ],
        "published_date": "1843",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL8193416W",
        "title": "The Picture of Dorian Gray",
        "authors": [
            "Oscar Wilde"
        ],
        "description": "A highly rated fiction book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/14314858-L.jpg",
        "isbn": None,
        "categories": [
            "Fiction"
        ],
        "published_date": "1890",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL21177W",
        "title": "Wuthering Heights",
        "authors": [
            "Emily Bronte\u0308"
        ],
        "description": "A highly rated fiction book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/12818862-L.jpg",
        "isbn": None,
        "categories": [
            "Fiction"
        ],
        "published_date": "1846",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL53908W",
        "title": "Adventures of Huckleberry Finn",
        "authors": [
            "Mark Twain"
        ],
        "description": "A highly rated fiction book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/8157718-L.jpg",
        "isbn": None,
        "categories": [
            "Fiction"
        ],
        "published_date": "1876",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL455305W",
        "title": "The Scarlet Letter",
        "authors": [
            "Nathaniel Hawthorne"
        ],
        "description": "A highly rated fiction book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/5654516-L.jpg",
        "isbn": None,
        "categories": [
            "Fiction"
        ],
        "published_date": "1800",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL45089W",
        "title": "Robinson Crusoe",
        "authors": [
            "Daniel Defoe",
            "J. J. Grandville",
            "Petrus Borel",
            "Les \u00e9ditions du Rey",
            "N. C. Wyeth"
        ],
        "description": "A highly rated fiction book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/368541-L.jpg",
        "isbn": None,
        "categories": [
            "Fiction"
        ],
        "published_date": "1686",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL9170454W",
        "title": "Hamlet",
        "authors": [
            "William Shakespeare"
        ],
        "description": "A highly rated fiction book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/8281954-L.jpg",
        "isbn": None,
        "categories": [
            "Fiction"
        ],
        "published_date": "1603",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL66513W",
        "title": "Emma",
        "authors": [
            "Jane Austen"
        ],
        "description": "A highly rated fiction book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/9278312-L.jpg",
        "isbn": None,
        "categories": [
            "Fiction"
        ],
        "published_date": "1815",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL18417W",
        "title": "The Wonderful Wizard of Oz",
        "authors": [
            "L. Frank Baum"
        ],
        "description": "A highly rated fantasy book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/552443-L.jpg",
        "isbn": None,
        "categories": [
            "Fantasy"
        ],
        "published_date": "1899",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL24034W",
        "title": "Treasure Island",
        "authors": [
            "Robert Louis Stevenson"
        ],
        "description": "A highly rated fantasy book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/13859660-L.jpg",
        "isbn": None,
        "categories": [
            "Fantasy"
        ],
        "published_date": "1880",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL85892W",
        "title": "Dracula",
        "authors": [
            "Bram Stoker"
        ],
        "description": "A highly rated fantasy book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/12216503-L.jpg",
        "isbn": None,
        "categories": [
            "Fantasy"
        ],
        "published_date": "1897",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL20600W",
        "title": "Gulliver's Travels",
        "authors": [
            "Jonathan Swift"
        ],
        "description": "A highly rated fantasy book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/12717083-L.jpg",
        "isbn": None,
        "categories": [
            "Fantasy"
        ],
        "published_date": "1726",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL14942956W",
        "title": "The Call of the Wild",
        "authors": [
            "Jack London"
        ],
        "description": "A highly rated fantasy book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/12393037-L.jpg",
        "isbn": None,
        "categories": [
            "Fantasy"
        ],
        "published_date": "1903",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL69612W",
        "title": "The Secret Garden",
        "authors": [
            "Frances Hodgson Burnett"
        ],
        "description": "A highly rated fantasy book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/12622062-L.jpg",
        "isbn": None,
        "categories": [
            "Fantasy"
        ],
        "published_date": "1911",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL450063W",
        "title": "Frankenstein; or, The Modern Prometheus",
        "authors": [
            "Mary Shelley"
        ],
        "description": "A highly rated science book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/12356249-L.jpg",
        "isbn": None,
        "categories": [
            "Science"
        ],
        "published_date": "1818",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL244537W",
        "title": "The Art of War",
        "authors": [
            "\u5b59\u6b66 (Sun Tzu)",
            "Stephen F. Kaufman",
            "Lionel Giles",
            "On\u00e9simo Colavidas"
        ],
        "description": "A highly rated science book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/4849549-L.jpg",
        "isbn": None,
        "categories": [
            "Science"
        ],
        "published_date": "1900",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL1089297W",
        "title": "The Prince",
        "authors": [
            "Niccol\u00f2 Machiavelli"
        ],
        "description": "A highly rated science book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/12726168-L.jpg",
        "isbn": None,
        "categories": [
            "Science"
        ],
        "published_date": "1515",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL52267W",
        "title": "The Time Machine",
        "authors": [
            "H. G. Wells"
        ],
        "description": "A highly rated science book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/9009316-L.jpg",
        "isbn": None,
        "categories": [
            "Science"
        ],
        "published_date": "1895",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL55649W",
        "title": "Walden",
        "authors": [
            "Henry David Thoreau"
        ],
        "description": "A highly rated science book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/11248037-L.jpg",
        "isbn": None,
        "categories": [
            "Science"
        ],
        "published_date": "1854",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL102749W",
        "title": "Moby Dick",
        "authors": [
            "Herman Melville"
        ],
        "description": "A highly rated science book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/10544254-L.jpg",
        "isbn": None,
        "categories": [
            "Science"
        ],
        "published_date": "1851",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL8193478W",
        "title": "Oliver Twist",
        "authors": [
            "Charles Dickens"
        ],
        "description": "A highly rated history book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/13300802-L.jpg",
        "isbn": None,
        "categories": [
            "History"
        ],
        "published_date": "1822",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL262496W",
        "title": "A Study in Scarlet",
        "authors": [
            "Arthur Conan Doyle"
        ],
        "description": "A highly rated mystery book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/13405534-L.jpg",
        "isbn": None,
        "categories": [
            "Mystery"
        ],
        "published_date": "1887",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL262454W",
        "title": "The Hound of the Baskervilles",
        "authors": [
            "Arthur Conan Doyle"
        ],
        "description": "A highly rated mystery book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/8063264-L.jpg",
        "isbn": None,
        "categories": [
            "Mystery"
        ],
        "published_date": "1900",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL166894W",
        "title": "\u041f\u0440\u0435\u0441\u0442\u0443\u043f\u043b\u0435\u043d\u0438\u0435 \u0438 \u043d\u0430\u043a\u0430\u0437\u0430\u043d\u0438\u0435",
        "authors": [
            "Fyodor Dostoyevsky"
        ],
        "description": "A highly rated mystery book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/9411873-L.jpg",
        "isbn": None,
        "categories": [
            "Mystery"
        ],
        "published_date": "1866",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL262421W",
        "title": "The Adventures of Sherlock Holmes [12 stories]",
        "authors": [
            "Arthur Conan Doyle"
        ],
        "description": "A highly rated mystery book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/6717853-L.jpg",
        "isbn": None,
        "categories": [
            "Mystery"
        ],
        "published_date": "1892",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL76487W",
        "title": "The Man Who Was Thursday",
        "authors": [
            "Gilbert Keith Chesterton"
        ],
        "description": "A highly rated mystery book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/8242857-L.jpg",
        "isbn": None,
        "categories": [
            "Mystery"
        ],
        "published_date": "1908",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL472715W",
        "title": "The Mysterious Affair at Styles",
        "authors": [
            "Agatha Christie"
        ],
        "description": "A highly rated mystery book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/13699667-L.jpg",
        "isbn": None,
        "categories": [
            "Mystery"
        ],
        "published_date": "1920",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL176092W",
        "title": "The Moonstone",
        "authors": [
            "Wilkie Collins"
        ],
        "description": "A highly rated mystery book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/8237041-L.jpg",
        "isbn": None,
        "categories": [
            "Mystery"
        ],
        "published_date": "1800",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL262438W",
        "title": "The Sign of Four",
        "authors": [
            "Arthur Conan Doyle"
        ],
        "description": "A highly rated mystery book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/9247987-L.jpg",
        "isbn": None,
        "categories": [
            "Mystery"
        ],
        "published_date": "1889",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL66562W",
        "title": "Sense and Sensibility",
        "authors": [
            "Jane Austen"
        ],
        "description": "A highly rated romance book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/9278292-L.jpg",
        "isbn": None,
        "categories": [
            "Romance"
        ],
        "published_date": "1811",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL29983W",
        "title": "Little Women",
        "authors": [
            "Louisa May Alcott"
        ],
        "description": "A highly rated romance book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/8775559-L.jpg",
        "isbn": None,
        "categories": [
            "Romance"
        ],
        "published_date": "1848",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL503666W",
        "title": "Don Quijote de la Mancha",
        "authors": [
            "Miguel de Cervantes Saavedra"
        ],
        "description": "A highly rated romance book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/14428305-L.jpg",
        "isbn": None,
        "categories": [
            "Romance"
        ],
        "published_date": "1600",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL893707W",
        "title": "Madame Bovary",
        "authors": [
            "Gustave Flaubert"
        ],
        "description": "A highly rated romance book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/12993424-L.jpg",
        "isbn": None,
        "categories": [
            "Romance"
        ],
        "published_date": "1856",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL259010W",
        "title": "A Midsummer Night's Dream",
        "authors": [
            "William Shakespeare"
        ],
        "description": "A highly rated romance book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/7205924-L.jpg",
        "isbn": None,
        "categories": [
            "Romance"
        ],
        "published_date": "1600",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL93082W",
        "title": "La Divina Commedia",
        "authors": [
            "Dante Alighieri"
        ],
        "description": "A highly rated romance book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/11621024-L.jpg",
        "isbn": None,
        "categories": [
            "Romance"
        ],
        "published_date": "1472",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL362702W",
        "title": "Julius Caesar",
        "authors": [
            "William Shakespeare"
        ],
        "description": "A highly rated biography book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/7901303-L.jpg",
        "isbn": None,
        "categories": [
            "Biography"
        ],
        "published_date": "1656",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL267096W",
        "title": "\u0410\u043d\u043d\u0430 \u041a\u0430\u0440\u0435\u043d\u0438\u043d\u0430",
        "authors": [
            "\u041b\u0435\u0432 \u0422\u043e\u043b\u0441\u0442\u043e\u0439"
        ],
        "description": "A highly rated biography book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/2560652-L.jpg",
        "isbn": None,
        "categories": [
            "Biography"
        ],
        "published_date": "1876",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL77746W",
        "title": "Anne of Green Gables",
        "authors": [
            "Lucy Maud Montgomery"
        ],
        "description": "A highly rated biography book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/14641084-L.jpg",
        "isbn": None,
        "categories": [
            "Biography"
        ],
        "published_date": "1908",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL69178W",
        "title": "Narrative of the life of Frederick Douglass",
        "authors": [
            "Frederick Douglass"
        ],
        "description": "A highly rated biography book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/8247724-L.jpg",
        "isbn": None,
        "categories": [
            "Biography"
        ],
        "published_date": "1845",
        "page_count": 0,
        "curated": True
    },
    {
        "google_books_id": "ol_OL78871W",
        "title": "Twelve years a slave",
        "authors": [
            "Solomon Northup"
        ],
        "description": "A highly rated biography book from the Open Library catalog.",
        "cover_image": "https://covers.openlibrary.org/b/id/14856045-L.jpg",
        "isbn": None,
        "categories": [
            "Biography"
        ],
        "published_date": "1853",
        "page_count": 0,
        "curated": True
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
