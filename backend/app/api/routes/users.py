from fastapi import APIRouter, Depends, status

from app.api.dependencies.auth import get_current_user
from app.api.dependencies.services import get_user_management_service
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.users import (
    ManagedUserCreateRequest,
    ManagedUserMutationResponse,
    ManagedUsersResponse,
    ManagedUserUpdateRequest,
)
from app.services.user_management_service import UserManagementService


router = APIRouter(prefix='/api/users', tags=['users'])


@router.get('', response_model=ManagedUsersResponse)
def list_users(
    current_user: User = Depends(get_current_user),
    user_management_service: UserManagementService = Depends(get_user_management_service),
) -> ManagedUsersResponse:
    return user_management_service.list_company_users(current_user)


@router.post('', response_model=ManagedUserMutationResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: ManagedUserCreateRequest,
    current_user: User = Depends(get_current_user),
    user_management_service: UserManagementService = Depends(get_user_management_service),
) -> ManagedUserMutationResponse:
    return user_management_service.create_user(current_user, payload)


@router.put('/{user_id}', response_model=ManagedUserMutationResponse)
def update_user(
    user_id: str,
    payload: ManagedUserUpdateRequest,
    current_user: User = Depends(get_current_user),
    user_management_service: UserManagementService = Depends(get_user_management_service),
) -> ManagedUserMutationResponse:
    return user_management_service.update_user(current_user, user_id, payload)


@router.delete('/{user_id}', response_model=MessageResponse)
def delete_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    user_management_service: UserManagementService = Depends(get_user_management_service),
) -> MessageResponse:
    response = user_management_service.delete_user(current_user, user_id)
    return MessageResponse(**response)
