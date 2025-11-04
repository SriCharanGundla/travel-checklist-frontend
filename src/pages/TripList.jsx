import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { CalendarRange, Loader2, MapPin, Trash2 } from 'lucide-react'
import { getTrips, deleteTrip } from '../services/tripService'
import { formatDateRange } from '../utils/dateUtils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button, buttonVariants } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Skeleton } from '../components/ui/skeleton'
import { EmptyState } from '../components/common/EmptyState'
import { cn } from '../lib/utils'
import { confirmToast } from '../lib/confirmToast'

const statusVariantMap = {
  planning: 'info',
  confirmed: 'success',
  ongoing: 'warning',
  completed: 'default',
  cancelled: 'danger',
}

const statusLabelMap = {
  planning: 'Planning',
  confirmed: 'Confirmed',
  ongoing: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const TripList = () => {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  const loadTrips = async () => {
    setLoading(true)
    try {
      const data = await getTrips()
      setTrips(data || [])
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Unable to load trips.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTrips()
  }, [])

  const handleDelete = (tripId) => {
    const runDeletion = async () => {
      setDeletingId(tripId)
      try {
        await deleteTrip(tripId)
        setTrips((prev) => prev.filter((trip) => trip.id !== tripId))
      } catch (error) {
        const message = error.response?.data?.error?.message || 'Unable to delete trip.'
        throw new Error(message)
      } finally {
        setDeletingId(null)
      }
    }

    confirmToast({
      title: 'Delete this trip?',
      description: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      tone: 'danger',
      onConfirm: () =>
        toast.promise(runDeletion(), {
          loading: 'Deleting trip…',
          success: 'Trip deleted',
          error: (error) => error.message || 'Unable to delete trip.',
        }),
    })
  }

  const skeletonItems = useMemo(
    () =>
      Array.from({ length: 3 }).map((_, index) => (
        <div key={`trip-skeleton-${index}`} className="flex items-center justify-between border-b border-border px-6 py-5">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40 rounded-md" />
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-3 w-28 rounded-md" />
          </div>
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
      )),
    [],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Trips</h1>
          <p className="text-sm text-muted-foreground">Manage destinations, schedules, and collaborators for upcoming travel.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link to="/trips/new" className={cn(buttonVariants({ variant: 'default', size: 'lg' }), 'sm:w-auto')}>
            Plan a Trip
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader className="px-6 pb-0">
          <CardTitle className="text-lg">Upcoming adventures</CardTitle>
          <CardDescription>Track active itineraries, budgets, and checklist progress at a glance.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y divide-border">{skeletonItems}</div>
          ) : trips.length === 0 ? (
            <EmptyState
              title="No trips yet"
              description="Kick off your next journey by creating a trip and inviting your travel companions."
              action={
                <Link to="/trips/new" className={cn(buttonVariants({ variant: 'default' }))}>
                  Create your first trip
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {trips.map((trip) => (
                <li key={trip.id} className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <Link
                      to={`/trips/${trip.id}`}
                      className="text-lg font-semibold text-foreground transition hover:text-primary"
                    >
                      {trip.name}
                    </Link>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                        {trip.destination || 'Destination TBD'}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <CalendarRange className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        {formatDateRange(trip.startDate, trip.endDate)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant={statusVariantMap[trip.status] || 'default'}>
                      {statusLabelMap[trip.status] || trip.status}
                    </Badge>

                    <Link
                      to={`/trips/${trip.id}`}
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                    >
                      View details
                    </Link>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(trip.id)}
                      disabled={deletingId === trip.id}
                    >
                      {deletingId === trip.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          Removing…
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          Delete
                        </>
                      )}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default TripList
