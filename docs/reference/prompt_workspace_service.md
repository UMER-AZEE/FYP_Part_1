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

## `PromptWorkspaceService.normalize_groups`

**Source:** `backend/app/services/prompt_workspace_service.py`

**Signature:** `normalize_groups(groups: list[str]) -> list[str]`

**Key calls:** `' '.join`, `normalized.lower`, `seen.add`, `normalized_groups.append`, `group.strip().split`, `group.strip`.

## `PromptWorkspaceService.build_messages`

**Source:** `backend/app/services/prompt_workspace_service.py`

**Signature:** `build_messages(prompt: str, system_prompt: str) -> list[dict[str, str]]`

**Key calls:** `messages.append`.

## `PromptWorkspaceService.read_json_response`

**Source:** `backend/app/services/prompt_workspace_service.py`

**Signature:** `read_json_response(request: Request) -> dict`

**Key calls:** `json.loads`, `urlopen`, `response.read().decode`, `PromptProviderError`, `payload.get('error', {}).get`, `payload.get`, `str(detail).strip`, `response.read`.

## `PromptWorkspaceService.extract_openai_text`

**Source:** `backend/app/services/prompt_workspace_service.py`

**Signature:** `extract_openai_text(payload: dict) -> str`

**Key calls:** `payload.get`, `choices[0].get`, `message.get`, `content.strip`, `'\n'.join`, `item.get('text', '').strip`, `item.get`.

## `PromptWorkspaceService.extract_anthropic_text`

**Source:** `backend/app/services/prompt_workspace_service.py`

**Signature:** `extract_anthropic_text(payload: dict) -> str`

**Key calls:** `payload.get`, `'\n'.join`, `item.get('text', '').strip`, `item.get`.

## `PromptWorkspaceService.extract_gemini_text`

**Source:** `backend/app/services/prompt_workspace_service.py`

**Signature:** `extract_gemini_text(payload: dict) -> str`

**Key calls:** `payload.get`, `candidates[0].get`, `content.get`, `'\n'.join`, `item.get('text', '').strip`, `item.get`.

