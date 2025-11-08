import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const toastMock = vi.hoisted(() => {
  const promise = vi.fn((maybePromise) => maybePromise)

  return {
    success: vi.fn(),
    error: vi.fn(),
    promise,
  }
})

const confirmToastMock = vi.fn()

const mockDirectoryState = {
  contacts: [],
  isLoading: false,
  hasLoaded: true,
  fetchContacts: vi.fn().mockResolvedValue([]),
}

let navigateMock = vi.fn()
const useNavigateStub = vi.fn(() => navigateMock)

vi.mock('sonner', () => ({
  toast: toastMock,
}))

vi.mock('@/lib/confirmToast', () => ({
  confirmToast: (...args) => confirmToastMock(...args),
}))

vi.mock('@/components/ui/date-picker', () => ({
  DatePicker: ({ value, onChange, ...props }) => (
    <input
      type="date"
      value={value ?? ''}
      onChange={(event) => onChange?.(event.target.value)}
      {...props}
    />
  ),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: useNavigateStub,
  }
})

vi.mock('@/stores/travelerDirectoryStore', () => ({
  useTravelerDirectoryStore: (selector = (state) => state) => selector(mockDirectoryState),
}))

let TravelersPanel

const baseProps = {
  tripId: 'trip-1',
  travelers: [],
  isLoading: false,
  onAdd: vi.fn(),
  onUpdate: vi.fn(),
  onDelete: vi.fn(),
}

beforeAll(async () => {
  ({ TravelersPanel } = await import('@/components/trips/TravelersPanel'))
})

describe('TravelersPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDirectoryState.contacts = []
    mockDirectoryState.isLoading = false
    mockDirectoryState.hasLoaded = true
    mockDirectoryState.fetchContacts = vi.fn().mockResolvedValue([])

    navigateMock = vi.fn()
    useNavigateStub.mockClear()
  })

  it('shows skeletons when travelers are loading', () => {
    const { container } = render(
      <TravelersPanel
        {...baseProps}
        isLoading
      />
    )

    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
  })

  it('adds a traveler through the form', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined)

    render(
      <TravelersPanel
        {...baseProps}
        onAdd={onAdd}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /add traveler/i }))

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Jamie Rivera' },
    })
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'jamie@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/^phone$/i, { selector: 'input' }), {
      target: { value: '+1 555-111-2222' },
    })
    fireEvent.change(screen.getByLabelText(/passport number/i, { selector: 'input' }), {
      target: { value: 'AA1234567' },
    })
    fireEvent.change(screen.getByLabelText(/notes/i), {
      target: { value: 'Requires aisle seat' },
    })

    fireEvent.click(screen.getByRole('button', { name: /add traveler$/i }))

    await waitFor(() =>
      expect(onAdd).toHaveBeenCalledWith('trip-1', expect.objectContaining({
        fullName: 'Jamie Rivera',
        email: 'jamie@example.com',
        phone: '+1 555-111-2222',
        passportNumber: 'AA1234567',
        notes: 'Requires aisle seat',
      }))
    )
    expect(toastMock.success).toHaveBeenCalledWith('Traveler added')
  })

  it('updates an existing traveler', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined)

    render(
      <TravelersPanel
        {...baseProps}
        travelers={[{
          id: 'traveler-1',
          fullName: 'Jamie Rivera',
          preferredName: 'Jamie',
          email: 'jamie@example.com',
        }]}
        onUpdate={onUpdate}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /edit/i }))
    fireEvent.change(screen.getByLabelText(/preferred name/i), {
      target: { value: 'JR' },
    })
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() =>
      expect(onUpdate).toHaveBeenCalledWith('trip-1', 'traveler-1', expect.objectContaining({
        preferredName: 'JR',
      }))
    )
    expect(toastMock.success).toHaveBeenCalledWith('Traveler updated')
  })

  it('confirms before removing a traveler', async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined)
    confirmToastMock.mockImplementation(({ onConfirm }) => onConfirm?.())

    render(
      <TravelersPanel
        {...baseProps}
        travelers={[{
          id: 'traveler-1',
          fullName: 'Jamie Rivera',
        }]}
        onDelete={onDelete}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /delete/i }))

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('trip-1', 'traveler-1'))
    expect(toastMock.promise).toHaveBeenCalled()
  })

  it('adds a traveler from the saved directory', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined)
    const directoryContact = {
      id: 'contact-1',
      fullName: 'Alex Kim',
      preferredName: 'Alex',
      email: 'alex@example.com',
      phone: '+44 20 1234 5678',
      birthdate: '1990-05-12',
      passportNumber: 'BK9876543',
      passportCountry: 'GB',
      passportExpiry: '2030-05-12',
      emergencyContactName: 'Chris Kim',
      emergencyContactPhone: '+44 20 8765 4321',
      notes: 'Vegetarian',
    }
    mockDirectoryState.contacts = [directoryContact]

    render(
      <TravelersPanel
        {...baseProps}
        onAdd={onAdd}
      />
    )

    fireEvent.click(screen.getAllByRole('button', { name: /browse saved travelers/i })[0])
    fireEvent.click(screen.getByRole('button', { name: /add to trip/i }))

    await waitFor(() =>
      expect(onAdd).toHaveBeenCalledWith('trip-1', expect.objectContaining({
        contactId: 'contact-1',
        fullName: 'Alex Kim',
        notes: 'Vegetarian',
      }))
    )
    expect(toastMock.success).toHaveBeenCalledWith('Alex Kim added to this trip')
  })
})
