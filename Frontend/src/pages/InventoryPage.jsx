import { useDeferredValue, useState } from 'react'

import {
  createInventoryGroup,
  deleteInventoryGroup,
  dlpPolicyOptions,
  groupsToCsv,
  guardrailsPolicyOptions,
  loadInventoryGroups,
  persistInventoryGroups,
  updateInventoryGroup,
} from '../services/inventory/inventoryService'

const emptyForm = {
  name: '',
  dlpPolicy: '',
  guardrailsPolicy: '',
  description: '',
}

function normalize(value) {
  return value.trim().toLowerCase()
}

export default function InventoryPage() {
  const [groups, setGroups] = useState(() => loadInventoryGroups())
  const [form, setForm] = useState(emptyForm)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)
  const [formError, setFormError] = useState('')
  const [query, setQuery] = useState('')
  const [dlpFilter, setDlpFilter] = useState('')
  const [guardrailsFilter, setGuardrailsFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showColumns, setShowColumns] = useState(false)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [page, setPage] = useState(1)
  const [actionSelections, setActionSelections] = useState({})
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    dlpPolicy: true,
    guardrailsPolicy: true,
    description: true,
  })
  const deferredQuery = useDeferredValue(query)

  const filteredGroups = groups.filter((group) => {
    const matchesQuery =
      !deferredQuery ||
      [group.name, group.dlpPolicy, group.guardrailsPolicy, group.description]
        .join(' ')
        .toLowerCase()
        .includes(normalize(deferredQuery))

    const matchesDlp = !dlpFilter || group.dlpPolicy === dlpFilter
    const matchesGuardrails = !guardrailsFilter || group.guardrailsPolicy === guardrailsFilter

    return matchesQuery && matchesDlp && matchesGuardrails
  })

  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / rowsPerPage))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * rowsPerPage
  const pagedGroups = filteredGroups.slice(startIndex, startIndex + rowsPerPage)
  const columnsCount = Object.values(visibleColumns).filter(Boolean).length

  const writeGroups = (nextGroups) => {
    setGroups(nextGroups)
    persistInventoryGroups(nextGroups)
  }

  const openCreateModal = () => {
    setEditingGroup(null)
    setForm(emptyForm)
    setFormError('')
    setModalOpen(true)
  }

  const openEditModal = (group) => {
    setEditingGroup(group)
    setForm({
      name: group.name,
      dlpPolicy: group.dlpPolicy,
      guardrailsPolicy: group.guardrailsPolicy,
      description: group.description,
    })
    setFormError('')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingGroup(null)
    setForm(emptyForm)
    setFormError('')
  }

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const name = form.name.trim()

    if (!name) {
      setFormError('Name is required.')
      return
    }

    const duplicateGroup = groups.find(
      (group) =>
        normalize(group.name) === normalize(name) &&
        group.id !== editingGroup?.id,
    )

    if (duplicateGroup) {
      setFormError('A group with this name already exists.')
      return
    }

    if (editingGroup) {
      const nextGroups = updateInventoryGroup(groups, editingGroup.id, {
        name,
        dlpPolicy: form.dlpPolicy,
        guardrailsPolicy: form.guardrailsPolicy,
        description: form.description.trim(),
      })
      writeGroups(nextGroups)
    } else {
      const nextGroups = [
        createInventoryGroup({ ...form, name }),
        ...groups,
      ]
      writeGroups(nextGroups)
    }

    closeModal()
  }

  const handleDelete = (groupId) => {
    const nextGroups = deleteInventoryGroup(groups, groupId)
    writeGroups(nextGroups)
    setPage(1)
  }

  const handleRowAction = (group, nextAction) => {
    setActionSelections((current) => ({ ...current, [group.id]: '' }))

    if (nextAction === 'edit') {
      openEditModal(group)
      return
    }

    if (nextAction === 'delete') {
      const confirmed = window.confirm(`Delete ${group.name}?`)
      if (confirmed) {
        handleDelete(group.id)
      }
    }
  }

  const handleExport = () => {
    const csv = groupsToCsv(filteredGroups)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'inventory-groups.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const toggleColumn = (key) => {
    setVisibleColumns((current) => ({ ...current, [key]: !current[key] }))
  }

  const fromEntry = filteredGroups.length === 0 ? 0 : startIndex + 1
  const toEntry = Math.min(startIndex + rowsPerPage, filteredGroups.length)

  return (
    <>
      <div className="inventory-card">
        <div className="inventory-header">
          <div>
            <h2 className="inventory-title">Inventory</h2>
          </div>
          <div className="inventory-header-actions">
            <button type="button" className="btn inventory-add-btn" onClick={openCreateModal}>
              Add group
            </button>
            <button type="button" className="btn inventory-icon-btn" aria-label="More actions">
              ...
            </button>
          </div>
        </div>

        <div className="inventory-toolbar">
          <button type="button" className="btn" onClick={handleExport}>
            Export
          </button>

          <div className="inventory-toolbar-right">
            <label className="inventory-search">
              <span className="inventory-search-icon">Q</span>
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setPage(1)
                }}
                placeholder="Search"
              />
            </label>

            <div className="inventory-popover-wrap">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setShowFilters((current) => !current)
                  setShowColumns(false)
                }}
              >
                Filters
              </button>
              {showFilters ? (
                <div className="inventory-popover">
                  <label className="field">
                    <span>DLP policy</span>
                    <select
                      value={dlpFilter}
                      onChange={(event) => {
                        setDlpFilter(event.target.value)
                        setPage(1)
                      }}
                    >
                      <option value="">All</option>
                      {dlpPolicyOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Guardrails policy</span>
                    <select
                      value={guardrailsFilter}
                      onChange={(event) => {
                        setGuardrailsFilter(event.target.value)
                        setPage(1)
                      }}
                    >
                      <option value="">All</option>
                      {guardrailsPolicyOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null}
            </div>

            <div className="inventory-popover-wrap">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setShowColumns((current) => !current)
                  setShowFilters(false)
                }}
              >
                Columns <span className="inventory-badge">{columnsCount}</span>
              </button>
              {showColumns ? (
                <div className="inventory-popover inventory-columns-popover">
                  {[
                    ['name', 'Name'],
                    ['dlpPolicy', 'Policy'],
                    ['guardrailsPolicy', 'Guardrails policy'],
                    ['description', 'Description'],
                  ].map(([key, label]) => (
                    <label key={key} className="inventory-checkbox">
                      <input
                        type="checkbox"
                        checked={visibleColumns[key]}
                        onChange={() => toggleColumn(key)}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="inventory-table-wrap">
          <table className="inventory-table">
            <thead>
              <tr>
                {visibleColumns.name ? <th>Name</th> : null}
                {visibleColumns.dlpPolicy ? <th>Policy</th> : null}
                {visibleColumns.guardrailsPolicy ? <th>Guardrails policy</th> : null}
                {visibleColumns.description ? <th>Description</th> : null}
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pagedGroups.map((group) => (
                <tr key={group.id}>
                  {visibleColumns.name ? <td>{group.name}</td> : null}
                  {visibleColumns.dlpPolicy ? (
                    <td>
                      {group.dlpPolicy ? <span className="inventory-tag">{group.dlpPolicy}</span> : '--'}
                    </td>
                  ) : null}
                  {visibleColumns.guardrailsPolicy ? <td>{group.guardrailsPolicy || '--'}</td> : null}
                  {visibleColumns.description ? (
                    <td>
                      <div className="inventory-description">{group.description || '--'}</div>
                    </td>
                  ) : null}
                  <td>
                    <select
                      className="inventory-action-select"
                      value={actionSelections[group.id] || ''}
                      onChange={(event) => {
                        const nextAction = event.target.value
                        setActionSelections((current) => ({ ...current, [group.id]: nextAction }))
                        handleRowAction(group, nextAction)
                      }}
                    >
                      <option value="">Action</option>
                      <option value="edit">Edit</option>
                      <option value="delete">Delete</option>
                    </select>
                  </td>
                </tr>
              ))}
              {pagedGroups.length === 0 ? (
                <tr>
                  <td colSpan={columnsCount + 1}>
                    <div className="inventory-empty">
                      No groups match your current search and filters.
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="inventory-footer">
          <div className="inventory-footer-left">
            <span># of rows:</span>
            <select
              value={rowsPerPage}
              onChange={(event) => {
                setRowsPerPage(Number(event.target.value))
                setPage(1)
              }}
            >
              {[10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>
              Showing {fromEntry} to {toEntry} of {filteredGroups.length} entries
            </span>
          </div>

          <div className="inventory-pagination">
            <button
              type="button"
              className="btn"
              disabled={currentPage === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Prev
            </button>
            <span className="inventory-page-pill">{currentPage}</span>
            <button
              type="button"
              className="btn"
              disabled={currentPage === totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {modalOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={closeModal}>
          <div
            className="modal-panel inventory-modal"
            role="dialog"
            aria-modal="true"
            aria-label={editingGroup ? 'Edit group' : 'New group'}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="inventory-modal-head">
              <h3>{editingGroup ? 'Edit Group' : 'New Group'}</h3>
            </div>

            <form className="inventory-form" onSubmit={handleSubmit}>
              <label className="field">
                <span>Name *</span>
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={updateField}
                  placeholder="Enter name"
                  required
                />
              </label>

              <label className="field">
                <span>DLP policy</span>
                <select name="dlpPolicy" value={form.dlpPolicy} onChange={updateField}>
                  <option value="">Select</option>
                  {dlpPolicyOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Guardrails policy</span>
                <select
                  name="guardrailsPolicy"
                  value={form.guardrailsPolicy}
                  onChange={updateField}
                >
                  <option value="">Select</option>
                  {guardrailsPolicyOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Description</span>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={updateField}
                  placeholder="Enter a description"
                  rows={4}
                />
              </label>

              {formError ? <div className="auth-error">{formError}</div> : null}

              <div className="inventory-modal-actions">
                <button type="button" className="btn inventory-cancel-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn inventory-submit-btn">
                  {editingGroup ? 'Save' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
