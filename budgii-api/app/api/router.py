from fastapi import APIRouter

from app.api import auth, health, households, receipts, sync, users

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(households.router, prefix="/households", tags=["households"])
api_router.include_router(sync.router, prefix="/sync", tags=["sync"])
api_router.include_router(receipts.router, prefix="/receipts", tags=["receipts"])
