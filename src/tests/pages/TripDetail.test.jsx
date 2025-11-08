import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: vi.fn(),
  }
})

import * as ReactRouter from 'react-router-dom'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import TripDetail from '@/pages/TripDetail'

const toastMock = vi.hoisted(() => {
  const promise = vi.fn((maybePromise) => {
    if (typeof maybePromise === 'function') {
      return maybePromise()
    }
    return maybePromise
  })

  return {
    success: vi.fn(),
    error: vi.fn(),
    promise,
    warning: vi.fn(),
    dismiss: vi.fn(),
    custom: vi.fn(),
  }
})

const tripServiceMock = vi.hoisted(() => ({
  getTripById: vi.fn(),
  deleteTrip: vi.fn(),
  exportTripData: vi.fn(),
  updateTrip: vi.fn(),
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

const resetObject = (target, payloadFactory) => {
  Object.keys(target).forEach((key) => delete target[key])
  Object.assign(target, payloadFactory())
}

const createResolved = (value) => vi.fn().mockResolvedValue(value)
const createNoop = () => vi.fn()

vi.mock('sonner', () => ({
  toast: toastMock,
}))

const { success: toastSuccess, error: toastError, promise: toastPromise } = toastMock
const {
  getTripById: mockGetTripById,
  exportTripData: mockExportTripData,
  updateTrip: mockUpdateTrip,
  deleteTrip: mockDeleteTrip,
} = tripServiceMock
const { downloadBlob: mockDownloadBlob, extractFilename: mockExtractFilename } = downloadUtilsMock

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

vi.mock('@/components/ui/date-picker', () => ({
  DatePicker: ({ value, onChange, ...props }) => (
    <input
      type="date"
      data-testid="date-picker"
      value={value ?? ''}
      onChange={(event) => onChange?.(event.target.value)}
      {...props}
    />
  ),
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, onBlur, children, ...props }) => (
    <select
      data-testid="select"
      value={value ?? ''}
      onChange={(event) => onValueChange?.(event.target.value)}
      onBlur={onBlur}
      {...props}
    >
      {children}
    </select>
  ),
}))

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }) => <div>{children}</div>,
  TabsList: ({ children }) => <div>{children}</div>,
  TabsTrigger: ({ children, ...props }) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
  TabsContent: ({ children }) => <div>{children}</div>,
}))

vi.mock('@/components/trips/TravelersPanel', () => ({
  TravelersPanel: () => <div data-testid="travelers-panel" />,
}))

vi.mock('@/components/trips/ChecklistPanel', () => ({
  ChecklistPanel: () => <div data-testid="checklist-panel" />,
}))

vi.mock('@/components/trips/DocumentsPanel', () => ({
  DocumentsPanel: () => <div data-testid="documents-panel" />,
}))

vi.mock('@/components/trips/CollaboratorsPanel', () => ({
  CollaboratorsPanel: () => <div data-testid="collaborators-panel" />,
}))

vi.mock('@/components/trips/ItineraryPanel', () => ({
  ItineraryPanel: () => <div data-testid="itinerary-panel" />,
}))

vi.mock('@/components/trips/ExpensesPanel', () => ({
  ExpensesPanel: () => <div data-testid="expenses-panel" />,
}))

vi.mock('@/lib/confirmToast', () => ({
  confirmToast: vi.fn((options) => options?.onConfirm?.()),
}))

const tripFixture = {
  id: 'trip-321',
  name: 'Autumn Adventure',
  destination: 'Kyoto, Japan',
  type: 'Leisure',
  status: 'planning',
  budgetAmount: 3500,
  budgetCurrency: 'USD',
  description: 'Leaf peeping in Kyoto',
  notes: 'Confirm ryokan stay',
  startDate: '2025-11-10',
  endDate: '2025-11-18',
  documentsModuleEnabled: false,
  permission: {
    level: 'admin',
  },
}

const renderTripDetail = async () => {
  render(
    <MemoryRouter initialEntries={['/trips/trip-321']}>
      <Routes>
        <Route path="/trips/:tripId" element={<TripDetail />} />
      </Routes>
    </MemoryRouter>
  )

  await screen.findByRole('heading', { name: tripFixture.name })
}

describe('TripDetail page', () => {
  let navigateMock

  beforeEach(() => {
    vi.clearAllMocks()
    if (window.localStorage?.clear) {
      window.localStorage.clear()
    }
    navigateMock = vi.fn()
    ReactRouter.useNavigate.mockReturnValue(navigateMock)
    mockGetTripById.mockReset()
    mockExportTripData.mockReset()
    mockUpdateTrip.mockReset()
    mockDeleteTrip.mockReset()
    mockDownloadBlob.mockReset()
    mockExtractFilename.mockReset()
    toastSuccess.mockReset()
    toastError.mockReset()

    mockGetTripById.mockResolvedValue({ ...tripFixture })
    mockExportTripData.mockResolvedValue({
      blob: new Blob(['test'], { type: 'application/pdf' }),
      disposition: 'attachment; filename="trip.pdf"',
      contentType: 'application/pdf',
    })
    mockUpdateTrip.mockResolvedValue({
      ...tripFixture,
      name: 'Winter Escape',
    })
    mockExtractFilename.mockImplementation((_, fallback) => fallback)
    mockDeleteTrip.mockResolvedValue(undefined)

    resetObject(mockTravelersStoreState, () => ({
      travelers: [{ id: 't1' }],
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
      deleteCategory: createNoop(),
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

  afterEach(() => {
    ReactRouter.useNavigate.mockReset()
  })

  it('renders trip summary once data loads', async () => {
    await renderTripDetail()

    expect(mockGetTripById).toHaveBeenCalledWith('trip-321')
    expect(screen.getByText('Download export')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /edit trip/i })).toBeInTheDocument()
    expect(screen.getByText('Trip Snapshot')).toBeInTheDocument()
  })

  it('keeps documents optional until the module is enabled', async () => {
    mockUpdateTrip.mockResolvedValueOnce({
      ...tripFixture,
      documentsModuleEnabled: true,
    })

    await renderTripDetail()

    expect(screen.queryByRole('button', { name: /^documents$/i })).not.toBeInTheDocument()
    const enableButton = screen.getByRole('button', { name: /enable travel documents/i })
    fireEvent.click(enableButton)

    await waitFor(() =>
      expect(mockUpdateTrip).toHaveBeenCalledWith('trip-321', { documentsModuleEnabled: true })
    )

    await screen.findByRole('button', { name: /^documents$/i })
  })

  it('surfaces packing snapshot items on the overview tab', async () => {
    mockChecklistStoreState.categories = [
      {
        id: 'cat-1',
        name: 'Packing',
        items: [
          {
            id: 'item-1',
            title: 'Pack adapter',
            priority: 'high',
            completedAt: null,
            dueDate: '2025-11-09',
            assignee: { fullName: 'Jamie Rivera' },
          },
        ],
      },
    ]

    await renderTripDetail()

    expect(screen.getByText('What to pack next')).toBeInTheDocument()
    expect(screen.getByText('Pack adapter')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /open checklist/i })).toBeInTheDocument()
  })

  it('updates trip details through the edit dialog', async () => {
    await renderTripDetail()

    fireEvent.click(screen.getByRole('button', { name: /edit trip/i }))

    const nameInput = await screen.findByLabelText(/trip name/i)
    fireEvent.change(nameInput, { target: { value: '  Winter Escape  ' } })

    const statusSelect = screen.getByLabelText(/trip status/i)
    fireEvent.change(statusSelect, { target: { value: 'completed' } })

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => expect(mockUpdateTrip).toHaveBeenCalledTimes(1))

    expect(mockUpdateTrip).toHaveBeenCalledWith('trip-321', expect.objectContaining({
      name: 'Winter Escape',
      status: 'completed',
    }))
    expect(toastSuccess).toHaveBeenCalledWith('Trip details updated')
  })

  it('downloads trip export with the selected options', async () => {
    await renderTripDetail()

    fireEvent.change(screen.getByLabelText(/select dataset/i), {
      target: { value: 'budget' },
    })

    fireEvent.change(screen.getByLabelText(/select export file format/i), {
      target: { value: 'csv' },
    })

    fireEvent.click(screen.getByRole('button', { name: /download export/i }))

    await waitFor(() => expect(mockExportTripData).toHaveBeenCalledTimes(1))

    expect(mockExportTripData).toHaveBeenCalledWith('trip-321', {
      resource: 'budget',
      format: 'csv',
    })
    expect(mockDownloadBlob).toHaveBeenCalledTimes(1)
    expect(toastSuccess).toHaveBeenCalledWith('Export ready: budget (CSV)')
  })

  it('notifies user when export fails', async () => {
    mockExportTripData.mockRejectedValueOnce({
      response: { data: { error: { message: 'Export failed' } } },
    })

    await renderTripDetail()

    fireEvent.click(screen.getByRole('button', { name: /download export/i }))

    await waitFor(() => expect(mockExportTripData).toHaveBeenCalledTimes(1))

    expect(toastError).toHaveBeenCalledWith('Export failed')
  })

  it('confirms and deletes a trip', async () => {
    await renderTripDetail()

    fireEvent.click(screen.getByRole('button', { name: /delete trip/i }))

    await waitFor(() => expect(mockDeleteTrip).toHaveBeenCalledWith('trip-321'))
    expect(navigateMock).toHaveBeenCalledWith('/trips', { replace: true })
    expect(toastPromise).toHaveBeenCalled()
  })
})
