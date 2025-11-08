import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { DatePicker } from '../ui/date-picker'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { SensitiveInput } from '../ui/sensitiveInput'
import { Skeleton } from '../ui/skeleton'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { formatDate } from '../../utils/dateUtils'
import { useTravelerDirectoryStore } from '../../stores/travelerDirectoryStore'
import { shallow } from 'zustand/shallow'
import { cn } from '../../lib/utils'
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

const mapContactToForm = (contact) => ({
  fullName: contact?.fullName || '',
  preferredName: contact?.preferredName || '',
  email: contact?.email || '',
  phone: contact?.phone || '',
  birthdate: contact?.birthdate || '',
  passportNumber: contact?.passportNumber || '',
  passportCountry: contact?.passportCountry || '',
  passportExpiry: contact?.passportExpiry || '',
  emergencyContactName: contact?.emergencyContactName || '',
  emergencyContactPhone: contact?.emergencyContactPhone || '',
  notes: contact?.notes || '',
})

export const TravelerDirectoryManager = () => {
  const [selectedContact, setSelectedContact] = useState(null)
  const [filter, setFilter] = useState('')
  const [isDialogOpen, setDialogOpen] = useState(false)

  const {
    contacts,
    isLoading,
    hasLoaded,
    fetchContacts,
    addContact,
    updateContact,
    removeContact,
  } = useTravelerDirectoryStore(
    (state) => ({
      contacts: state.contacts,
      isLoading: state.isLoading,
      hasLoaded: state.hasLoaded,
      fetchContacts: state.fetchContacts,
      addContact: state.addContact,
      updateContact: state.updateContact,
      removeContact: state.removeContact,
    }),
    shallow
  )

  const {
    handleSubmit,
    register,
    control,
    reset,
    formState: { isSubmitting },
  } = useForm({ defaultValues: emptyForm })

  useEffect(() => {
    if (!hasLoaded && !isLoading) {
      fetchContacts().catch(() => {
        toast.error('Unable to load traveler directory. Please try again.')
      })
    }
  }, [hasLoaded, isLoading, fetchContacts])

  useEffect(() => {
    reset(mapContactToForm(selectedContact))
  }, [selectedContact, reset])

  const openDialogForNew = () => {
    setSelectedContact(null)
    reset(emptyForm)
    setDialogOpen(true)
  }

  const openDialogForEdit = (contact) => {
    setSelectedContact(contact)
    reset(mapContactToForm(contact))
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setSelectedContact(null)
    reset(emptyForm)
  }

  const filteredContacts = useMemo(() => {
    const term = filter.trim().toLowerCase()
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
  }, [contacts, filter])

  const onSubmit = async (values) => {
    try {
      if (selectedContact) {
        await updateContact(selectedContact.id, values)
        toast.success('Traveler updated')
      } else {
        await addContact(values)
        toast.success('Traveler saved')
      }
      closeDialog()
    } catch (error) {
      const message =
        error.response?.data?.error?.message || 'Unable to save traveler. Please try again.'
      toast.error(message)
    }
  }

  const handleDelete = (contact) => {
    const remove = async () => {
      try {
        await removeContact(contact.id)
        if (selectedContact?.id === contact.id) {
          closeDialog()
        }
      } catch (error) {
        const message =
          error.response?.data?.error?.message || 'Unable to remove traveler. Please try again.'
        throw new Error(message)
      }
    }

    confirmToast({
      title: `Remove ${contact.fullName}?`,
      description: 'This contact will be removed from your directory.',
      confirmLabel: 'Remove',
      cancelLabel: 'Cancel',
      tone: 'danger',
      onConfirm: () =>
        toast.promise(remove(), {
          loading: 'Removing traveler…',
          success: 'Traveler removed from directory',
          error: (error) => error.message || 'Unable to remove traveler. Please try again.',
        }),
    })
  }

  return (
    <Card id="traveler-directory">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Traveler Directory</CardTitle>
            <CardDescription>
              Store frequent travelers once, then quickly add them to any trip.
            </CardDescription>
          </div>
          <Button type="button" onClick={openDialogForNew}>
            Add traveler
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input
              placeholder="Search saved travelers"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="sm:max-w-xs"
            />
            {contacts.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Showing {filteredContacts.length} of {contacts.length} saved traveler
                {contacts.length === 1 ? '' : 's'}
              </p>
            )}
          </div>

          {isLoading && !hasLoaded ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : filteredContacts.length ? (
            <div className="space-y-3">
              {filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => openDialogForEdit(contact)}
                  className={cn(
                    'w-full rounded-lg border border-border bg-card/80 p-4 text-left transition hover:border-primary/40 hover:bg-muted',
                    selectedContact?.id === contact.id && isDialogOpen && 'border-primary bg-muted/70',
                  )}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-semibold text-foreground">{contact.fullName}</span>
                      {contact.passportExpiry && (
                        <span className="text-xs text-muted-foreground">
                          Passport expires {formatDate(contact.passportExpiry)}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {contact.preferredName && <span>Prefers {contact.preferredName}</span>}
                      {contact.email && <span>{contact.email}</span>}
                      {contact.phone && <span>{contact.phone}</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : contacts.length ? (
            <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
              No travelers match your search. Try a different keyword.
            </p>
          ) : (
            <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
              Save family members, frequent flyers, or coworkers here to reuse them in future trips.
            </p>
          )}
        </section>

        {contacts.length > 0 && (
          <div className="mt-6 space-y-2 rounded-lg border border-border bg-muted p-4 text-xs text-muted-foreground">
            <p className="font-semibold text-muted-foreground">Tip</p>
            <p>
              When you open a trip’s Travelers tab, choose “Browse saved travelers” to quickly add
              anyone from this directory.
            </p>
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedContact ? 'Edit traveler' : 'Add traveler'}</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-2">
              <Label htmlFor="directory-fullName">Full name</Label>
              <Input id="directory-fullName" placeholder="Traveler name" {...register('fullName')} required />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="directory-preferredName">Preferred name</Label>
                <Input id="directory-preferredName" placeholder="Nickname" {...register('preferredName')} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="directory-birthdate">Birthdate</Label>
                <Controller
                  control={control}
                  name="birthdate"
                  render={({ field }) => (
                    <DatePicker
                      id="directory-birthdate"
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
                <Label htmlFor="directory-email">Email</Label>
                <Input id="directory-email" type="email" placeholder="traveler@email.com" {...register('email')} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="directory-phone">Phone</Label>
                <SensitiveInput
                  id="directory-phone"
                  placeholder="+1 555-123-4567"
                  {...register('phone')}
                  toggleLabel="Toggle traveler phone visibility"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="directory-passportNumber">Passport number</Label>
                <SensitiveInput
                  id="directory-passportNumber"
                  placeholder="123456789"
                  {...register('passportNumber')}
                  toggleLabel="Toggle passport number visibility"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="directory-passportCountry">Country</Label>
                <Input id="directory-passportCountry" placeholder="USA" maxLength={2} {...register('passportCountry')} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="directory-passportExpiry">Passport expiry</Label>
                <Controller
                  control={control}
                  name="passportExpiry"
                  render={({ field }) => (
                    <DatePicker
                      id="directory-passportExpiry"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Select expiry"
                    />
                  )}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="directory-emergencyContactName">Emergency contact</Label>
                <Input
                  id="directory-emergencyContactName"
                  placeholder="Contact name"
                  {...register('emergencyContactName')}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="directory-emergencyContactPhone">Emergency phone</Label>
                <SensitiveInput
                  id="directory-emergencyContactPhone"
                  placeholder="+1 555-987-6543"
                  {...register('emergencyContactPhone')}
                  toggleLabel="Toggle emergency contact phone visibility"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="directory-notes">Notes</Label>
                <Textarea id="directory-notes" placeholder="Allergies, seating needs…" rows={3} {...register('notes')} />
              </div>
            </div>

            <DialogFooter className="justify-between">
              <div>
                {selectedContact ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(selectedContact)}
                  >
                    Delete traveler
                  </Button>
                ) : null}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving…' : selectedContact ? 'Save changes' : 'Save traveler'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default TravelerDirectoryManager
