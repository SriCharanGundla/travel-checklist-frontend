import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { CollaboratorsPanel } from '@/components/trips/CollaboratorsPanel'

const toastMock = vi.hoisted(() => {
  const promise = vi.fn((maybePromise) => maybePromise)

  return {
    success: vi.fn(),
    error: vi.fn(),
    promise,
    custom: vi.fn(),
  }
})

const confirmToastMock = vi.fn()

const basePermission = { level: 'admin' }

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

vi.mock('@/contexts/AnimationSettingsContext.jsx', () => ({
  useAnimationSettings: () => ({ prefersReducedMotion: false }),
}))

const makeBaseProps = () => ({
  tripId: 'trip-1',
  collaborators: [],
  collaboratorsMeta: { page: 1, limit: 10, total: 0 },
  shareLinks: [],
  shareLinksMeta: { page: 1, limit: 10, total: 0 },
  permission: basePermission,
  collaboratorsLoading: false,
  shareLinksLoading: false,
  onInvite: vi.fn(),
  onResend: vi.fn(),
  onRemove: vi.fn(),
  onUpdatePermission: vi.fn(),
  onCreateShareLink: vi.fn(),
  onRevokeShareLink: vi.fn(),
  onFetchCollaborators: vi.fn(),
  onFetchShareLinks: vi.fn(),
})

describe('CollaboratorsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(window, { location: { origin: 'https://travel.test' } })
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  it('renders skeletons while collaborators are loading', () => {
    const props = makeBaseProps()
    const { container } = render(
      <CollaboratorsPanel
        {...props}
        collaboratorsLoading
      />
    )

    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
  })

  it('invites a collaborator by email', async () => {
    const props = makeBaseProps()
    props.onInvite.mockResolvedValue({ inviteToken: 'token-123' })

    render(<CollaboratorsPanel {...props} />)

    fireEvent.change(screen.getByLabelText(/invite by email/i), {
      target: { value: 'friend@example.com' },
    })
    const permissionSelect = screen.getByLabelText(/permission/i)
    fireEvent.change(permissionSelect, {
      target: { value: 'admin' },
    })
    await waitFor(() => expect(permissionSelect).toHaveValue('admin'))

    fireEvent.click(screen.getByRole('button', { name: /send invite/i }))

    await waitFor(() => {
      expect(props.onInvite).toHaveBeenCalledTimes(1)
      expect(props.onInvite).toHaveBeenCalledWith('trip-1', {
        email: 'friend@example.com',
        permissionLevel: 'admin',
      })
    })
    expect(toastMock.success).toHaveBeenCalledWith('Invitation sent')
    expect(toastMock.custom).toHaveBeenCalled()
  })

  it('updates collaborator permission level', async () => {
    const props = makeBaseProps()
    props.collaborators = [
      {
        id: 'col-1',
        email: 'user@example.com',
        status: 'accepted',
        permissionLevel: 'edit',
        invitedAt: '2025-01-01T00:00:00Z',
      },
    ]

    render(<CollaboratorsPanel {...props} />)

    const tableSelect = screen.getAllByDisplayValue('Editor').at(-1)
    fireEvent.change(tableSelect, {
      target: { value: 'admin' },
    })

    await waitFor(() =>
      expect(props.onUpdatePermission).toHaveBeenCalledWith('trip-1', 'col-1', {
        permissionLevel: 'admin',
      })
    )
    expect(toastMock.success).toHaveBeenCalledWith('Permissions updated')
  })

  it('creates a share link for guests', async () => {
    const props = makeBaseProps()
    props.shareLinks = []
    props.onCreateShareLink.mockResolvedValue({
      token: 'token-abc',
      shareLink: {
        id: 'link-1',
        label: 'Family',
      },
    })

    render(<CollaboratorsPanel {...props} />)

    fireEvent.change(screen.getByLabelText(/label/i), {
      target: { value: 'Family link' },
    })
    fireEvent.change(screen.getByLabelText(/access level/i), {
      target: { value: 'contribute' },
    })
    fireEvent.change(screen.getByLabelText(/expires/i), {
      target: { value: '2025-12-01T10:00' },
    })
    fireEvent.change(screen.getByLabelText(/max uses/i), {
      target: { value: '5' },
    })

    fireEvent.click(screen.getByRole('button', { name: /create link/i }))

    await waitFor(() =>
      expect(props.onCreateShareLink).toHaveBeenCalledWith('trip-1', expect.objectContaining({
        label: 'Family link',
        accessLevel: 'contribute',
        expiresAt: expect.any(String),
        maxUsages: 5,
      }))
    )
    expect(props.onCreateShareLink.mock.calls[0][1].expiresAt).toContain('2025-12-01')
    expect(toastMock.success).toHaveBeenCalledWith('Share link created')
  })

  it('revokes an existing share link after confirmation', async () => {
    const props = makeBaseProps()
    props.shareLinks = [
      {
        id: 'link-1',
        label: 'Vendors',
        accessLevel: 'view',
        token: 'token-abc',
        createdAt: '2025-01-01T00:00:00Z',
      },
    ]
    confirmToastMock.mockImplementation(({ onConfirm }) => onConfirm?.())

    render(<CollaboratorsPanel {...props} />)

    fireEvent.click(screen.getByRole('button', { name: /revoke/i }))

    await waitFor(() => expect(props.onRevokeShareLink).toHaveBeenCalledWith('trip-1', 'link-1'))
    expect(toastMock.promise).toHaveBeenCalled()
  })
})
