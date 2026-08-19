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

## `AuthService.seconds_until_password_reset_resend`

**Source:** `backend/app/services/auth_service.py`

**Signature:** `seconds_until_password_reset_resend(user: User, current_time: datetime | None=None) -> int`

**Key calls:** `(available_at - current_time).total_seconds`, `now_utc`, `timedelta`, `ceil`.

## `AuthService.build_delivery_message`

**Source:** `backend/app/services/auth_service.py`

**Signature:** `build_delivery_message(verification_code: str, delivery_result: EmailDeliveryResult) -> str`

**Returns expression:** `f'Email delivery is unavailable in this environment. Use verification code {verification_code} to continue.'`.

## `AuthService.build_password_reset_delivery_message`

**Source:** `backend/app/services/auth_service.py`

**Signature:** `build_password_reset_delivery_message(verification_code: str, delivery_result: EmailDeliveryResult) -> str`

**Returns expression:** `f'Email delivery is unavailable in this environment. Use password reset code {verification_code} to continue.'`.

## `AuthService.issue_verification_code`

**Source:** `backend/app/services/auth_service.py`

**Signature:** `issue_verification_code(self, user: User) -> VerificationPendingResponse`

**Key calls:** `self.prepare_verification`, `send_verification_email`, `self.verification_pending_response`, `self.build_delivery_message`.

## `AuthService.issue_password_reset_code`

**Source:** `backend/app/services/auth_service.py`

**Signature:** `issue_password_reset_code(self, user: User) -> PasswordResetPendingResponse`

**Key calls:** `self.prepare_password_reset`, `send_password_reset_email`, `self.password_reset_pending_response`, `self.build_password_reset_delivery_message`.

## `AuthService.build_auth_response`

**Source:** `backend/app/services/auth_service.py`

**Signature:** `build_auth_response(user: User) -> AuthResponse`

**Key calls:** `AuthResponse`, `create_access_token`, `AuthenticatedUserRead.model_validate`.

## `AuthService.get_current_user`

**Source:** `backend/app/services/auth_service.py`

**Signature:** `get_current_user(self, token: str) -> User`

**Key calls:** `decode_access_token`, `normalize_email`, `self.user_repository.find_by_email`, `payload.get`.

**Explicit HTTP errors:** "Invalid token subject"; "User no longer exists".

## `AuthService.get_invited_user`

**Source:** `backend/app/services/auth_service.py`

**Signature:** `get_invited_user(self, token: str) -> User`

**Key calls:** `hash_invitation_token`, `self.user_repository.find_by_invitation_token_hash`, `token.strip`, `now_utc`.

**Explicit HTTP errors:** "Invitation not found"; "Invitation link has expired".

## `AuthService.signup`

**Source:** `backend/app/services/auth_service.py`

**Signature:** `signup(self, payload: SignupRequest) -> VerificationPendingResponse`

**Key calls:** `normalize_email`, `normalize_person_name`, `normalize_company_name`, `validate_email`, `slugify_company`, `self.company_repository.find_by_slug`, `User`, `self.issue_verification_code`.

**Explicit HTTP errors:** "Password and confirm password must match"; "First name is required"; "Last name is required"; "Company name is required"; "Email is already registered"; "Failed to create company".

## `AuthService.login`

**Source:** `backend/app/services/auth_service.py`

**Signature:** `login(self, payload: LoginRequest) -> AuthResponse | VerificationPendingResponse`

**Key calls:** `normalize_email`, `validate_email`, `self.user_repository.find_by_email`, `self.build_auth_response`, `verify_password`, `now_utc`, `self.seconds_until_resend`, `self.issue_verification_code`.

**Explicit HTTP errors:** "Invalid email or password".

## `AuthService.verify_email`

**Source:** `backend/app/services/auth_service.py`

**Signature:** `verify_email(self, payload: VerificationRequest) -> AuthResponse`

**Key calls:** `normalize_email`, `self.user_repository.find_by_email`, `self.clear_verification_state`, `self.user_repository.save`, `self.build_auth_response`, `verify_email_code`, `now_utc`, `payload.code.strip`.

**Explicit HTTP errors:** "User not found"; "Email is already verified. Please sign in."; "Verification code has expired"; "Too many invalid verification attempts. Request a new code."; "Invalid verification code".

## `AuthService.resend_verification`

**Source:** `backend/app/services/auth_service.py`

**Signature:** `resend_verification(self, payload: ResendVerificationRequest) -> VerificationPendingResponse`

**Key calls:** `normalize_email`, `validate_email`, `self.user_repository.find_by_email`, `self.seconds_until_resend`, `self.issue_verification_code`, `self.user_repository.save`.

**Explicit HTTP errors:** "User not found"; "Email is already verified".

## `AuthService.forgot_password`

**Source:** `backend/app/services/auth_service.py`

**Signature:** `forgot_password(self, payload: ForgotPasswordRequest) -> PasswordResetPendingResponse`

**Key calls:** `normalize_email`, `validate_email`, `self.user_repository.find_by_email`, `now_utc`, `self.seconds_until_password_reset_resend`, `self.issue_password_reset_code`, `self.user_repository.save`, `self.password_reset_pending_response`.

## `AuthService.reset_password`

**Source:** `backend/app/services/auth_service.py`

**Signature:** `reset_password(self, payload: ResetPasswordRequest) -> MessageResponse`

**Key calls:** `normalize_email`, `validate_email`, `self.user_repository.find_by_email`, `hash_password`, `self.clear_password_reset_state`, `self.user_repository.save`, `MessageResponse`, `verify_password_reset_code`.

**Explicit HTTP errors:** "Password and confirm password must match"; "User not found"; "Password reset code has expired"; "Too many invalid reset attempts. Request a new code."; "Invalid password reset code".

## `AuthService.get_invitation_details`

**Source:** `backend/app/services/auth_service.py`

**Signature:** `get_invitation_details(self, token: str) -> InvitationDetailsResponse`

**Key calls:** `self.get_invited_user`, `InvitationDetailsResponse`.

## `AuthService.accept_invitation`

**Source:** `backend/app/services/auth_service.py`

**Signature:** `accept_invitation(self, payload: AcceptInvitationRequest) -> MessageResponse`

**Key calls:** `self.get_invited_user`, `hash_password`, `self.clear_invitation_state`, `self.clear_verification_state`, `self.clear_password_reset_state`, `self.user_repository.save`, `MessageResponse`.

**Explicit HTTP errors:** "Password and confirm password must match".

