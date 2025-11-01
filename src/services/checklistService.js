import api from './api'

const extract = (response) => response.data?.data

export const getChecklistBoard = async (tripId) => {
  const response = await api.get(`/v1/trips/${tripId}/checklists`)
  return extract(response) || []
}

export const createCategory = async (tripId, payload) => {
  const response = await api.post(`/v1/trips/${tripId}/checklists`, payload)
  return extract(response)
}

export const updateCategory = async (tripId, categoryId, payload) => {
  const response = await api.patch(`/v1/trips/${tripId}/checklists/${categoryId}`, payload)
  return extract(response)
}

export const deleteCategory = async (tripId, categoryId) => {
  await api.delete(`/v1/trips/${tripId}/checklists/${categoryId}`)
}

export const createItem = async (categoryId, payload) => {
  const response = await api.post(`/v1/checklists/categories/${categoryId}/items`, payload)
  return extract(response)
}

export const updateItem = async (itemId, payload) => {
  const response = await api.patch(`/v1/checklists/items/${itemId}`, payload)
  return extract(response)
}

export const setItemCompletion = async (itemId, completed = true) => {
  const response = await api.post(`/v1/checklists/items/${itemId}/complete`, { completed })
  return extract(response)
}

export const deleteItem = async (itemId) => {
  await api.delete(`/v1/checklists/items/${itemId}`)
}

export default {
  getChecklistBoard,
  createCategory,
  updateCategory,
  deleteCategory,
  createItem,
  updateItem,
  setItemCompletion,
  deleteItem,
}

