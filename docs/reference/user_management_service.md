# User Management Service reference

Source: `backend/app/services/user_management_service.py`. This page records callable signatures, direct dependencies, and declared HTTP errors from the implementation.

## `UserManagementService.to_managed_user`

**Source:** `backend/app/services/user_management_service.py`

**Signature:** `to_managed_user(user: User) -> ManagedUserRead`

**Key calls:** `ManagedUserRead`.

## `UserManagementService.normalize_groups`

**Source:** `backend/app/services/user_management_service.py`

**Signature:** `normalize_groups(groups: list[str]) -> list[str]`

**Key calls:** `' '.join`, `normalized.lower`, `seen.add`, `normalized_groups.append`, `group.strip().split`, `group.strip`.

## `UserManagementService.apply_user_fields`

**Source:** `backend/app/services/user_management_service.py`

**Signature:** `apply_user_fields(user: User, payload: ManagedUserCreateRequest | ManagedUserUpdateRequest) -> None`

**Key calls:** `normalize_person_name`, `' '.join((part for part in [user.first_name, user.last_name] if part)).strip`, `normalize_email`, `normalize_department_name`, `normalize_role_name`, `UserManagementService.normalize_groups`, `validate_email`, `' '.join`.

**Explicit HTTP errors:** "First name is required"; "Last name is required"; "Department is required"; "Role is required".

## `UserManagementService.prepare_invitation`

**Source:** `backend/app/services/user_management_service.py`

**Signature:** `prepare_invitation(user: User) -> str`

**Key calls:** `generate_invitation_token`, `now_utc`, `hash_invitation_token`, `timedelta`.

## `UserManagementService.invitation_message`

**Source:** `backend/app/services/user_management_service.py`

**Signature:** `invitation_message(delivery_result: EmailDeliveryResult) -> str`

**Returns expression:** `'User created. Email delivery is unavailable, so the invitation link was logged to the backend console.'`.

## `UserManagementService.ensure_manager`

**Source:** `backend/app/services/user_management_service.py`

**Signature:** `ensure_manager(current_user: User) -> None`

**Key calls:** `current_user.role.strip().lower`, `current_user.role.strip`.

**Explicit HTTP errors:** "Only managers can manage company users".

## `UserManagementService.list_company_users`

**Source:** `backend/app/services/user_management_service.py`

**Signature:** `list_company_users(self, current_user: User) -> ManagedUsersResponse`

**Key calls:** `self.ensure_manager`, `ManagedUsersResponse`, `self.to_managed_user`, `self.user_repository.list_by_company_id`.

