from fastapi import APIRouter, HTTPException, status

from app.schemas.auth import EmailLoginRequest, OAuthLoginRequest, RefreshRequest, TokenResponse

router = APIRouter()


@router.post("/apple", response_model=TokenResponse, status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def login_apple(_body: OAuthLoginRequest) -> TokenResponse:
    raise HTTPException(status_code=501, detail="Apple Sign In not implemented yet")


@router.post("/google", response_model=TokenResponse, status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def login_google(_body: OAuthLoginRequest) -> TokenResponse:
    raise HTTPException(status_code=501, detail="Google Sign In not implemented yet")


@router.post("/email", response_model=TokenResponse, status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def login_email(_body: EmailLoginRequest) -> TokenResponse:
    raise HTTPException(status_code=501, detail="Email login not implemented yet")


@router.post("/refresh", response_model=TokenResponse, status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def refresh_token(_body: RefreshRequest) -> TokenResponse:
    raise HTTPException(status_code=501, detail="Token refresh not implemented yet")
