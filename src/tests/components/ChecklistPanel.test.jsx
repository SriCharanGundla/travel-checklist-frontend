import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { ChecklistPanel } from '@/components/trips/ChecklistPanel'

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

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange, ...props }) => (
    <select
      data-testid="select"
      value={value ?? ''}
      onChange={(event) => onValueChange?.(event.target.value)}
      {...props}
    >
      {children}
    </select>
  ),
}))

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, ...props }) => (
    <input
      type="checkbox"
      data-testid="checkbox"
      checked={checked}
      onChange={() => onCheckedChange?.(!checked)}
      {...props}
    />
  ),
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

describe('ChecklistPanel', () => {
  const baseProps = {
    tripId: 'trip-1',
    categories: [],
    travelers: [],
    isLoading: false,
    onCreateCategory: vi.fn(),
    onDeleteCategory: vi.fn(),
    onCreateItem: vi.fn(),
    onToggleItem: vi.fn(),
    onDeleteItem: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading skeletons while data is loading', () => {
    const { container } = render(
      <ChecklistPanel
        {...baseProps}
        isLoading
      />
    )

    const skeletons = container.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('creates a new category through the dialog', async () => {
    const onCreateCategory = vi.fn().mockResolvedValue(undefined)

    render(
      <ChecklistPanel
        {...baseProps}
        onCreateCategory={onCreateCategory}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /new category/i }))

    fireEvent.change(screen.getByLabelText(/category name/i), {
      target: { value: 'Packing' },
    })
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'All packing related tasks' },
    })

    fireEvent.click(screen.getByRole('button', { name: /create category/i }))

    await waitFor(() => expect(onCreateCategory).toHaveBeenCalledWith('trip-1', {
      name: 'Packing',
      description: 'All packing related tasks',
    }))

    expect(toastMock.success).toHaveBeenCalledWith('Checklist category created')
    await waitFor(() =>
      expect(screen.queryByText(/create a checklist category/i)).not.toBeInTheDocument()
    )
  })

  it('adds an item to a category with the quick form', async () => {
    const onCreateItem = vi.fn().mockResolvedValue(undefined)

    render(
      <ChecklistPanel
        {...baseProps}
        travelers={[{ id: 'traveler-1', fullName: 'Jamie Rivera' }]}
        categories={[
          {
            id: 'cat-1',
            name: 'Travel prep',
            description: '',
            items: [],
          },
        ]}
        onCreateItem={onCreateItem}
      />
    )

    const quickAddForm = screen.getByTestId('quick-add-form-cat-1')

    fireEvent.change(screen.getByTestId('quick-add-input-cat-1'), {
      target: { value: 'Book flights' },
    })
    fireEvent.click(within(quickAddForm).getByRole('button', { name: /^add$/i }))

    await waitFor(() =>
      expect(onCreateItem).toHaveBeenCalledWith('cat-1', {
        title: 'Book flights',
        priority: 'medium',
        dueDate: '',
        assigneeTravelerId: '',
        notes: '',
      })
    )
    expect(toastMock.success).toHaveBeenCalledWith('Checklist item added')
  })

  it('allows adding metadata through the advanced drawer', async () => {
    const onCreateItem = vi.fn().mockResolvedValue(undefined)

    render(
      <ChecklistPanel
        {...baseProps}
        travelers={[{ id: 'traveler-2', fullName: 'Alex Kim' }]}
        categories={[
          {
            id: 'cat-1',
            name: 'Travel prep',
            description: '',
            items: [],
          },
        ]}
        onCreateItem={onCreateItem}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /add details/i }))

    fireEvent.change(screen.getByLabelText(/priority/i), {
      target: { value: 'high' },
    })
    fireEvent.change(screen.getByLabelText(/due date/i), {
      target: { value: '2025-12-01' },
    })
    fireEvent.change(screen.getByLabelText(/assignee/i), {
      target: { value: 'traveler-2' },
    })
    fireEvent.change(screen.getByLabelText(/notes/i), {
      target: { value: 'Use travel credits' },
    })

    const quickAddForm = screen.getByTestId('quick-add-form-cat-1')

    fireEvent.change(screen.getByTestId('quick-add-input-cat-1'), {
      target: { value: 'Reserve seats' },
    })
    fireEvent.click(within(quickAddForm).getByRole('button', { name: /^add$/i }))

    await waitFor(() =>
      expect(onCreateItem).toHaveBeenCalledWith('cat-1', {
        title: 'Reserve seats',
        priority: 'high',
        dueDate: '2025-12-01',
        assigneeTravelerId: 'traveler-2',
        notes: 'Use travel credits',
      })
    )
  })

  it('filters tasks by traveler', () => {
    render(
      <ChecklistPanel
        {...baseProps}
        travelers={[
          { id: 'traveler-1', fullName: 'Jamie Rivera' },
          { id: 'traveler-2', fullName: 'Alex Kim' },
        ]}
        categories={[
          {
            id: 'cat-1',
            name: 'Travel prep',
            description: '',
            items: [
              { id: 'item-1', title: 'Book flights', priority: 'medium', completedAt: null, assigneeTravelerId: 'traveler-1', assignee: { fullName: 'Jamie Rivera' } },
              { id: 'item-2', title: 'Renew passport', priority: 'high', completedAt: null, assigneeTravelerId: 'traveler-2', assignee: { fullName: 'Alex Kim' } },
            ],
          },
        ]}
      />
    )

    fireEvent.change(screen.getByLabelText(/show tasks for/i), {
      target: { value: 'traveler-2' },
    })

    expect(screen.getByText('Renew passport')).toBeInTheDocument()
    expect(screen.queryByText('Book flights')).not.toBeInTheDocument()
  })

  it('confirms before removing an item', async () => {
    const deletePromise = Promise.resolve()
    const onDeleteItem = vi.fn().mockReturnValue(deletePromise)
    confirmToastMock.mockImplementation(({ onConfirm }) => {
      onConfirm?.()
    })

    render(
      <ChecklistPanel
        {...baseProps}
        categories={[{
          id: 'cat-1',
          name: 'Travel prep',
          description: '',
          items: [
            {
              id: 'item-1',
              title: 'Book flights',
              priority: 'medium',
              completedAt: null,
            },
          ],
        }]}
        onDeleteItem={onDeleteItem}
      />
    )

    const categoryCard = screen.getByTestId('checklist-category-cat-1')
    fireEvent.click(within(categoryCard).getByRole('button', { name: /remove/i }))

    await waitFor(() => expect(onDeleteItem).toHaveBeenCalledWith('item-1'))
    expect(confirmToastMock).toHaveBeenCalled()
    expect(toastMock.promise).toHaveBeenCalledWith(deletePromise, expect.any(Object))
  })
})
