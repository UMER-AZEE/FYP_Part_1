import { apiRequest } from '../api/client'
import { mockDashboardData } from './mockDashboardData'

function shouldUseMockData() {
  const source = import.meta.env.VITE_DASHBOARD_DATA_SOURCE || 'api'
  return source !== 'api'
}

export async function getDashboardData() {
  if (shouldUseMockData()) {
    return mockDashboardData
  }

  return apiRequest('/dashboard')
}
