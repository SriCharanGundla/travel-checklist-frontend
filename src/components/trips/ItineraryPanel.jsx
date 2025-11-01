import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select } from '../ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Skeleton } from '../ui/skeleton'
import { formatDate, formatDateTime } from '../../utils/dateUtils'

const typeLabels = {
  flight: 'Flight',
  accommodation: 'Accommodation',
  activity: 'Activity',
  restaurant: 'Dining',
  transport: 'Transport',
}

const defaultItem = {
  type: 'flight',
  title: '',
  provider: '',
  startTime: '',
  endTime: '',
  bookingReference: '',
  location: '',
  notes: '',
}

export const ItineraryPanel = ({
  tripId,
  items,
  isLoading,
  permission,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [form, setForm] = useState(defaultItem)

  const canEditItinerary = permission?.level === 'admin' || permission?.level === 'edit'

  const groupedItems = useMemo(() => {
    return items.reduce((acc, item) => {
      const dateKey = item.startTime ? formatDate(item.startTime) : 'Unscheduled'
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(item)
      return acc
    }, {})
  }, [items])

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.title) {
      toast.error('Add a title for this itinerary item.')
      return
    }

    try {
      await onAdd(tripId, form)
      toast.success('Itinerary item added')
      setForm(defaultItem)
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Unable to add itinerary item.'
      toast.error(message)
    }
  }

  const handleRemove = async (item) => {
    const confirmed = window.confirm(`Remove "${item.title}" from the itinerary?`)
    if (!confirmed) return

    try {
      await onDelete(tripId, item.id)
      toast.success('Itinerary item removed')
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Unable to remove itinerary item.'
      toast.error(message)
    }
  }

  return (
    <div className="space-y-6">
      {canEditItinerary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Add to itinerary</CardTitle>
            <CardDescription>Outline flights, stays, and activities.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-6">
              <div>
                <Label htmlFor="itinerary-type" className="text-xs uppercase tracking-wide text-slate-500">
                  Type
                </Label>
                <Select
                  id="itinerary-type"
                  value={form.type}
                  onChange={handleChange('type')}
                >
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="itinerary-title" className="text-xs uppercase tracking-wide text-slate-500">
                  Title
                </Label>
                <Input
                  id="itinerary-title"
                  placeholder="Flight to Tokyo"
                  value={form.title}
                  onChange={handleChange('title')}
                  required
                />
              </div>
              <div>
                <Label htmlFor="itinerary-provider" className="text-xs uppercase tracking-wide text-slate-500">
                  Provider
                </Label>
                <Input
                  id="itinerary-provider"
                  placeholder="Airline or vendor"
                  value={form.provider}
                  onChange={handleChange('provider')}
                />
              </div>
              <div>
                <Label htmlFor="itinerary-start" className="text-xs uppercase tracking-wide text-slate-500">
                  Start
                </Label>
                <Input
                  id="itinerary-start"
                  type="datetime-local"
                  value={form.startTime}
                  onChange={handleChange('startTime')}
                />
              </div>
              <div>
                <Label htmlFor="itinerary-end" className="text-xs uppercase tracking-wide text-slate-500">
                  End
                </Label>
                <Input
                  id="itinerary-end"
                  type="datetime-local"
                  value={form.endTime}
                  onChange={handleChange('endTime')}
                />
              </div>
              <div>
                <Label htmlFor="itinerary-location" className="text-xs uppercase tracking-wide text-slate-500">
                  Location
                </Label>
                <Input
                  id="itinerary-location"
                  placeholder="Airport, hotel, venue"
                  value={form.location}
                  onChange={handleChange('location')}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="itinerary-booking" className="text-xs uppercase tracking-wide text-slate-500">
                  Booking reference
                </Label>
                <Input
                  id="itinerary-booking"
                  placeholder="Confirmation #"
                  value={form.bookingReference}
                  onChange={handleChange('bookingReference')}
                />
              </div>
              <div className="md:col-span-3">
                <Label htmlFor="itinerary-notes" className="text-xs uppercase tracking-wide text-slate-500">
                  Notes
                </Label>
                <Input
                  id="itinerary-notes"
                  placeholder="Optional reminders"
                  value={form.notes}
                  onChange={handleChange('notes')}
                />
              </div>
              <div className="md:col-span-6 flex justify-end">
                <Button type="submit">Add item</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Itinerary timeline</CardTitle>
          <CardDescription>Your trip agenda at a glance.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : items?.length ? (
            Object.entries(groupedItems).map(([dateLabel, dayItems]) => (
              <div key={dateLabel} className="mb-5 rounded-xl border border-slate-100 bg-white p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  {dateLabel}
                </h3>
                <Table className="mt-3">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Detail</TableHead>
                      <TableHead>Location</TableHead>
                      {canEditItinerary && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dayItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="w-48 text-sm text-slate-600">
                          {item.startTime ? formatDateTime(item.startTime, 'p') : 'TBD'}
                          {item.endTime && (
                            <span className="block text-xs text-slate-400">
                              • {formatDateTime(item.endTime, 'p')}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="capitalize">
                                {typeLabels[item.type] || item.type}
                              </Badge>
                              <span className="font-semibold text-slate-900">{item.title}</span>
                            </div>
                            {item.provider && (
                              <span className="text-xs text-slate-500">{item.provider}</span>
                            )}
                            {item.bookingReference && (
                              <span className="text-xs text-slate-400">Ref: {item.bookingReference}</span>
                            )}
                            {item.notes && <span className="text-xs text-slate-500">{item.notes}</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {item.location || '—'}
                        </TableCell>
                        {canEditItinerary && (
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-600 hover:bg-rose-50"
                              onClick={() => handleRemove(item)}
                            >
                              Remove
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">Build your itinerary to keep travel days organized.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
