import { create } from 'zustand'
import * as travelerService from '../services/travelerService'

export const useTravelersStore = create((set, get) => ({
  travelers: [],
  isLoading: false,
  error: null,

  fetchTravelers: async (tripId) => {
    set({ isLoading: true, error: null })
    try {
      const travelers = await travelerService.getTravelers(tripId)
      set({ travelers, isLoading: false })
      return travelers
    } catch (error) {
      set({ isLoading: false, error })
      throw error
    }
  },

  addTraveler: async (tripId, payload) => {
    const traveler = await travelerService.createTraveler(tripId, payload)
    set((state) => ({
      travelers: [...state.travelers, traveler],
    }))
    return traveler
  },

  updateTraveler: async (tripId, travelerId, payload) => {
    const updated = await travelerService.updateTraveler(tripId, travelerId, payload)
    set((state) => ({
      travelers: state.travelers.map((traveler) =>
        traveler.id === travelerId ? { ...traveler, ...updated } : traveler
      ),
    }))
    return updated
  },

  removeTraveler: async (tripId, travelerId) => {
    await travelerService.deleteTraveler(tripId, travelerId)
    set((state) => ({
      travelers: state.travelers.filter((traveler) => traveler.id !== travelerId),
    }))
  },
}))

