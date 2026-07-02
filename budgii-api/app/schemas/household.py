from datetime import datetime

from pydantic import BaseModel, Field


class CreateHouseholdRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)


class JoinHouseholdRequest(BaseModel):
    code: str = Field(min_length=4, max_length=12)


class SendInviteRequest(BaseModel):
    contact: str = Field(min_length=3, max_length=120)
    household_id: str | None = None


class HouseholdResponse(BaseModel):
    id: str
    name: str
    role: str


class HouseholdListResponse(BaseModel):
    households: list[HouseholdResponse]


class InviteResponse(BaseModel):
    code: str
    invite_url: str
    expires_at: datetime | None = None
