import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import toast from 'react-hot-toast'
import authService from '../services/authService'
import collaboratorService from '../services/collaboratorService'

export const AuthContext = createContext(null)

const PENDING_INVITE_STORAGE_KEY = 'pendingInviteToken'

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

  const processInviteToken = useCallback(
    async (token, { silent = false } = {}) => {
      if (!token) {
        return null
      }

      try {
        const collaborator = await collaboratorService.acceptInvitation(token)
        localStorage.removeItem(PENDING_INVITE_STORAGE_KEY)

        if (!silent) {
          const tripName = collaborator?.trip?.name || 'the trip'
          toast.success(`You now have access to ${tripName}!`)
        }

        return collaborator
      } catch (error) {
        if (!silent) {
          const message = error.response?.data?.error?.message || 'Unable to accept invitation.'
          toast.error(message)
        }

        if (error.response?.status && error.response.status !== 429) {
          localStorage.removeItem(PENDING_INVITE_STORAGE_KEY)
        }

        throw error
      }
    },
    []
  )

  const claimPendingInviteIfNeeded = useCallback(
    async (currentUser = user) => {
      const pendingToken = localStorage.getItem(PENDING_INVITE_STORAGE_KEY)
      if (!pendingToken || !currentUser) {
        return
      }

      try {
        await processInviteToken(pendingToken)
      } catch (error) {
        console.error('Pending invite acceptance failed', error)
      }
    },
    [processInviteToken, user]
  )

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

  useEffect(() => {
    if (!loading && user) {
      claimPendingInviteIfNeeded(user)
    }
  }, [loading, user, claimPendingInviteIfNeeded])

  const login = useCallback(
    async (credentials) => {
      setLoading(true)
      try {
        const { user: userData, tokens } = await authService.login(credentials)
        localStorage.setItem('accessToken', tokens.accessToken)
        localStorage.setItem('refreshToken', tokens.refreshToken)
        setUser(userData)
        toast.success('Welcome back!')
        claimPendingInviteIfNeeded(userData)
        return userData
      } finally {
        setLoading(false)
      }
    },
    [claimPendingInviteIfNeeded]
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
        claimPendingInviteIfNeeded(userData)
        return userData
      } finally {
        setLoading(false)
      }
    },
    [claimPendingInviteIfNeeded]
  )

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      setUser,
      processInviteToken,
    }),
    [user, loading, login, register, logout, processInviteToken]
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
