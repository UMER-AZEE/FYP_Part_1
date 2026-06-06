from fastapi import APIRouter, Depends, status

from app.api.dependencies.auth import get_current_user
from app.api.dependencies.services import get_llm_integration_service
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.integrations import (
    LLMAvailableModelsRequest,
    LLMAvailableModelsResponse,
    LLMIntegrationCreateRequest,
    LLMIntegrationMutationResponse,
    LLMIntegrationsResponse,
    LLMIntegrationUpdateRequest,
)
from app.services.llm_integration_service import LLMIntegrationService


router = APIRouter(prefix='/api/integrations', tags=['integrations'])


@router.get('', response_model=LLMIntegrationsResponse)
def list_integrations(
    current_user: User = Depends(get_current_user),
    llm_integration_service: LLMIntegrationService = Depends(get_llm_integration_service),
) -> LLMIntegrationsResponse:
    return llm_integration_service.list_integrations(current_user)


@router.post('/available-models', response_model=LLMAvailableModelsResponse)
def available_models(
    payload: LLMAvailableModelsRequest,
    current_user: User = Depends(get_current_user),
    llm_integration_service: LLMIntegrationService = Depends(get_llm_integration_service),
) -> LLMAvailableModelsResponse:
    return llm_integration_service.fetch_available_models(current_user, payload)


@router.post('', response_model=LLMIntegrationMutationResponse, status_code=status.HTTP_201_CREATED)
def create_integration(
    payload: LLMIntegrationCreateRequest,
    current_user: User = Depends(get_current_user),
    llm_integration_service: LLMIntegrationService = Depends(get_llm_integration_service),
) -> LLMIntegrationMutationResponse:
    return llm_integration_service.create_integration(current_user, payload)


@router.put('/{integration_id}', response_model=LLMIntegrationMutationResponse)
def update_integration(
    integration_id: str,
    payload: LLMIntegrationUpdateRequest,
    current_user: User = Depends(get_current_user),
    llm_integration_service: LLMIntegrationService = Depends(get_llm_integration_service),
) -> LLMIntegrationMutationResponse:
    return llm_integration_service.update_integration(current_user, integration_id, payload)


@router.delete('/{integration_id}', response_model=MessageResponse)
def delete_integration(
    integration_id: str,
    current_user: User = Depends(get_current_user),
    llm_integration_service: LLMIntegrationService = Depends(get_llm_integration_service),
) -> MessageResponse:
    response = llm_integration_service.delete_integration(current_user, integration_id)
    return MessageResponse(**response)
