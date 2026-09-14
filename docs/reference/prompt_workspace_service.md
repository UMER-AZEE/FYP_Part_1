# Prompt Workspace Service reference

Source: `backend/app/services/prompt_workspace_service.py`. This page records callable signatures, direct dependencies, and declared HTTP errors from the implementation.

## `now_utc`

**Source:** `backend/app/services/prompt_workspace_service.py`

**Signature:** `now_utc() -> datetime`

**Key calls:** `datetime.now`.

## `PromptWorkspaceService.is_manager`

**Source:** `backend/app/services/prompt_workspace_service.py`

**Signature:** `is_manager(user: User) -> bool`

**Key calls:** `user.role.strip().lower`, `user.role.strip`.

## `PromptWorkspaceService.normalize_text`

**Source:** `backend/app/services/prompt_workspace_service.py`

**Signature:** `normalize_text(value: str, *, field_name: str) -> str`

**Key calls:** `value.strip`.

## `PromptWorkspaceService.normalize_optional_text`

**Source:** `backend/app/services/prompt_workspace_service.py`

**Signature:** `normalize_optional_text(value: str | None) -> str`

**Key calls:** `' '.join`, `(value or '').strip().split`, `(value or '').strip`.

