import api from './client'

export const listJobCards = (params) => api.get('/job-cards', { params })
export const getJobCard = id => api.get(`/job-cards/${id}`)
export const createJobCard = data => api.post('/job-cards', data)
export const updateJobCard = (id, data) => api.put(`/job-cards/${id}`, data)
export const updateStatus = (id, status) => api.post(`/job-cards/${id}/status`, { status })
export const deleteJobCard = id => api.delete(`/job-cards/${id}`)
