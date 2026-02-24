import { useState, useCallback } from 'react'
import api from '../api/client'

export function useAgent() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const call = useCallback(async (payload) => {
        setLoading(true); setError(null)
        try {
            const { data } = await api.post('/agents/master', payload)
            return data
        } catch (err) {
            setError(err.response?.data?.detail || err.message)
            return null
        } finally {
            setLoading(false)
        }
    }, [])

    return { call, loading, error }
}
