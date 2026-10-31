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

## `LLMIntegrationRepository.list_by_company_id`

**Source:** `backend/app/repositories/llm_integration_repository.py`

**Signature:** `list_by_company_id(self, company_id: str) -> list[LLMIntegration]`

**Key calls:** `self.collection.find`, `self._to_model`, `self._object_id`.

## `LLMIntegrationRepository.create`

**Source:** `backend/app/repositories/llm_integration_repository.py`

**Signature:** `create(self, integration: LLMIntegration) -> LLMIntegration`

**Key calls:** `self.collection.insert_one`, `self._to_document`.

## `LLMIntegrationRepository.save`

**Source:** `backend/app/repositories/llm_integration_repository.py`

**Signature:** `save(self, integration: LLMIntegration) -> LLMIntegration`

**Key calls:** `self.collection.update_one`, `self._object_id`, `self._to_document`.

## `LLMIntegrationRepository.delete`

**Source:** `backend/app/repositories/llm_integration_repository.py`

**Signature:** `delete(self, integration_id: str) -> bool`

**Key calls:** `self.collection.delete_one`, `self._object_id`.

