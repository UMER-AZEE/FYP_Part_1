# Llm Integration Service reference

Source: `backend/app/services/llm_integration_service.py`. This page records callable signatures, direct dependencies, and declared HTTP errors from the implementation.

## `now_utc`

**Source:** `backend/app/services/llm_integration_service.py`

**Signature:** `now_utc() -> datetime`

**Key calls:** `datetime.now`.

## `LLMIntegrationService.ensure_manager`

**Source:** `backend/app/services/llm_integration_service.py`

**Signature:** `ensure_manager(current_user: User) -> None`

**Key calls:** `current_user.role.strip().lower`, `current_user.role.strip`.

**Explicit HTTP errors:** "Only managers can manage organization integrations".

## `LLMIntegrationService.normalize_provider`

**Source:** `backend/app/services/llm_integration_service.py`

**Signature:** `normalize_provider(provider: str) -> str`

**Key calls:** `provider.strip().lower`, `provider.strip`.

**Explicit HTTP errors:** "Select a supported provider".

