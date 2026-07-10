import time
from dataclasses import dataclass, field

from fastapi import FastAPI, Request, Response, status
from fastapi.responses import JSONResponse

from app.config import Settings


@dataclass
class RateLimitBucket:
    reset_at: float
    count: int = 0


@dataclass
class InMemoryRateLimiter:
    limit: int
    window_seconds: int
    buckets: dict[str, RateLimitBucket] = field(default_factory=dict)

    def hit(self, key: str, now: float | None = None) -> tuple[bool, int]:
        current_time = now if now is not None else time.monotonic()
        bucket = self.buckets.get(key)
        if bucket is None or bucket.reset_at <= current_time:
            self.buckets[key] = RateLimitBucket(reset_at=current_time + self.window_seconds, count=1)
            return True, self.window_seconds

        bucket.count += 1
        retry_after = max(1, int(bucket.reset_at - current_time))
        return bucket.count <= self.limit, retry_after


def add_auth_rate_limiting(app: FastAPI, settings: Settings) -> None:
    if not settings.auth_rate_limit_enabled:
        return

    limiter = InMemoryRateLimiter(
        limit=settings.auth_rate_limit_requests,
        window_seconds=settings.auth_rate_limit_window_seconds,
    )
    auth_prefix = f"{settings.api_prefix.rstrip('/')}/auth/"

    @app.middleware("http")
    async def auth_rate_limit_middleware(request: Request, call_next) -> Response:
        if request.method == "POST" and request.url.path.startswith(auth_prefix):
            key = f"{client_key(request)}:{request.url.path}"
            allowed, retry_after = limiter.hit(key)
            if not allowed:
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={"detail": "Too many authentication attempts. Please try again later."},
                    headers={"Retry-After": str(retry_after)},
                )

        return await call_next(request)


def client_key(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",", 1)[0].strip()
    return request.client.host if request.client else "unknown"
