# Llm Integration Repository reference

Source: `backend/app/repositories/llm_integration_repository.py`. This page records callable signatures, direct dependencies, and declared HTTP errors from the implementation.

## `LLMIntegrationRepository.find_by_id`

**Source:** `backend/app/repositories/llm_integration_repository.py`

**Signature:** `find_by_id(self, integration_id: str) -> LLMIntegration | None`

**Key calls:** `self._to_model`, `self.collection.find_one`, `self._object_id`.

## `LLMIntegrationRepository.find_by_company_provider_account_name`

**Source:** `backend/app/repositories/llm_integration_repository.py`

**Signature:** `find_by_company_provider_account_name(self, company_id: str, provider: str, account_name: str) -> LLMIntegration | None`

**Key calls:** `self._to_model`, `self.collection.find_one`, `self._object_id`.

