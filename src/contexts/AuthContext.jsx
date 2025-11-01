import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import toast from 'react-hot-toast'
import authService from '../services/authService'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const clearSession = useCallback(() => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
    setLoading(false)
  }, [])

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        await authService.logout({ refreshToken })
      }
    } catch (error) {
      // Network or API errors are non-blocking during logout
      console.error('Logout error', error)
    } finally {
      clearSession()
    }
  }, [clearSession])

  const loadProfile = useCallback(async () => {
    const storedToken = localStorage.getItem('accessToken')
    if (!storedToken) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      const profile = await authService.getProfile()
      setUser(profile)
    } catch (error) {
      console.error('Failed to load profile', error)
      clearSession()
    } finally {
      setLoading(false)
    }
  }, [clearSession])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  useEffect(() => {
    const handleForcedLogout = () => {
      toast.error('Session expired. Please sign in again.')
      logout()
    }

    window.addEventListener('auth:logout', handleForcedLogout)
    return () => window.removeEventListener('auth:logout', handleForcedLogout)
  }, [logout])

  const login = useCallback(
    async (credentials) => {
      setLoading(true)
      try {
        const { user: userData, tokens } = await authService.login(credentials)
        localStorage.setItem('accessToken', tokens.accessToken)
        localStorage.setItem('refreshToken', tokens.refreshToken)
        setUser(userData)
        toast.success('Welcome back!')
        return userData
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const register = useCallback(
    async (payload) => {
      setLoading(true)
      try {
        const { user: userData, tokens } = await authService.register(payload)
        localStorage.setItem('accessToken', tokens.accessToken)
        localStorage.setItem('refreshToken', tokens.refreshToken)
        setUser(userData)
        toast.success('Account created successfully!')
        return userData
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      setUser,
    }),
    [user, loading, login, register, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
