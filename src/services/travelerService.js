import api from './api'

const extract = (response) => response.data?.data

export const getTravelers = async (tripId) => {
  const response = await api.get(`/v1/trips/${tripId}/travelers`)
  return extract(response) || []
}

export const createTraveler = async (tripId, payload) => {
  const response = await api.post(`/v1/trips/${tripId}/travelers`, payload)
  return extract(response)
}

export const updateTraveler = async (tripId, travelerId, payload) => {
  const response = await api.patch(`/v1/trips/${tripId}/travelers/${travelerId}`, payload)
  return extract(response)
}

export const deleteTraveler = async (tripId, travelerId) => {
  await api.delete(`/v1/trips/${tripId}/travelers/${travelerId}`)
}

export default {
  getTravelers,
  createTraveler,
  updateTraveler,
  deleteTraveler,
}

