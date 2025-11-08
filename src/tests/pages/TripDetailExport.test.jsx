import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import TripDetail from '../../pages/TripDetail'

const toastMock = vi.hoisted(() => {
  const promise = vi.fn((promiseOrFactory) => {
    if (typeof promiseOrFactory === 'function') {
      try {
        return promiseOrFactory()
      } catch (error) {
        return Promise.reject(error)
      }
    }
    return promiseOrFactory
  })

  return {
    success: vi.fn(),
    error: vi.fn(),
    promise,
    warning: vi.fn().mockReturnValue('mock-toast'),
    dismiss: vi.fn(),
    custom: vi.fn(),
  }
})

const tripServiceMock = vi.hoisted(() => ({
  getTripById: vi.fn(),
  exportTripData: vi.fn(),
  deleteTrip: vi.fn(),
}))

const downloadUtilsMock = vi.hoisted(() => ({
  downloadBlob: vi.fn(),
  extractFilename: vi.fn(),
}))

const mockTravelersStoreState = {}
const mockChecklistStoreState = {}
const mockDocumentsStoreState = {}
const mockCollaborationStoreState = {}
const mockItineraryStoreState = {}
const mockExpensesStoreState = {}

const resetObject = (target, next) => {
  Object.keys(target).forEach((key) => {
    delete target[key]
  })
  Object.assign(target, next())
}

const createNoop = () => vi.fn()
const createResolved = (value) => vi.fn().mockResolvedValue(value)

vi.mock('sonner', () => ({
  toast: toastMock,
}))

const { success: toastSuccess, error: toastError } = toastMock
const {
  getTripById: mockGetTripById,
  exportTripData: mockExportTripData,
} = tripServiceMock
const {
  downloadBlob: mockDownloadBlob,
  extractFilename: mockExtractFilename,
} = downloadUtilsMock

vi.mock('@/services/tripService', () => tripServiceMock)

vi.mock('@/utils/download', () => downloadUtilsMock)

vi.mock('@/stores/travelersStore', () => ({
  useTravelersStore: (selector = (state) => state) => selector(mockTravelersStoreState),
}))

vi.mock('@/stores/checklistStore', () => ({
  useChecklistStore: (selector = (state) => state) => selector(mockChecklistStoreState),
}))

vi.mock('@/stores/documentsStore', () => ({
  useDocumentsStore: (selector = (state) => state) => selector(mockDocumentsStoreState),
}))

vi.mock('@/stores/collaborationStore', () => ({
  useCollaborationStore: (selector = (state) => state) => selector(mockCollaborationStoreState),
}))

vi.mock('@/stores/itineraryStore', () => ({
  useItineraryStore: (selector = (state) => state) => selector(mockItineraryStoreState),
}))

vi.mock('@/stores/expensesStore', () => ({
  useExpensesStore: (selector = (state) => state) => selector(mockExpensesStoreState),
}))

const tripFixture = {
  id: 'trip-123',
  name: 'Autumn Adventure',
  destination: 'Kyoto, Japan',
  type: 'Leisure',
  status: 'Planning',
  budgetAmount: 3500,
  budgetCurrency: 'USD',
  description: 'Leaf peeping in Kyoto',
  notes: 'Confirm ryokan stay',
  startDate: '2025-11-10',
  endDate: '2025-11-18',
  permission: {
    level: 'admin',
  },
}

const createExportPayload = () => ({
  blob: new Blob(['export'], { type: 'text/csv' }),
  disposition: 'attachment; filename="trip-export.csv"',
  contentType: 'text/csv',
})

const renderTripDetail = async () => {
  render(
    <MemoryRouter initialEntries={['/trips/trip-123']}>
      <Routes>
        <Route path="/trips/:tripId" element={<TripDetail />} />
      </Routes>
    </MemoryRouter>
  )

  await screen.findByRole('heading', { name: /export data/i })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetTripById.mockReset()
  mockExportTripData.mockReset()
  mockDownloadBlob.mockReset()
  mockExtractFilename.mockReset()
  toastSuccess.mockReset()
  toastError.mockReset()

  mockGetTripById.mockResolvedValue({ ...tripFixture })
  mockExportTripData.mockResolvedValue(createExportPayload())
  mockExtractFilename.mockImplementation((_, fallback) => fallback)

  resetObject(mockTravelersStoreState, () => ({
    travelers: [],
    isLoading: false,
    fetchTravelers: createResolved([]),
    addTraveler: createNoop(),
    updateTraveler: createNoop(),
    removeTraveler: createNoop(),
  }))

  resetObject(mockChecklistStoreState, () => ({
    categories: [],
    isLoading: false,
    fetchBoard: createResolved([]),
    createCategory: createNoop(),
    createItem: createNoop(),
    toggleItemCompletion: createNoop(),
    deleteItem: createNoop(),
  }))

  resetObject(mockDocumentsStoreState, () => ({
    documents: [],
    isLoading: false,
    fetchDocuments: createResolved([]),
    addDocument: createNoop(),
    updateDocument: createNoop(),
    removeDocument: createNoop(),
  }))

  resetObject(mockCollaborationStoreState, () => ({
    collaborators: [],
    collaboratorsMeta: { total: 0 },
    collaboratorsLoading: false,
    shareLinks: [],
    shareLinksMeta: { total: 0 },
    shareLinksLoading: false,
    fetchCollaborators: createResolved([]),
    inviteCollaborator: createNoop(),
    resendInvitation: createNoop(),
    updateCollaboratorPermission: createNoop(),
    removeCollaborator: createNoop(),
    fetchShareLinks: createResolved([]),
    createShareLink: createNoop(),
    revokeShareLink: createNoop(),
  }))

  resetObject(mockItineraryStoreState, () => ({
    items: [],
    isLoading: false,
    fetchItems: createResolved([]),
    addItem: createNoop(),
    updateItem: createNoop(),
    removeItem: createNoop(),
  }))

  resetObject(mockExpensesStoreState, () => ({
    expenses: [],
    isLoading: false,
    fetchExpenses: createResolved([]),
    addExpense: createNoop(),
    updateExpense: createNoop(),
    removeExpense: createNoop(),
  }))
})

describe('TripDetail export workflow', () => {
  it('downloads the selected dataset in the desired format', async () => {
    const exportPayload = {
      blob: new Blob(['budget'], { type: 'text/csv' }),
      disposition: 'attachment; filename="budget.csv"',
      contentType: 'text/csv',
    }
    mockExportTripData.mockResolvedValue(exportPayload)
    mockExtractFilename.mockReturnValue('budget.csv')

    await renderTripDetail()

    const datasetSelect = screen.getByLabelText(/dataset/i)
    const formatSelect = screen.getByLabelText(/format/i)

    fireEvent.change(datasetSelect, { target: { value: 'budget' } })
    fireEvent.change(formatSelect, { target: { value: 'csv' } })

    const downloadButton = screen.getByRole('button', { name: /download export/i })
    fireEvent.click(downloadButton)

    expect(downloadButton).toBeDisabled()

    await waitFor(() => {
      expect(mockExportTripData).toHaveBeenCalledWith('trip-123', {
        resource: 'budget',
        format: 'csv',
      })
    })

    expect(mockExtractFilename).toHaveBeenCalledWith(
      'attachment; filename="budget.csv"',
      'autumn-adventure-budget.csv'
    )

    await waitFor(() => {
      expect(mockDownloadBlob).toHaveBeenCalledWith(exportPayload.blob, 'budget.csv')
    })

    expect(toastSuccess).toHaveBeenCalledWith('Export ready: budget (CSV)')
    expect(downloadButton).not.toBeDisabled()
  })

  it('surfaces a toast error when the export fails', async () => {
    const error = new Error('Export failed')
    error.response = { data: { error: { message: 'Export service offline' } } }
    mockExportTripData.mockRejectedValueOnce(error)

    await renderTripDetail()

    const downloadButton = screen.getByRole('button', { name: /download export/i })
    fireEvent.click(downloadButton)

    await waitFor(() => {
      expect(mockExportTripData).toHaveBeenCalledWith('trip-123', {
        resource: 'trip',
        format: 'pdf',
      })
    })

    expect(mockDownloadBlob).not.toHaveBeenCalled()
    expect(mockExtractFilename).not.toHaveBeenCalled()

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Export service offline')
    })

    expect(downloadButton).not.toBeDisabled()
  })
})
