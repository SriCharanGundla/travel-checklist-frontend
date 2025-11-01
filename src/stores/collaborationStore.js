import { create } from 'zustand'
import * as collaboratorService from '../services/collaboratorService'
import * as shareLinkService from '../services/shareLinkService'

const DEFAULT_PAGE_SIZE = 10

const defaultMeta = {
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
  total: 0,
  totalPages: 1,
  hasMore: false,
}

export const useCollaborationStore = create((set, get) => ({
  collaborators: [],
  collaboratorsMeta: { ...defaultMeta },
  collaboratorsLoading: false,
  collaboratorsError: null,
  shareLinks: [],
  shareLinksMeta: { ...defaultMeta },
  shareLinksLoading: false,
  shareLinksError: null,

  fetchCollaborators: async (tripId, params = {}) => {
    const currentMeta = get().collaboratorsMeta || defaultMeta
    const page = params.page || currentMeta.page || 1
    const limit = params.limit || currentMeta.limit || DEFAULT_PAGE_SIZE

    set({ collaboratorsLoading: true, collaboratorsError: null })
    try {
      const { data, meta } = await collaboratorService.getCollaborators(tripId, { page, limit })
      set({
        collaborators: data,
        collaboratorsMeta: meta || { ...defaultMeta, page, limit, total: data.length },
        collaboratorsLoading: false,
      })
      return data
    } catch (error) {
      set({ collaboratorsLoading: false, collaboratorsError: error })
      throw error
    }
  },

  inviteCollaborator: async (tripId, payload) => {
    const result = await collaboratorService.inviteCollaborator(tripId, payload)
    if (!result) return null

    const limit = get().collaboratorsMeta?.limit || DEFAULT_PAGE_SIZE
    await get().fetchCollaborators(tripId, { page: 1, limit })
    return result
  },

  resendInvitation: async (tripId, collaboratorId) => {
    return collaboratorService.resendInvitation(tripId, collaboratorId)
  },

  updateCollaboratorPermission: async (tripId, collaboratorId, payload) => {
    const updated = await collaboratorService.updateCollaboratorPermission(
      tripId,
      collaboratorId,
      payload
    )

    const meta = get().collaboratorsMeta || defaultMeta
    await get().fetchCollaborators(tripId, { page: meta.page, limit: meta.limit })
    return updated
  },

  removeCollaborator: async (tripId, collaboratorId) => {
    await collaboratorService.removeCollaborator(tripId, collaboratorId)
    const meta = get().collaboratorsMeta || defaultMeta
    await get().fetchCollaborators(tripId, { page: meta.page, limit: meta.limit })
  },

  fetchShareLinks: async (tripId, params = {}) => {
    const currentMeta = get().shareLinksMeta || defaultMeta
    const page = params.page || currentMeta.page || 1
    const limit = params.limit || currentMeta.limit || DEFAULT_PAGE_SIZE

    set({ shareLinksLoading: true, shareLinksError: null })
    try {
      const { data, meta } = await shareLinkService.getShareLinks(tripId, { page, limit })
      set({
        shareLinks: data,
        shareLinksMeta: meta || { ...defaultMeta, page, limit, total: data.length },
        shareLinksLoading: false,
      })
      return data
    } catch (error) {
      set({ shareLinksLoading: false, shareLinksError: error })
      throw error
    }
  },

  createShareLink: async (tripId, payload) => {
    const result = await shareLinkService.createShareLink(tripId, payload)
    if (!result) return null

    const limit = get().shareLinksMeta?.limit || DEFAULT_PAGE_SIZE
    await get().fetchShareLinks(tripId, { page: 1, limit })
    return result
  },

  revokeShareLink: async (tripId, shareLinkId) => {
    await shareLinkService.revokeShareLink(tripId, shareLinkId)
    const meta = get().shareLinksMeta || defaultMeta
    await get().fetchShareLinks(tripId, { page: meta.page, limit: meta.limit })
  },
}))
