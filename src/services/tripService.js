import api from './api'

const extract = (response) => response.data?.data

export const getTrips = async (params = {}) => {
  const response = await api.get('/v1/trips', { params })
  return extract(response)
}

export const getTripById = async (tripId) => {
  const response = await api.get(`/v1/trips/${tripId}`)
  return extract(response)
}

export const createTrip = async (payload) => {
  const response = await api.post('/v1/trips', payload)
  return extract(response)
}

export const updateTrip = async (tripId, payload) => {
  const response = await api.put(`/v1/trips/${tripId}`, payload)
  return extract(response)
}

export const deleteTrip = async (tripId) => {
  await api.delete(`/v1/trips/${tripId}`)
}

export const exportTripData = async (tripId, params = {}) => {
  const response = await api.get(`/v1/trips/${tripId}/export`, {
    params,
    responseType: 'blob',
  })

  return {
    blob: response.data,
    contentType: response.headers['content-type'],
    disposition: response.headers['content-disposition'],
  }
}

export default {
  getTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
  exportTripData,
}
