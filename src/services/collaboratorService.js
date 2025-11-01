import api from './api'

const extract = (response) => response.data?.data

const buildMeta = (response, fallback = {}) => {
  return response.data?.meta || {
    page: fallback.page ?? 1,
    limit: fallback.limit ?? 10,
    total: extract(response)?.length || 0,
    totalPages: 1,
    hasMore: false,
  }
}

export const getCollaborators = async (tripId, params = {}) => {
  const response = await api.get(`/v1/trips/${tripId}/collaborators`, { params })
  return {
    data: extract(response) || [],
    meta: buildMeta(response, params),
  }
}

export const inviteCollaborator = async (tripId, payload) => {
  const response = await api.post(`/v1/trips/${tripId}/collaborators`, payload)
  return extract(response)
}

export const resendInvitation = async (tripId, collaboratorId) => {
  const response = await api.post(
    `/v1/trips/${tripId}/collaborators/${collaboratorId}/resend`
  )
  return extract(response)
}

export const updateCollaboratorPermission = async (tripId, collaboratorId, payload) => {
  const response = await api.patch(
    `/v1/trips/${tripId}/collaborators/${collaboratorId}`,
    payload
  )
  return extract(response)
}

export const removeCollaborator = async (tripId, collaboratorId) => {
  await api.delete(`/v1/trips/${tripId}/collaborators/${collaboratorId}`)
}

export const acceptInvitation = async (token) => {
  const response = await api.post('/v1/collaborators/accept', { token })
  return extract(response)
}

export const declineInvitation = async ({ token, reason }) => {
  const response = await api.post('/v1/collaborators/decline', { token, reason })
  return extract(response)
}

export default {
  getCollaborators,
  inviteCollaborator,
  resendInvitation,
  updateCollaboratorPermission,
  removeCollaborator,
  acceptInvitation,
  declineInvitation,
}
