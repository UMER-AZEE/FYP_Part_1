# Prompt Run Repository reference

Source: `backend/app/repositories/prompt_run_repository.py`. This page records callable signatures, direct dependencies, and declared HTTP errors from the implementation.

## `PromptRunRepository.list_by_company_id`

**Source:** `backend/app/repositories/prompt_run_repository.py`

**Signature:** `list_by_company_id(self, company_id: str, limit: int=20) -> list[PromptRun]`

**Key calls:** `self.collection.find`, `self._sorted_runs`, `self._object_id`.

## `PromptRunRepository.list_by_user_id`

**Source:** `backend/app/repositories/prompt_run_repository.py`

**Signature:** `list_by_user_id(self, user_id: str, limit: int=20) -> list[PromptRun]`

**Key calls:** `self.collection.find`, `self._sorted_runs`, `self._object_id`.

## `PromptRunRepository.create`

**Source:** `backend/app/repositories/prompt_run_repository.py`

**Signature:** `create(self, run: PromptRun) -> PromptRun`

**Key calls:** `self.collection.insert_one`, `self._to_document`.
