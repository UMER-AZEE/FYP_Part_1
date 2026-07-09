# Auth reference

Source: `backend/app/api/routes/auth.py`. This page records callable signatures, direct dependencies, and declared HTTP errors from the implementation.

## `signup`

**Source:** `backend/app/api/routes/auth.py`

**Signature:** `signup(payload: SignupRequest, auth_service: AuthService=Depends(get_auth_service)) -> VerificationPendingResponse`

**Route:** `POST /signup`

**Key calls:** `router.post`, `Depends`, `auth_service.signup`.

## `login`

**Source:** `backend/app/api/routes/auth.py`

**Signature:** `login(payload: LoginRequest, auth_service: AuthService=Depends(get_auth_service)) -> AuthResponse | VerificationPendingResponse`

**Route:** `POST /login`

**Key calls:** `router.post`, `Depends`, `auth_service.login`.

## `verify_email`

**Source:** `backend/app/api/routes/auth.py`

**Signature:** `verify_email(payload: VerificationRequest, auth_service: AuthService=Depends(get_auth_service)) -> AuthResponse`

**Route:** `POST /verify-email`

**Key calls:** `router.post`, `Depends`, `auth_service.verify_email`.

## `resend_verification`

**Source:** `backend/app/api/routes/auth.py`

**Signature:** `resend_verification(payload: ResendVerificationRequest, auth_service: AuthService=Depends(get_auth_service)) -> VerificationPendingResponse`

**Route:** `POST /resend-verification`

**Key calls:** `router.post`, `Depends`, `auth_service.resend_verification`.

## `forgot_password`

**Source:** `backend/app/api/routes/auth.py`

**Signature:** `forgot_password(payload: ForgotPasswordRequest, auth_service: AuthService=Depends(get_auth_service)) -> PasswordResetPendingResponse`

**Route:** `POST /forgot-password`

**Key calls:** `router.post`, `Depends`, `auth_service.forgot_password`.

## `reset_password`

**Source:** `backend/app/api/routes/auth.py`

**Signature:** `reset_password(payload: ResetPasswordRequest, auth_service: AuthService=Depends(get_auth_service)) -> MessageResponse`

**Route:** `POST /reset-password`

**Key calls:** `router.post`, `Depends`, `auth_service.reset_password`.

## `invitation_details`

**Source:** `backend/app/api/routes/auth.py`

**Signature:** `invitation_details(token: str, auth_service: AuthService=Depends(get_auth_service)) -> InvitationDetailsResponse`

**Route:** `GET /invitation`

**Key calls:** `router.get`, `Depends`, `auth_service.get_invitation_details`.

## `accept_invitation`

**Source:** `backend/app/api/routes/auth.py`

**Signature:** `accept_invitation(payload: AcceptInvitationRequest, auth_service: AuthService=Depends(get_auth_service)) -> MessageResponse`

**Route:** `POST /accept-invitation`

**Key calls:** `router.post`, `Depends`, `auth_service.accept_invitation`.

## `me`

**Source:** `backend/app/api/routes/auth.py`

**Signature:** `me(current_user: User=Depends(get_current_user)) -> AuthenticatedUserRead`

**Route:** `GET /me`

**Key calls:** `router.get`, `Depends`, `AuthenticatedUserRead.model_validate`.

