import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const register = async (username, email, password, passwordConfirm) => {
    try {
      const data = await authAPI.register(username, email, password, passwordConfirm)
      // Handle both response formats
      if (data.tokens) {
        localStorage.setItem('access_token', data.tokens.access)
        localStorage.setItem('refresh_token', data.tokens.refresh)
      } else {
        localStorage.setItem('access_token', data.access)
        localStorage.setItem('refresh_token', data.refresh)
      }
      setIsAuthenticated(true)
      if (data.user) {
        setUser(data.user)
      }
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data
      let errorText = 'Registration failed'
      if (typeof errorMessage === 'object') {
        // Handle field errors
        const firstError = Object.values(errorMessage)[0]
        errorText = Array.isArray(firstError) ? firstError[0] : firstError
      } else if (typeof errorMessage === 'string') {
        errorText = errorMessage
      }
      return {
        success: false,
        error: errorText,
      }
    }
  }

  const login = async (username, password) => {
    try {
      const data = await authAPI.login(username, password)
      localStorage.setItem('access_token', data.access)
      localStorage.setItem('refresh_token', data.refresh)
      setIsAuthenticated(true)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed',
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setIsAuthenticated(false)
    setUser(null)
  }

  const value = {
    isAuthenticated,
    loading,
    user,
    register,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

