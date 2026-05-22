import { useEffect, useState } from 'react'

import { ErrorState, LoadingState } from '../components/DataState'
import { getDashboardData } from '../services/dashboard/dashboardService'
import {
  createLLMIntegration,
  deleteLLMIntegration,
  fetchLLMIntegrations,
  updateLLMIntegration,
} from '../services/integrations/llmIntegrationService'

const providerCatalog = [
  {
    id: 'openai',
    label: 'OpenAI',
    logo: '◎',
    tone: 'mint',
    models: ['gpt-4o', 'gpt-4.1', 'gpt-4.1-mini', 'o4-mini'],
  },
  {
    id: 'groq',
    label: 'Groq',
    logo: 'GQ',
    tone: 'amber',
    models: ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
  },
  {
    id: 'ollama',
    label: 'Ollama',
    logo: 'OL',
    tone: 'slate',
    models: ['llama3.1', 'mistral', 'qwen2.5', 'phi3'],
  },
  {
    id: 'gemini',
    label: 'Gemini',
    logo: '✦',
    tone: 'blue',
    models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'],
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    logo: 'DS',
    tone: 'violet',
    models: ['deepseek-chat', 'deepseek-reasoner'],
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    logo: 'AI',
    tone: 'sand',
    models: ['claude-3-5-sonnet-latest', 'claude-3-7-sonnet-latest', 'claude-3-haiku-20240307'],
  },
]

const providerMap = Object.fromEntries(providerCatalog.map((provider) => [provider.id, provider]))

const emptyForm = {
  provider: '',
  account_name: '',
  api_key: '',
  policy_name: '',
  models: [],
}

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function IntegrationsPage({ currentUser, openCreateIntegration = false }) {
  const [integrations, setIntegrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingIntegration, setEditingIntegration] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingIntegrationId, setDeletingIntegrationId] = useState('')
  const [policyOptions, setPolicyOptions] = useState([])

  async function loadIntegrations() {
    try {
      setLoading(true)
      const result = await fetchLLMIntegrations()
      setIntegrations(result)
      setError(null)
    } catch (requestError) {
      setError(requestError)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    async function loadIntegrationsOnMount() {
      try {
        const result = await fetchLLMIntegrations()
        if (active) {
          setIntegrations(result)
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

    loadIntegrationsOnMount()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    async function loadPolicies() {
      try {
        const dashboardData = await getDashboardData()
        if (!active) return
        const policyNames = (dashboardData?.policies || [])
          .map((policy) => policy?.name?.trim())
          .filter(Boolean)
        setPolicyOptions(policyNames)
      } catch {
        if (active) {
          setPolicyOptions([])
        }
      }
    }

    loadPolicies()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!openCreateIntegration) return

    const timer = window.setTimeout(() => {
      openCreateModal()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [openCreateIntegration])

  const openCreateModal = (providerId = '') => {
    setEditingIntegration(null)
    const provider = providerMap[providerId]
    setForm({
      ...emptyForm,
      provider: providerId,
      policy_name: policyOptions[0] || '',
      models: provider ? [provider.models[0]] : [],
    })
    setFormError('')
    setModalOpen(true)
  }

  const openEditModal = (integration) => {
    setEditingIntegration(integration)
    setForm({
      provider: integration.provider,
      account_name: integration.account_name,
      api_key: '',
      policy_name: integration.policy_name,
      models: integration.models,
    })
    setFormError('')
    setModalOpen(true)
  }

  const closeModal = () => {
    if (submitting) return
    setModalOpen(false)
    setEditingIntegration(null)
    setForm(emptyForm)
    setFormError('')
    if (window.location.hash === '#integrations?modal=add') {
      window.location.hash = 'integrations'
    }
  }

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const selectProvider = (providerId) => {
    setForm((current) => {
      const allowedModels = new Set(
        (providerMap[providerId]?.models || []).map((model) => model.toLowerCase()),
      )
      return {
        ...current,
        provider: providerId,
        models: current.models.filter((model) => allowedModels.has(model.toLowerCase())),
      }
    })
  }

  const toggleModel = (modelName) => {
    setForm((current) => ({
      ...current,
      models: current.models.includes(modelName)
        ? current.models.filter((model) => model !== modelName)
        : [...current.models, modelName],
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.provider) {
      setFormError('Select a provider')
      return
    }
    if (form.models.length === 0) {
      setFormError('Select at least one model')
      return
    }

    setSubmitting(true)
    setFormError('')

    const payload = {
      provider: form.provider,
      account_name: form.account_name,
      policy_name: form.policy_name,
      models: form.models,
      ...(editingIntegration || form.api_key ? { api_key: form.api_key } : {}),
    }

    try {
      const response = editingIntegration
        ? await updateLLMIntegration(editingIntegration.id, payload)
        : await createLLMIntegration(payload)

      setFeedback(response.message)
      setModalOpen(false)
      setEditingIntegration(null)
      setForm(emptyForm)
      setFormError('')
      await loadIntegrations()
    } catch (requestError) {
      setFormError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (integration) => {
    const providerLabel = providerMap[integration.provider]?.label || integration.provider
    const confirmed = window.confirm(`Delete ${providerLabel} integration "${integration.account_name}"?`)
    if (!confirmed) return

    setDeletingIntegrationId(integration.id)
    try {
      const response = await deleteLLMIntegration(integration.id)
      setFeedback(response.message)
      await loadIntegrations()
    } catch (requestError) {
      setError(requestError)
    } finally {
      setDeletingIntegrationId('')
    }
  }

  const selectedProvider = providerMap[form.provider]

  if (loading) {
    return (
      <LoadingState
        title="Loading LLM integrations…"
        copy="Waiting for the organization integration registry to respond."
      />
    )
  }

  if (error) {
    return <ErrorState error={error} title="Could not load LLM integrations" />
  }

  return (
    <>
      <div className="card">
        <div className="card-head">
          <h3>LLM providers</h3>
          <span className="hint">
            Click any provider to connect it for {currentUser?.company?.name || 'your organization'}.
          </span>
        </div>
        <div className="card-body">
          {feedback ? <div className="auth-success users-feedback">{feedback}</div> : null}
          <div className="integration-provider-row">
            {providerCatalog.map((provider) => (
              <button
                type="button"
                className={`integration-provider-card compact integration-provider-launch tone-${provider.tone}`}
                key={provider.id}
                onClick={() => openCreateModal(provider.id)}
              >
                <div className="integration-provider-head">
                  <div className={`integration-provider-logo tone-${provider.tone}`}>{provider.logo}</div>
                  <div>
                    <div className="integration-provider-name">{provider.label}</div>
                    <div className="integration-provider-copy">
                      {provider.models.length} models available
                    </div>
                  </div>
                </div>
                <div className="integration-provider-model-preview">
                  {provider.models.map((model) => (
                    <span className="integration-model-chip" key={`${provider.id}-${model}`}>
                      {model}
                    </span>
                  ))}
                </div>
                <div className="integration-provider-cta">Click to connect</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Integrated providers</h3>
          <span className="hint">Stored organization provider credentials and model mappings.</span>
        </div>
        <div className="overflow-x-auto">
          {integrations.length === 0 ? (
            <div className="card-body">
              <div className="state-block">
                <div className="state-title">No LLM integrations yet</div>
                <div className="state-copy">
                  Use “LLM Integration Provider” to connect your first model provider.
                </div>
              </div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Account name</th>
                  <th>Policy</th>
                  <th>Models</th>
                  <th>API key</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {integrations.map((integration) => (
                  <tr key={integration.id}>
                    <td>
                      <div className="integration-provider-inline">
                        <span className={`integration-provider-logo xs tone-${providerMap[integration.provider]?.tone || 'slate'}`}>
                          {providerMap[integration.provider]?.logo || 'AI'}
                        </span>
                        <span className="pill integration-provider-pill">
                          {providerMap[integration.provider]?.label || integration.provider}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="font-medium">{integration.account_name}</div>
                    </td>
                    <td>{integration.policy_name}</td>
                    <td>
                      <div className="integration-model-list">
                        {integration.models.map((model) => (
                          <span className="integration-model-chip" key={`${integration.id}-${model}`}>
                            {model}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="mono integration-secret-preview">{integration.masked_api_key}</td>
                    <td className="mono">{formatDate(integration.updated_at)}</td>
                    <td>
                      <div className="users-table-actions">
                        <button type="button" className="btn" onClick={() => openEditModal(integration)}>
                          Update
                        </button>
                        <button
                          type="button"
                          className="btn"
                          onClick={() => handleDelete(integration)}
                          disabled={deletingIntegrationId === integration.id}
                        >
                          {deletingIntegrationId === integration.id ? 'Deleting...' : 'Delete'}
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
            aria-label={editingIntegration ? 'Update integration' : 'Add integration'}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="card-head">
              <h3>{editingIntegration ? 'Update LLM integration' : 'Add LLM integration'}</h3>
              <span className="hint">
                Select a provider, store the organization API key, and choose the enabled models.
              </span>
            </div>
            <form className="card-body users-form" onSubmit={handleSubmit}>
              <div className="field">
                <span>Provider</span>
                <div className="integration-provider-grid">
                  {providerCatalog.map((provider) => (
                    <button
                      key={provider.id}
                      type="button"
                      className={`integration-provider-card tone-${provider.tone} ${form.provider === provider.id ? 'selected' : ''}`}
                      onClick={() => selectProvider(provider.id)}
                    >
                      <div className="integration-provider-head">
                        <div className={`integration-provider-logo tone-${provider.tone}`}>{provider.logo}</div>
                        <div>
                          <div className="integration-provider-name">{provider.label}</div>
                          <div className="integration-provider-copy">
                            {provider.models.length} selectable models
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <label className="field">
                <span>Account name</span>
                <input
                  name="account_name"
                  type="text"
                  value={form.account_name}
                  onChange={updateField}
                  placeholder="Production account"
                  required
                />
              </label>

              <label className="field">
                <span>API key</span>
                <input
                  autoComplete="off"
                  name="api_key"
                  type="password"
                  value={form.api_key}
                  onChange={updateField}
                  placeholder={editingIntegration ? 'Leave blank to keep current API key' : 'Paste provider API key'}
                  required={!editingIntegration}
                />
              </label>

              <label className="field">
                <span>Policy</span>
                <select
                  name="policy_name"
                  value={form.policy_name}
                  onChange={updateField}
                  required
                >
                  <option value="">Select a policy</option>
                  {policyOptions.map((policyName) => (
                    <option key={policyName} value={policyName}>
                      {policyName}
                    </option>
                  ))}
                </select>
              </label>

              <div className="field">
                <span>Models</span>
                {selectedProvider ? (
                  <div className="integration-model-selector">
                    {selectedProvider.models.map((model) => (
                      <label className="integration-model-option" key={model}>
                        <input
                          type="checkbox"
                          checked={form.models.includes(model)}
                          onChange={() => toggleModel(model)}
                        />
                        <span>{model}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="state-copy">Choose a provider to see its supported models.</div>
                )}
              </div>

              {formError ? <div className="auth-error">{formError}</div> : null}

              <div className="users-modal-actions">
                <button type="button" className="btn" onClick={closeModal} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn primary" disabled={submitting}>
                  {submitting
                    ? (editingIntegration ? 'Saving...' : 'Creating...')
                    : (editingIntegration ? 'Save changes' : 'Create integration')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
