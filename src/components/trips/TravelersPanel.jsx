import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Input } from '../ui/input'
import { DatePicker } from '../ui/date-picker'
import { SensitiveInput } from '../ui/sensitiveInput'
import SensitiveValue from '../ui/sensitiveValue'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Skeleton } from '../ui/skeleton'
import { formatDate, isPastDate } from '../../utils/dateUtils'
import { maskEmail } from '../../utils/privacy'
import { useTravelerDirectoryStore } from '../../stores/travelerDirectoryStore'
import { shallow } from 'zustand/shallow'
import { confirmToast } from '../../lib/confirmToast'

const emptyForm = {
  fullName: '',
  preferredName: '',
  email: '',
  phone: '',
  birthdate: '',
  passportNumber: '',
  passportCountry: '',
  passportExpiry: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  notes: '',
}

const mapTravelerToFormValues = (traveler) => ({
  fullName: traveler?.fullName || '',
  preferredName: traveler?.preferredName || '',
  email: traveler?.email || '',
  phone: traveler?.phone || '',
  birthdate: traveler?.birthdate || '',
  passportNumber: traveler?.passportNumber || '',
  passportCountry: traveler?.passportCountry || '',
  passportExpiry: traveler?.passportExpiry || '',
  emergencyContactName: traveler?.emergencyContactName || '',
  emergencyContactPhone: traveler?.emergencyContactPhone || '',
  notes: traveler?.notes || '',
})

export const TravelersPanel = ({ tripId, travelers, isLoading, onAdd, onUpdate, onDelete }) => {
  const [isDialogOpen, setDialogOpen] = useState(false)
  const [selectedTraveler, setSelectedTraveler] = useState(null)
  const [isDirectoryOpen, setDirectoryOpen] = useState(false)
  const [directoryFilter, setDirectoryFilter] = useState('')
  const navigate = useNavigate()

  const { register, handleSubmit, reset, control, formState } = useForm({ defaultValues: emptyForm })

  const {
    contacts,
    isLoading: directoryLoading,
    hasLoaded: directoryLoaded,
    fetchContacts,
  } = useTravelerDirectoryStore(
    (state) => ({
      contacts: state.contacts,
      isLoading: state.isLoading,
      hasLoaded: state.hasLoaded,
      fetchContacts: state.fetchContacts,
    }),
    shallow
  )

  const travelerCountLabel = useMemo(() => {
    if (!travelers?.length) return 'No travelers yet'
    if (travelers.length === 1) return '1 traveler'
    return `${travelers.length} travelers`
  }, [travelers])

  const filteredContacts = useMemo(() => {
    const term = directoryFilter.trim().toLowerCase()
    if (!term) return contacts
    return contacts.filter((contact) => {
      const haystacks = [
        contact.fullName,
        contact.preferredName,
        contact.email,
        contact.phone,
        contact.notes,
      ]
        .filter(Boolean)
        .map((value) => value.toString().toLowerCase())
      return haystacks.some((value) => value.includes(term))
    })
  }, [contacts, directoryFilter])

  useEffect(() => {
    reset(mapTravelerToFormValues(selectedTraveler))
  }, [selectedTraveler, reset])

  useEffect(() => {
    if (!isDirectoryOpen) {
      return
    }

    setDirectoryFilter('')

    if (directoryLoaded || directoryLoading) {
      return
    }

    fetchContacts().catch(() =>
      toast.error('Unable to load traveler directory. Please try again.')
    )
  }, [isDirectoryOpen, directoryLoaded, directoryLoading, fetchContacts])

  const closeDialog = () => {
    setDialogOpen(false)
    setSelectedTraveler(null)
  }

  const handleCreate = () => {
    setSelectedTraveler(null)
    setDialogOpen(true)
  }

  const handleEdit = (traveler) => {
    setSelectedTraveler(traveler)
    setDialogOpen(true)
  }

  const handleRemove = (traveler) => {
    confirmToast({
      title: `Remove ${traveler.fullName}?`,
      description: 'They will lose access to this trip.',
      confirmLabel: 'Remove',
      cancelLabel: 'Cancel',
      tone: 'danger',
      onConfirm: () =>
        toast.promise(onDelete(tripId, traveler.id), {
          loading: 'Removing traveler…',
          success: 'Traveler removed',
          error: (error) =>
            error.response?.data?.error?.message || 'Unable to remove traveler. Please try again.',
        }),
    })
  }

  const handleOpenDirectory = () => {
    setDirectoryOpen(true)
  }

  const handleCloseDirectory = () => {
    setDirectoryOpen(false)
  }

  const handleManageDirectory = () => {
    setDirectoryOpen(false)
    navigate('/profile#travelers')
  }

  const contactIdsInTrip = useMemo(() => {
    if (!Array.isArray(travelers)) {
      return new Set()
    }
    return new Set(travelers.filter((traveler) => traveler.contactId).map((traveler) => traveler.contactId))
  }, [travelers])

  const handleAddSavedTraveler = async (contact) => {
    if (contactIdsInTrip.has(contact.id)) {
      toast.error(`${contact.fullName} is already part of this trip.`)
      return
    }

    const payload = {
      contactId: contact.id,
      fullName: contact.fullName,
      preferredName: contact.preferredName,
      email: contact.email,
      phone: contact.phone,
      birthdate: contact.birthdate,
      passportNumber: contact.passportNumber,
      passportCountry: contact.passportCountry,
      passportExpiry: contact.passportExpiry,
      emergencyContactName: contact.emergencyContactName,
      emergencyContactPhone: contact.emergencyContactPhone,
      notes: contact.notes,
    }

    try {
      await onAdd(tripId, payload)
      toast.success(`${contact.fullName} added to this trip`)
      setDirectoryOpen(false)
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        'Unable to add traveler from directory. Please try again.'
      toast.error(message)
    }
  }

  const onSubmit = async (values) => {
    try {
      if (selectedTraveler) {
        await onUpdate(tripId, selectedTraveler.id, values)
        toast.success('Traveler updated')
      } else {
        await onAdd(tripId, values)
        toast.success('Traveler added')
      }
      closeDialog()
    } catch (error) {
      const message =
        error.response?.data?.error?.message || 'Unable to save traveler. Please try again.'
      toast.error(message)
    }
  }

  const renderPassportStatus = (traveler) => {
    if (!traveler.passportExpiry) {
      return <Badge variant="outline">No expiry set</Badge>
    }

    if (isPastDate(traveler.passportExpiry)) {
      return <Badge className="bg-destructive/15 text-destructive">Expired</Badge>
    }

    const expiryLabel = formatDate(traveler.passportExpiry)
    return <Badge className="bg-success/15 text-success">Valid · {expiryLabel}</Badge>
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Travelers</h2>
          <p className="text-sm text-muted-foreground">{travelerCountLabel}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleOpenDirectory}>
            Browse saved travelers
          </Button>
          <Button onClick={handleCreate}>Add Traveler</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : travelers?.length ? (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Passport</TableHead>
                <TableHead>Emergency Contact</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {travelers.map((traveler) => (
                <TableRow key={traveler.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{traveler.fullName}</span>
                      {traveler.preferredName && (
                        <span className="text-xs text-muted-foreground">
                          Prefers {traveler.preferredName}
                        </span>
                      )}
                      {traveler.email && (
                        <span className="text-xs text-muted-foreground">{maskEmail(traveler.email)}</span>
                      )}
                      {traveler.phone && (
                        <SensitiveValue
                          value={traveler.phone}
                          className="text-xs text-muted-foreground"
                          emptyPlaceholder="—"
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {traveler.passportNumber ? (
                        <div className="flex flex-col text-sm text-foreground">
                          <SensitiveValue value={traveler.passportNumber} />
                          {traveler.passportCountry && (
                            <span className="text-xs text-muted-foreground">{traveler.passportCountry}</span>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Not captured</p>
                      )}
                      {renderPassportStatus(traveler)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {traveler.emergencyContactName ? (
                      <div className="flex flex-col text-sm text-foreground">
                        <span>{traveler.emergencyContactName}</span>
                        {traveler.emergencyContactPhone && (
                          <SensitiveValue
                            value={traveler.emergencyContactPhone}
                            className="text-xs text-muted-foreground"
                            emptyPlaceholder="—"
                          />
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">Not provided</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {traveler.documents?.length
                        ? `${traveler.documents.length} document${traveler.documents.length > 1 ? 's' : ''}`
                        : 'No documents'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(traveler)}>
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-destructive/40 text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemove(traveler)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted p-10 text-center">
          <p className="text-base font-medium text-foreground">No travelers yet</p>
          <p className="text-sm text-muted-foreground max-w-md">
            Invite fellow travelers, store emergency contacts, and keep passports organized in one
            place.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={handleCreate}>Add first traveler</Button>
            <Button variant="outline" onClick={handleOpenDirectory}>
              Browse saved travelers
            </Button>
            <Button variant="ghost" onClick={() => navigate('/profile#travelers')}>
              Manage directory
            </Button>
          </div>
        </div>
      )}

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog()
          } else {
            setDialogOpen(true)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedTraveler ? 'Edit traveler information' : 'Add a traveler'}
            </DialogTitle>
            <DialogDescription>
              Keep traveler profiles up to date so the team can access documents and contacts.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-3">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" placeholder="Traveler name" {...register('fullName')} required />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="preferredName">Preferred name</Label>
                <Input id="preferredName" placeholder="Nickname" {...register('preferredName')} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="birthdate">Birthdate</Label>
                <Controller
                  control={control}
                  name="birthdate"
                  render={({ field }) => (
                    <DatePicker
                      id="birthdate"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Select birthdate"
                    />
                  )}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="traveler@email.com" {...register('email')} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <SensitiveInput
                  id="phone"
                  placeholder="+1 555-123-4567"
                  {...register('phone')}
                  toggleLabel="Toggle traveler phone visibility"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="passportNumber">Passport number</Label>
                <SensitiveInput
                  id="passportNumber"
                  placeholder="123456789"
                  {...register('passportNumber')}
                  toggleLabel="Toggle passport number visibility"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="passportCountry">Country</Label>
                <Input id="passportCountry" placeholder="USA" maxLength={2} {...register('passportCountry')} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="passportExpiry">Passport expiry</Label>
                <Controller
                  control={control}
                  name="passportExpiry"
                  render={({ field }) => (
                    <DatePicker
                      id="passportExpiry"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Select expiry"
                    />
                  )}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="emergencyContactName">Emergency contact</Label>
                <Input id="emergencyContactName" placeholder="Contact name" {...register('emergencyContactName')} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="emergencyContactPhone">Emergency phone</Label>
                <SensitiveInput
                  id="emergencyContactPhone"
                  placeholder="+1 555-987-6543"
                  {...register('emergencyContactPhone')}
                  toggleLabel="Toggle emergency contact phone visibility"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" placeholder="Allergies, seating needs…" rows={3} {...register('notes')} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={formState.isSubmitting}>
                {selectedTraveler ? 'Save changes' : 'Add traveler'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDirectoryOpen}
        onOpenChange={(open) => {
          if (open) {
            setDirectoryOpen(true)
          } else {
            handleCloseDirectory()
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Browse saved travelers</DialogTitle>
            <DialogDescription>
              Pick someone from your directory to add them to this trip.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Input
                placeholder="Search saved travelers"
                value={directoryFilter}
                onChange={(event) => setDirectoryFilter(event.target.value)}
                className="sm:max-w-xs"
              />
              <Button type="button" variant="ghost" onClick={handleManageDirectory}>
                Manage directory
              </Button>
            </div>

            {directoryLoading && !directoryLoaded ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : contacts.length ? (
              filteredContacts.length ? (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-base font-semibold text-foreground">{contact.fullName}</p>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {contact.preferredName && <span>Prefers {contact.preferredName}</span>}
                          {contact.email && <span>{maskEmail(contact.email)}</span>}
                          {contact.phone && (
                            <SensitiveValue
                              value={contact.phone}
                              className="text-xs text-muted-foreground"
                              emptyPlaceholder="—"
                            />
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAddSavedTraveler(contact)}
                          disabled={contactIdsInTrip.has(contact.id)}
                        >
                          {contactIdsInTrip.has(contact.id) ? 'Already added' : 'Add to trip'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-border bg-muted p-6 text-sm text-muted-foreground">
                  No saved travelers match your search.
                </p>
              )
            ) : (
              <div className="space-y-3 rounded-lg border border-dashed border-border bg-muted p-6 text-sm text-muted-foreground">
                <p>Save travelers in your profile to use this picker.</p>
                <Button type="button" size="sm" onClick={handleManageDirectory}>
                  Go to profile
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-end">
            <Button type="button" variant="outline" onClick={handleCloseDirectory}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

export default TravelersPanel
