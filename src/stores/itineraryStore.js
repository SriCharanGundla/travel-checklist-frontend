import { create } from 'zustand'
import * as itineraryService from '../services/itineraryService'

export const useItineraryStore = create((set) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchItems: async (tripId, params) => {
    set({ isLoading: true, error: null })
    try {
      const items = await itineraryService.getItineraryItems(tripId, params)
      set({ items, isLoading: false })
      return items
    } catch (error) {
      set({ isLoading: false, error })
      throw error
    }
  },

  addItem: async (tripId, payload) => {
    const item = await itineraryService.createItineraryItem(tripId, payload)
    set((state) => ({
      items: [...state.items, item].sort(sortItineraryItems),
    }))
    return item
  },

  updateItem: async (tripId, itemId, payload) => {
    const updated = await itineraryService.updateItineraryItem(tripId, itemId, payload)
    set((state) => ({
      items: state.items
        .map((item) => (item.id === itemId ? { ...item, ...updated } : item))
        .sort(sortItineraryItems),
    }))
    return updated
  },

  removeItem: async (tripId, itemId) => {
    await itineraryService.deleteItineraryItem(tripId, itemId)
    set((state) => ({
      items: state.items.filter((item) => item.id !== itemId),
    }))
  },
}))

const sortItineraryItems = (a, b) => {
  const startA = a.startTime ? new Date(a.startTime).getTime() : Number.POSITIVE_INFINITY
  const startB = b.startTime ? new Date(b.startTime).getTime() : Number.POSITIVE_INFINITY

  if (startA !== startB) {
    return startA - startB
  }

  return (a.sortOrder || 0) - (b.sortOrder || 0)
}
