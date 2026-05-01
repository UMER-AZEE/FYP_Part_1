const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const TOKEN_STORAGE_KEY = 'centurion.auth.token'

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const body = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const message = typeof body === 'string' ? body : body?.detail || body?.message
    throw new Error(message || `Request failed with status ${response.status}`)
  }

  return body
}

export function getAuthToken() {
  return window.localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function setAuthToken(token) {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

export function clearAuthToken() {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export async function apiRequest(path, options = {}) {
  const token = options.token ?? getAuthToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  })

  return parseResponse(response)
}
