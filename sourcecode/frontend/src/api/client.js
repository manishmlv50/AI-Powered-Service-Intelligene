import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// Attach auth token from localStorage
api.interceptors.request.use(cfg => {
    const token = localStorage.getItem('si_token')
    if (token) cfg.headers['X-Token'] = token
    return cfg
})

export default api
