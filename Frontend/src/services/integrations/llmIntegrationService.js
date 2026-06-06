import { apiRequest } from '../api/client'

export async function fetchLLMIntegrations() {
  const payload = await apiRequest('/integrations')
  return payload.integrations || []
}

export async function fetchAvailableLLMModels(formData) {
  return apiRequest('/integrations/available-models', {
    method: 'POST',
    body: JSON.stringify(formData),
  })
}

export async function createLLMIntegration(formData) {
  return apiRequest('/integrations', {
    method: 'POST',
    body: JSON.stringify(formData),
  })
}

export async function updateLLMIntegration(integrationId, formData) {
  return apiRequest(`/integrations/${integrationId}`, {
    method: 'PUT',
    body: JSON.stringify(formData),
  })
}

export async function deleteLLMIntegration(integrationId) {
  return apiRequest(`/integrations/${integrationId}`, {
    method: 'DELETE',
  })
}
