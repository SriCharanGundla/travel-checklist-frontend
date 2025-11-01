import { create } from 'zustand'
import * as expenseService from '../services/expenseService'

export const useExpensesStore = create((set, get) => ({
  expenses: [],
  isLoading: false,
  error: null,

  fetchExpenses: async (tripId, params) => {
    set({ isLoading: true, error: null })
    try {
      const expenses = await expenseService.getExpenses(tripId, params)
      set({ expenses, isLoading: false })
      return expenses
    } catch (error) {
      set({ isLoading: false, error })
      throw error
    }
  },

  addExpense: async (tripId, payload) => {
    const expense = await expenseService.createExpense(tripId, payload)
    set((state) => ({
      expenses: [expense, ...state.expenses],
    }))
    return expense
  },

  updateExpense: async (tripId, expenseId, payload) => {
    const updated = await expenseService.updateExpense(tripId, expenseId, payload)
    set((state) => ({
      expenses: state.expenses.map((expense) =>
        expense.id === expenseId ? { ...expense, ...updated } : expense
      ),
    }))
    return updated
  },

  removeExpense: async (tripId, expenseId) => {
    await expenseService.deleteExpense(tripId, expenseId)
    set((state) => ({
      expenses: state.expenses.filter((expense) => expense.id !== expenseId),
    }))
  },
}))
