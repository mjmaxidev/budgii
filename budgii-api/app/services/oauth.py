import httpx
from jose import jwk, jwt
from jose.exceptions import JWTError

from app.config import Settings


class OAuthVerificationError(Exception):
    pass


async def verify_google_id_token(id_token: str, settings: Settings) -> tuple[str, str, str | None]:
    if not settings.google_client_id:
        raise OAuthVerificationError("Google Sign In is not configured")

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": id_token},
        )
    if response.status_code != 200:
        raise OAuthVerificationError("Invalid Google token")

    payload = response.json()
    if payload.get("aud") != settings.google_client_id:
        raise OAuthVerificationError("Google token audience mismatch")

    email = payload.get("email")
    if not email:
        raise OAuthVerificationError("Google token missing email")

    name = payload.get("name") or email.split("@")[0]
    picture = payload.get("picture")
    return str(email).lower(), name, picture


async def verify_apple_id_token(id_token: str, settings: Settings) -> tuple[str, str, str | None]:
    if not settings.apple_client_id:
        raise OAuthVerificationError("Apple Sign In is not configured")

    try:
        header = jwt.get_unverified_header(id_token)
    except JWTError as exc:
        raise OAuthVerificationError("Invalid Apple token") from exc

    kid = header.get("kid")
    if not kid:
        raise OAuthVerificationError("Apple token missing key id")

    async with httpx.AsyncClient(timeout=10) as client:
        keys_response = await client.get("https://appleid.apple.com/auth/keys")
    if keys_response.status_code != 200:
        raise OAuthVerificationError("Unable to fetch Apple public keys")

    keys = keys_response.json().get("keys", [])
    jwk_data = next((key for key in keys if key.get("kid") == kid), None)
    if not jwk_data:
        raise OAuthVerificationError("Apple public key not found")

    try:
        public_key = jwk.construct(jwk_data)
        payload = jwt.decode(
            id_token,
            public_key,
            algorithms=[header.get("alg", "RS256")],
            audience=settings.apple_client_id,
            issuer="https://appleid.apple.com",
        )
    except JWTError as exc:
        raise OAuthVerificationError("Invalid Apple token") from exc

    email = payload.get("email")
    if not email:
        raise OAuthVerificationError("Apple token missing email")

    name = email.split("@")[0]
    return str(email).lower(), name, None
