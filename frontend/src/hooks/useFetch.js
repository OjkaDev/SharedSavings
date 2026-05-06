import { useState, useCallback } from 'react'

export function useFetch(initialLoading = true) {
  const [loading, setLoading] = useState(initialLoading)

  const run = useCallback(async (fn) => {
    setLoading(true)
    try {
      await fn()
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, run }
}
