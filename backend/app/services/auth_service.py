from datetime import datetime, timedelta, timezone
from math import ceil

from fastapi import HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.core.config import (
    INVITATION_EXPIRE_HOURS,
    PASSWORD_RESET_CODE_EXPIRE_MINUTES,
    PASSWORD_RESET_MAX_ATTEMPTS,
    PASSWORD_RESET_RESEND_COOLDOWN_SECONDS,
    VERIFICATION_CODE_EXPIRE_MINUTES,
    VERIFICATION_MAX_ATTEMPTS,
    VERIFICATION_RESEND_COOLDOWN_SECONDS,
)
from app.core.security import (
    create_access_token,
    decode_access_token,
    generate_invitation_token,
    generate_verification_code,
    hash_invitation_token,
    hash_password,
    hash_password_reset_code,
    hash_verification_code,
    verify_email_code,
    verify_password,
    verify_password_reset_code,
)
from app.models.user import User
from app.repositories.company_repository import CompanyRepository
from app.repositories.user_repository import UserRepository
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
from app.services.email_service import (
    EmailDeliveryResult,
    send_password_reset_email,
    send_verification_email,
)
from app.utils.normalizers import (
    normalize_company_name,
    normalize_department_name,
    normalize_email,
    normalize_role_name,
    normalize_person_name,
    slugify_company,
    validate_email,
)


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


class AuthService:
    def __init__(self, user_repository: UserRepository, company_repository: CompanyRepository):
        self.user_repository = user_repository
        self.company_repository = company_repository

    def prepare_verification(self, user: User) -> str:
        code = generate_verification_code()
        issued_at = now_utc()
        user.is_email_verified = False
        user.email_verification_code_hash = hash_verification_code(user.email, code)
        user.email_verification_sent_at = issued_at
        user.email_verification_expires_at = issued_at + timedelta(minutes=VERIFICATION_CODE_EXPIRE_MINUTES)
        user.email_verification_attempts = 0
        return code

    def prepare_password_reset(self, user: User) -> str:
        code = generate_verification_code()
        issued_at = now_utc()
        user.password_reset_code_hash = hash_password_reset_code(user.email, code)
        user.password_reset_sent_at = issued_at
        user.password_reset_expires_at = issued_at + timedelta(minutes=PASSWORD_RESET_CODE_EXPIRE_MINUTES)
        user.password_reset_attempts = 0
        return code

    @staticmethod
    def clear_verification_state(user: User) -> None:
        user.email_verification_code_hash = None
        user.email_verification_expires_at = None
        user.email_verification_sent_at = None
        user.email_verification_delivery_mode = None
        user.email_verification_attempts = 0

    @staticmethod
    def clear_password_reset_state(user: User) -> None:
        user.password_reset_code_hash = None
        user.password_reset_expires_at = None
        user.password_reset_sent_at = None
        user.password_reset_delivery_mode = None
        user.password_reset_attempts = 0

    @staticmethod
    def clear_invitation_state(user: User) -> None:
        user.invitation_token_hash = None
        user.invitation_expires_at = None
        user.invited_at = None

    @staticmethod
    def prepare_invitation(user: User) -> str:
        token = generate_invitation_token()
        issued_at = now_utc()
        user.invitation_token_hash = hash_invitation_token(token)
        user.invitation_expires_at = issued_at + timedelta(hours=INVITATION_EXPIRE_HOURS)
        user.invited_at = issued_at
        return token

    @staticmethod
    def verification_pending_response(
        email: str,
        message: str = 'A verification code has been sent to your email address',
        retry_after_seconds: int | None = None,
    ) -> VerificationPendingResponse:
        return VerificationPendingResponse(
            email=email,
            message=message,
            retry_after_seconds=retry_after_seconds,
        )

    @staticmethod
    def password_reset_pending_response(
        email: str,
        message: str,
        retry_after_seconds: int | None = None,
    ) -> PasswordResetPendingResponse:
        return PasswordResetPendingResponse(
            email=email,
            message=message,
            retry_after_seconds=retry_after_seconds,
        )

    @staticmethod
    def seconds_until_resend(user: User, current_time: datetime | None = None) -> int:
        if user.email_verification_sent_at is None:
            return 0

        current_time = current_time or now_utc()
        available_at = user.email_verification_sent_at + timedelta(
            seconds=VERIFICATION_RESEND_COOLDOWN_SECONDS
        )
        remaining = (available_at - current_time).total_seconds()
        return max(0, ceil(remaining))

    @staticmethod
    def seconds_until_password_reset_resend(
        user: User,
        current_time: datetime | None = None,
    ) -> int:
        if user.password_reset_sent_at is None:
            return 0

        current_time = current_time or now_utc()
        available_at = user.password_reset_sent_at + timedelta(
            seconds=PASSWORD_RESET_RESEND_COOLDOWN_SECONDS
        )
        remaining = (available_at - current_time).total_seconds()
        return max(0, ceil(remaining))

    @staticmethod
    def build_delivery_message(
        verification_code: str,
        delivery_result: EmailDeliveryResult,
    ) -> str:
        if delivery_result.delivered:
            return 'A verification code has been sent to your email address'
        return (
            'Email delivery is unavailable in this environment. '
            f'Use verification code {verification_code} to continue.'
        )

    @staticmethod
    def build_password_reset_delivery_message(
        verification_code: str,
        delivery_result: EmailDeliveryResult,
    ) -> str:
        if delivery_result.delivered:
            return 'A password reset code has been sent to your email address'
        return (
            'Email delivery is unavailable in this environment. '
            f'Use password reset code {verification_code} to continue.'
        )

    def issue_verification_code(self, user: User) -> VerificationPendingResponse:
        verification_code = self.prepare_verification(user)
        delivery_result = send_verification_email(user.email, verification_code)
        user.email_verification_delivery_mode = delivery_result.mode
        return self.verification_pending_response(
            user.email,
            message=self.build_delivery_message(verification_code, delivery_result),
        )

    def issue_password_reset_code(self, user: User) -> PasswordResetPendingResponse:
        verification_code = self.prepare_password_reset(user)
        delivery_result = send_password_reset_email(user.email, verification_code)
        user.password_reset_delivery_mode = delivery_result.mode
        return self.password_reset_pending_response(
            user.email,
            message=self.build_password_reset_delivery_message(verification_code, delivery_result),
        )

    @staticmethod
    def build_auth_response(user: User) -> AuthResponse:
        return AuthResponse(
            access_token=create_access_token(user.email),
            user=AuthenticatedUserRead.model_validate(user),
        )

    def get_current_user(self, token: str) -> User:
        payload = decode_access_token(token)
        email = normalize_email(payload.get('sub', ''))
        if not email:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token subject')

        user = self.user_repository.find_by_email(email)
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User no longer exists')

        return user

    def get_invited_user(self, token: str) -> User:
        invitation_token_hash = hash_invitation_token(token.strip())
        user = self.user_repository.find_by_invitation_token_hash(invitation_token_hash)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Invitation not found')
        if user.invitation_expires_at is None or user.invitation_expires_at < now_utc():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invitation link has expired')
        return user

    def signup(self, payload: SignupRequest) -> VerificationPendingResponse:
        email = normalize_email(payload.email)
        first_name = normalize_person_name(payload.first_name)
        last_name = normalize_person_name(payload.last_name)
        company_name = normalize_company_name(payload.company_name)

        validate_email(email)
        if payload.password != payload.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail='Password and confirm password must match',
            )
        if not first_name:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail='First name is required')
        if not last_name:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail='Last name is required')
        if not company_name:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail='Company name is required')

        if self.user_repository.find_by_email(email) is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Email is already registered')

        company_slug = slugify_company(company_name)
        company = self.company_repository.find_by_slug(company_slug)
        if company is None:
            try:
                company = self.company_repository.create(company_name, company_slug)
            except DuplicateKeyError:
                company = self.company_repository.find_by_slug(company_slug)

        if company is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='Failed to create company')

        user = User(
            id='',
            full_name=' '.join(part for part in [first_name, last_name] if part).strip(),
            first_name=first_name,
            last_name=last_name,
            email=email,
            department=normalize_department_name('Management'),
            role=normalize_role_name('Manager'),
            password_hash=hash_password(payload.password),
            company=company,
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
        response = self.issue_verification_code(user)
        try:
            self.user_repository.create(user)
        except DuplicateKeyError as exc:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Email is already registered') from exc
        return response

    def login(self, payload: LoginRequest) -> AuthResponse | VerificationPendingResponse:
        email = normalize_email(payload.email)
        validate_email(email)

        user = self.user_repository.find_by_email(email)
        if user is None or user.password_hash is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid email or password')
        if not verify_password(payload.password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid email or password')
        if not user.is_email_verified:
            current_time = now_utc()
            retry_after_seconds = self.seconds_until_resend(user, current_time)
            if (
                retry_after_seconds > 0
                and user.email_verification_expires_at is not None
                and user.email_verification_expires_at > current_time
                and user.email_verification_delivery_mode != 'console'
            ):
                return self.verification_pending_response(
                    user.email,
                    message=(
                        'Use the verification code already sent to your email address. '
                        f'You can request a new code in {retry_after_seconds} seconds.'
                    ),
                    retry_after_seconds=retry_after_seconds,
                )
            response = self.issue_verification_code(user)
            self.user_repository.save(user)
            return response

        return self.build_auth_response(user)

    def verify_email(self, payload: VerificationRequest) -> AuthResponse:
        email = normalize_email(payload.email)
        user = self.user_repository.find_by_email(email)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
        if user.is_email_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Email is already verified. Please sign in.',
            )
        if (
            user.email_verification_expires_at is None
            or user.email_verification_expires_at < now_utc()
        ):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Verification code has expired')
        if user.email_verification_attempts >= VERIFICATION_MAX_ATTEMPTS:
            self.clear_verification_state(user)
            self.user_repository.save(user)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Too many invalid verification attempts. Request a new code.',
            )
        if not verify_email_code(user.email, payload.code.strip(), user.email_verification_code_hash):
            user.email_verification_attempts += 1
            attempts_remaining = VERIFICATION_MAX_ATTEMPTS - user.email_verification_attempts
            if attempts_remaining <= 0:
                self.clear_verification_state(user)
                self.user_repository.save(user)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail='Too many invalid verification attempts. Request a new code.',
                )
            self.user_repository.save(user)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid verification code')

        user.is_email_verified = True
        self.clear_verification_state(user)
        self.user_repository.save(user)
        return self.build_auth_response(user)

    def resend_verification(self, payload: ResendVerificationRequest) -> VerificationPendingResponse:
        email = normalize_email(payload.email)
        validate_email(email)

        user = self.user_repository.find_by_email(email)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
        if user.is_email_verified:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Email is already verified')

        retry_after_seconds = self.seconds_until_resend(user)
        if retry_after_seconds > 0 and user.email_verification_delivery_mode != 'console':
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    'A verification code was sent recently. '
                    f'Try again in {retry_after_seconds} seconds.'
                ),
            )

        response = self.issue_verification_code(user)
        self.user_repository.save(user)
        return response

    def forgot_password(self, payload: ForgotPasswordRequest) -> PasswordResetPendingResponse:
        email = normalize_email(payload.email)
        validate_email(email)

        user = self.user_repository.find_by_email(email)
        generic_message = 'If an account exists for this email, a password reset code has been sent.'
        if user is None:
            return self.password_reset_pending_response(email, generic_message)

        current_time = now_utc()
        retry_after_seconds = self.seconds_until_password_reset_resend(user, current_time)
        if (
            retry_after_seconds > 0
            and user.password_reset_expires_at is not None
            and user.password_reset_expires_at > current_time
            and user.password_reset_delivery_mode != 'console'
        ):
            return self.password_reset_pending_response(
                user.email,
                message=(
                    'Use the password reset code already sent to your email address. '
                    f'You can request a new code in {retry_after_seconds} seconds.'
                ),
                retry_after_seconds=retry_after_seconds,
            )

        response = self.issue_password_reset_code(user)
        self.user_repository.save(user)
        return response

    def reset_password(self, payload: ResetPasswordRequest) -> MessageResponse:
        email = normalize_email(payload.email)
        validate_email(email)
        if payload.password != payload.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail='Password and confirm password must match',
            )

        user = self.user_repository.find_by_email(email)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
        if user.password_reset_expires_at is None or user.password_reset_expires_at < now_utc():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Password reset code has expired')
        if user.password_reset_attempts >= PASSWORD_RESET_MAX_ATTEMPTS:
            self.clear_password_reset_state(user)
            self.user_repository.save(user)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Too many invalid reset attempts. Request a new code.',
            )
        if not verify_password_reset_code(email, payload.code.strip(), user.password_reset_code_hash):
            user.password_reset_attempts += 1
            attempts_remaining = PASSWORD_RESET_MAX_ATTEMPTS - user.password_reset_attempts
            if attempts_remaining <= 0:
                self.clear_password_reset_state(user)
                self.user_repository.save(user)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail='Too many invalid reset attempts. Request a new code.',
                )
            self.user_repository.save(user)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid password reset code')

        user.password_hash = hash_password(payload.password)
        self.clear_password_reset_state(user)
        self.user_repository.save(user)
        return MessageResponse(message='Password reset successful. Please sign in with your new password.')

    def get_invitation_details(self, token: str) -> InvitationDetailsResponse:
        user = self.get_invited_user(token)
        return InvitationDetailsResponse(
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            department=user.department,
            role=user.role,
            company_name=user.company.name,
        )

    def accept_invitation(self, payload: AcceptInvitationRequest) -> MessageResponse:
        if payload.password != payload.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail='Password and confirm password must match',
            )

        user = self.get_invited_user(payload.token)
        user.password_hash = hash_password(payload.password)
        user.is_email_verified = True
        self.clear_invitation_state(user)
        self.clear_verification_state(user)
        self.clear_password_reset_state(user)
        self.user_repository.save(user)
        return MessageResponse(message='Invitation accepted. You can now sign in to your account.')
