import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'

const toastMock = vi.hoisted(() => {
  const promise = vi.fn((maybePromise) => maybePromise)

  return {
    success: vi.fn(),
    error: vi.fn(),
    promise,
  }
})

const confirmToastMock = vi.fn()

vi.mock('sonner', () => ({
  toast: toastMock,
}))

vi.mock('@/lib/confirmToast', () => ({
  confirmToast: (...args) => confirmToastMock(...args),
}))

vi.mock('@/components/ui/date-picker', () => ({
  DateTimePicker: ({ value, onChange, ...props }) => (
    <input
      type="datetime-local"
      value={value ?? ''}
      onChange={(event) => onChange?.(event.target.value)}
      {...props}
    />
  ),
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onChange, ...props }) => (
    <select value={value} onChange={onChange} {...props}>
      {children}
    </select>
  ),
}))

let ItineraryPanel

const makeBaseProps = () => ({
  tripId: 'trip-1',
  items: [],
  isLoading: false,
  permission: { level: 'admin' },
  tripStartDate: '2025-05-01',
  tripEndDate: '2025-05-10',
  onAdd: vi.fn(),
  onUpdate: vi.fn(),
  onDelete: vi.fn(),
})

beforeAll(async () => {
  ;({ ItineraryPanel } = await import('@/components/trips/ItineraryPanel'))
})

describe('ItineraryPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders skeletons while itinerary data is loading', () => {
    const props = makeBaseProps()
    const { container } = render(
      <ItineraryPanel
        {...props}
        isLoading
      />
    )

    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
  })

  it('adds a new itinerary item', async () => {
    const props = makeBaseProps()
    props.onAdd.mockResolvedValue(undefined)

    render(<ItineraryPanel {...props} />)

    fireEvent.change(screen.getByLabelText(/type/i), { target: { value: 'activity' } })
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Boat tour' } })
    fireEvent.change(screen.getByLabelText(/start/i), { target: { value: '2025-05-03T09:00' } })
    fireEvent.change(screen.getByLabelText(/end/i), { target: { value: '2025-05-03T11:00' } })
    fireEvent.change(screen.getByLabelText(/location/i), { target: { value: 'Harbor' } })

    fireEvent.click(screen.getByRole('button', { name: /add item/i }))

    await waitFor(() =>
      expect(props.onAdd).toHaveBeenCalledWith('trip-1', expect.objectContaining({
        type: 'activity',
        title: 'Boat tour',
        startTime: expect.any(String),
        endTime: expect.any(String),
      }))
    )
    const payload = props.onAdd.mock.calls[0][1]
    expect(payload.startTime).toContain('2025-05-03')
    expect(payload.endTime).toContain('2025-05-03')
    expect(toastMock.success).toHaveBeenCalledWith('Itinerary item added')
  })

  it('updates an existing itinerary item', async () => {
    const props = makeBaseProps()
    props.items = [
      {
        id: 'item-1',
        type: 'flight',
        title: 'Flight to Tokyo',
        startTime: '2025-05-02T12:00:00.000Z',
        endTime: '2025-05-02T18:00:00.000Z',
        location: 'SFO',
      },
    ]
    props.onUpdate.mockResolvedValue(undefined)

    render(<ItineraryPanel {...props} />)

    fireEvent.click(screen.getByRole('button', { name: /edit/i }))
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Flight JL001' } })
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() =>
      expect(props.onUpdate).toHaveBeenCalledWith('trip-1', 'item-1', expect.objectContaining({
        title: 'Flight JL001',
      }))
    )
    expect(toastMock.success).toHaveBeenCalledWith('Itinerary item updated')
  })

  it('removes an itinerary item when confirmed', async () => {
    const props = makeBaseProps()
    props.items = [
      {
        id: 'item-1',
        type: 'activity',
        title: 'City tour',
        startTime: '2025-05-04T09:00:00.000Z',
        endTime: '2025-05-04T11:00:00.000Z',
      },
    ]
    props.onDelete.mockResolvedValue(undefined)
    confirmToastMock.mockImplementation(({ onConfirm }) => onConfirm?.())

    render(<ItineraryPanel {...props} />)

    fireEvent.click(screen.getByRole('button', { name: /remove/i }))

    await waitFor(() => expect(props.onDelete).toHaveBeenCalledWith('trip-1', 'item-1'))
    expect(toastMock.promise).toHaveBeenCalled()
  })

  it('shows the selected day details and unscheduled items in calendar view', async () => {
    const props = makeBaseProps()
    props.items = [
      {
        id: 'item-1',
        type: 'flight',
        title: 'Flight to Tokyo',
        provider: 'JAL',
        startTime: '2025-05-02T09:00:00',
        endTime: '2025-05-02T12:00:00',
        location: 'SFO',
      },
      {
        id: 'item-2',
        type: 'activity',
        title: 'Temple tour',
        startTime: '2025-05-02T15:00:00',
        endTime: '2025-05-02T18:00:00',
        location: 'Kyoto',
      },
      {
        id: 'item-3',
        type: 'activity',
        title: 'Dinner TBD',
        notes: 'Pick a spot near Gion',
      },
    ]

    render(<ItineraryPanel {...props} />)

    await screen.findByText('Flight to Tokyo')

    expect(screen.getByRole('heading', { name: 'Friday, May 2, 2025' })).toBeInTheDocument()
    expect(screen.getByText('Flight to Tokyo')).toBeInTheDocument()
    expect(screen.getByText('Temple tour')).toBeInTheDocument()
    expect(screen.getByText('2 items')).toBeInTheDocument()
    expect(screen.getByText('Unscheduled items')).toBeInTheDocument()
    expect(screen.getByText('Dinner TBD')).toBeInTheDocument()
    expect(screen.getByText('Add start times to place these items on the calendar.')).toBeInTheDocument()
  })

  it('groups entries by day when switching to the timeline view', async () => {
    const props = makeBaseProps()
    props.items = [
      {
        id: 'item-1',
        type: 'flight',
        title: 'Flight to Kyoto',
        startTime: '2025-05-02T08:00:00',
        endTime: '2025-05-02T12:00:00',
      },
      {
        id: 'item-2',
        type: 'accommodation',
        title: 'Ryokan check-in',
        startTime: '2025-05-03T15:00:00',
        endTime: '2025-05-04T11:00:00',
      },
      {
        id: 'item-3',
        type: 'activity',
        title: 'Food crawl',
      },
    ]

    render(<ItineraryPanel {...props} />)

    fireEvent.click(screen.getByRole('button', { name: /timeline/i }))

    const maySecondGroupHeading = await screen.findByRole('heading', { name: 'Fri, May 2, 2025' })
    const maySecondGroupCard = maySecondGroupHeading.parentElement?.parentElement
    expect(maySecondGroupCard).toBeTruthy()
    expect(within(maySecondGroupCard).getByText('Flight to Kyoto')).toBeInTheDocument()

    const mayThirdGroupHeading = screen.getByRole('heading', { name: 'Sat, May 3, 2025' })
    const mayThirdGroupCard = mayThirdGroupHeading.parentElement?.parentElement
    expect(within(mayThirdGroupCard).getByText('Ryokan check-in')).toBeInTheDocument()

    expect(screen.queryByText('Add itinerary items to see the full timeline here.')).not.toBeInTheDocument()
    expect(screen.getByText('Unscheduled items')).toBeInTheDocument()
    expect(screen.getByText('Food crawl')).toBeInTheDocument()
    expect(screen.getByText('Add start times to place these items on the timeline.')).toBeInTheDocument()
  })

  it('disables calendar days outside the trip range unless they contain itinerary items', async () => {
    const props = makeBaseProps()
    props.tripStartDate = '2025-05-03'
    props.tripEndDate = '2025-05-06'
    props.items = [
      {
        id: 'item-1',
        type: 'activity',
        title: 'Market visit',
        startTime: '2025-05-04T09:00:00',
        endTime: '2025-05-04T12:00:00',
      },
      {
        id: 'item-2',
        type: 'activity',
        title: 'Extra night',
        startTime: '2025-05-10T10:00:00',
        endTime: '2025-05-10T12:00:00',
      },
    ]

    render(<ItineraryPanel {...props} />)

    await waitFor(() => {
      const dayTwoButtons = screen.getAllByRole('button', { name: /^2$/ })
      expect(dayTwoButtons.length).toBeGreaterThan(0)
      dayTwoButtons.forEach((button) => expect(button).toBeDisabled())
    })

    const dayFourButtons = screen.getAllByRole('button', { name: /^4$/ })
    expect(dayFourButtons.some((button) => !button.disabled)).toBe(true)

    await waitFor(() => {
      const dayTenButtons = screen.getAllByRole('button', { name: /^10$/ })
      expect(dayTenButtons.some((button) => !button.disabled)).toBe(true)
    })
  })

  it('renders overnight segments with arrival/departure context across multiple days', async () => {
    const props = makeBaseProps()
    props.items = [
      {
        id: 'item-overnight',
        type: 'flight',
        title: 'Overnight hop',
        startTime: '2025-05-04T22:00:00',
        endTime: '2025-05-05T06:00:00',
      },
    ]

    render(<ItineraryPanel {...props} />)

    await screen.findByText('Overnight hop')

    expect(screen.getByText('Arrives May 5 • 6:00 AM')).toBeInTheDocument()

    const dayFiveButton = screen.getAllByRole('button', { name: /^5$/ }).find((button) => !button.disabled)
    expect(dayFiveButton).toBeTruthy()
    fireEvent.click(dayFiveButton)

    expect(screen.getByText('Arrives 6:00 AM')).toBeInTheDocument()
    expect(screen.getByText('Departed May 4 • 10:00 PM')).toBeInTheDocument()
  })
})
