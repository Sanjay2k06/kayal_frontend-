from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import get_settings

client: AsyncIOMotorClient | None = None
db: AsyncIOMotorDatabase | None = None


async def connect_db() -> None:
    global client, db
    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client[settings.mongodb_db]

    await db.users.create_index("email", unique=True)
    await db.users.create_index("created_at")

    await db.bookmarks.create_index([("user_id", 1), ("scheme_id", 1)], unique=True)
    await db.bookmarks.create_index("user_id")

    await db.chat_history.create_index([("user_id", 1), ("created_at", -1)])
    await db.whatsapp_sessions.create_index("phone", unique=True)
    await db.whatsapp_sessions.create_index("updated_at")
    await db.user_checklist.create_index([("user_id", 1), ("item_id", 1)], unique=True)
    await db.user_checklist.create_index("updated_at")

    await db.user_sessions.create_index("jti", unique=True)
    await db.user_sessions.create_index("user_id")
    await db.user_sessions.create_index("expires_at", expireAfterSeconds=0)

    await db.revoked_tokens.create_index("jti", unique=True)
    await db.revoked_tokens.create_index("expires_at", expireAfterSeconds=0)

    await db.schemes.create_index("scheme_name")
    await db.schemes.create_index("category")
    await db.schemes.create_index("state")
    await db.schemes.create_index("approval_status")
    await db.schemes.create_index("source_last_verified_at")
    await db.schemes.create_index("duplicate_of")
    await db.schemes.create_index("link_status")
    await db.schemes.create_index([("scheme_name", "text"), ("description", "text"), ("eligibility", "text")])

    await db.scheme_change_requests.create_index([("status", 1), ("requested_at", -1)])
    await db.scheme_change_requests.create_index("scheme_id")

    await db.scheme_revision_history.create_index([("scheme_id", 1), ("created_at", -1)])


async def close_db() -> None:
    global client
    if client:
        client.close()


def get_db() -> AsyncIOMotorDatabase:
    if db is None:
        raise RuntimeError("Database is not initialized")
    return db


def utcnow() -> datetime:
    return datetime.now(timezone.utc)
