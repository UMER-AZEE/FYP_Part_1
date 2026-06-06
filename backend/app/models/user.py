from dataclasses import dataclass, field
from datetime import datetime

from app.models.company import Company


@dataclass(slots=True)
class User:
    id: str
    full_name: str
    first_name: str
    last_name: str
    email: str
    department: str
    role: str
    password_hash: str | None
    company: Company
    is_email_verified: bool
    invitation_token_hash: str | None
    invitation_expires_at: datetime | None
    invited_at: datetime | None
    email_verification_code_hash: str | None
    email_verification_expires_at: datetime | None
    email_verification_sent_at: datetime | None
    email_verification_delivery_mode: str | None
    email_verification_attempts: int
    password_reset_code_hash: str | None
    password_reset_expires_at: datetime | None
    password_reset_sent_at: datetime | None
    password_reset_delivery_mode: str | None
    password_reset_attempts: int
    created_at: datetime
    groups: list[str] = field(default_factory=list)

    @property
    def account_status(self) -> str:
        if self.password_hash and self.is_email_verified:
            return 'active'
        if self.invitation_token_hash:
            return 'invited'
        return 'pending'
