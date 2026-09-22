import { useEffect, useState } from 'react'

import { ErrorState, LoadingState } from '../components/DataState'
import { loadInventoryGroups } from '../services/inventory/inventoryService'
import {
  executePromptWorkspaceRun,
  fetchPromptWorkspaceContext,
  fetchPromptWorkspaceRuns,
} from '../services/promptWorkspace/promptWorkspaceService'

const emptyForm = {
  integration_id: '',
  model: '',
  prompt: '',
  system_prompt: 'You are a careful enterprise AI assistant. Be concise, accurate, and policy-aware.',
  selected_groups: [],
}

function resolveLocalGroups(currentUserGroups = []) {
  return Array.from(
    new Set([
      ...loadInventoryGroups().map((group) => group?.name?.trim()).filter(Boolean),
      ...currentUserGroups.map((group) => group?.trim()).filter(Boolean),
    ]),
  ).sort((left, right) => left.localeCompare(right))
}

function formatDateTime(value) {
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatProviderName(provider) {
  return provider
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ')
}

function getStatusTone(status) {
  return status === 'completed' ? 'green' : 'rose'
}

function getRunBucket(value) {
  const createdAt = new Date(value)
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const runStart = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate())
  const diffDays = Math.floor((todayStart - runStart) / 86400000)

  if (diffDays <= 0) return 'Today'
  if (diffDays <= 7) return 'Last 7 Days'
  if (diffDays <= 30) return 'Last 30 Days'
  return 'Older'
}

function groupRunsByDate(runs) {
  const order = ['Today', 'Last 7 Days', 'Last 30 Days', 'Older']
  const grouped = order.map((label) => ({ label, runs: [] }))

  runs.forEach((run) => {
    const bucket = getRunBucket(run.created_at)
    const section = grouped.find((group) => group.label === bucket)
    section.runs.push(run)
  })

  return grouped.filter((group) => group.runs.length > 0)
}

function summarizePrompt(prompt = '') {
  const cleaned = prompt.trim().replace(/\s+/g, ' ')
  return cleaned.length > 82 ? `${cleaned.slice(0, 82)}...` : cleaned
}

export default function PromptStudioPage({ currentUser }) {
  const [integrations, setIntegrations] = useState([])
  const [runs, setRuns] = useState([])
  const [availableGroups, setAvailableGroups] = useState(() => resolveLocalGroups(currentUser?.groups || []))
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    selected_groups: Array.isArray(currentUser?.groups) ? currentUser.groups : [],
  }))
  const [latestRun, setLatestRun] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const selectedIntegration = integrations.find((integration) => integration.id === form.integration_id) || null
  const selectedModels = selectedIntegration?.models || []
  const totalRuns = runs.length
  const failedRuns = runs.filter((run) => run.status === 'failed').length
  const groupedRuns = groupRunsByDate(runs)

  useEffect(() => {
    let active = true

    async function loadWorkspace() {
      try {
        setLoading(true)
        const [contextPayload, runPayload] = await Promise.all([
          fetchPromptWorkspaceContext(),
          fetchPromptWorkspaceRuns(),
        ])

        if (!active) return

        const nextIntegrations = contextPayload.integrations || []
        const nextRuns = runPayload || []
        const nextGroups = resolveLocalGroups(currentUser?.groups || [])

        setIntegrations(nextIntegrations)
        setRuns(nextRuns)
        setAvailableGroups(nextGroups)
        setLatestRun(nextRuns[0] || null)
        setForm((current) => {
          const fallbackIntegration = nextIntegrations[0] || null
          const currentIntegration =
            nextIntegrations.find((integration) => integration.id === current.integration_id) || fallbackIntegration
          const nextModel =
            currentIntegration?.models.includes(current.model)
              ? current.model
              : currentIntegration?.models[0] || ''

          return {
            ...current,
            integration_id: currentIntegration?.id || '',
            model: nextModel,
            selected_groups: current.selected_groups.length
              ? current.selected_groups
              : (Array.isArray(currentUser?.groups) ? currentUser.groups : []),
          }
        })
        setError(null)
      } catch (requestError) {
        if (active) {
          setError(requestError)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadWorkspace()

    return () => {
      active = false
    }
  }, [currentUser])

  const updateField = (event) => {
    const { name, value } = event.target

    if (name === 'integration_id') {
      const nextIntegration = integrations.find((integration) => integration.id === value) || null
      setForm((current) => ({
        ...current,
        integration_id: value,
        model: nextIntegration?.models[0] || '',
      }))
      return
    }

    setForm((current) => ({ ...current, [name]: value }))
  }

  const toggleGroup = (groupName) => {
    setForm((current) => ({
      ...current,
      selected_groups: current.selected_groups.includes(groupName)
        ? current.selected_groups.filter((group) => group !== groupName)
        : [...current.selected_groups, groupName],
    }))
  }

  const startNewPrompt = () => {
    setSubmitError('')
    setLatestRun(null)
    setForm((current) => ({
      ...current,
      prompt: '',
      system_prompt: emptyForm.system_prompt,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setSubmitError('')

    try {
      const payload = {
        integration_id: form.integration_id,
        model: form.model,
        prompt: form.prompt,
        system_prompt: form.system_prompt,
        selected_groups: form.selected_groups,
      }

      const response = await executePromptWorkspaceRun(payload)
      const nextRun = response.run

      setLatestRun(nextRun)
      setRuns((current) => [nextRun, ...current.filter((run) => run.id !== nextRun.id)].slice(0, 20))
    } catch (requestError) {
      setSubmitError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <LoadingState
        title="Loading prompt workspace…"
        copy="Loading integrations, recent runs, and the active workspace context."
      />
    )
  }

  if (error) {
    return <ErrorState error={error} title="Could not load prompt workspace" />
  }

  if (integrations.length === 0) {
    return (
      <div className="card">
        <div className="card-head">
          <h3>Prompt Studio</h3>
          <span className="hint">A workspace needs at least one configured provider before prompts can run.</span>
        </div>
        <div className="card-body">
          <div className="state-block">
            <div className="state-title">No integrations available</div>
            <div className="state-copy">
              A manager needs to add an LLM integration first, then this workspace can send prompts and track responses.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="prompt-chat-shell">
      <aside className="prompt-history-panel">
        <div className="prompt-history-head">
          <div>
            <div className="prompt-history-title">History <span aria-hidden="true">?</span></div>
            <div className="prompt-history-count">{totalRuns} runs, {failedRuns} failed</div>
          </div>
          <button type="button" className="prompt-history-new" onClick={startNewPrompt} aria-label="Start a new prompt">
            +
          </button>
        </div>

        <div className="prompt-history-scroll">
          {groupedRuns.length > 0 ? groupedRuns.map((section) => (
            <section className="prompt-history-section" key={section.label}>
              <h4>{section.label}</h4>
              {section.runs.map((run) => (
                <button
                  type="button"
                  className={`prompt-history-item${latestRun?.id === run.id ? ' active' : ''}`}
                  key={run.id}
                  onClick={() => setLatestRun(run)}
                >
                  <span>{summarizePrompt(run.prompt)}</span>
                  <small>{formatProviderName(run.provider)} | {run.model}</small>
                  {run.status === 'failed' ? <em>Violations: 1</em> : null}
                </button>
              ))}
            </section>
          )) : (
            <div className="prompt-history-empty">
              <strong>No prompt history yet</strong>
              <span>Runs will appear here after your first prompt.</span>
            </div>
          )}
        </div>
      </aside>

      <section className="prompt-chat-main">
        <div className="prompt-transcript-card">
          {latestRun ? (
            <div className="prompt-answer">
              <div className="prompt-answer-meta">
                <span className={`pill ${getStatusTone(latestRun.status)}`}>{latestRun.status}</span>
                <span>{formatProviderName(latestRun.provider)}</span>
                <span>{latestRun.model}</span>
                <span>{formatDateTime(latestRun.created_at)}</span>
              </div>

              {latestRun.status === 'failed' ? (
                <div className="prompt-failure-banner compact">
                  <strong>Your request failed before a normal answer was returned.</strong>
                  <span>{latestRun.error_message || 'The provider did not accept the request.'}</span>
                </div>
              ) : null}

              <pre className="prompt-answer-text">
                {latestRun.response_text || latestRun.error_message || 'No output returned.'}
              </pre>

              <div className="prompt-answer-footer">
                <span>Policy: {latestRun.policy_name || '--'}</span>
                <span>Groups: {latestRun.selected_groups.length ? latestRun.selected_groups.join(', ') : 'none'}</span>
                <span>Tokens: {latestRun.total_tokens ?? '--'}</span>
                <span>Latency: {latestRun.latency_ms ?? '--'} ms</span>
              </div>
            </div>
          ) : (
            <div className="prompt-empty-answer">
              <strong>Start a prompt to see the answer here.</strong>
              <span>Select the account and model below, then write your prompt.</span>
            </div>
          )}
        </div>

        <form className="prompt-input-card" onSubmit={handleSubmit}>
          <label className="prompt-input-label" htmlFor="prompt-workspace-input">
            Where should I begin? <span>*</span>
          </label>
          <textarea
            id="prompt-workspace-input"
            className="prompt-chat-input"
            name="prompt"
            rows="5"
            value={form.prompt}
            onChange={updateField}
            placeholder="Ask anything..."
            required
          />

          {availableGroups.length > 0 ? (
            <div className="prompt-group-strip" aria-label="Prompt groups">
              {availableGroups.map((group) => {
                const checked = form.selected_groups.includes(group)
                return (
                  <label className={`prompt-group-pill${checked ? ' selected' : ''}`} key={group}>
                    <input type="checkbox" checked={checked} onChange={() => toggleGroup(group)} />
                    <span>{group}</span>
                  </label>
                )
              })}
            </div>
          ) : null}

          {submitError ? <div className="auth-error">{submitError}</div> : null}

          <div className="prompt-input-footer">
            <div className="prompt-route-note">
              <span>Policy: {selectedIntegration?.policy_name || 'None'}</span>
            </div>
            <div className="prompt-route-controls">
              <select name="integration_id" value={form.integration_id} onChange={updateField} required aria-label="Integration">
                {integrations.map((integration) => (
                  <option key={integration.id} value={integration.id}>
                    {formatProviderName(integration.provider)} | {integration.account_name}
                  </option>
                ))}
              </select>
              <select name="model" value={form.model} onChange={updateField} required aria-label="Model">
                {selectedModels.map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
              <button type="submit" className="prompt-send-button" disabled={submitting} aria-label="Run prompt">
                {submitting ? '■' : '>'}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  )
}
