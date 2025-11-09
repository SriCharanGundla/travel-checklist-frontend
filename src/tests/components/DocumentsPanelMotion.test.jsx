import { useState } from 'react'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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

vi.mock('@/contexts/AnimationSettingsContext.jsx', () => ({
  useAnimationSettings: () => ({ prefersReducedMotion: false }),
}))

vi.mock('@/services/documentService', () => ({
  default: {
    requestVaultDownloadLink: (...args) => requestVaultLinkMock(...args),
  },
  requestVaultDownloadLink: (...args) => requestVaultLinkMock(...args),
}))

const travelers = [
  { id: 'trav-1', fullName: 'Jamie Rivera' },
  { id: 'trav-2', fullName: 'Avery Chen' },
]

const baseDoc = {
  id: 'doc-1',
  type: 'passport',
  travelerId: 'trav-1',
  traveler: { id: 'trav-1', fullName: 'Jamie Rivera' },
  identifier: 'AA1234567',
  issuingCountry: 'US',
  issuedDate: '2024-01-01',
  expiryDate: '2034-01-01',
  status: 'valid',
  hasVaultFile: true,
  vaultFileName: 'passport.pdf',
}

const renderPanel = (props = {}) =>
  render(
    <DocumentsPanel
      tripId="trip-1"
      documents={[baseDoc]}
      travelers={travelers}
      isLoading={false}
      onAdd={vi.fn()}
      onUpdate={vi.fn()}
      onDelete={vi.fn()}
      {...props}
    />
  )

const renderPanelHarness = (options = {}) => {
  const { initialDocuments = [baseDoc] } = options
  const addSpy = vi.fn()
  const deleteSpy = vi.fn()

  let nextId = initialDocuments.length + 1

  const Harness = () => {
    const [docs, setDocs] = useState(initialDocuments)

    const handleAdd = async (tripId, travelerId, payload) => {
      addSpy(tripId, travelerId, payload)
      setDocs((prev) => [
        ...prev,
        {
          id: `doc-${nextId++}`,
          travelerId,
          traveler: travelers.find((traveler) => traveler.id === travelerId) || { id: travelerId, fullName: 'Unknown traveler' },
          type: payload.type,
          identifier: payload.identifier,
          issuingCountry: payload.issuingCountry,
          issuedDate: payload.issuedDate,
          expiryDate: payload.expiryDate,
          status: payload.status,
          hasVaultFile: Boolean(payload.fileUrl),
          vaultFileName: payload.fileUrl ? 'upload.pdf' : undefined,
          notes: payload.notes,
        },
      ])

      return Promise.resolve()
    }

    const handleDelete = async (tripId, documentId) => {
      deleteSpy(tripId, documentId)
      setDocs((prev) => prev.filter((doc) => doc.id !== documentId))
      return Promise.resolve()
    }

    return (
      <DocumentsPanel
        tripId="trip-1"
        documents={docs}
        travelers={travelers}
        isLoading={false}
        onAdd={handleAdd}
        onUpdate={vi.fn()}
        onDelete={handleDelete}
      />
    )
  }

  return { ...render(<Harness />), addSpy, deleteSpy }
}

describe('DocumentsPanel motion-enabled flows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('adds a document with a secure attachment and keeps the morph summary stable', async () => {
    const { addSpy } = renderPanelHarness()

    const addButton = screen.getByRole('button', { name: /add document/i })
    fireEvent.click(addButton)

    const dialog = screen.getByRole('dialog')

    fireEvent.change(screen.getByLabelText(/traveler/i), { target: { value: 'trav-2' } })
    fireEvent.change(screen.getByLabelText(/^type$/i), { target: { value: 'visa' } })
    fireEvent.change(screen.getByLabelText(/identifier/i, { selector: 'input' }), {
      target: { value: 'VISA-7890' },
    })
    fireEvent.change(screen.getByLabelText(/issuing country/i), {
      target: { value: 'SG' },
    })
    fireEvent.change(screen.getByLabelText(/issued/i), { target: { value: '2025-02-01' } })
    fireEvent.change(screen.getByLabelText(/expiry/i), { target: { value: '2026-02-01' } })
    fireEvent.change(screen.getByLabelText(/^status$/i), { target: { value: 'approved' } })
    fireEvent.change(screen.getByLabelText(/file url/i), {
      target: { value: 'https://vault.example.com/uploads/visa.pdf' },
    })
    fireEvent.change(screen.getByLabelText(/notes/i), { target: { value: 'Uploaded during intake' } })

    fireEvent.click(within(dialog).getByRole('button', { name: /add document$/i }))

    await waitFor(() =>
      expect(addSpy).toHaveBeenCalledWith(
        'trip-1',
        'trav-2',
        expect.objectContaining({
          fileUrl: 'https://vault.example.com/uploads/visa.pdf',
          type: 'visa',
        }),
      ),
    )

    const uploadedFileLabel = await screen.findByText('upload.pdf')
    const uploadRow = uploadedFileLabel.closest('tr')
    expect(uploadRow).not.toBeNull()
    expect(
      within(uploadRow).getByText((content) => content.trim().toLowerCase() === 'visa'),
    ).toBeInTheDocument()

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    const editButton = within(uploadRow).getByRole('button', { name: /edit/i })
    fireEvent.click(editButton)

    const editDialog = screen.getByRole('dialog')
    expect(within(editDialog).getByText('VISA-7890')).toBeInTheDocument()
    expect(within(editDialog).getByText(/upload\.pdf/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
  })

  it('removes a document and tears down the morph row cleanly', async () => {
    const secondDoc = {
      id: 'doc-2',
      type: 'insurance',
      travelerId: 'trav-2',
      traveler: travelers[1],
      identifier: 'INS-55',
      issuingCountry: 'SG',
      issuedDate: '2024-05-01',
      expiryDate: '2025-05-01',
      status: 'pending',
      hasVaultFile: false,
    }

    const { deleteSpy } = renderPanelHarness({ initialDocuments: [baseDoc, secondDoc] })
    confirmToastMock.mockImplementation(({ onConfirm }) => onConfirm?.())

    const passportRow = screen.getByText('passport.pdf').closest('tr')
    const deleteButton = within(passportRow).getByRole('button', { name: /delete/i })
    fireEvent.click(deleteButton)

    await waitFor(() => expect(deleteSpy).toHaveBeenCalledWith('trip-1', 'doc-1'))
    await waitFor(() => expect(screen.queryByText('passport.pdf')).not.toBeInTheDocument())

    expect(toastMock.promise).toHaveBeenCalled()
  })

  it('shows the secure-link preview loading state while fetching a vault URL', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.assign(window, { isSecureContext: true })
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    })

    let resolveLink
    requestVaultLinkMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLink = resolve
        }),
    )

    renderPanel()

    const linkButton = screen.getByRole('button', { name: /get secure link/i })
    fireEvent.click(linkButton)

    expect(screen.getByText(/generating/i)).toBeInTheDocument()

    await act(() => resolveLink?.({ downloadUrl: 'https://secure.example.com/tmp', expiresAt: new Date().toISOString() }))

    await waitFor(() => expect(requestVaultLinkMock).toHaveBeenCalledWith('doc-1'))
    await waitFor(() => expect(screen.queryByText(/generating/i)).not.toBeInTheDocument())

    expect(writeTextMock).toHaveBeenCalledWith('https://secure.example.com/tmp')
    expect(toastMock.success).toHaveBeenCalled()
  })
})
