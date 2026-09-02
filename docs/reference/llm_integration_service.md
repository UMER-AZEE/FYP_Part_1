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

## `LLMIntegrationService.normalize_account_name`

**Source:** `backend/app/services/llm_integration_service.py`

**Signature:** `normalize_account_name(account_name: str) -> str`

**Key calls:** `' '.join`, `account_name.strip().split`, `account_name.strip`.

**Explicit HTTP errors:** "Account name is required".

## `LLMIntegrationService.normalize_policy_name`

**Source:** `backend/app/services/llm_integration_service.py`

**Signature:** `normalize_policy_name(policy_name: str) -> str`

**Key calls:** `' '.join`, `policy_name.strip().split`, `policy_name.strip`.

**Explicit HTTP errors:** "Policy is required".

## `LLMIntegrationService.normalize_api_key`

**Source:** `backend/app/services/llm_integration_service.py`

**Signature:** `normalize_api_key(api_key: str | None, *, required: bool) -> str | None`

**Key calls:** `api_key.strip`.

**Explicit HTTP errors:** "API key is required".

## `LLMIntegrationService.normalize_remote_models`

**Source:** `backend/app/services/llm_integration_service.py`

**Signature:** `normalize_remote_models(models: list[str]) -> list[str]`

**Key calls:** `' '.join`, `deduped.setdefault`, `deduped.values`, `model.strip().split`, `normalized.lower`, `model.strip`.

## `LLMIntegrationService.normalize_models`

**Source:** `backend/app/services/llm_integration_service.py`

**Signature:** `normalize_models(models: list[str]) -> list[str]`

**Key calls:** `' '.join`, `normalized.lower`, `seen.add`, `normalized_models.append`, `model.strip().split`, `model.strip`.

**Explicit HTTP errors:** "Select at least one model".

## `LLMIntegrationService.mask_api_key`

**Source:** `backend/app/services/llm_integration_service.py`

**Signature:** `mask_api_key(api_key: str) -> str`

**Returns expression:** `f"{api_key[:4]}{'*' * max(len(api_key) - 8, 4)}{api_key[-4:]}"`.

## `LLMIntegrationService.read_json_response`

**Source:** `backend/app/services/llm_integration_service.py`

**Signature:** `read_json_response(request: Request) -> dict`

**Key calls:** `json.loads`, `urlopen`, `response.read().decode`, `payload.get('error', {}).get`, `payload.get`, `response.read`, `exc.read().decode`, `exc.read`.

**Explicit HTTP errors:** "Provider returned an invalid response while loading models".

## `LLMIntegrationService.fetch_openai_compatible_models`

**Source:** `backend/app/services/llm_integration_service.py`

**Signature:** `fetch_openai_compatible_models(self, provider: str, api_key: str) -> list[str]`

**Key calls:** `Request`, `self.read_json_response`, `self.normalize_remote_models`, `item.get('id', '').strip`, `payload.get`, `item.get`.

## `LLMIntegrationService.fetch_gemini_models`

**Source:** `backend/app/services/llm_integration_service.py`

**Signature:** `fetch_gemini_models(self, api_key: str) -> list[str]`

**Key calls:** `Request`, `self.read_json_response`, `payload.get`, `self.normalize_remote_models`, `urlencode`, `item.get`, `item.get('name', '').removeprefix`, `models.append`.

## `LLMIntegrationService.fetch_anthropic_models`

**Source:** `backend/app/services/llm_integration_service.py`

**Signature:** `fetch_anthropic_models(self, api_key: str) -> list[str]`

**Key calls:** `Request`, `self.read_json_response`, `self.normalize_remote_models`, `item.get('id', '').strip`, `payload.get`, `item.get`.

## `LLMIntegrationService.fetch_ollama_models`

**Source:** `backend/app/services/llm_integration_service.py`

**Signature:** `fetch_ollama_models(self) -> list[str]`

**Key calls:** `Request`, `self.read_json_response`, `self.normalize_remote_models`, `(item.get('model') or item.get('name') or '').strip`, `payload.get`, `item.get`.

