import api from './api'

const extract = (response) => response.data?.data

export const getContacts = async () => {
  const response = await api.get('/v1/traveler-directory')
  return extract(response) || []
}

export const createContact = async (payload) => {
  const response = await api.post('/v1/traveler-directory', payload)
  return extract(response)
}

export const updateContact = async (contactId, payload) => {
  const response = await api.patch(`/v1/traveler-directory/${contactId}`, payload)
  return extract(response)
}

export const deleteContact = async (contactId) => {
  await api.delete(`/v1/traveler-directory/${contactId}`)
}

export default {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
}
