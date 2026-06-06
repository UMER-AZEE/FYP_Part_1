from datetime import timedelta

from fastapi import HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.core.config import INVITATION_EXPIRE_HOURS
from app.core.security import generate_invitation_token, hash_invitation_token
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.users import (
    ManagedUserCreateRequest,
    ManagedUserMutationResponse,
    ManagedUserRead,
    ManagedUsersResponse,
    ManagedUserUpdateRequest,
)
from app.services.auth_service import now_utc
from app.services.email_service import EmailDeliveryResult, send_invitation_email
from app.utils.normalizers import (
    normalize_department_name,
    normalize_email,
    normalize_person_name,
    normalize_role_name,
    validate_email,
)
class UserManagementService:
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    @staticmethod
    def to_managed_user(user: User) -> ManagedUserRead:
        return ManagedUserRead(
            id=user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            department=user.department,
            role=user.role,
            groups=list(user.groups),
            account_status=user.account_status,
            is_email_verified=user.is_email_verified,
            created_at=user.created_at,
        )

    @staticmethod
    def normalize_groups(groups: list[str]) -> list[str]:
        normalized_groups: list[str] = []
        seen: set[str] = set()
        for group in groups:
            normalized = ' '.join(group.strip().split())
            if not normalized:
                continue
            dedupe_key = normalized.lower()
            if dedupe_key in seen:
                continue
            seen.add(dedupe_key)
            normalized_groups.append(normalized)
        return normalized_groups

    @staticmethod
    def apply_user_fields(user: User, payload: ManagedUserCreateRequest | ManagedUserUpdateRequest) -> None:
        user.first_name = normalize_person_name(payload.first_name)
        user.last_name = normalize_person_name(payload.last_name)
        user.full_name = ' '.join(part for part in [user.first_name, user.last_name] if part).strip()
        user.email = normalize_email(payload.email)
        user.department = normalize_department_name(payload.department)
        user.role = normalize_role_name(payload.role)
        user.groups = UserManagementService.normalize_groups(payload.groups)

        validate_email(user.email)
        if not user.first_name:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail='First name is required')
        if not user.last_name:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail='Last name is required')
        if not user.department:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail='Department is required')
        if not user.role:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail='Role is required')

    @staticmethod
    def prepare_invitation(user: User) -> str:
        token = generate_invitation_token()
        issued_at = now_utc()
        user.invitation_token_hash = hash_invitation_token(token)
        user.invitation_expires_at = issued_at + timedelta(hours=INVITATION_EXPIRE_HOURS)
        user.invited_at = issued_at
        user.is_email_verified = False
        user.password_hash = None
        return token

    @staticmethod
    def invitation_message(delivery_result: EmailDeliveryResult) -> str:
        if delivery_result.delivered:
            return 'User created and invitation email sent.'
        return 'User created. Email delivery is unavailable, so the invitation link was logged to the backend console.'

    @staticmethod
    def ensure_manager(current_user: User) -> None:
        if current_user.role.strip().lower() != 'manager':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='Only managers can manage company users',
            )

    def list_company_users(self, current_user: User) -> ManagedUsersResponse:
        self.ensure_manager(current_user)
        users = [
            self.to_managed_user(user)
            for user in self.user_repository.list_by_company_id(current_user.company.id)
            if user.id != current_user.id
        ]
        return ManagedUsersResponse(users=users)

    def create_user(
        self,
        current_user: User,
        payload: ManagedUserCreateRequest,
    ) -> ManagedUserMutationResponse:
        self.ensure_manager(current_user)
        user = User(
            id='',
            full_name='',
            first_name='',
            last_name='',
            email='',
            department='',
            role='',
            groups=[],
            password_hash=None,
            company=current_user.company,
            is_email_verified=False,
            invitation_token_hash=None,
            invitation_expires_at=None,
            invited_at=None,
            email_verification_code_hash=None,
            email_verification_expires_at=None,
            email_verification_sent_at=None,
            email_verification_delivery_mode=None,
            email_verification_attempts=0,
            password_reset_code_hash=None,
            password_reset_expires_at=None,
            password_reset_sent_at=None,
            password_reset_delivery_mode=None,
            password_reset_attempts=0,
            created_at=now_utc(),
        )
        self.apply_user_fields(user, payload)

        if self.user_repository.find_by_email(user.email) is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Email is already registered')

        invitation_token = self.prepare_invitation(user)
        try:
            self.user_repository.create(user)
        except DuplicateKeyError as exc:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Email is already registered') from exc

        delivery_result = send_invitation_email(user.email, invitation_token, current_user.company.name)
        return ManagedUserMutationResponse(
            user=self.to_managed_user(user),
            message=self.invitation_message(delivery_result),
        )

    def update_user(
        self,
        current_user: User,
        user_id: str,
        payload: ManagedUserUpdateRequest,
    ) -> ManagedUserMutationResponse:
        self.ensure_manager(current_user)
        if user_id == current_user.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='You cannot edit your own account here')

        user = self.user_repository.find_by_id(user_id)
        if user is None or user.company.id != current_user.company.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')

        previous_email = user.email
        previous_status = user.account_status
        self.apply_user_fields(user, payload)

        delivery_result: EmailDeliveryResult | None = None
        if previous_status == 'invited' and user.email != previous_email:
            invitation_token = self.prepare_invitation(user)
            delivery_result = send_invitation_email(user.email, invitation_token, current_user.company.name)

        try:
            self.user_repository.save(user)
        except DuplicateKeyError as exc:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Email is already registered') from exc

        message = 'User updated successfully.'
        if delivery_result is not None:
            message = self.invitation_message(delivery_result)
        return ManagedUserMutationResponse(user=self.to_managed_user(user), message=message)

    def delete_user(self, current_user: User, user_id: str) -> dict[str, str]:
        self.ensure_manager(current_user)
        if user_id == current_user.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='You cannot delete your own account')

        user = self.user_repository.find_by_id(user_id)
        if user is None or user.company.id != current_user.company.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')

        self.user_repository.delete(user_id)
        return {'message': 'User deleted successfully.'}
