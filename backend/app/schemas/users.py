from datetime import datetime

from pydantic import BaseModel, Field


class ManagedUserCreateRequest(BaseModel):
    first_name: str = Field(min_length=2, max_length=120)
    last_name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=255)
    department: str = Field(min_length=2, max_length=160)
    role: str = Field(min_length=2, max_length=120)
    groups: list[str] = Field(default_factory=list, max_length=32)


class ManagedUserUpdateRequest(BaseModel):
    first_name: str = Field(min_length=2, max_length=120)
    last_name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=255)
    department: str = Field(min_length=2, max_length=160)
    role: str = Field(min_length=2, max_length=120)
    groups: list[str] = Field(default_factory=list, max_length=32)


class ManagedUserRead(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: str
    department: str
    role: str
    groups: list[str]
    account_status: str
    is_email_verified: bool
    created_at: datetime


class ManagedUsersResponse(BaseModel):
    users: list[ManagedUserRead]


class ManagedUserMutationResponse(BaseModel):
    user: ManagedUserRead
    message: str
