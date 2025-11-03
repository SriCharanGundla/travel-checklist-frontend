import { create } from 'zustand'
import * as travelerDirectoryService from '../services/travelerDirectoryService'

const sortContactsByName = (contacts) =>
  contacts.slice().sort((a, b) => a.fullName.localeCompare(b.fullName))

export const useTravelerDirectoryStore = create((set, get) => ({
  contacts: [],
  isLoading: false,
  hasLoaded: false,
  error: null,

  fetchContacts: async () => {
    if (get().isLoading) {
      return get().contacts
    }

    set({ isLoading: true, error: null })
    try {
      const contacts = await travelerDirectoryService.getContacts()
      set({ contacts, isLoading: false, hasLoaded: true })
      return contacts
    } catch (error) {
      set({ isLoading: false, error })
      throw error
    }
  },

  addContact: async (payload) => {
    const contact = await travelerDirectoryService.createContact(payload)
    set((state) => ({
      contacts: sortContactsByName([...state.contacts, contact]),
      hasLoaded: true,
    }))
    return contact
  },

  updateContact: async (contactId, payload) => {
    const updated = await travelerDirectoryService.updateContact(contactId, payload)
    set((state) => ({
      contacts: sortContactsByName(
        state.contacts.map((contact) => (contact.id === contactId ? { ...contact, ...updated } : contact))
      ),
      hasLoaded: true,
    }))
    return updated
  },

  removeContact: async (contactId) => {
    await travelerDirectoryService.deleteContact(contactId)
    set((state) => ({
      contacts: state.contacts.filter((contact) => contact.id !== contactId),
    }))
  },
}))
