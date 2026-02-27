import api from './client'

export const listCustomers = () => api.get('/customers')
export const getCustomer = id => api.get(`/customers/${id}`)
export const getVehicles = id => api.get(`/customers/${id}/vehicles`)
export const addVehicle = (id, data) => api.post(`/customers/${id}/vehicles`, data)
export const updateVehicle = (cid, vid, data) => api.put(`/customers/${cid}/vehicles/${vid}`, data)
export const getHistory = id => api.get(`/customers/${id}/history`)
export const getLatestJob = id => api.get(`/customers/${id}/latest-job`)
export const getCustomerJobs = (id, params = {}) => api.get(`/customers/${id}/jobs`, { params })
export const getCustomerJobDetail = (customerId, jobId) => api.get(`/customers/${customerId}/jobs/${jobId}`)
export const getCustomerJobEstimate = async (customerId, jobId) => {
	try {
		return await api.get(`/customers/${customerId}/jobs/${jobId}/estimate`)
	} catch (err) {
		if (err.response?.status === 404) return { data: null }
		throw err
	}
}
export const searchVehicleByVin = vin => api.get(`/customers/vehicles/search`, { params: { vin } })

