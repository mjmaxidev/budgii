from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str = Field(default="", max_length=120)


class OAuthLoginRequest(BaseModel):
    id_token: str = Field(min_length=10)


class EmailLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    avatar: str | None = None
    auth_provider: str
    email_verified_at: str | None = None


class UpdateUserRequest(BaseModel):
    email: EmailStr | None = None
    name: str | None = Field(default=None, max_length=120)
    avatar: str | None = Field(default=None, max_length=512)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=8)
    new_password: str = Field(min_length=8)


class EmailActionRequest(BaseModel):
    email: EmailStr


class TokenActionRequest(BaseModel):
    token: str = Field(min_length=16)


class PasswordResetConfirmRequest(TokenActionRequest):
    new_password: str = Field(min_length=8)


class AuthActionResponse(BaseModel):
    ok: bool = True
