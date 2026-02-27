import api from './client'

export const login = (username, password) => api.post('/auth/login', { username, password })
export const logout = token => api.post(`/auth/logout?token=${token}`)
