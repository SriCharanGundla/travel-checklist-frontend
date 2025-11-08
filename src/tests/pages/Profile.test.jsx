import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Profile from '@/pages/Profile'

const mockUseAuth = vi.fn()

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock('@/components/profile/TravelerDirectoryManager', () => ({
  TravelerDirectoryManager: () => <div data-testid="directory-manager">Directory</div>,
}))

const originalScrollIntoView = HTMLElement.prototype.scrollIntoView

describe('Profile page', () => {
  beforeEach(() => {
    mockUseAuth.mockReset()
  })

  afterEach(() => {
    HTMLElement.prototype.scrollIntoView = originalScrollIntoView
  })

  it('returns null when no user is present', () => {
    mockUseAuth.mockReturnValue({ user: null })

    const { container } = render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    )

    expect(container.firstChild).toBeNull()
  })

  it('renders profile details for the authenticated user', () => {
    mockUseAuth.mockReturnValue({
      user: {
        firstName: 'Jamie',
        lastName: 'Rivera',
        email: 'jamie@example.com',
        timezone: 'America/New_York',
        role: 'admin',
      },
    })

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument()
    expect(screen.getByText('Jamie Rivera')).toBeInTheDocument()
    expect(screen.getByText('ja***@example.com')).toBeInTheDocument()
    expect(screen.getByText('America/New_York')).toBeInTheDocument()
    expect(screen.getByText('admin')).toBeInTheDocument()
    expect(screen.getByTestId('directory-manager')).toBeInTheDocument()
  })

  it('scrolls the traveler directory into view when hash matches', async () => {
    const scrollSpy = vi.fn()
    HTMLElement.prototype.scrollIntoView = scrollSpy

    mockUseAuth.mockReturnValue({
      user: {
        firstName: 'Jamie',
        lastName: 'Rivera',
        email: 'jamie@example.com',
        timezone: 'America/New_York',
        role: 'admin',
      },
    })

    render(
      <MemoryRouter initialEntries={['/profile#travelers']}>
        <Profile />
      </MemoryRouter>
    )

    await waitFor(() => expect(scrollSpy).toHaveBeenCalledTimes(1))
  })
})
