import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const toastMock = {
  success: vi.fn(),
  error: vi.fn(),
}

vi.mock('sonner', () => ({
  toast: toastMock,
}))

const registerMock = vi.fn()
const mockAuthContext = {
  register: registerMock,
  loading: false,
}

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}))

const mockAnimationSettings = {
  prefersReducedMotion: false,
}

vi.mock('@/contexts/AnimationSettingsContext.jsx', () => ({
  useAnimationSettings: () => mockAnimationSettings,
}))

let navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

let Register

beforeAll(async () => {
  ({ default: Register } = await import('@/pages/Register'))
})

const renderRegister = () =>
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>,
  )

const fillProfileFields = () => {
  fireEvent.input(screen.getByLabelText(/first name/i), { target: { value: 'Jamie' } })
  fireEvent.input(screen.getByLabelText(/last name/i), { target: { value: 'Rivera' } })
  fireEvent.input(screen.getByLabelText(/email address/i), { target: { value: 'jamie@example.com' } })
}

const fillPasswordFields = () => {
  fireEvent.input(screen.getByLabelText(/^password$/i), { target: { value: 'Password1' } })
  fireEvent.input(screen.getByLabelText(/confirm password/i), { target: { value: 'Password1' } })
}

describe('Register page motion regression', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    registerMock.mockReset()
    registerMock.mockResolvedValue({})
    toastMock.success.mockReset()
    toastMock.error.mockReset()
    mockAuthContext.register = registerMock
    mockAuthContext.loading = false
    mockAnimationSettings.prefersReducedMotion = false
    navigateMock = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('updates tracker statuses as sections progress', async () => {
    renderRegister()

    expect(screen.getByTestId('tracker-status-profile')).toHaveTextContent('Pending')
    expect(screen.getByTestId('tracker-status-workspace-security')).toHaveTextContent('Pending')
    expect(screen.getByTestId('tracker-status-invite-team')).toHaveTextContent('Pending')

    fillProfileFields()

    await waitFor(() => expect(screen.getByTestId('tracker-status-profile')).toHaveTextContent('Complete'))

    fireEvent.input(screen.getByLabelText(/^password$/i), { target: { value: 'Password1' } })
    await waitFor(() => expect(screen.getByTestId('tracker-status-workspace-security')).toHaveTextContent('In progress'))

    fireEvent.input(screen.getByLabelText(/confirm password/i), { target: { value: 'Password1' } })
    await waitFor(() => expect(screen.getByTestId('tracker-status-workspace-security')).toHaveTextContent('Complete'))
    await waitFor(() => expect(screen.getByTestId('tracker-status-invite-team')).toHaveTextContent('In progress'))
  })

  it('shows celebration overlay and delays navigation when motion is enabled', async () => {
    mockAnimationSettings.prefersReducedMotion = false
    registerMock.mockResolvedValueOnce({})

    renderRegister()
    fillProfileFields()
    fillPasswordFields()

    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => expect(registerMock).toHaveBeenCalledTimes(1))

    await waitFor(() => expect(screen.getByTestId('register-celebration')).toBeInTheDocument())
    expect(navigateMock).not.toHaveBeenCalled()

    await waitFor(() => expect(navigateMock).toHaveBeenCalledTimes(1), { timeout: 3000 })
  })

  it('skips celebration overlay and navigates immediately when reduced motion is enabled', async () => {
    mockAnimationSettings.prefersReducedMotion = true
    registerMock.mockResolvedValueOnce({})

    renderRegister()
    fillProfileFields()
    fillPasswordFields()

    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => expect(registerMock).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(navigateMock).toHaveBeenCalledTimes(1))
    expect(screen.queryByTestId('register-celebration')).not.toBeInTheDocument()
  })
})
