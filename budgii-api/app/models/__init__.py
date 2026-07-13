import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.access import AccessRole, EditorLevel


def new_uuid() -> uuid.UUID:
    return uuid.uuid4()


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    name: Mapped[str] = mapped_column(String(120), default="")
    avatar: Mapped[str | None] = mapped_column(String(512), nullable=True)
    auth_provider: Mapped[str] = mapped_column(String(32), default="email")
    external_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    memberships: Mapped[list["HouseholdMembership"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    auth_action_tokens: Mapped[list["AuthActionToken"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    user_agent: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(64), nullable=True)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped[User] = relationship(back_populates="refresh_tokens")


class AuthActionToken(Base):
    __tablename__ = "auth_action_tokens"
    __table_args__ = (UniqueConstraint("token_hash", name="uq_auth_action_token_hash"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    token_hash: Mapped[str] = mapped_column(String(64), index=True)
    purpose: Mapped[str] = mapped_column(String(32), index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped[User] = relationship(back_populates="auth_action_tokens")


class Household(Base):
    __tablename__ = "households"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(String(80))
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    memberships: Mapped[list["HouseholdMembership"]] = relationship(back_populates="household")
    personas: Mapped[list["HouseholdPersona"]] = relationship(back_populates="household")
    invites: Mapped[list["HouseholdInvite"]] = relationship(back_populates="household")
    expenses: Mapped[list["Expense"]] = relationship(back_populates="household")
    receipts: Mapped[list["Receipt"]] = relationship(back_populates="household")
    sync_meta: Mapped["HouseholdSyncMeta | None"] = relationship(back_populates="household", uselist=False)
    sync_chunks: Mapped[list["HouseholdSyncChunk"]] = relationship(back_populates="household")


class HouseholdPersona(Base):
    """Tag-only or display persona for expense assignment — may link to an app user via membership."""

    __tablename__ = "household_personas"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    household_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("households.id", ondelete="CASCADE")
    )
    name: Mapped[str] = mapped_column(String(80))
    relation_label: Mapped[str] = mapped_column("relationship", String(80), default="Family")
    avatar: Mapped[str] = mapped_column(String(16), default="🧑")
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    household: Mapped[Household] = relationship(back_populates="personas")
    membership: Mapped["HouseholdMembership | None"] = relationship(back_populates="persona", uselist=False)
    expenses: Mapped[list["Expense"]] = relationship(back_populates="persona")
    receipt_items: Mapped[list["ReceiptItem"]] = relationship(back_populates="persona")


class HouseholdMembership(Base):
    __tablename__ = "household_memberships"
    __table_args__ = (UniqueConstraint("household_id", "user_id", name="uq_household_user"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    household_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("households.id", ondelete="CASCADE")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    persona_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("household_personas.id", ondelete="SET NULL"), nullable=True
    )
    access_role: Mapped[AccessRole] = mapped_column(String(16), default="viewer")
    editor_level: Mapped[EditorLevel | None] = mapped_column(String(16), nullable=True)
    is_account_holder: Mapped[bool] = mapped_column(Boolean, default=False)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    household: Mapped[Household] = relationship(back_populates="memberships")
    user: Mapped[User] = relationship(back_populates="memberships")
    persona: Mapped[HouseholdPersona | None] = relationship(back_populates="membership")


class HouseholdInvite(Base):
    __tablename__ = "household_invites"
    __table_args__ = (UniqueConstraint("code", name="uq_invite_code"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    household_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("households.id", ondelete="CASCADE")
    )
    code: Mapped[str] = mapped_column(String(12), index=True)
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    access_role: Mapped[AccessRole] = mapped_column(String(16), default="editor")
    editor_level: Mapped[EditorLevel | None] = mapped_column(String(16), nullable=True)
    sent_to_contact: Mapped[str | None] = mapped_column(String(320), nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    used_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    household: Mapped[Household] = relationship(back_populates="invites")


class HouseholdSyncMeta(Base):
    __tablename__ = "household_sync_meta"

    household_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("households.id", ondelete="CASCADE"), primary_key=True
    )
    revision: Mapped[int] = mapped_column(Integer, default=1)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    household: Mapped[Household] = relationship(back_populates="sync_meta")


class HouseholdSyncChunk(Base):
    __tablename__ = "household_sync_chunks"

    household_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("households.id", ondelete="CASCADE"), primary_key=True
    )
    chunk_key: Mapped[str] = mapped_column(String(64), primary_key=True)
    data: Mapped[Any] = mapped_column(JSONB, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    household: Mapped[Household] = relationship(back_populates="sync_chunks")


class NotificationReadState(Base):
    __tablename__ = "notification_read_states"
    __table_args__ = (
        UniqueConstraint("household_id", "user_id", "notification_id", name="uq_notification_read_state"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    household_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("households.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    notification_id: Mapped[str] = mapped_column(String(160), index=True)
    read_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class NotificationDeviceToken(Base):
    __tablename__ = "notification_device_tokens"
    __table_args__ = (
        UniqueConstraint("household_id", "user_id", "token", name="uq_notification_device_token"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    household_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("households.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    token: Mapped[str] = mapped_column(String(512), index=True)
    platform: Mapped[str] = mapped_column(String(32))
    device_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    app_version: Mapped[str | None] = mapped_column(String(64), nullable=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class NotificationPushDelivery(Base):
    __tablename__ = "notification_push_deliveries"
    __table_args__ = (
        UniqueConstraint(
            "device_token_id",
            "notification_id",
            name="uq_notification_push_delivery_token_notification",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    household_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("households.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    device_token_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("notification_device_tokens.id", ondelete="CASCADE"), index=True
    )
    notification_id: Mapped[str] = mapped_column(String(160), index=True)
    notification_type: Mapped[str] = mapped_column(String(64))
    provider: Mapped[str] = mapped_column(String(32), default="log")
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class BackgroundJobRun(Base):
    __tablename__ = "background_job_runs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    job_name: Mapped[str] = mapped_column(String(64), index=True)
    status: Mapped[str] = mapped_column(String(16), index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    finished_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    summary: Mapped[Any | None] = mapped_column(JSONB, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    household_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("households.id", ondelete="CASCADE")
    )
    persona_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("household_personas.id", ondelete="SET NULL"), nullable=True
    )
    category_id: Mapped[str] = mapped_column(String(80))
    amount: Mapped[float] = mapped_column(Numeric(12, 2))
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    merchant: Mapped[str] = mapped_column(String(160), default="")
    tag_ids: Mapped[Any] = mapped_column(JSONB, default=list)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    receipt_upload_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("receipt_uploads.id", ondelete="SET NULL"), nullable=True
    )
    receipt_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("receipts.id", ondelete="SET NULL"), nullable=True
    )
    source: Mapped[str] = mapped_column(String(32), default="manual")
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    household: Mapped[Household] = relationship(back_populates="expenses")
    persona: Mapped[HouseholdPersona | None] = relationship(back_populates="expenses")
    receipt: Mapped["Receipt | None"] = relationship(back_populates="expenses")


class ReceiptUpload(Base):
    __tablename__ = "receipt_uploads"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    household_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("households.id", ondelete="CASCADE")
    )
    uploaded_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    filename: Mapped[str] = mapped_column(String(255))
    content_type: Mapped[str] = mapped_column(String(128))
    storage_path: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(32), default="uploaded")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    receipt: Mapped["Receipt | None"] = relationship(back_populates="upload", uselist=False)


class Receipt(Base):
    __tablename__ = "receipts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    household_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("households.id", ondelete="CASCADE")
    )
    upload_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("receipt_uploads.id", ondelete="SET NULL"), nullable=True
    )
    merchant: Mapped[str] = mapped_column(String(160), default="")
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    total: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    ocr_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="uploaded")
    analysis_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    household: Mapped[Household] = relationship(back_populates="receipts")
    upload: Mapped[ReceiptUpload | None] = relationship(back_populates="receipt")
    items: Mapped[list["ReceiptItem"]] = relationship(back_populates="receipt", cascade="all, delete-orphan")
    expenses: Mapped[list[Expense]] = relationship(back_populates="receipt")


class ReceiptItem(Base):
    __tablename__ = "receipt_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    receipt_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("receipts.id", ondelete="CASCADE")
    )
    household_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("households.id", ondelete="CASCADE")
    )
    persona_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("household_personas.id", ondelete="SET NULL"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(160))
    amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    category_id: Mapped[str] = mapped_column(String(80))
    tag_ids: Mapped[Any] = mapped_column(JSONB, default=list)
    ai_confidence: Mapped[float] = mapped_column(Numeric(5, 4), default=0)
    manually_edited: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    receipt: Mapped[Receipt] = relationship(back_populates="items")
    persona: Mapped[HouseholdPersona | None] = relationship(back_populates="receipt_items")
