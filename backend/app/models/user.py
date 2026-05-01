from dataclasses import dataclass
from datetime import datetime

from app.models.company import Company


@dataclass(slots=True)
class User:
    id: str
    full_name: str
    first_name: str
    last_name: str
    email: str
    password_hash: str
    company: Company
    is_email_verified: bool
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
