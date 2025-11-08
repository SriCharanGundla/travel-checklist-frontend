import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import SharedTrip from '@/pages/SharedTrip'

const getShareLinkByTokenMock = vi.fn()
const performShareLinkActionMock = vi.fn()

vi.mock('@/services/shareLinkService', () => ({
  getShareLinkByToken: (...args) => getShareLinkByTokenMock(...args),
  performShareLinkAction: (...args) => performShareLinkActionMock(...args),
  default: {
    getShareLinkByToken: (...args) => getShareLinkByTokenMock(...args),
    performShareLinkAction: (...args) => performShareLinkActionMock(...args),
  },
}))

vi.mock('@/components/ui/date-picker', () => ({
  DatePicker: ({ ...props }) => <input data-testid="date-picker" {...props} />,
  DateTimePicker: ({ ...props }) => <input data-testid="date-time-picker" {...props} />,
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, ...props }) => (
    <select data-testid="select" {...props}>
      {children}
    </select>
  ),
}))

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }) => <div data-testid="tabs">{children}</div>,
  TabsList: ({ children }) => <div>{children}</div>,
  TabsTrigger: ({ children, ...props }) => (
    <button type="button" data-testid="tabs-trigger" {...props}>
      {children}
    </button>
  ),
  TabsContent: ({ children }) => <div>{children}</div>,
}))

const renderSharedTrip = () =>
  render(
    <MemoryRouter initialEntries={['/shared/token-123']}>
      <Routes>
        <Route path="/shared/:token" element={<SharedTrip />} />
      </Routes>
    </MemoryRouter>
  )

describe('SharedTrip page', () => {
  beforeEach(() => {
    getShareLinkByTokenMock.mockReset()
    performShareLinkActionMock.mockReset()
  })

  it('renders fallback itinerary and expense sections when data is missing', async () => {
    getShareLinkByTokenMock.mockResolvedValue({
      updatedAt: '2025-11-01T12:00:00.000Z',
      createdAt: '2025-10-20T12:00:00.000Z',
      accessLevel: 'view',
      permissions: {
        canContribute: false,
      },
      allowedActions: [],
      trip: {
        name: 'Autumn Escape',
        destination: 'Lisbon',
        status: 'planning',
        type: 'leisure',
        budgetCurrency: 'USD',
        budgetAmount: 0,
        startDate: '2025-12-01',
        endDate: '2025-12-10',
      },
    })

    renderSharedTrip()

    await screen.findByRole('heading', { name: /autumn escape/i })

    expect(screen.getByText('No itinerary items yet')).toBeInTheDocument()
    expect(screen.getByText('No expenses recorded yet')).toBeInTheDocument()
    expect(getShareLinkByTokenMock).toHaveBeenCalledWith('token-123')
  })
})
