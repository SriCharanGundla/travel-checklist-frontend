import api from './api'

const extract = (response) => response.data?.data

export const getTripDocuments = async (tripId) => {
  const response = await api.get(`/v1/trips/${tripId}/documents`)
  return extract(response) || []
}

export const createDocument = async (travelerId, payload) => {
  const response = await api.post(`/v1/travelers/${travelerId}/documents`, payload)
  return extract(response)
}

export const updateDocument = async (documentId, payload) => {
  const response = await api.patch(`/v1/documents/${documentId}`, payload)
  return extract(response)
}

export const deleteDocument = async (documentId) => {
  await api.delete(`/v1/documents/${documentId}`)
}

export default {
  getTripDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
}

