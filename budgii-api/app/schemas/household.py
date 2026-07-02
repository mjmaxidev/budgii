from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.access import AccessRole, EditorLevel


class MembershipResponse(BaseModel):
    access_role: AccessRole
    editor_level: EditorLevel | None = None
    is_account_holder: bool = False


class CreateHouseholdRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)


class JoinHouseholdRequest(BaseModel):
    code: str = Field(min_length=4, max_length=12)


class SendInviteRequest(BaseModel):
    contact: str = Field(min_length=3, max_length=120)
    household_id: str | None = None
    access_role: AccessRole = "editor"
    editor_level: EditorLevel | None = "standard"


class HouseholdResponse(BaseModel):
    id: str
    name: str
    access_role: AccessRole
    editor_level: EditorLevel | None = None
    is_account_holder: bool = False


class HouseholdListResponse(BaseModel):
    households: list[HouseholdResponse]


class InviteResponse(BaseModel):
    code: str
    invite_url: str
    expires_at: datetime | None = None
    access_role: AccessRole
    editor_level: EditorLevel | None = None
