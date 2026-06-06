from fastapi import APIRouter, Depends, Query

from app.api.dependencies.auth import get_current_user
from app.api.dependencies.services import get_prompt_workspace_service
from app.models.user import User
from app.schemas.prompts import (
    PromptRunExecutionResponse,
    PromptRunExecuteRequest,
    PromptRunsResponse,
    PromptWorkspaceContextResponse,
)
from app.services.prompt_workspace_service import PromptWorkspaceService


router = APIRouter(prefix='/api/prompt-workspace', tags=['prompt-workspace'])


@router.get('/context', response_model=PromptWorkspaceContextResponse)
def context(
    current_user: User = Depends(get_current_user),
    prompt_workspace_service: PromptWorkspaceService = Depends(get_prompt_workspace_service),
) -> PromptWorkspaceContextResponse:
    return prompt_workspace_service.get_context(current_user)


@router.get('/runs', response_model=PromptRunsResponse)
def runs(
    limit: int = Query(default=20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    prompt_workspace_service: PromptWorkspaceService = Depends(get_prompt_workspace_service),
) -> PromptRunsResponse:
    return prompt_workspace_service.list_runs(current_user, limit)


@router.post('/run', response_model=PromptRunExecutionResponse)
def run_prompt(
    payload: PromptRunExecuteRequest,
    current_user: User = Depends(get_current_user),
    prompt_workspace_service: PromptWorkspaceService = Depends(get_prompt_workspace_service),
) -> PromptRunExecutionResponse:
    return prompt_workspace_service.run_prompt(current_user, payload)
