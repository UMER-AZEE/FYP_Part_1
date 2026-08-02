# Auth Service reference

Source: `backend/app/services/auth_service.py`. This page records callable signatures, direct dependencies, and declared HTTP errors from the implementation.

## `AuthService.prepare_verification`

**Source:** `backend/app/services/auth_service.py`

**Signature:** `prepare_verification(self, user: User) -> str`

**Key calls:** `generate_verification_code`, `now_utc`, `hash_verification_code`, `timedelta`.

## `AuthService.prepare_password_reset`

**Source:** `backend/app/services/auth_service.py`

**Signature:** `prepare_password_reset(self, user: User) -> str`

**Key calls:** `generate_verification_code`, `now_utc`, `hash_password_reset_code`, `timedelta`.

## `AuthService.clear_verification_state`

**Source:** `backend/app/services/auth_service.py`

**Signature:** `clear_verification_state(user: User) -> None`

## `AuthService.clear_password_reset_state`

**Source:** `backend/app/services/auth_service.py`

**Signature:** `clear_password_reset_state(user: User) -> None`

## `AuthService.clear_invitation_state`

**Source:** `backend/app/services/auth_service.py`

**Signature:** `clear_invitation_state(user: User) -> None`

## `AuthService.prepare_invitation`

**Source:** `backend/app/services/auth_service.py`

**Signature:** `prepare_invitation(user: User) -> str`

**Key calls:** `generate_invitation_token`, `now_utc`, `hash_invitation_token`, `timedelta`.

## `AuthService.verification_pending_response`

**Source:** `backend/app/services/auth_service.py`

**Signature:** `verification_pending_response(email: str, message: str='A verification code has been sent to your email address', retry_after_seconds: int | None=None) -> VerificationPendingResponse`

**Key calls:** `VerificationPendingResponse`.

## `AuthService.password_reset_pending_response`

**Source:** `backend/app/services/auth_service.py`

**Signature:** `password_reset_pending_response(email: str, message: str, retry_after_seconds: int | None=None) -> PasswordResetPendingResponse`

**Key calls:** `PasswordResetPendingResponse`.

## `AuthService.seconds_until_resend`

**Source:** `backend/app/services/auth_service.py`

**Signature:** `seconds_until_resend(user: User, current_time: datetime | None=None) -> int`

**Key calls:** `(available_at - current_time).total_seconds`, `now_utc`, `timedelta`, `ceil`.

