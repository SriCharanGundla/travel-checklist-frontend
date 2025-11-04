import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select } from '../ui/select'
import { Skeleton } from '../ui/skeleton'
import { cn } from '../../lib/utils'
import { formatDateTime } from '../../utils/dateUtils'
import { DateTimePicker } from '../ui/date-picker'
import { confirmToast } from '../../lib/confirmToast'

const toIsoString = (value) => {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }
  return parsed.toISOString()
}

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

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const toDate = (value) => {
  if (!value) return null
  const parsed = typeof value === 'string' ? parseISO(value) : new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }
  return parsed
}

const getDateKey = (date) => format(startOfDay(date), 'yyyy-MM-dd')

const toInputValue = (value) => {
  const date = toDate(value)
  if (!date) return ''
  const offsetMinutes = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offsetMinutes * 60000)
  return local.toISOString().slice(0, 16)
}

const getSegmentSortValue = (segment) => {
  const startTime = toDate(segment.item.startTime)
  const endTime = toDate(segment.item.endTime)

  if (segment.isStart || !endTime) {
    return startTime ? startTime.getTime() : Number.POSITIVE_INFINITY
  }

  if (segment.isEnd && endTime) {
    return endTime.getTime()
  }

  if (startTime) {
    return startTime.getTime()
  }

  return Number.POSITIVE_INFINITY
}

const compareSegments = (a, b) => {
  const diff = getSegmentSortValue(a) - getSegmentSortValue(b)
  if (diff !== 0) return diff

  const sortOrderDiff = (a.item.sortOrder || 0) - (b.item.sortOrder || 0)
  if (sortOrderDiff !== 0) return sortOrderDiff

  return a.item.title.localeCompare(b.item.title)
}

const buildItineraryByDay = (items) => {
  const dayMap = new Map()
  const unscheduled = []

  items.forEach((item) => {
    const startTime = toDate(item.startTime)
    const endTimeRaw = toDate(item.endTime)

    if (!startTime) {
      unscheduled.push(item)
      return
    }

    const endTime = endTimeRaw && endTimeRaw >= startTime ? endTimeRaw : startTime
    const daySpan = eachDayOfInterval({ start: startOfDay(startTime), end: startOfDay(endTime) })

    daySpan.forEach((day, index) => {
      const key = getDateKey(day)
      const segments = dayMap.get(key) || []
      segments.push({
        item,
        dayDate: day,
        dayKey: key,
        isStart: index === 0,
        isEnd: index === daySpan.length - 1,
      })
      dayMap.set(key, segments)
    })
  })

  const orderedEntries = Array.from(dayMap.entries()).sort(([keyA], [keyB]) =>
    keyA.localeCompare(keyB)
  )

  const itineraryByDay = orderedEntries.reduce((acc, [key, segments]) => {
    acc[key] = segments
      .slice()
      .sort(compareSegments)
    return acc
  }, {})

  const unscheduledSorted = unscheduled
    .slice()
    .sort((a, b) => {
      const orderDiff = (a.sortOrder || 0) - (b.sortOrder || 0)
      if (orderDiff !== 0) return orderDiff
      const startDiff = getSegmentSortValue({ item: a, isStart: true, isEnd: false }) -
        getSegmentSortValue({ item: b, isStart: true, isEnd: false })
      if (startDiff !== 0) return startDiff
      return a.title.localeCompare(b.title)
    })

  return {
    itineraryByDay,
    dayKeys: orderedEntries.map(([key]) => key),
    unscheduled: unscheduledSorted,
  }
}

const generateCalendarDays = (month) => {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 })
  const days = []

  for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) {
    days.push(cursor)
  }

  return days
}

export const ItineraryPanel = ({
  tripId,
  items,
  isLoading,
  permission,
  tripStartDate,
  tripEndDate,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [form, setForm] = useState(() => ({ ...defaultItem }))
  const [editingItem, setEditingItem] = useState(null)
  const [activeMonth, setActiveMonth] = useState(() => startOfMonth(new Date()))
  const [selectedDayKey, setSelectedDayKey] = useState(null)
  const [viewMode, setViewMode] = useState('calendar')

  const canEditItinerary = permission?.level === 'admin' || permission?.level === 'edit'

  const tripStart = useMemo(() => {
    const parsed = toDate(tripStartDate)
    return parsed ? startOfDay(parsed) : null
  }, [tripStartDate])

  const tripEnd = useMemo(() => {
    const parsed = toDate(tripEndDate)
    return parsed ? startOfDay(parsed) : null
  }, [tripEndDate])

  const { itineraryByDay, dayKeys, unscheduled } = useMemo(
    () => buildItineraryByDay(items || []),
    [items]
  )

  const timelineGroups = useMemo(() => {
    const groups = new Map()
    const unscheduledItems = []

    ;(items || []).forEach((item) => {
      const startDate = toDate(item.startTime)
      if (!startDate) {
        unscheduledItems.push(item)
        return
      }

      const key = format(startOfDay(startDate), 'yyyy-MM-dd')
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key).push(item)
    })

    const sortedKeys = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b))
    const entries = sortedKeys.map((key) => {
      const dayItems = groups.get(key).slice()
      dayItems.sort((a, b) => {
        const aStart = a.startTime ? new Date(a.startTime).getTime() : Number.POSITIVE_INFINITY
        const bStart = b.startTime ? new Date(b.startTime).getTime() : Number.POSITIVE_INFINITY
        if (aStart !== bStart) {
          return aStart - bStart
        }
        return (a.sortOrder || 0) - (b.sortOrder || 0)
      })

      return {
        dayKey: key,
        label: format(parseISO(key), 'EEE, MMM d, yyyy'),
        items: dayItems,
      }
    })

    return {
      entries,
      unscheduled: unscheduledItems,
    }
  }, [items])

  const fallbackDayKey = useMemo(() => {
    if (dayKeys.length) return dayKeys[0]
    if (tripStart) return getDateKey(tripStart)
    if (tripEnd) return getDateKey(tripEnd)
    return getDateKey(new Date())
  }, [dayKeys, tripStart, tripEnd])

  useEffect(() => {
    setSelectedDayKey((current) => {
      if (current && (dayKeys.length === 0 || dayKeys.includes(current))) {
        return current
      }
      return fallbackDayKey
    })
  }, [dayKeys, fallbackDayKey])

  useEffect(() => {
    if (!selectedDayKey) {
      setActiveMonth(startOfMonth(parseISO(fallbackDayKey)))
      return
    }

    const selectedDate = parseISO(selectedDayKey)
    if (!isSameMonth(selectedDate, activeMonth)) {
      setActiveMonth(startOfMonth(selectedDate))
    }
  }, [selectedDayKey, fallbackDayKey, activeMonth])

  const calendarDays = useMemo(() => generateCalendarDays(activeMonth), [activeMonth])
  const highlightedDays = useMemo(() => new Set(dayKeys), [dayKeys])
  const selectedDayDate = selectedDayKey ? parseISO(selectedDayKey) : null
  const selectedDaySegments = selectedDayKey ? itineraryByDay[selectedDayKey] || [] : []

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }
  const handleDateTimeChange = (field) => (value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.title) {
      toast.error('Add a title for this itinerary item.')
      return
    }

    try {
      const payload = {
        ...form,
        startTime: toIsoString(form.startTime) || null,
        endTime: toIsoString(form.endTime) || null,
      }

      if (editingItem) {
        const updated = await onUpdate(tripId, editingItem.id, payload)
        toast.success('Itinerary item updated')
        setEditingItem(null)
        setForm({ ...defaultItem })
        const updatedDate = toDate(updated?.startTime)
        if (updatedDate) {
          setSelectedDayKey(getDateKey(updatedDate))
        }
      } else {
        const created = await onAdd(tripId, payload)
        toast.success('Itinerary item added')
        setForm({ ...defaultItem })
        const createdDate = toDate(created?.startTime)
        if (createdDate) {
          setSelectedDayKey(getDateKey(createdDate))
        }
      }
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Unable to save itinerary item.'
      toast.error(message)
    }
  }

  const handleRemove = (item) => {
    const removeItem = async () => {
      try {
        await onDelete(tripId, item.id)
        if (editingItem?.id === item.id) {
          setEditingItem(null)
          setForm({ ...defaultItem })
        }
      } catch (error) {
        const message = error.response?.data?.error?.message || 'Unable to remove itinerary item.'
        throw new Error(message)
      }
    }

    confirmToast({
      title: 'Remove itinerary item?',
      description: `Remove "${item.title}" from the itinerary?`,
      confirmLabel: 'Remove',
      cancelLabel: 'Cancel',
      tone: 'danger',
      onConfirm: () =>
        toast.promise(removeItem(), {
          loading: 'Removing item…',
          success: 'Itinerary item removed',
          error: (error) => error.message || 'Unable to remove itinerary item.',
        }),
    })
  }

  const handleMonthChange = (offset) => {
    setActiveMonth((prev) => startOfMonth(addMonths(prev, offset)))
  }

  const handleSelectDay = (day) => {
    const key = getDateKey(day)
    setSelectedDayKey(key)
  }

  const handleEditItem = (item) => {
    setEditingItem(item)
    setForm({
      type: item.type || defaultItem.type,
      title: item.title || '',
      provider: item.provider || '',
      startTime: toInputValue(item.startTime),
      endTime: toInputValue(item.endTime),
      bookingReference: item.bookingReference || '',
      location: item.location || '',
      notes: item.notes || '',
    })

    const itemDate = toDate(item.startTime)
    if (itemDate) {
      setSelectedDayKey(getDateKey(itemDate))
    }
  }

  const handleCancelEdit = () => {
    setEditingItem(null)
    setForm({ ...defaultItem })
  }

  const renderTimelineTimes = (item) => {
    const startTime = toDate(item.startTime)
    const endTime = toDate(item.endTime)

    return (
      <div className="text-sm text-foreground">
        <span className="font-semibold">{startTime ? formatDateTime(startTime, 'p') : 'TBD'}</span>
        {endTime && (
          <span className="mt-1 block text-xs text-muted-foreground">
            {`Arrives ${formatDateTime(
              endTime,
              startTime && isSameDay(startTime, endTime) ? 'p' : 'MMM d • p'
            )}`}
          </span>
        )}
      </div>
    )
  }

  const renderSegmentTimes = (segment) => {
    const startTime = toDate(segment.item.startTime)
    const endTime = toDate(segment.item.endTime)

    if (segment.isStart) {
      return (
        <div>
          <span className="text-sm font-semibold text-foreground">
            {startTime ? format(startTime, 'p') : 'TBD'}
          </span>
          {endTime && (
            <span className="mt-1 block text-xs text-muted-foreground">
              {`Arrives ${format(
                endTime,
                startTime && isSameDay(startTime, endTime) ? 'p' : 'MMM d • p'
              )}`}
            </span>
          )}
        </div>
      )
    }

    if (segment.isEnd && endTime) {
      return (
        <div>
          <span className="text-sm font-semibold text-foreground">
            {`Arrives ${format(endTime, 'p')}`}
          </span>
          {startTime && !isSameDay(startTime, endTime) && (
            <span className="mt-1 block text-xs text-muted-foreground">
              {`Departed ${format(startTime, 'MMM d • p')}`}
            </span>
          )}
        </div>
      )
    }

    if (startTime) {
      return (
        <span className="text-sm font-semibold text-foreground">{format(startTime, 'p')}</span>
      )
    }

    return <span className="text-sm text-muted-foreground">Time TBD</span>
  }

  const dayIsWithinTrip = (day) => {
    if (highlightedDays.has(getDateKey(day))) {
      return true
    }

    if (tripStart && isBefore(day, startOfDay(tripStart))) {
      return false
    }

    if (tripEnd && isAfter(day, endOfDay(tripEnd))) {
      return false
    }

    return true
  }

  return (
    <div className="space-y-6">
      {canEditItinerary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Add to itinerary</CardTitle>
            <CardDescription>
              {editingItem ? `Editing "${editingItem.title}"` : 'Outline flights, stays, and activities.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-6">
              <div>
                <Label htmlFor="itinerary-type" className="text-xs uppercase tracking-wide text-muted-foreground">
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
                <Label htmlFor="itinerary-title" className="text-xs uppercase tracking-wide text-muted-foreground">
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
                <Label htmlFor="itinerary-provider" className="text-xs uppercase tracking-wide text-muted-foreground">
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
                <Label htmlFor="itinerary-start" className="text-xs uppercase tracking-wide text-muted-foreground">
                  Start
                </Label>
                <DateTimePicker
                  id="itinerary-start"
                  value={form.startTime}
                  onChange={handleDateTimeChange('startTime')}
                  placeholder="Select start time"
                />
              </div>
              <div>
                <Label htmlFor="itinerary-end" className="text-xs uppercase tracking-wide text-muted-foreground">
                  End
                </Label>
                <DateTimePicker
                  id="itinerary-end"
                  value={form.endTime}
                  onChange={handleDateTimeChange('endTime')}
                  placeholder="Select end time"
                />
              </div>
              <div>
                <Label htmlFor="itinerary-location" className="text-xs uppercase tracking-wide text-muted-foreground">
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
                <Label htmlFor="itinerary-booking" className="text-xs uppercase tracking-wide text-muted-foreground">
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
                <Label htmlFor="itinerary-notes" className="text-xs uppercase tracking-wide text-muted-foreground">
                  Notes
                </Label>
                <Input
                  id="itinerary-notes"
                  placeholder="Optional reminders"
                  value={form.notes}
                  onChange={handleChange('notes')}
                />
              </div>
              <div className="md:col-span-6 flex justify-end gap-2">
                {editingItem && (
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                )}
                <Button type="submit">{editingItem ? 'Save changes' : 'Add item'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">Itinerary timeline</CardTitle>
            <CardDescription>
              Switch between the calendar and the full list to review travel details.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              onClick={() => setViewMode('calendar')}
            >
              Calendar
            </Button>
            <Button
              type="button"
              variant={viewMode === 'timeline' ? 'default' : 'outline'}
              onClick={() => setViewMode('timeline')}
            >
              Timeline
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : viewMode === 'calendar' ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(240px,0.9fr)_minmax(0,2.1fr)]">
              <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => handleMonthChange(-1)}
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <div className="text-sm font-semibold text-foreground">
                    {format(activeMonth, 'MMMM yyyy')}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => handleMonthChange(1)}
                    aria-label="Next month"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>

                <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {weekdayLabels.map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>

                <div className="mt-2 grid grid-cols-7 gap-1">
                  {calendarDays.map((day) => {
                    const dayKey = getDateKey(day)
                    const isSelected = selectedDayKey === dayKey
                    const hasItinerary = highlightedDays.has(dayKey)
                    const isToday = isSameDay(day, new Date())
                    const isDisabled = !dayIsWithinTrip(day)

                    return (
                      <button
                        key={dayKey + format(day, 'yyyyMMdd')}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => handleSelectDay(day)}
                        className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-md text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/50',
                          {
                            'text-muted-foreground': !isSameMonth(day, activeMonth),
                            'border border-primary/30 bg-muted text-foreground': hasItinerary && !isSelected,
                            'bg-primary text-primary-foreground shadow': isSelected,
                            'ring-1 ring-primary/40': isToday && !isSelected,
                            'opacity-40 pointer-events-none': isDisabled,
                          }
                        )}
                      >
                        {format(day, 'd')}
                      </button>
                    )
                  })}
                </div>
                {!items?.length && (
                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    Add itinerary items to see them appear on the calendar.
                  </p>
                )}
              </section>

              <section className="space-y-5">
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-base font-semibold text-foreground">
                      {selectedDayDate ? format(selectedDayDate, 'EEEE, MMM d, yyyy') : 'Select a day'}
                    </h3>
                    {selectedDaySegments.length > 0 && (
                      <Badge variant="outline" className="w-fit">
                        {selectedDaySegments.length} item{selectedDaySegments.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>

                  {selectedDaySegments.length ? (
                    <div className="mt-4 space-y-4">
                      {selectedDaySegments.map((segment) => (
                        <div
                          key={`${segment.item.id}-${segment.dayKey}`}
                          className={cn(
                            'rounded-lg border border-border p-4',
                            editingItem?.id === segment.item.id && 'border-primary bg-muted/70'
                          )}
                        >
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 text-sm">
                                <Badge variant="secondary" className="capitalize">
                                  {typeLabels[segment.item.type] || segment.item.type}
                                </Badge>
                                <span className="text-base font-semibold text-foreground">
                                  {segment.item.title}
                                </span>
                              </div>
                              {segment.item.provider && (
                                <p className="mt-1 text-sm text-muted-foreground">{segment.item.provider}</p>
                              )}
                              {segment.item.location && (
                                <p className="mt-2 text-sm text-muted-foreground">{segment.item.location}</p>
                              )}
                              {segment.item.notes && (
                                <p className="mt-2 text-sm text-muted-foreground">{segment.item.notes}</p>
                              )}
                              {segment.item.bookingReference && (
                                <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
                                  Ref: {segment.item.bookingReference}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-start gap-3 text-left md:items-end md:text-right">
                              {renderSegmentTimes(segment)}
                              {canEditItinerary && (
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditItem(segment.item)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:bg-destructive/10"
                                    onClick={() => handleRemove(segment.item)}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-6 text-sm text-muted-foreground">
                      {items?.length
                        ? 'No itinerary items are planned for this day.'
                        : 'Build your itinerary to keep travel days organized.'}
                    </p>
                  )}
                </div>

                {unscheduled.length > 0 && (
                  <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Unscheduled items
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Add start times to place these items on the calendar.
                    </p>
                    <div className="mt-3 space-y-3">
                      {unscheduled.map((item) => (
                        <div
                          key={item.id}
                          className={cn(
                            'flex flex-col gap-2 rounded-lg border border-dashed border-border/70 p-3 sm:flex-row sm:items-center sm:justify-between',
                            editingItem?.id === item.id && 'border-primary bg-muted/70'
                          )}
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="capitalize">
                                {typeLabels[item.type] || item.type}
                              </Badge>
                              <span className="text-sm font-medium text-foreground">{item.title}</span>
                            </div>
                            {item.notes && <span className="text-xs text-muted-foreground">{item.notes}</span>}
                          </div>
                          {canEditItinerary && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditItem(item)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => handleRemove(item)}
                              >
                                Remove
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </div>
          ) : (
            <div className="space-y-5">
              {timelineGroups.entries.length ? (
                timelineGroups.entries.map((group) => (
                  <div key={group.dayKey} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        {group.label}
                      </h3>
                      <Badge variant="outline">{group.items.length} item{group.items.length > 1 ? 's' : ''}</Badge>
                    </div>
                    <div className="mt-3 space-y-4">
                      {group.items.map((item) => (
                        <div
                          key={item.id}
                          className={cn(
                            'flex flex-col gap-4 rounded-lg border border-border p-4 md:flex-row md:items-start md:justify-between',
                            editingItem?.id === item.id && 'border-primary bg-muted/70'
                          )}
                        >
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              <Badge variant="secondary" className="capitalize">
                                {typeLabels[item.type] || item.type}
                              </Badge>
                              <span className="text-base font-semibold text-foreground">{item.title}</span>
                            </div>
                            {item.provider && (
                              <p className="mt-1 text-sm text-muted-foreground">{item.provider}</p>
                            )}
                            {item.location && (
                              <p className="mt-2 text-sm text-muted-foreground">{item.location}</p>
                            )}
                            {item.notes && (
                              <p className="mt-2 text-sm text-muted-foreground">{item.notes}</p>
                            )}
                            {item.bookingReference && (
                              <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
                                Ref: {item.bookingReference}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-start gap-3 text-left md:items-end md:text-right">
                            {renderTimelineTimes(item)}
                            {canEditItinerary && (
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleEditItem(item)}>
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:bg-destructive/10"
                                  onClick={() => handleRemove(item)}
                                >
                                  Remove
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Add itinerary items to see the full timeline here.
                </p>
              )}

              {timelineGroups.unscheduled.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Unscheduled items
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Add start times to place these items on the timeline.
                  </p>
                  <div className="mt-3 space-y-3">
                    {timelineGroups.unscheduled.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          'flex flex-col gap-2 rounded-lg border border-dashed border-border/70 p-3 sm:flex-row sm:items-center sm:justify-between',
                          editingItem?.id === item.id && 'border-primary bg-muted/70'
                        )}
                      >
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="capitalize">
                              {typeLabels[item.type] || item.type}
                            </Badge>
                            <span className="text-sm font-medium text-foreground">{item.title}</span>
                          </div>
                          {item.notes && <span className="text-xs text-muted-foreground">{item.notes}</span>}
                        </div>
                        {canEditItinerary && (
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditItem(item)}>
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemove(item)}
                            >
                              Remove
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
