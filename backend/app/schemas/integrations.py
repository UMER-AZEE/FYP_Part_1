from datetime import datetime

from pydantic import BaseModel, Field


class LLMIntegrationCreateRequest(BaseModel):
    provider: str = Field(min_length=2, max_length=64)
    account_name: str = Field(min_length=2, max_length=160)
    api_key: str = Field(min_length=1, max_length=512)
    policy_name: str = Field(min_length=2, max_length=160)
    models: list[str] = Field(min_length=1, max_length=50)


class LLMIntegrationUpdateRequest(BaseModel):
    provider: str = Field(min_length=2, max_length=64)
    account_name: str = Field(min_length=2, max_length=160)
    api_key: str | None = Field(default=None, max_length=512)
    policy_name: str = Field(min_length=2, max_length=160)
    models: list[str] = Field(min_length=1, max_length=50)


class LLMIntegrationRead(BaseModel):
    id: str
    provider: str
    account_name: str
    masked_api_key: str
    policy_name: str
    models: list[str]
    created_at: datetime
    updated_at: datetime


class LLMIntegrationsResponse(BaseModel):
    integrations: list[LLMIntegrationRead]


class LLMIntegrationMutationResponse(BaseModel):
    integration: LLMIntegrationRead
    message: str


class LLMAvailableModelsRequest(BaseModel):
    provider: str = Field(min_length=2, max_length=64)
    api_key: str | None = Field(default=None, max_length=512)


class LLMAvailableModelsResponse(BaseModel):
    provider: str
    models: list[str]
