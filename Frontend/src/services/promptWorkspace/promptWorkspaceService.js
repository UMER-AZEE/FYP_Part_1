import { apiRequest } from '../api/client'

export async function fetchPromptWorkspaceContext() {
  return apiRequest('/prompt-workspace/context')
}

export async function fetchPromptWorkspaceRuns(limit = 20) {
  const params = new URLSearchParams({ limit: String(limit) })
  const payload = await apiRequest(`/prompt-workspace/runs?${params.toString()}`)
  return payload.runs || []
}

export async function executePromptWorkspaceRun(formData) {
  return apiRequest('/prompt-workspace/run', {
    method: 'POST',
    body: JSON.stringify(formData),
  })
}
