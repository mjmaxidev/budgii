from pydantic import BaseModel, Field


class PersonaResponse(BaseModel):
    id: str
    name: str
    relationship: str
    avatar: str
    active: bool
    is_default: bool
    has_app_access: bool = False
    access_role: str | None = None
    editor_level: str | None = None


class PersonaListResponse(BaseModel):
    personas: list[PersonaResponse]


class CreatePersonaRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    relationship: str = Field(default="Family", max_length=80)
    avatar: str = Field(default="🧑", max_length=16)
    active: bool = True
    is_default: bool = False


class UpdatePersonaRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    relationship: str | None = Field(default=None, max_length=80)
    avatar: str | None = Field(default=None, max_length=16)
    active: bool | None = None
    is_default: bool | None = None
