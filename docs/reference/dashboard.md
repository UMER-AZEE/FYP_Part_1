# Dashboard reference

Source: `backend/app/api/routes/dashboard.py`. This page records callable signatures, direct dependencies, and declared HTTP errors from the implementation.

## `dashboard`

**Source:** `backend/app/api/routes/dashboard.py`

**Signature:** `dashboard(dashboard_service: DashboardService=Depends(get_dashboard_service)) -> dict`

**Route:** `GET `

**Key calls:** `router.get`, `Depends`, `dashboard_service.get_dashboard_data`.

