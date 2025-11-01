import api from './api'

const parseResponse = (response) => response.data?.data

export const register = async (payload) => {
  const response = await api.post('/v1/auth/register', payload)
  return parseResponse(response)
}

export const login = async (payload) => {
  const response = await api.post('/v1/auth/login', payload)
  return parseResponse(response)
}

export const refresh = async (refreshToken) => {
  const response = await api.post('/v1/auth/refresh', { refreshToken })
  return parseResponse(response)
}

export const logout = async ({ refreshToken }) => {
  if (!refreshToken) return
  await api.post('/v1/auth/logout', { refreshToken })
}

export const getProfile = async () => {
  const response = await api.get('/v1/auth/me')
  return response.data?.data
}

export const requestPasswordReset = async (payload) => {
  await api.post('/v1/auth/password/forgot', payload)
}

export const resetPassword = async (payload) => {
  const response = await api.post('/v1/auth/password/reset', payload)
  return parseResponse(response)
}

export default {
  register,
  login,
  refresh,
  logout,
  getProfile,
  requestPasswordReset,
  resetPassword,
}
