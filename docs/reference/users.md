# Users reference

Source: `backend/app/api/routes/users.py`. This page records callable signatures, direct dependencies, and declared HTTP errors from the implementation.

## `list_users`

**Source:** `backend/app/api/routes/users.py`

**Signature:** `list_users(current_user: User=Depends(get_current_user), user_management_service: UserManagementService=Depends(get_user_management_service)) -> ManagedUsersResponse`

**Route:** `GET `

**Key calls:** `router.get`, `Depends`, `user_management_service.list_company_users`.

## `create_user`

**Source:** `backend/app/api/routes/users.py`

**Signature:** `create_user(payload: ManagedUserCreateRequest, current_user: User=Depends(get_current_user), user_management_service: UserManagementService=Depends(get_user_management_service)) -> ManagedUserMutationResponse`

**Route:** `POST `

**Key calls:** `router.post`, `Depends`, `user_management_service.create_user`.

