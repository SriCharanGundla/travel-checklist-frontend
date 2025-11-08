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

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onChange, ...props }) => (
    <select value={value} onChange={onChange} {...props}>
      {children}
    </select>
  ),
}))

let ExpensesPanel

const makeBaseProps = () => ({
  tripId: 'trip-1',
  expenses: [],
  isLoading: false,
  permission: { level: 'admin' },
  currency: 'USD',
  onAdd: vi.fn(),
  onUpdate: vi.fn(),
  onDelete: vi.fn(),
})

beforeAll(async () => {
  ({ ExpensesPanel } = await import('@/components/trips/ExpensesPanel'))
})

describe('ExpensesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows skeletons when expenses are loading', () => {
    const props = makeBaseProps()
    const { container } = render(
      <ExpensesPanel
        {...props}
        isLoading
      />
    )

    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
  })

  it('adds a new expense', async () => {
    const props = makeBaseProps()
    props.onAdd.mockResolvedValue(undefined)

    render(<ExpensesPanel {...props} />)

    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'food' } })
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '45.67' } })
    fireEvent.change(screen.getByLabelText(/date/i), { target: { value: '2025-05-01' } })
    fireEvent.change(screen.getByLabelText(/merchant/i), { target: { value: 'Cafe Lisboa' } })
    fireEvent.change(screen.getByLabelText(/notes/i), { target: { value: 'Team lunch' } })

    fireEvent.click(screen.getByRole('button', { name: /add expense/i }))

    await waitFor(() =>
      expect(props.onAdd).toHaveBeenCalledWith('trip-1', {
        category: 'food',
        amount: 45.67,
        spentAt: '2025-05-01',
        merchant: 'Cafe Lisboa',
        notes: 'Team lunch',
        currency: 'USD',
      })
    )
    expect(toastMock.success).toHaveBeenCalledWith('Expense added')
  })

  it('edits an existing expense', async () => {
    const props = makeBaseProps()
    props.expenses = [
      {
        id: 'exp-1',
        category: 'transport',
        amount: 120,
        spentAt: '2025-04-15',
        merchant: 'Trainline',
        currency: 'USD',
      },
    ]
    props.onUpdate.mockResolvedValue(undefined)

    render(<ExpensesPanel {...props} />)

    fireEvent.click(screen.getByRole('button', { name: /edit/i }))
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '150' } })
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() =>
      expect(props.onUpdate).toHaveBeenCalledWith('trip-1', 'exp-1', expect.objectContaining({
        amount: 150,
      }))
    )
    expect(toastMock.success).toHaveBeenCalledWith('Expense updated')
  })

  it('removes an expense after confirmation', async () => {
    const props = makeBaseProps()
    props.expenses = [
      {
        id: 'exp-1',
        category: 'other',
        amount: 10,
        spentAt: '2025-04-01',
        merchant: 'Snacks',
        currency: 'USD',
      },
    ]
    props.onDelete.mockResolvedValue(undefined)
    confirmToastMock.mockImplementation(({ onConfirm }) => onConfirm?.())

    render(<ExpensesPanel {...props} />)

    fireEvent.click(screen.getByRole('button', { name: /remove/i }))

    await waitFor(() => expect(props.onDelete).toHaveBeenCalledWith('trip-1', 'exp-1'))
    expect(toastMock.promise).toHaveBeenCalled()
  })
})
