# User Repository reference

Source: `backend/app/repositories/user_repository.py`. This page records callable signatures, direct dependencies, and declared HTTP errors from the implementation.

## `UserRepository.find_by_email`

**Source:** `backend/app/repositories/user_repository.py`

**Signature:** `find_by_email(self, email: str) -> User | None`

**Key calls:** `self._to_model`, `self.collection.find_one`.

