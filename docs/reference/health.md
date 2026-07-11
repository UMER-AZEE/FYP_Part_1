# Health reference

Source: `backend/app/api/routes/health.py`. This page records callable signatures, direct dependencies, and declared HTTP errors from the implementation.

## `health_check`

**Source:** `backend/app/api/routes/health.py`

**Signature:** `health_check() -> dict[str, str]`

**Route:** `GET /api/health`

**Key calls:** `router.get`, `get_database_status`, `database_status.get`.

