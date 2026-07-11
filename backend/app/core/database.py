from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from redis import asyncio as aioredis
from app.core.config import settings


class Database:
    """Manages MongoDB and Redis connections."""

    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None
    redis: aioredis.Redis = None


db_instance = Database()


async def connect_to_mongo():
    """Create MongoDB connection on app startup."""
    db_instance.client = AsyncIOMotorClient(settings.MONGODB_URI)
    db_instance.db = db_instance.client[settings.DB_NAME]

    # Create indexes
    await db_instance.db.users.create_index("email", unique=True)
    await db_instance.db.users.create_index("username", unique=True)
    await db_instance.db.books.create_index("google_books_id", unique=True)
    await db_instance.db.books.create_index(
        [("title", "text"), ("authors", "text")],
        name="book_text_search"
    )
    await db_instance.db.reviews.create_index(
        [("user_id", 1), ("book_id", 1)],
        unique=True
    )
    await db_instance.db.reading_lists.create_index("user_id")

    print(f"✅ Connected to MongoDB: {settings.DB_NAME}")


async def close_mongo_connection():
    """Close MongoDB connection on app shutdown."""
    if db_instance.client:
        db_instance.client.close()
        print("❌ MongoDB connection closed")


async def connect_to_redis():
    """Create Redis connection on app startup."""
    db_instance.redis = aioredis.from_url(
        settings.REDIS_URL,
        encoding="utf-8",
        decode_responses=True
    )
    print("✅ Connected to Redis")


async def close_redis_connection():
    """Close Redis connection on app shutdown."""
    if db_instance.redis:
        await db_instance.redis.close()
        print("❌ Redis connection closed")


def get_db() -> AsyncIOMotorDatabase:
    """Dependency: Get the MongoDB database instance."""
    return db_instance.db


def get_redis() -> aioredis.Redis:
    """Dependency: Get the Redis instance."""
    return db_instance.redis
