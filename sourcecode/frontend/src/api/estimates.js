import api from './client'

export const getEstimateByJob = async jobCardId => {
    try {
        return await api.get(`/estimates/job/${jobCardId}`)
    } catch (err) {
        if (err.response?.status === 404) return { data: null }
        throw err
    }
}
export const getEstimate = id => api.get(`/estimates/${id}`)
export const createEstimate = data => api.post('/estimates', data)
export const listEstimates = () => api.get('/estimates')
export const approveEstimate = id => api.post(`/estimates/${id}/approve`)
export const rejectEstimate = id => api.post(`/estimates/${id}/reject`)
export const updateEstimate = (id, data) => api.put(`/estimates/${id}`, data)
