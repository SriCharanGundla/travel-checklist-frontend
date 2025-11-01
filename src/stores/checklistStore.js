import { create } from 'zustand'
import * as checklistService from '../services/checklistService'

export const useChecklistStore = create((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,

  fetchBoard: async (tripId) => {
    set({ isLoading: true, error: null })
    try {
      const categories = await checklistService.getChecklistBoard(tripId)
      set({ categories, isLoading: false })
      return categories
    } catch (error) {
      set({ isLoading: false, error })
      throw error
    }
  },

  createCategory: async (tripId, payload) => {
    const category = await checklistService.createCategory(tripId, payload)
    set((state) => ({
      categories: [...state.categories, { ...category, items: [] }],
    }))
    return category
  },

  updateCategory: async (tripId, categoryId, payload) => {
    const category = await checklistService.updateCategory(tripId, categoryId, payload)
    set((state) => ({
      categories: state.categories.map((existing) =>
        existing.id === categoryId ? { ...existing, ...category } : existing
      ),
    }))
    return category
  },

  deleteCategory: async (tripId, categoryId) => {
    await checklistService.deleteCategory(tripId, categoryId)
    set((state) => ({
      categories: state.categories.filter((category) => category.id !== categoryId),
    }))
  },

  createItem: async (categoryId, payload) => {
    const item = await checklistService.createItem(categoryId, payload)
    set((state) => ({
      categories: state.categories.map((category) =>
        category.id === categoryId
          ? { ...category, items: [...(category.items || []), item] }
          : category
      ),
    }))
    return item
  },

  updateItem: async (itemId, payload) => {
    const item = await checklistService.updateItem(itemId, payload)
    set((state) => ({
      categories: state.categories.map((category) => ({
        ...category,
        items: (category.items || []).map((existing) =>
          existing.id === itemId ? { ...existing, ...item } : existing
        ),
      })),
    }))
    return item
  },

  toggleItemCompletion: async (itemId, completed) => {
    const item = await checklistService.setItemCompletion(itemId, completed)
    set((state) => ({
      categories: state.categories.map((category) => ({
        ...category,
        items: (category.items || []).map((existing) =>
          existing.id === itemId ? { ...existing, ...item } : existing
        ),
      })),
    }))
    return item
  },

  deleteItem: async (itemId) => {
    await checklistService.deleteItem(itemId)
    set((state) => ({
      categories: state.categories.map((category) => ({
        ...category,
        items: (category.items || []).filter((item) => item.id !== itemId),
      })),
    }))
  },

  getItemById: (itemId) => {
    const { categories } = get()
    for (const category of categories) {
      const item = (category.items || []).find((entry) => entry.id === itemId)
      if (item) {
        return item
      }
    }
    return null
  },
}))

