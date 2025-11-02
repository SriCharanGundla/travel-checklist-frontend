import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Input } from '../ui/input'
import { SensitiveInput } from '../ui/sensitiveInput'
import SensitiveValue from '../ui/sensitiveValue'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Skeleton } from '../ui/skeleton'
import { formatDate, isPastDate } from '../../utils/dateUtils'
import { maskEmail } from '../../utils/privacy'

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

export const TravelersPanel = ({ tripId, travelers, isLoading, onAdd, onUpdate, onDelete }) => {
  const [isDialogOpen, setDialogOpen] = useState(false)
  const [selectedTraveler, setSelectedTraveler] = useState(null)

  const { register, handleSubmit, reset, formState } = useForm({ defaultValues: emptyForm })

  const travelerCountLabel = useMemo(() => {
    if (!travelers?.length) return 'No travelers yet'
    if (travelers.length === 1) return '1 traveler'
    return `${travelers.length} travelers`
  }, [travelers])

  useEffect(() => {
    if (selectedTraveler) {
      const {
        fullName,
        preferredName,
        email,
        phone,
        birthdate,
        passportNumber,
        passportCountry,
        passportExpiry,
        emergencyContactName,
        emergencyContactPhone,
        notes,
      } = selectedTraveler
      reset({
        fullName: fullName || '',
        preferredName: preferredName || '',
        email: email || '',
        phone: phone || '',
        birthdate: birthdate || '',
        passportNumber: passportNumber || '',
        passportCountry: passportCountry || '',
        passportExpiry: passportExpiry || '',
        emergencyContactName: emergencyContactName || '',
        emergencyContactPhone: emergencyContactPhone || '',
        notes: notes || '',
      })
    } else {
      reset(emptyForm)
    }
  }, [selectedTraveler, reset])

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

  const handleRemove = async (traveler) => {
    const confirmed = window.confirm(`Remove ${traveler.fullName} from this trip?`)
    if (!confirmed) return

    try {
      await onDelete(tripId, traveler.id)
      toast.success('Traveler removed')
    } catch (error) {
      const message =
        error.response?.data?.error?.message || 'Unable to remove traveler. Please try again.'
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
      return <Badge className="bg-rose-100 text-rose-700">Expired</Badge>
    }

    const expiryLabel = formatDate(traveler.passportExpiry)
    return <Badge className="bg-emerald-100 text-emerald-700">Valid · {expiryLabel}</Badge>
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Travelers</h2>
          <p className="text-sm text-slate-500">{travelerCountLabel}</p>
        </div>
        <Button onClick={handleCreate}>Add Traveler</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : travelers?.length ? (
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
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
                      <span className="font-medium text-slate-900">{traveler.fullName}</span>
                      {traveler.preferredName && (
                        <span className="text-xs text-slate-500">
                          Prefers {traveler.preferredName}
                        </span>
                      )}
                      {traveler.email && (
                        <span className="text-xs text-slate-500">{maskEmail(traveler.email)}</span>
                      )}
                      {traveler.phone && (
                        <SensitiveValue
                          value={traveler.phone}
                          className="text-xs text-slate-500"
                          emptyPlaceholder="—"
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {traveler.passportNumber ? (
                        <div className="flex flex-col text-sm text-slate-700">
                          <SensitiveValue value={traveler.passportNumber} />
                          {traveler.passportCountry && (
                            <span className="text-xs text-slate-400">{traveler.passportCountry}</span>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400 italic">Not captured</p>
                      )}
                      {renderPassportStatus(traveler)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {traveler.emergencyContactName ? (
                      <div className="flex flex-col text-sm text-slate-700">
                        <span>{traveler.emergencyContactName}</span>
                        {traveler.emergencyContactPhone && (
                          <SensitiveValue
                            value={traveler.emergencyContactPhone}
                            className="text-xs text-slate-500"
                            emptyPlaceholder="—"
                          />
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400 italic">Not provided</span>
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
                        className="border-rose-200 text-rose-600 hover:bg-rose-50"
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
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
          <p className="text-base font-medium text-slate-700">No travelers yet</p>
          <p className="text-sm text-slate-500 max-w-md">
            Invite fellow travelers, store emergency contacts, and keep passports organized in one
            place.
          </p>
          <Button onClick={handleCreate}>Add first traveler</Button>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedTraveler ? 'Edit traveler information' : 'Add a traveler'}
            </DialogTitle>
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
                <Input id="birthdate" type="date" {...register('birthdate')} />
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
                <Input id="passportExpiry" type="date" {...register('passportExpiry')} />
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
    </section>
  )
}

export default TravelersPanel
