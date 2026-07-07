from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.schemas.access import AccessRole, EditorLevel
from app.schemas.persona import PersonaResponse


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
    id: str | None = None
    code: str
    invite_url: str
    expires_at: datetime | None = None
    access_role: AccessRole
    editor_level: EditorLevel | None = None
    sent_to_contact: str | None = None
    sent_at: datetime | None = None
    used_at: datetime | None = None
    used_by: str | None = None


class InviteListResponse(BaseModel):
    invites: list[InviteResponse]


class HouseholdMemberResponse(BaseModel):
    user_id: str
    persona_id: str | None = None
    name: str
    email: str
    avatar: str | None = None
    access_role: AccessRole
    editor_level: EditorLevel | None = None
    is_account_holder: bool = False
    joined_at: datetime


class HouseholdMemberListResponse(BaseModel):
    members: list[HouseholdMemberResponse]


class UpdateMemberRequest(BaseModel):
    access_role: AccessRole
    editor_level: EditorLevel | None = None


class HouseholdBootstrapResponse(BaseModel):
    household: HouseholdResponse
    members: list[HouseholdMemberResponse]
    personas: list[PersonaResponse]
    invites: list[InviteResponse]
    server_time: datetime
    revision: int
    snapshot: dict[str, Any]
