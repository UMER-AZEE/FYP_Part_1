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

function summarizeRate(runs) {
  if (!runs.length) return '--'
  const completed = runs.filter((run) => run.status === 'completed').length
  return `${Math.round((completed / runs.length) * 100)}%`
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
  const assignedGroupCount = availableGroups.length

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
    <>
      <div className="prompt-studio-hero">
        <div>
          <div className="prompt-hero-badge">Live Prompt Workspace</div>
          <h2>Prompt Studio</h2>
          <p>
            Run prompts through approved provider accounts, attach inventory groups, and inspect every response with policy context and trace metadata.
          </p>
        </div>
        <div className="prompt-hero-stats">
          <div className="prompt-hero-stat">
            <span className="prompt-meta-label">Integrations</span>
            <strong>{integrations.length}</strong>
            <div className="state-copy">Active provider routes</div>
          </div>
          <div className="prompt-hero-stat">
            <span className="prompt-meta-label">Success rate</span>
            <strong>{summarizeRate(runs)}</strong>
            <div className="state-copy">Across recent runs</div>
          </div>
          <div className="prompt-hero-stat">
            <span className="prompt-meta-label">Tagged groups</span>
            <strong>{assignedGroupCount}</strong>
            <div className="state-copy">Available for prompt scope</div>
          </div>
        </div>
      </div>

      <div className="prompt-studio-grid">
        <div className="card prompt-composer-card">
          <div className="card-head">
            <h3>Compose</h3>
            <span className="hint">Choose a provider route, set the model, then run the prompt through your approved workspace path.</span>
          </div>
          <form className="card-body prompt-layout" onSubmit={handleSubmit}>
            <div className="prompt-composer">
              <div className="prompt-form-grid">
                <label className="field">
                  <span>Integration</span>
                  <select name="integration_id" value={form.integration_id} onChange={updateField} required>
                    {integrations.map((integration) => (
                      <option key={integration.id} value={integration.id}>
                        {formatProviderName(integration.provider)} · {integration.account_name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Model</span>
                  <select name="model" value={form.model} onChange={updateField} required>
                    {selectedModels.map((model) => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </label>

              </div>

              <div className="prompt-policy-row">
                <div className="prompt-policy-card accent">
                  <span className="prompt-meta-label">Applied policy</span>
                  <strong>{selectedIntegration?.policy_name || 'None'}</strong>
                  <div className="state-copy">Inherited from the integration record used for execution.</div>
                </div>
                <div className="prompt-policy-card dark">
                  <span className="prompt-meta-label">Execution route</span>
                  <strong>{formatProviderName(selectedIntegration?.provider || '')}</strong>
                  <div className="state-copy">{selectedIntegration?.account_name || 'No account selected'}</div>
                </div>
              </div>

              <label className="field">
                <span>System prompt</span>
                <textarea
                  name="system_prompt"
                  rows="4"
                  value={form.system_prompt}
                  onChange={updateField}
                  placeholder="Add system instructions for the selected model."
                />
              </label>

              <label className="field">
                <span>User prompt</span>
                <textarea
                  className="prompt-editor"
                  name="prompt"
                  rows="10"
                  value={form.prompt}
                  onChange={updateField}
                  placeholder="Write the prompt you want the selected AI model to answer."
                  required
                />
              </label>

              <div className="field">
                <span>Groups</span>
                {availableGroups.length > 0 ? (
                  <div className="prompt-group-picker">
                    {availableGroups.map((group) => {
                      const checked = form.selected_groups.includes(group)
                      return (
                        <label className={`prompt-group-option${checked ? ' selected' : ''}`} key={group}>
                          <input type="checkbox" checked={checked} onChange={() => toggleGroup(group)} />
                          <span>{group}</span>
                        </label>
                      )
                    })}
                  </div>
                ) : (
                  <div className="state-copy">No inventory groups are defined yet. Prompts can still run without group tags.</div>
                )}
              </div>

              {submitError ? <div className="auth-error">{submitError}</div> : null}

              <div className="prompt-actions">
                <button type="button" className="btn" onClick={() => setForm({ ...emptyForm, integration_id: form.integration_id, model: form.model, selected_groups: form.selected_groups })} disabled={submitting}>
                  Reset text
                </button>
                <button type="submit" className="btn primary prompt-run-button" disabled={submitting}>
                  {submitting ? 'Running prompt…' : 'Run prompt'}
                </button>
              </div>
            </div>

            <div className="prompt-response-column">
              <div className="prompt-response-card">
                <div className="card-head">
                  <h3>{latestRun ? 'Selected run' : 'Latest response'}</h3>
                  <span className="hint">Output, failure detail, usage, and route metadata stay visible here while you iterate.</span>
                </div>
                <div className="card-body">
                  {latestRun ? (
                    <>
                      <div className="prompt-response-meta">
                        <div>
                          <span className="prompt-meta-label">Status</span>
                          <div><span className={`pill ${getStatusTone(latestRun.status)}`}>{latestRun.status}</span></div>
                        </div>
                        <div>
                          <span className="prompt-meta-label">Latency</span>
                          <div className="mono">{latestRun.latency_ms ? `${latestRun.latency_ms} ms` : '--'}</div>
                        </div>
                        <div>
                          <span className="prompt-meta-label">Tokens</span>
                          <div className="mono">{latestRun.total_tokens ?? '--'}</div>
                        </div>
                      </div>

                      {latestRun.status === 'failed' ? (
                        <div className="prompt-failure-banner">
                          <div className="prompt-response-heading">Execution failed</div>
                          <div>{latestRun.error_message || 'The provider did not accept the request.'}</div>
                          <div className="state-copy">
                            If this is a `403`, the provider account usually rejected the API key, workspace access, or model permissions for this integration.
                          </div>
                        </div>
                      ) : null}

                      <div className="prompt-response-block">
                        <div className="prompt-response-heading">Model output</div>
                        <pre className="prompt-response-text">
                          {latestRun.response_text || latestRun.error_message || 'No output returned.'}
                        </pre>
                      </div>

                      <div className="prompt-response-block">
                        <div className="prompt-response-heading">Run metadata</div>
                        <div className="prompt-metadata-grid">
                          <div>
                            <span className="prompt-meta-label">Provider</span>
                            <strong>{formatProviderName(latestRun.provider)}</strong>
                          </div>
                          <div>
                            <span className="prompt-meta-label">Model</span>
                            <strong>{latestRun.model}</strong>
                          </div>
                          <div>
                            <span className="prompt-meta-label">Policy</span>
                            <strong>{latestRun.policy_name || '--'}</strong>
                          </div>
                          <div>
                            <span className="prompt-meta-label">Groups</span>
                            <strong>{latestRun.selected_groups.length ? latestRun.selected_groups.join(', ') : 'None'}</strong>
                          </div>
                          <div>
                            <span className="prompt-meta-label">Executed by</span>
                            <strong>{latestRun.user_name || latestRun.user_email}</strong>
                          </div>
                          <div>
                            <span className="prompt-meta-label">Run time</span>
                            <strong>{formatDateTime(latestRun.created_at)}</strong>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="state-block">
                      <div className="state-title">No prompt executed yet</div>
                      <div className="state-copy">Submit the first prompt to see output, latency, and usage metadata here.</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="card prompt-history-card">
          <div className="card-head">
            <h3>Recent runs</h3>
            <span className="hint">
              {currentUser?.role?.trim().toLowerCase() === 'manager'
                ? 'Managers can review company-wide prompt history.'
                : 'Your most recent prompt executions.'}
            </span>
          </div>
          <div className="card-body prompt-run-list">
            <div className="prompt-history-summary">
              <div className="prompt-history-stat">
                <span className="prompt-meta-label">Recent runs</span>
                <strong>{totalRuns}</strong>
              </div>
              <div className="prompt-history-stat">
                <span className="prompt-meta-label">Failures</span>
                <strong>{failedRuns}</strong>
              </div>
              <div className="prompt-history-stat">
                <span className="prompt-meta-label">Current model</span>
                <strong>{form.model || '--'}</strong>
              </div>
            </div>

            {runs.length > 0 ? runs.map((run) => (
              <button
                type="button"
                className={`prompt-run-item${latestRun?.id === run.id ? ' active' : ''}`}
                key={run.id}
                onClick={() => setLatestRun(run)}
              >
                <div className="prompt-run-item-head">
                  <div>
                    <div className="font-medium">{run.user_name || run.user_email}</div>
                    <div className="prompt-run-subtitle">
                      {formatProviderName(run.provider)} · {run.model} · {run.integration_account_name}
                    </div>
                  </div>
                  <div className="prompt-run-status">
                    <span className={`pill ${getStatusTone(run.status)}`}>{run.status}</span>
                    <span className="mono">{formatDateTime(run.created_at)}</span>
                  </div>
                </div>
                <div className="prompt-run-prompt">{run.prompt}</div>
                {run.status === 'failed' && run.error_message ? (
                  <div className="prompt-run-error">{run.error_message}</div>
                ) : null}
                <div className="prompt-run-footer">
                  <span className="mono">latency {run.latency_ms ?? '--'} ms</span>
                  <span className="mono">tokens {run.total_tokens ?? '--'}</span>
                  <span>policy {run.policy_name || '--'}</span>
                  <span>groups {run.selected_groups.length ? run.selected_groups.join(', ') : 'none'}</span>
                </div>
              </button>
            )) : (
              <div className="state-block">
                <div className="state-title">No prompt history yet</div>
                <div className="state-copy">Runs will appear here as soon as prompts are executed.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
