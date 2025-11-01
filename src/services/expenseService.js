import api from './api'

const extract = (response) => response.data?.data

export const getExpenses = async (tripId, params = {}) => {
  const response = await api.get(`/v1/trips/${tripId}/expenses`, { params })
  return extract(response) || []
}

export const createExpense = async (tripId, payload) => {
  const response = await api.post(`/v1/trips/${tripId}/expenses`, payload)
  return extract(response)
}

export const updateExpense = async (tripId, expenseId, payload) => {
  const response = await api.patch(`/v1/trips/${tripId}/expenses/${expenseId}`, payload)
  return extract(response)
}

export const deleteExpense = async (tripId, expenseId) => {
  await api.delete(`/v1/trips/${tripId}/expenses/${expenseId}`)
}

export default {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
}
