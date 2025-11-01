import { create } from 'zustand'
import * as documentService from '../services/documentService'

export const useDocumentsStore = create((set) => ({
  documents: [],
  isLoading: false,
  error: null,

  fetchDocuments: async (tripId) => {
    set({ isLoading: true, error: null })
    try {
      const documents = await documentService.getTripDocuments(tripId)
      set({ documents, isLoading: false })
      return documents
    } catch (error) {
      set({ isLoading: false, error })
      throw error
    }
  },

  addDocument: async (tripId, travelerId, payload) => {
    await documentService.createDocument(travelerId, payload)
    const documents = await documentService.getTripDocuments(tripId)
    set({ documents })
    return documents
  },

  updateDocument: async (tripId, documentId, payload) => {
    await documentService.updateDocument(documentId, payload)
    const documents = await documentService.getTripDocuments(tripId)
    set({ documents })
    return documents
  },

  removeDocument: async (tripId, documentId) => {
    await documentService.deleteDocument(documentId)
    const documents = await documentService.getTripDocuments(tripId)
    set({ documents })
    return documents
  },
}))
