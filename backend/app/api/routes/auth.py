from fastapi import APIRouter, Depends, status

from app.api.dependencies.auth import get_current_user
from app.api.dependencies.services import get_auth_service
from app.models.user import User
from app.schemas.auth import (
    AcceptInvitationRequest,
    AuthResponse,
    AuthenticatedUserRead,
    ForgotPasswordRequest,
    InvitationDetailsResponse,
    LoginRequest,
    MessageResponse,
    PasswordResetPendingResponse,
    ResendVerificationRequest,
    ResetPasswordRequest,
    SignupRequest,
    VerificationPendingResponse,
    VerificationRequest,
)
from app.services.auth_service import AuthService


router = APIRouter(prefix='/api/auth', tags=['auth'])


@router.post('/signup', response_model=VerificationPendingResponse, status_code=status.HTTP_201_CREATED)
def signup(
    payload: SignupRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> VerificationPendingResponse:
    return auth_service.signup(payload)


@router.post('/login', response_model=AuthResponse | VerificationPendingResponse)
def login(
    payload: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> AuthResponse | VerificationPendingResponse:
    return auth_service.login(payload)


@router.post('/verify-email', response_model=AuthResponse)
def verify_email(
    payload: VerificationRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    return auth_service.verify_email(payload)


@router.post('/resend-verification', response_model=VerificationPendingResponse)
def resend_verification(
    payload: ResendVerificationRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> VerificationPendingResponse:
    return auth_service.resend_verification(payload)


@router.post('/forgot-password', response_model=PasswordResetPendingResponse)
def forgot_password(
    payload: ForgotPasswordRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> PasswordResetPendingResponse:
    return auth_service.forgot_password(payload)


@router.post('/reset-password', response_model=MessageResponse)
def reset_password(
    payload: ResetPasswordRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    return auth_service.reset_password(payload)


@router.get('/invitation', response_model=InvitationDetailsResponse)
def invitation_details(
    token: str,
    auth_service: AuthService = Depends(get_auth_service),
) -> InvitationDetailsResponse:
    return auth_service.get_invitation_details(token)


@router.post('/accept-invitation', response_model=MessageResponse)
def accept_invitation(
    payload: AcceptInvitationRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    return auth_service.accept_invitation(payload)


@router.get('/me', response_model=AuthenticatedUserRead)
def me(current_user: User = Depends(get_current_user)) -> AuthenticatedUserRead:
    return AuthenticatedUserRead.model_validate(current_user)
