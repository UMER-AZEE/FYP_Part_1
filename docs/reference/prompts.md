# Prompts reference

Source: `backend/app/api/routes/prompts.py`. This page records callable signatures, direct dependencies, and declared HTTP errors from the implementation.

## `context`

**Source:** `backend/app/api/routes/prompts.py`

**Signature:** `context(current_user: User=Depends(get_current_user), prompt_workspace_service: PromptWorkspaceService=Depends(get_prompt_workspace_service)) -> PromptWorkspaceContextResponse`

**Route:** `GET /context`

**Key calls:** `router.get`, `Depends`, `prompt_workspace_service.get_context`.

## `runs`

**Source:** `backend/app/api/routes/prompts.py`

**Signature:** `runs(limit: int=Query(default=20, ge=1, le=50), current_user: User=Depends(get_current_user), prompt_workspace_service: PromptWorkspaceService=Depends(get_prompt_workspace_service)) -> PromptRunsResponse`

**Route:** `GET /runs`

**Key calls:** `router.get`, `Query`, `Depends`, `prompt_workspace_service.list_runs`.

## `run_prompt`

**Source:** `backend/app/api/routes/prompts.py`

**Signature:** `run_prompt(payload: PromptRunExecuteRequest, current_user: User=Depends(get_current_user), prompt_workspace_service: PromptWorkspaceService=Depends(get_prompt_workspace_service)) -> PromptRunExecutionResponse`

**Route:** `POST /run`

**Key calls:** `router.post`, `Depends`, `prompt_workspace_service.run_prompt`.
