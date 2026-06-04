import { useEffect, useState } from 'react'

import { ErrorState, LoadingState } from '../components/DataState'
import { loadInventoryGroups } from '../services/inventory/inventoryService'
import {
  createManagedUser,
  deleteManagedUser,
  fetchManagedUsers,
  updateManagedUser,
} from '../services/users/userManagementService'

const emptyForm = {
  first_name: '',
  last_name: '',
  email: '',
  department: '',
  role: '',
  groups: [],
}

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getStatusTone(status) {
  if (status === 'active') return 'green'
  if (status === 'invited') return 'amber'
  return 'rose'
}

function resolveAvailableGroups(selectedGroups = []) {
  return Array.from(
    new Set([
      ...loadInventoryGroups().map((group) => group?.name?.trim()).filter(Boolean),
      ...selectedGroups.map((group) => group?.trim()).filter(Boolean),
    ]),
  ).sort((left, right) => left.localeCompare(right))
}

export default function UsersPage({ currentUser, openCreateUser = false }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState('')
  const [availableGroups, setAvailableGroups] = useState(() => resolveAvailableGroups())

  const activeCount = users.filter((user) => user.account_status === 'active').length
  const invitedCount = users.filter((user) => user.account_status === 'invited').length
  const departmentCount = new Set(users.map((user) => user.department)).size
  const currentUserGroups = Array.isArray(currentUser?.groups) ? currentUser.groups : []

  const refreshAvailableGroups = (selectedGroups = []) => {
    const nextGroups = resolveAvailableGroups(selectedGroups)
    setAvailableGroups(nextGroups)
    return nextGroups
  }

  const openCreateModal = () => {
    refreshAvailableGroups()
    setEditingUser(null)
    setForm(emptyForm)
    setFormError('')
    setModalOpen(true)
  }

  const openEditModal = (user) => {
    const userGroups = Array.isArray(user.groups) ? user.groups : []
    refreshAvailableGroups(userGroups)
    setEditingUser(user)
    setForm({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      department: user.department,
      role: user.role,
      groups: userGroups,
    })
    setFormError('')
    setModalOpen(true)
  }

  async function loadUsers() {
    try {
      setLoading(true)
      const result = await fetchManagedUsers()
      setUsers(result)
      setError(null)
    } catch (requestError) {
      setError(requestError)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    async function loadUsersOnMount() {
      try {
        const result = await fetchManagedUsers()
        if (active) {
          setUsers(result)
          setError(null)
          setLoading(false)
        }
      } catch (requestError) {
        if (active) {
          setError(requestError)
          setLoading(false)
        }
      }
    }

    loadUsersOnMount()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!openCreateUser) return

    const timer = window.setTimeout(() => {
      refreshAvailableGroups()
      setEditingUser(null)
      setForm(emptyForm)
      setFormError('')
      setModalOpen(true)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [openCreateUser])

  const closeModal = () => {
    if (submitting) return
    setModalOpen(false)
    setEditingUser(null)
    setForm(emptyForm)
    setFormError('')
    if (window.location.hash === '#users?modal=add') {
      window.location.hash = 'users'
    }
  }

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const toggleGroupSelection = (groupName) => {
    setForm((current) => ({
      ...current,
      groups: current.groups.includes(groupName)
        ? current.groups.filter((group) => group !== groupName)
        : [...current.groups, groupName],
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setFormError('')

    try {
      const response = editingUser
        ? await updateManagedUser(editingUser.id, form)
        : await createManagedUser(form)

      setFeedback(response.message)
      setModalOpen(false)
      setEditingUser(null)
      setForm(emptyForm)
      setFormError('')
      await loadUsers()
    } catch (requestError) {
      setFormError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (user) => {
    const confirmed = window.confirm(`Delete ${user.first_name} ${user.last_name}?`)
    if (!confirmed) return

    setDeletingUserId(user.id)
    try {
      const response = await deleteManagedUser(user.id)
      setFeedback(response.message)
      await loadUsers()
    } catch (requestError) {
      setError(requestError)
    } finally {
      setDeletingUserId('')
    }
  }

  if (loading) {
    return (
      <LoadingState
        title="Loading company users…"
        copy="Waiting for the user directory to respond."
      />
    )
  }

  if (error) {
    return <ErrorState error={error} title="Could not load company users" />
  }

  return (
    <>
      <div className="grid row-3">
        <div className="card">
          <div className="card-head">
            <h3>User management</h3>
            <span className="hint">
              Manage the employees in {currentUser?.company?.name || 'your workspace'}.
            </span>
            <div className="right">
              <button type="button" className="btn primary" onClick={openCreateModal}>
                Add user
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="users-summary-grid">
              <div className="users-summary-item">
                <span className="users-summary-label">Employees</span>
                <strong>{users.length}</strong>
              </div>
              <div className="users-summary-item">
                <span className="users-summary-label">Active</span>
                <strong>{activeCount}</strong>
              </div>
              <div className="users-summary-item">
                <span className="users-summary-label">Invited</span>
                <strong>{invitedCount}</strong>
              </div>
              <div className="users-summary-item">
                <span className="users-summary-label">Departments</span>
                <strong>{departmentCount}</strong>
              </div>
            </div>
            {feedback ? <div className="auth-success users-feedback">{feedback}</div> : null}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Manager access</h3>
            <span className="hint">Current operator</span>
          </div>
          <div className="card-body">
            <div className="users-manager-card">
              <div className="avatar">
                {[currentUser?.first_name, currentUser?.last_name]
                  .filter(Boolean)
                  .map((part) => part[0]?.toUpperCase() || '')
                  .join('')
                  .slice(0, 2)}
              </div>
              <div>
                <div className="n">
                  {[currentUser?.first_name, currentUser?.last_name].filter(Boolean).join(' ')}
                </div>
                <div className="d">
                  {[currentUser?.role, currentUser?.department].filter(Boolean).join(' · ')}
                </div>
                {currentUserGroups.length ? (
                  <div className="users-group-list users-manager-groups">
                    {currentUserGroups.map((group) => (
                      <span className="users-group-chip" key={`manager-${group}`}>
                        {group}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="users-group-empty">No groups assigned</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Invitation status</h3>
            <span className="hint">Pending account activations</span>
          </div>
          <div className="card-body">
            <div className="users-invite-list">
              {invitedCount > 0 ? users
                .filter((user) => user.account_status === 'invited')
                .slice(0, 3)
                .map((user) => (
                  <div className="users-invite-row" key={user.id}>
                    <div>
                      <div className="n">{user.first_name} {user.last_name}</div>
                      <div className="d">{user.email}</div>
                    </div>
                    <span className="pill amber">Invited</span>
                  </div>
                )) : (
                <div className="state-copy">No pending invitations.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Employees</h3>
          <span className="hint">Create, update, and delete company users.</span>
        </div>
        <div className="overflow-x-auto">
          {users.length === 0 ? (
            <div className="card-body">
              <div className="state-block">
                <div className="state-title">No employees yet</div>
                <div className="state-copy">Use “Add user” to send the first invitation.</div>
              </div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Groups</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="font-medium">{user.first_name} {user.last_name}</div>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.department}</td>
                    <td>{user.role}</td>
                    <td>
                      {user.groups?.length ? (
                        <div className="users-group-list">
                          {user.groups.map((group) => (
                            <span className="users-group-chip" key={`${user.id}-${group}`}>
                              {group}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="users-group-empty">No groups</span>
                      )}
                    </td>
                    <td>
                      <span className={`pill ${getStatusTone(user.account_status)}`}>
                        {user.account_status}
                      </span>
                    </td>
                    <td className="mono">{formatDate(user.created_at)}</td>
                    <td>
                      <div className="users-table-actions">
                        <button type="button" className="btn" onClick={() => openEditModal(user)}>
                          Update
                        </button>
                        <button
                          type="button"
                          className="btn"
                          onClick={() => handleDelete(user)}
                          disabled={deletingUserId === user.id}
                        >
                          {deletingUserId === user.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modalOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={closeModal}>
          <div
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-label={editingUser ? 'Update user' : 'Add user'}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="card-head">
              <h3>{editingUser ? 'Update user' : 'Add user'}</h3>
              <span className="hint">
                {editingUser
                  ? 'Edit employee details and keep directory data current.'
                  : 'Create a user and send an invitation email with an activation link.'}
              </span>
            </div>
            <form className="card-body users-form" onSubmit={handleSubmit}>
              <label className="field">
                <span>First name</span>
                <input
                  name="first_name"
                  type="text"
                  value={form.first_name}
                  onChange={updateField}
                  required
                />
              </label>

              <label className="field">
                <span>Last name</span>
                <input
                  name="last_name"
                  type="text"
                  value={form.last_name}
                  onChange={updateField}
                  required
                />
              </label>

              <label className="field">
                <span>Email</span>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={updateField}
                  required
                />
              </label>

              <label className="field">
                <span>Department</span>
                <input
                  name="department"
                  type="text"
                  value={form.department}
                  onChange={updateField}
                  required
                />
              </label>

              <label className="field">
                <span>Role</span>
                <input
                  name="role"
                  type="text"
                  value={form.role}
                  onChange={updateField}
                  required
                />
              </label>

              <div className="field">
                <span>Groups</span>
                {availableGroups.length > 0 ? (
                  <div className="users-group-picker">
                    {availableGroups.map((group) => {
                      const checked = form.groups.includes(group)
                      return (
                        <label className={`users-group-option${checked ? ' selected' : ''}`} key={group}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleGroupSelection(group)}
                          />
                          <span>{group}</span>
                        </label>
                      )
                    })}
                  </div>
                ) : (
                  <div className="users-group-empty-state">
                    No inventory groups found. Create groups in Inventory first.
                  </div>
                )}
              </div>

              {formError ? <div className="auth-error">{formError}</div> : null}

              <div className="users-modal-actions">
                <button type="button" className="btn" onClick={closeModal} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn primary" disabled={submitting}>
                  {submitting
                    ? (editingUser ? 'Saving...' : 'Creating...')
                    : (editingUser ? 'Save changes' : 'Create user')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
