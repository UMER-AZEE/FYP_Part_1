# Auth Service reference

Source: `backend/app/services/auth_service.py`. This page records callable signatures, direct dependencies, and declared HTTP errors from the implementation.

## `AuthService.prepare_verification`

**Source:** `backend/app/services/auth_service.py`

**Signature:** `prepare_verification(self, user: User) -> str`

**Key calls:** `generate_verification_code`, `now_utc`, `hash_verification_code`, `timedelta`.

