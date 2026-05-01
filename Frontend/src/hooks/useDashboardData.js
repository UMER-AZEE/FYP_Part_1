import { useEffect, useState } from 'react'
import { getDashboardData } from '../services/dashboard/dashboardService'

export function useDashboardData() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function loadDashboard() {
      try {
        setLoading(true)
        const result = await getDashboardData()
        if (isMounted) {
          setData(result)
          setError(null)
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      isMounted = false
    }
  }, [])

  return { data, loading, error }
}
