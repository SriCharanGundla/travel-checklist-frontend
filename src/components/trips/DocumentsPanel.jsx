import { useEffect, useRef, useState } from 'react'
import { LayoutGroup, motion } from 'motion/react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Link as LinkIcon, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Input } from '../ui/input'
import { SensitiveInput } from '../ui/sensitiveInput'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select } from '../ui/select'
import { Skeleton } from '../ui/skeleton'
import { formatDate, isPastDate } from '../../utils/dateUtils'
import SensitiveValue from '../ui/sensitiveValue'
import documentService from '../../services/documentService'
import { DatePicker } from '../ui/date-picker'
import { confirmToast } from '../../lib/confirmToast'
import { useAnimationSettings } from '@/contexts/AnimationSettingsContext.jsx'

const DOCUMENT_TYPES = [
  { value: 'passport', label: 'Passport' },
  { value: 'visa', label: 'Visa' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'license', label: 'License' },
]

const DOCUMENT_STATUS = [
  { value: 'pending', label: 'Pending' },
  { value: 'applied', label: 'Applied' },
  { value: 'approved', label: 'Approved' },
  { value: 'valid', label: 'Valid' },
  { value: 'expiring_soon', label: 'Expiring Soon' },
  { value: 'expired', label: 'Expired' },
]

const statusBadgeStyles = {
  pending: 'bg-muted text-foreground',
  applied: 'bg-warning/15 text-warning',
  approved: 'bg-success/15 text-success',
  valid: 'bg-success/15 text-success',
  expiring_soon: 'bg-warning/15 text-warning',
  expired: 'bg-destructive/15 text-destructive',
}

const emptyForm = {
  travelerId: '',
  type: 'passport',
  identifier: '',
  issuingCountry: '',
  issuedDate: '',
  expiryDate: '',
  status: 'pending',
  fileUrl: '',
  notes: '',
}

export const DocumentsPanel = ({
  tripId,
  documents,
  travelers,
  isLoading,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const { prefersReducedMotion } = useAnimationSettings()
  const [isDialogOpen, setDialogOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [vaultLinkLoadingId, setVaultLinkLoadingId] = useState(null)
  const lastFocusRef = useRef(null)

  const { register, handleSubmit, reset, watch, control, formState } = useForm({
    defaultValues: emptyForm,
  })

  const selectedStatus = watch('status')

  useEffect(() => {
    if (selectedDocument) {
      const { traveler, travelerId, type, identifier, issuingCountry, issuedDate, expiryDate, status, notes } =
        selectedDocument
      reset({
        travelerId: travelerId || traveler?.id || '',
        type: type || 'passport',
        identifier: identifier || '',
        issuingCountry: issuingCountry || '',
        issuedDate: issuedDate || '',
        expiryDate: expiryDate || '',
        status: status || 'pending',
        fileUrl: '',
        notes: notes || '',
      })
    } else {
      reset({
        ...emptyForm,
        travelerId: travelers?.[0]?.id || '',
      })
    }
  }, [selectedDocument, reset, travelers])

  const closeDialog = () => {
    setDialogOpen(false)
    setSelectedDocument(null)
    if (lastFocusRef.current && typeof lastFocusRef.current.focus === 'function') {
      lastFocusRef.current.focus()
    }
    lastFocusRef.current = null
  }

  const enableMorphs = !prefersReducedMotion
  const getLayoutId = (segment, id) => (enableMorphs && id ? `document-${segment}-${id}` : undefined)

  const handleCreate = (triggerEl) => {
    if (triggerEl) {
      lastFocusRef.current = triggerEl
    }
    setSelectedDocument(null)
    setDialogOpen(true)
  }

  const handleEdit = (document, triggerEl) => {
    if (triggerEl) {
      lastFocusRef.current = triggerEl
    }
    setSelectedDocument(document)
    setDialogOpen(true)
  }

  const handleRemove = (document) => {
    confirmToast({
      title: `Remove ${document.type}?`,
      description: document.traveler?.fullName
        ? `This will remove the document for ${document.traveler.fullName}.`
        : 'This will remove the document.',
      confirmLabel: 'Remove',
      cancelLabel: 'Cancel',
      tone: 'danger',
      onConfirm: () =>
        toast.promise(onDelete(tripId, document.id), {
          loading: 'Removing document…',
          success: 'Document removed',
          error: (error) =>
            error.response?.data?.error?.message || 'Unable to remove document. Please try again.',
        }),
    })
  }

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      issuingCountry: values.issuingCountry?.toUpperCase() || null,
    }

    try {
      if (selectedDocument) {
        await onUpdate(tripId, selectedDocument.id, payload)
        toast.success('Document updated')
      } else {
        await onAdd(tripId, payload.travelerId, payload)
        toast.success('Document added')
      }
      closeDialog()
    } catch (error) {
      const message =
        error.response?.data?.error?.message || 'Unable to save document. Please try again.'
      toast.error(message)
    }
  }

  const renderExpiryBadge = (document) => {
    if (!document.expiryDate) {
      return <Badge variant="outline">N/A</Badge>
    }

    const statusClass =
      statusBadgeStyles[document.status] ||
      (isPastDate(document.expiryDate)
        ? statusBadgeStyles.expired
        : statusBadgeStyles.valid)

    return <Badge className={statusClass}>{formatDate(document.expiryDate)}</Badge>
  }

  const handleRequestVaultLink = async (document) => {
    if (!document?.id) {
      return
    }

    setVaultLinkLoadingId(document.id)
    try {
      const result = await documentService.requestVaultDownloadLink(document.id)
      const secureUrl = result?.downloadUrl
      if (!secureUrl) {
        throw new Error('Secure link missing from response')
      }

      const expiresAt = result?.expiresAt ? new Date(result.expiresAt) : null
      const message = expiresAt
        ? `Secure link ready (expires ${expiresAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).`
        : 'Secure link ready.'

      const shouldCopy = window.isSecureContext && navigator.clipboard
      if (shouldCopy) {
        await navigator.clipboard.writeText(secureUrl)
        toast.success(`${message} Copied to clipboard.`)
      } else {
        toast.success(`${message} Opening in a new tab.`)
        window.open(secureUrl, '_blank', 'noopener')
      }
    } catch (error) {
      const message =
        error.response?.data?.error?.message || error.message || 'Unable to generate secure link.'
      toast.error(message)
    } finally {
      setVaultLinkLoadingId(null)
    }
  }

  return (
    <LayoutGroup id={`documents-layout-${tripId || 'default'}`}>
      <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Documents</h2>
          <p className="text-sm text-muted-foreground">
            Track passports, visas, insurance, and other critical paperwork.
          </p>
        </div>
        <Button onClick={(event) => handleCreate(event.currentTarget)} disabled={!travelers?.length}>
          Add Document
        </Button>
      </div>

      {!travelers?.length && (
        <div className="rounded-xl border border-warning/40 bg-warning/15 p-4 text-warning">
          Add at least one traveler to begin tracking documents.
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : documents?.length ? (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Traveler</TableHead>
                <TableHead>Identifier</TableHead>
                <TableHead>Attachment</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((document) => (
                <motion.tr
                  key={document.id}
                  layoutId={getLayoutId('row', document.id)}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  <TableCell className="capitalize">
                    <motion.span layoutId={getLayoutId('type', document.id)} className="font-medium text-foreground">
                      {document.type}
                    </motion.span>
                  </TableCell>
                  <TableCell>
                    <motion.span layoutId={getLayoutId('traveler', document.id)}>
                      {document.traveler?.fullName || 'Unknown traveler'}
                    </motion.span>
                  </TableCell>
                  <TableCell>
                    <motion.div layoutId={getLayoutId('identifier', document.id)} className="flex flex-col text-sm text-foreground">
                      <SensitiveValue value={document.identifier} />
                      {document.issuingCountry && (
                        <span className="text-xs text-muted-foreground">{document.issuingCountry}</span>
                      )}
                    </motion.div>
                  </TableCell>
                  <TableCell>
                    {document.hasVaultFile ? (
                      <motion.div layoutId={getLayoutId('attachment', document.id)} className="flex flex-col gap-2">
                        <span className="text-xs text-muted-foreground">
                          {document.vaultFileName || 'Secure attachment'}
                        </span>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="inline-flex items-center gap-2"
                          onClick={() => handleRequestVaultLink(document)}
                          disabled={vaultLinkLoadingId === document.id}
                        >
                          {vaultLinkLoadingId === document.id ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                              Generating…
                            </>
                          ) : (
                            <>
                              <LinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
                              Get secure link
                            </>
                          )}
                        </Button>
                      </motion.div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No file stored</span>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(document.issuedDate)}</TableCell>
                  <TableCell>{renderExpiryBadge(document)}</TableCell>
                  <TableCell>
                    <motion.div layoutId={getLayoutId('status', document.id)}>
                      <Badge className={statusBadgeStyles[document.status] || 'bg-muted text-muted-foreground'}>
                        {document.status.replace('_', ' ')}
                      </Badge>
                    </motion.div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={(event) => handleEdit(document, event.currentTarget)}>
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-destructive/40 text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemove(document)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted p-10 text-center">
          <p className="text-base font-medium text-foreground">No documents tracked yet</p>
          <p className="text-sm text-muted-foreground max-w-md">
            Add passports, visas, and insurance policies to get expiry reminders and quick access
            during travel.
          </p>
          <Button onClick={handleCreate} disabled={!travelers?.length}>
            Add a document
          </Button>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          {enableMorphs && selectedDocument ? (
            <motion.div
              layoutId={getLayoutId('row', selectedDocument.id)}
              className="rounded-xl border border-border/60 bg-muted/60 p-4 shadow-inner"
            >
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <motion.div
                  layoutId={getLayoutId('type', selectedDocument.id)}
                  className="text-lg font-semibold capitalize text-foreground"
                >
                  {selectedDocument.type}
                </motion.div>
                <motion.div
                  layoutId={getLayoutId('traveler', selectedDocument.id)}
                  className="text-muted-foreground"
                >
                  {selectedDocument.traveler?.fullName || 'Unknown traveler'}
                </motion.div>
                <motion.div
                  layoutId={getLayoutId('status', selectedDocument.id)}
                  className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                >
                  {selectedDocument.status.replace('_', ' ')}
                </motion.div>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <motion.div layoutId={getLayoutId('identifier', selectedDocument.id)} className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{selectedDocument.identifier || 'No identifier'}</span>
                  {selectedDocument.issuingCountry && <span>{selectedDocument.issuingCountry}</span>}
                </motion.div>
                {selectedDocument.hasVaultFile ? (
                  <motion.span layoutId={getLayoutId('attachment', selectedDocument.id)}>
                    {selectedDocument.vaultFileName || 'Secure attachment stored'}
                  </motion.span>
                ) : null}
              </div>
            </motion.div>
          ) : null}
          <DialogHeader>
            <DialogTitle>{selectedDocument ? 'Edit document' : 'Add document'}</DialogTitle>
            <DialogDescription>
              Store key travel paperwork details and keep attachments secure.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="travelerId">Traveler</Label>
                <Controller
                  name="travelerId"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select
                      id="travelerId"
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                      required
                    >
                      {travelers.map((traveler) => (
                        <option key={traveler.id} value={traveler.id}>
                          {traveler.fullName}
                        </option>
                      ))}
                    </Select>
                  )}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Controller
                  name="type"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select
                      id="type"
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                      required
                    >
                      {DOCUMENT_TYPES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="identifier">Identifier</Label>
                <SensitiveInput
                  id="identifier"
                  placeholder="Document number"
                  {...register('identifier')}
                  toggleLabel="Toggle document identifier visibility"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="issuingCountry">Issuing country</Label>
                <Input
                  id="issuingCountry"
                  placeholder="USA"
                  maxLength={2}
                  {...register('issuingCountry')}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="issuedDate">Issued</Label>
                <Controller
                  name="issuedDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      id="issuedDate"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Select issued date"
                    />
                  )}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expiryDate">Expiry</Label>
                <Controller
                  name="expiryDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      id="expiryDate"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Select expiry date"
                    />
                  )}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Controller
                  name="status"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select
                      id="status"
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                      required
                    >
                      {DOCUMENT_STATUS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="fileUrl">File URL</Label>
                <SensitiveInput
                  id="fileUrl"
                  placeholder="https://vault.example.com/object-key"
                  {...register('fileUrl')}
                  toggleLabel="Toggle secure file reference visibility"
                />
                {selectedDocument?.hasVaultFile ? (
                  <p className="text-xs text-muted-foreground">
                    A secure file is already stored. Providing a new URL will replace the existing attachment.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Paste a secure vault URL (HTTPS, approved host). Leave blank to omit an attachment.
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" rows={3} placeholder="Where the document is stored..." {...register('notes')} />
              </div>
            </div>

            {selectedStatus === 'expiring_soon' && (
              <p className="text-sm text-warning">
                Marked as expiring soon — consider renewing this document before it lapses.
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={formState.isSubmitting || !travelers.length}>
                {selectedDocument ? 'Save changes' : 'Add document'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
    </LayoutGroup>
  )
}

export default DocumentsPanel
