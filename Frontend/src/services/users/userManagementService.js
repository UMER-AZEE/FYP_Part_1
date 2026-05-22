import { apiRequest } from '../api/client'

export async function fetchManagedUsers() {
  const payload = await apiRequest('/users')
  return payload.users || []
}

export async function createManagedUser(formData) {
  return apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify(formData),
  })
}

export async function updateManagedUser(userId, formData) {
  return apiRequest(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(formData),
  })
}

export async function deleteManagedUser(userId) {
  return apiRequest(`/users/${userId}`, {
    method: 'DELETE',
  })
}
