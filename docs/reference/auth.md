# Auth reference

Source: `backend/app/api/routes/auth.py`. This page records callable signatures, direct dependencies, and declared HTTP errors from the implementation.

## `signup`

**Source:** `backend/app/api/routes/auth.py`

**Signature:** `signup(payload: SignupRequest, auth_service: AuthService=Depends(get_auth_service)) -> VerificationPendingResponse`

**Route:** `POST /signup`

**Key calls:** `router.post`, `Depends`, `auth_service.signup`.

