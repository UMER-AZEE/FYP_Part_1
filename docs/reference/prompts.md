# Prompts reference

Source: `backend/app/api/routes/prompts.py`. This page records callable signatures, direct dependencies, and declared HTTP errors from the implementation.

## `context`

**Source:** `backend/app/api/routes/prompts.py`

**Signature:** `context(current_user: User=Depends(get_current_user), prompt_workspace_service: PromptWorkspaceService=Depends(get_prompt_workspace_service)) -> PromptWorkspaceContextResponse`

**Route:** `GET /context`

**Key calls:** `router.get`, `Depends`, `prompt_workspace_service.get_context`.

