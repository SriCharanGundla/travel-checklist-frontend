import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { DocumentsPanel } from '@/components/trips/DocumentsPanel'

const toastMock = vi.hoisted(() => {
  const promise = vi.fn((maybePromise) => maybePromise)

  return {
    success: vi.fn(),
    error: vi.fn(),
    promise,
  }
})

const confirmToastMock = vi.fn()
const requestVaultLinkMock = vi.fn()

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

vi.mock('@/services/documentService', () => ({
  default: {
    requestVaultDownloadLink: (...args) => requestVaultLinkMock(...args),
  },
  requestVaultDownloadLink: (...args) => requestVaultLinkMock(...args),
}))

const baseProps = {
  tripId: 'trip-1',
  documents: [],
  travelers: [],
  isLoading: false,
  onAdd: vi.fn(),
  onUpdate: vi.fn(),
  onDelete: vi.fn(),
}

describe('DocumentsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders skeletons while loading documents', () => {
    const { container } = render(
      <DocumentsPanel
        {...baseProps}
        isLoading
      />
    )

    const skeletons = container.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('creates a document for an existing traveler', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined)

    render(
      <DocumentsPanel
        {...baseProps}
        travelers={[{ id: 'traveler-1', fullName: 'Jamie Rivera' }]}
        onAdd={onAdd}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /add document/i }))

    fireEvent.change(screen.getByLabelText(/traveler/i), {
      target: { value: 'traveler-1' },
    })
    fireEvent.change(screen.getByLabelText(/^type$/i), {
      target: { value: 'visa' },
    })
    const identifierInput = screen.getByLabelText(/identifier/i, { selector: 'input' })
    fireEvent.change(identifierInput, {
      target: { value: 'AB123456' },
    })
    fireEvent.change(screen.getByLabelText(/issuing country/i), {
      target: { value: 'jp' },
    })
    fireEvent.change(screen.getByLabelText(/issued/i), {
      target: { value: '2025-01-01' },
    })
    fireEvent.change(screen.getByLabelText(/expiry/i), {
      target: { value: '2025-12-31' },
    })
    fireEvent.change(screen.getByLabelText(/^status$/i), {
      target: { value: 'approved' },
    })
    fireEvent.change(screen.getByLabelText(/file url/i), {
      target: { value: 'https://secure.example.com/documents/1' },
    })
    fireEvent.change(screen.getByLabelText(/notes/i), {
      target: { value: 'Uploaded copy' },
    })

    fireEvent.click(screen.getByRole('button', { name: /add document$/i }))

    await waitFor(() =>
      expect(onAdd).toHaveBeenCalledWith('trip-1', 'traveler-1', expect.objectContaining({
        type: 'visa',
        issuingCountry: 'JP',
      }))
    )
    expect(toastMock.success).toHaveBeenCalledWith('Document added')
  })

  it('updates an existing document', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined)

    render(
      <DocumentsPanel
        {...baseProps}
        travelers={[{ id: 'traveler-1', fullName: 'Jamie Rivera' }]}
        documents={[{
          id: 'doc-1',
          travelerId: 'traveler-1',
          traveler: { id: 'traveler-1', fullName: 'Jamie Rivera' },
          type: 'passport',
          identifier: 'AA1234567',
          issuingCountry: 'US',
          issuedDate: '2024-01-10',
          expiryDate: '2034-01-10',
          status: 'valid',
          notes: 'Renewed recently',
          hasVaultFile: false,
        }]}
        onUpdate={onUpdate}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /edit/i }))
    fireEvent.change(screen.getByLabelText(/notes/i), {
      target: { value: 'Updated note' },
    })
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() =>
      expect(onUpdate).toHaveBeenCalledWith('trip-1', 'doc-1', expect.objectContaining({
        notes: 'Updated note',
      }))
    )
    expect(toastMock.success).toHaveBeenCalledWith('Document updated')
  })

  it('confirms removal of a document', async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined)
    confirmToastMock.mockImplementation(({ onConfirm }) => onConfirm?.())

    render(
      <DocumentsPanel
        {...baseProps}
        travelers={[{ id: 'traveler-1', fullName: 'Jamie Rivera' }]}
        documents={[{
          id: 'doc-1',
          travelerId: 'traveler-1',
          traveler: { id: 'traveler-1', fullName: 'Jamie Rivera' },
          type: 'passport',
          status: 'valid',
        }]}
        onDelete={onDelete}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /delete/i }))

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('trip-1', 'doc-1'))
    expect(toastMock.promise).toHaveBeenCalled()
  })

  it('requests a secure vault link', async () => {
    requestVaultLinkMock.mockResolvedValue({ downloadUrl: 'https://secure.example.com/link' })
    Object.assign(window, { isSecureContext: true })
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })

    render(
      <DocumentsPanel
        {...baseProps}
        travelers={[{ id: 'traveler-1', fullName: 'Jamie Rivera' }]}
        documents={[{
          id: 'doc-1',
          travelerId: 'traveler-1',
          traveler: { id: 'traveler-1', fullName: 'Jamie Rivera' },
          type: 'passport',
          status: 'valid',
          hasVaultFile: true,
          vaultFileName: 'passport.pdf',
        }]}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /get secure link/i }))

    await waitFor(() => expect(requestVaultLinkMock).toHaveBeenCalledWith('doc-1'))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://secure.example.com/link')
    expect(toastMock.success).toHaveBeenCalled()
  })
})
