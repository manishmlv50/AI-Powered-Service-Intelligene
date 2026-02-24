import api from './client'

export const advisorDashboard = (advisorId) => api.get('/dashboard/advisor', { params: { advisor_id: advisorId } })
export const managerDashboard = () => api.get('/dashboard/manager')
