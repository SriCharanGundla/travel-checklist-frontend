import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { SensitiveInput } from '../ui/sensitiveInput'
import SensitiveValue from '../ui/sensitiveValue'
import { Skeleton } from '../ui/skeleton'
import { formatDate } from '../../utils/dateUtils'
import { useTravelerDirectoryStore } from '../../stores/travelerDirectoryStore'
import { shallow } from 'zustand/shallow'

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

  const handleResetSelection = () => {
    setSelectedContact(null)
  }

  const onSubmit = async (values) => {
    try {
      if (selectedContact) {
        await updateContact(selectedContact.id, values)
        toast.success('Traveler updated')
      } else {
        await addContact(values)
        toast.success('Traveler saved')
      }
      setSelectedContact(null)
      reset(emptyForm)
    } catch (error) {
      const message =
        error.response?.data?.error?.message || 'Unable to save traveler. Please try again.'
      toast.error(message)
    }
  }

  const handleDelete = async (contact) => {
    const confirmed = window.confirm(`Remove ${contact.fullName} from your directory?`)
    if (!confirmed) return

    try {
      await removeContact(contact.id)
      toast.success('Traveler removed from directory')
      if (selectedContact?.id === contact.id) {
        setSelectedContact(null)
        reset(emptyForm)
      }
    } catch (error) {
      const message =
        error.response?.data?.error?.message || 'Unable to remove traveler. Please try again.'
      toast.error(message)
    }
  }

  return (
    <Card id="traveler-directory">
      <CardHeader>
        <CardTitle>Traveler Directory</CardTitle>
        <CardDescription>
          Store frequent travelers once, then quickly add them to any trip.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Input
                placeholder="Search saved travelers"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="sm:max-w-xs"
              />
              {contacts.length > 0 && (
                <p className="text-xs text-slate-500">
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
                    onClick={() => setSelectedContact(contact)}
                    className={
                      'w-full rounded-lg border p-4 text-left transition hover:border-slate-300 hover:bg-slate-50'
                    + (selectedContact?.id === contact.id ? ' border-slate-400 bg-slate-50' : ' border-slate-200')}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-semibold text-slate-900">{contact.fullName}</span>
                        {contact.passportExpiry && (
                          <span className="text-xs text-slate-500">
                            Passport expires {formatDate(contact.passportExpiry)}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        {contact.preferredName && <span>Prefers {contact.preferredName}</span>}
                        {contact.email && <span>{contact.email}</span>}
                        {contact.phone && <span>{contact.phone}</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : contacts.length ? (
              <p className="rounded-lg border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                No travelers match your search. Try a different keyword.
              </p>
            ) : (
              <p className="rounded-lg border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                Save family members, frequent flyers, or coworkers here to reuse them in future trips.
              </p>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                {selectedContact ? 'Edit traveler' : 'Add traveler'}
              </h3>
              {selectedContact && (
                <Button type="button" variant="ghost" size="sm" onClick={handleResetSelection}>
                  New entry
                </Button>
              )}
            </div>

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
                  <Input id="directory-birthdate" type="date" {...register('birthdate')} />
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
                  <Input id="directory-passportExpiry" type="date" {...register('passportExpiry')} />
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

              <div className="flex justify-between">
                {selectedContact ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-rose-600 hover:bg-rose-50"
                    onClick={() => handleDelete(selectedContact)}
                  >
                    Delete traveler
                  </Button>
                ) : (
                  <span />
                )}

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleResetSelection}>
                    Clear
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving…' : selectedContact ? 'Save changes' : 'Save traveler'}
                  </Button>
                </div>
              </div>
            </form>
          </section>
        </div>

        {contacts.length > 0 && (
          <div className="mt-6 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
            <p className="font-semibold text-slate-600">Tip</p>
            <p>
              When you open a trip’s Travelers tab, choose “Browse saved travelers” to quickly add
              anyone from this directory.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default TravelerDirectoryManager
