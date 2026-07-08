from fastapi import APIRouter

from app.api import (
    alerts,
    auth,
    deals,
    expenses,
    health,
    households,
    notifications,
    personas,
    receipts,
    sync,
    users,
)

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(households.router, prefix="/households", tags=["households"])
api_router.include_router(expenses.router, prefix="/households", tags=["expenses"])
api_router.include_router(alerts.router, prefix="/households", tags=["spending-alerts"])
api_router.include_router(deals.router, prefix="/households", tags=["deals"])
api_router.include_router(notifications.router, prefix="/households", tags=["notifications"])
api_router.include_router(receipts.household_router, prefix="/households", tags=["receipts"])
api_router.include_router(personas.router, prefix="/personas", tags=["personas"])
api_router.include_router(sync.router, prefix="/sync", tags=["sync"])
api_router.include_router(receipts.router, prefix="/receipts", tags=["receipts"])
