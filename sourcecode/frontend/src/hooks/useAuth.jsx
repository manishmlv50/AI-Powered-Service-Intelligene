import { useState, useEffect, createContext, useContext } from 'react'
import { login as apiLogin, logout as apiLogout } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('si_user')) } catch { return null }
    })

    const login = async (username, password) => {
        const { data } = await apiLogin(username, password)
        localStorage.setItem('si_token', data.token)
        localStorage.setItem('si_user', JSON.stringify(data))
        setUser(data)
        return data
    }

    const logout = async () => {
        const token = localStorage.getItem('si_token')
        try { if (token) await apiLogout(token) } catch { }
        localStorage.removeItem('si_token')
        localStorage.removeItem('si_user')
        setUser(null)
    }

    return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
