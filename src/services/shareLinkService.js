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

export const getShareLinks = async (tripId, params = {}) => {
  const response = await api.get(`/v1/trips/${tripId}/share-links`, { params })
  return {
    data: extract(response) || [],
    meta: buildMeta(response, params),
  }
}

export const createShareLink = async (tripId, payload) => {
  const response = await api.post(`/v1/trips/${tripId}/share-links`, payload)
  return extract(response)
}

export const revokeShareLink = async (tripId, shareLinkId) => {
  await api.delete(`/v1/trips/${tripId}/share-links/${shareLinkId}`)
}

export const getShareLinkByToken = async (token) => {
  const response = await api.get(`/v1/share-links/${token}`)
  return extract(response)
}

export const performShareLinkAction = async (token, payload) => {
  const response = await api.post(`/v1/share-links/${token}/action`, payload)
  return extract(response)
}

export default {
  getShareLinks,
  createShareLink,
  revokeShareLink,
  getShareLinkByToken,
  performShareLinkAction,
}
