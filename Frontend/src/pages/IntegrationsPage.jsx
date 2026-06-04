import { useEffect, useState } from 'react'

import { ErrorState, LoadingState } from '../components/DataState'
import { getDashboardData } from '../services/dashboard/dashboardService'
import {
  createLLMIntegration,
  deleteLLMIntegration,
  fetchAvailableLLMModels,
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

function getModelPreview(models, limit = 4) {
  return {
    visibleModels: models.slice(0, limit),
    hiddenCount: Math.max(0, models.length - limit),
    fullList: models.join(', '),
  }
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
  const [availableModels, setAvailableModels] = useState([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [modelsError, setModelsError] = useState('')

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

  function openCreateModal(providerId = '') {
    setEditingIntegration(null)
    setForm({
      ...emptyForm,
      provider: providerId,
      policy_name: policyOptions[0] || '',
      models: [],
    })
    setFormError('')
    setAvailableModels([])
    setModelsError('')
    setModelsLoading(false)
    setModalOpen(true)
  }

  useEffect(() => {
    if (!openCreateIntegration) return

    const timer = window.setTimeout(() => {
      setEditingIntegration(null)
      setForm({
        ...emptyForm,
        provider: '',
        policy_name: policyOptions[0] || '',
        models: [],
      })
      setFormError('')
      setAvailableModels([])
      setModelsError('')
      setModelsLoading(false)
      setModalOpen(true)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [openCreateIntegration, policyOptions])

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
    setAvailableModels([])
    setModelsError('')
    setModelsLoading(false)
    setModalOpen(true)
  }

  const closeModal = () => {
    if (submitting) return
    setModalOpen(false)
    setEditingIntegration(null)
    setForm(emptyForm)
    setFormError('')
    setAvailableModels([])
    setModelsError('')
    setModelsLoading(false)
    if (window.location.hash === '#integrations?modal=add') {
      window.location.hash = 'integrations'
    }
  }

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const selectProvider = (providerId) => {
    setForm((current) => ({
      ...current,
      provider: providerId,
      api_key: '',
      models: [],
    }))
    setAvailableModels([])
    setModelsError('')
    setModelsLoading(false)
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

  const loadAvailableModels = async (force = false) => {
    if (!form.provider) {
      setModelsError('Select a provider first')
      return
    }

    if (form.provider !== 'ollama' && !form.api_key.trim()) {
      setModelsError('Enter the API key first')
      return
    }

    if (!force && modelsLoading) {
      return
    }

    setModelsLoading(true)
    setModelsError('')

    try {
      const response = await fetchAvailableLLMModels({
        provider: form.provider,
        api_key: form.api_key,
      })
      setAvailableModels(response.models || [])
      setForm((current) => {
        const allowed = new Set((response.models || []).map((model) => model.toLowerCase()))
        const preserved = current.models.filter((model) => allowed.has(model.toLowerCase()))
        return {
          ...current,
          models: preserved,
        }
      })
    } catch (requestError) {
      setAvailableModels([])
      setModelsError(requestError.message)
    } finally {
      setModelsLoading(false)
    }
  }

  useEffect(() => {
    if (!modalOpen || !form.provider) return
    if (form.provider !== 'ollama' && !form.api_key.trim()) return

    let active = true

    async function loadAvailableModelsOnTimer() {
      if (modelsLoading) {
        return
      }

      setModelsLoading(true)
      setModelsError('')

      try {
        const response = await fetchAvailableLLMModels({
          provider: form.provider,
          api_key: form.api_key,
        })
        if (!active) return

        setAvailableModels(response.models || [])
        setForm((current) => {
          const allowed = new Set((response.models || []).map((model) => model.toLowerCase()))
          const preserved = current.models.filter((model) => allowed.has(model.toLowerCase()))
          return {
            ...current,
            models: preserved,
          }
        })
      } catch (requestError) {
        if (!active) return
        setAvailableModels([])
        setModelsError(requestError.message)
      } finally {
        if (active) {
          setModelsLoading(false)
        }
      }
    }

    const timer = window.setTimeout(() => {
      loadAvailableModelsOnTimer()
    }, 450)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [form.provider, form.api_key, modalOpen, modelsLoading])

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
                {integrations.map((integration) => {
                  const { visibleModels, hiddenCount, fullList } = getModelPreview(integration.models)

                  return (
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
                        <div className="integration-model-summary" title={fullList}>
                          {visibleModels.map((model) => (
                            <span className="integration-model-chip" key={`${integration.id}-${model}`}>
                              {model}
                            </span>
                          ))}
                          {hiddenCount > 0 ? (
                            <span className="integration-model-chip more">+{hiddenCount} more</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="mono integration-secret-preview">{integration.masked_api_key}</td>
                      <td className="mono integration-updated-cell">{formatDate(integration.updated_at)}</td>
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
                  )
                })}
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
                {selectedProvider ? (
                  <div className={`integration-provider-card selected tone-${selectedProvider.tone}`}>
                    <div className="integration-provider-head">
                      <div className={`integration-provider-logo tone-${selectedProvider.tone}`}>
                        {selectedProvider.logo}
                      </div>
                      <div>
                        <div className="integration-provider-name">{selectedProvider.label}</div>
                        <div className="integration-provider-copy">
                          Only {selectedProvider.label} models will be shown below
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
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
                )}
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
                  onBlur={() => {
                    if (form.provider) {
                      loadAvailableModels(true)
                    }
                  }}
                  placeholder={editingIntegration ? 'Leave blank to keep current API key' : 'Paste provider API key'}
                  required={!editingIntegration && form.provider !== 'ollama'}
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
                    {availableModels.map((model) => (
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
                {selectedProvider && availableModels.length === 0 && !modelsLoading ? (
                  <div className="state-copy">
                    {form.provider === 'ollama'
                      ? 'Select Ollama and we will load local models automatically.'
                      : 'Enter the provider API key to load available models.'}
                  </div>
                ) : null}
                {modelsLoading ? <div className="state-copy">Loading available models…</div> : null}
                {modelsError ? <div className="auth-error">{modelsError}</div> : null}
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
