import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { useAuth } from '../contexts/AuthContext'
import dashboardService from '../services/dashboardService'
import { Button } from '../components/ui/button'

const formatNumber = (value) => {
  if (value === null || value === undefined) {
    return '—'
  }
  return Number(value).toLocaleString()
}

const NextTripDetails = ({ trip }) => {
  if (!trip) {
    return (
      <div className="rounded-xl bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Next Trip</h2>
        <p className="mt-2 text-sm text-muted-foreground">Add start dates to your trips to see countdowns and destinations here.</p>
      </div>
    )
  }

  const startDateLabel = trip.startDate ? format(new Date(trip.startDate), 'MMM d, yyyy') : 'TBD'
  const endDateLabel = trip.endDate ? format(new Date(trip.endDate), 'MMM d, yyyy') : null
  const destinationLabel = trip.destination || 'Destination TBA'

  return (
    <div className="rounded-xl bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">Next Trip</h2>
      <div className="mt-3 space-y-2 text-sm text-foreground">
        <p className="text-base font-semibold text-foreground">{trip.name}</p>
        <p className="text-muted-foreground">{destinationLabel}</p>
        <p>
          <span className="font-medium text-foreground">{startDateLabel}</span>
          {endDateLabel ? <span className="text-muted-foreground"> → {endDateLabel}</span> : null}
        </p>
        <p className="text-muted-foreground">
          {trip.daysUntil === 0
            ? 'Trip is happening now!'
            : `${trip.daysUntil} day${trip.daysUntil === 1 ? '' : 's'} to go`}
        </p>
      </div>
    </div>
  )
}

const TasksPlaceholder = ({ tasks }) => (
  <div className="rounded-xl bg-card p-5 shadow-sm">
    <h2 className="text-lg font-semibold text-foreground">Tasks Due Soon</h2>
    <p className="mt-4 text-3xl font-semibold text-primary">{formatNumber(tasks?.dueSoonCount ?? 0)}</p>
    <p className="mt-2 text-sm text-muted-foreground">
      {tasks?.placeholder
        ? tasks.message || 'Checklist tasks are coming online with the Phase 2 release.'
        : 'Tasks due within the next 7 days.'}
    </p>
  </div>
)

const KpiCard = ({ label, value, sublabel }) => (
  <div className="rounded-xl bg-card p-5 shadow-sm">
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <p className="mt-2 text-3xl font-semibold text-foreground">{formatNumber(value)}</p>
    {sublabel ? <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p> : null}
  </div>
)

const Dashboard = () => {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const fetchMetrics = async () => {
      try {
        const overview = await dashboardService.getOverview()
        if (isMounted) {
          setMetrics(overview)
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load dashboard metrics', err)
          setError('We could not load your dashboard data. Please try again shortly.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchMetrics()

    return () => {
      isMounted = false
    }
  }, [])

  const statusSummary = useMemo(() => {
    if (!metrics?.statusBreakdown) return []
    return Object.entries(metrics.statusBreakdown)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => ({
        status,
        count,
      }))
  }, [metrics])

  return (
    <div className="space-y-8">
      <header className="rounded-xl bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">Welcome, {user?.firstName || 'Traveler'}!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Track upcoming trips, see recent changes, and jump into your checklists.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/trips/new">Plan a New Trip</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/trips">View All Trips</Link>
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-sm text-muted-foreground">
          Loading your dashboard metrics…
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">{error}</div>
      ) : (
        <>
          <section className="grid gap-6 md:grid-cols-3">
            <KpiCard label="Upcoming Trips" value={metrics?.totals?.upcomingTripCount} />
            <KpiCard label="Trips In Progress" value={metrics?.totals?.activeTripCount} />
            <KpiCard label="All Trips" value={metrics?.totals?.totalTrips} />
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <NextTripDetails trip={metrics?.nextTrip} />
            <TasksPlaceholder tasks={metrics?.tasks} />
          </section>

          <section className="rounded-xl bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Status Breakdown</h2>
            {statusSummary.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Create trips and update their status to see insights here.</p>
            ) : (
              <ul className="mt-3 grid gap-2 text-sm text-foreground md:grid-cols-2">
                {statusSummary.map(({ status, count }) => (
                  <li key={status} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
                    <span className="capitalize text-muted-foreground">{status}</span>
                    <span className="font-semibold text-foreground">{formatNumber(count)}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              Updated {metrics?.generatedAt ? format(new Date(metrics.generatedAt), 'MMM d, yyyy h:mm a') : 'recently'}
            </p>
          </section>
        </>
      )}
    </div>
  )
}

export default Dashboard
