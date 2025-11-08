import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Dashboard from '@/pages/Dashboard'

const mockUseAuth = vi.fn()

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

const getOverviewMock = vi.fn()

vi.mock('@/services/dashboardService', () => ({
  getOverview: (...args) => getOverviewMock(...args),
  default: {
    getOverview: (...args) => getOverviewMock(...args),
  },
}))

const renderDashboard = () =>
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </MemoryRouter>
  )

describe('Dashboard page', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { firstName: 'Alex' },
    })
    getOverviewMock.mockReset()
  })

  it('renders metrics after successfully fetching overview data', async () => {
    getOverviewMock.mockResolvedValue({
      totals: {
        upcomingTripCount: 2,
        activeTripCount: 1,
        totalTrips: 5,
      },
      statusBreakdown: {
        planning: 3,
        archived: 0,
      },
      nextTrip: {
        name: 'Conference NYC',
        destination: 'New York, USA',
        startDate: '2025-12-01',
        endDate: '2025-12-05',
        daysUntil: 10,
      },
      tasks: {
        dueSoonCount: 4,
      },
      generatedAt: '2025-11-01T15:00:00.000Z',
    })

    renderDashboard()

    expect(screen.getByText('Loading your dashboard metrics…')).toBeInTheDocument()

    await waitFor(() => expect(getOverviewMock).toHaveBeenCalledTimes(1))

    expect(
      screen.getByRole('heading', { name: /welcome, alex!/i })
    ).toBeInTheDocument()
    expect(screen.getByText('Upcoming Trips')).toBeInTheDocument()
    expect(screen.getByText('Trips In Progress')).toBeInTheDocument()
    expect(screen.getByText('All Trips')).toBeInTheDocument()

    expect(screen.queryByText(/archived/i)).not.toBeInTheDocument()
  })

  it('shows an error message when the overview request fails', async () => {
    getOverviewMock.mockRejectedValueOnce(new Error('Network error'))

    renderDashboard()

    await waitFor(() =>
      expect(
        screen.getByText('We could not load your dashboard data. Please try again shortly.')
      ).toBeInTheDocument()
    )
  })
})
