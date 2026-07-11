from datetime import datetime, timezone
from bson import ObjectId
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token
from app.core.config import settings


async def register_user(db, user_data: dict) -> dict:
    """Register a new user and create default reading lists."""
    # Check if email or username already exists
    existing_email = await db.users.find_one({"email": user_data["email"]})
    if existing_email:
        return {"error": "Email already registered"}

    existing_username = await db.users.find_one({"username": user_data["username"]})
    if existing_username:
        return {"error": "Username already taken"}

    # Create user document
    user_doc = {
        "username": user_data["username"],
        "email": user_data["email"],
        "hashed_password": hash_password(user_data["password"]),
        "avatar_url": None,
        "bio": None,
        "favorite_genres": [],
        "created_at": datetime.now(timezone.utc),
    }

    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    # Create default reading lists
    default_lists = ["Want to Read", "Currently Reading", "Finished"]
    for list_name in default_lists:
        await db.reading_lists.insert_one({
            "user_id": ObjectId(user_id),
            "name": list_name,
            "books": [],
            "is_default": True,
            "created_at": datetime.now(timezone.utc),
        })

    # Generate tokens
    tokens = _generate_tokens(user_id)
    return {
        "user": {
            "id": user_id,
            "username": user_doc["username"],
            "email": user_doc["email"],
        },
        **tokens,
    }


async def login_user(db, email: str, password: str) -> dict:
    """Authenticate user and return tokens."""
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(password, user["hashed_password"]):
        return {"error": "Invalid email or password"}

    user_id = str(user["_id"])
    tokens = _generate_tokens(user_id)
    return {
        "user": {
            "id": user_id,
            "username": user["username"],
            "email": user["email"],
        },
        **tokens,
    }


async def refresh_tokens(db, redis, refresh_token: str) -> dict:
    """Validate refresh token and issue new token pair."""
    from app.core.security import decode_token

    payload = decode_token(refresh_token)
    if payload.get("type") != "refresh":
        return {"error": "Invalid token type"}

    user_id = payload.get("sub")
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return {"error": "User not found"}

    # Blacklist old refresh token
    if redis:
        await redis.set(
            f"blacklist:{refresh_token}",
            "1",
            ex=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        )

    tokens = _generate_tokens(user_id)
    return tokens


async def logout_user(redis, access_token: str):
    """Blacklist the current access token."""
    if redis:
        await redis.set(
            f"blacklist:{access_token}",
            "1",
            ex=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )


def _generate_tokens(user_id: str) -> dict:
    """Generate access + refresh token pair."""
    return {
        "access_token": create_access_token({"sub": user_id}),
        "refresh_token": create_refresh_token({"sub": user_id}),
        "token_type": "bearer",
    }
