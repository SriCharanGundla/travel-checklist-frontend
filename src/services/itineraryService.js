import api from './api'

const extract = (response) => response.data?.data

export const getItineraryItems = async (tripId, params = {}) => {
  const response = await api.get(`/v1/trips/${tripId}/itinerary`, { params })
  return extract(response) || []
}

export const createItineraryItem = async (tripId, payload) => {
  const response = await api.post(`/v1/trips/${tripId}/itinerary`, payload)
  return extract(response)
}

export const updateItineraryItem = async (tripId, itemId, payload) => {
  const response = await api.patch(`/v1/trips/${tripId}/itinerary/${itemId}`, payload)
  return extract(response)
}

export const deleteItineraryItem = async (tripId, itemId) => {
  await api.delete(`/v1/trips/${tripId}/itinerary/${itemId}`)
}

export default {
  getItineraryItems,
  createItineraryItem,
  updateItineraryItem,
  deleteItineraryItem,
}
