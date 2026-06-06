from dataclasses import dataclass
from datetime import datetime

from app.models.company import Company


@dataclass(slots=True)
class LLMIntegration:
    id: str
    company: Company
    provider: str
    account_name: str
    api_key: str
    policy_name: str
    models: list[str]
    created_at: datetime
    updated_at: datetime
