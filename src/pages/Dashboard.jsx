import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { useAuth } from '../contexts/AuthContext'
import dashboardService from '../services/dashboardService'

const formatNumber = (value) => {
  if (value === null || value === undefined) {
    return '—'
  }
  return Number(value).toLocaleString()
}

const NextTripDetails = ({ trip }) => {
  if (!trip) {
    return (
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Next Trip</h2>
        <p className="mt-2 text-sm text-gray-600">Add start dates to your trips to see countdowns and destinations here.</p>
      </div>
    )
  }

  const startDateLabel = trip.startDate ? format(new Date(trip.startDate), 'MMM d, yyyy') : 'TBD'
  const endDateLabel = trip.endDate ? format(new Date(trip.endDate), 'MMM d, yyyy') : null
  const destinationLabel = trip.destination || 'Destination TBA'

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Next Trip</h2>
      <div className="mt-3 space-y-2 text-sm text-gray-700">
        <p className="text-base font-semibold text-gray-900">{trip.name}</p>
        <p className="text-gray-600">{destinationLabel}</p>
        <p>
          <span className="font-medium text-gray-900">{startDateLabel}</span>
          {endDateLabel ? <span className="text-gray-500"> → {endDateLabel}</span> : null}
        </p>
        <p className="text-gray-600">
          {trip.daysUntil === 0
            ? 'Trip is happening now!'
            : `${trip.daysUntil} day${trip.daysUntil === 1 ? '' : 's'} to go`}
        </p>
      </div>
    </div>
  )
}

const TasksPlaceholder = ({ tasks }) => (
  <div className="rounded-xl bg-white p-5 shadow-sm">
    <h2 className="text-lg font-semibold text-gray-900">Tasks Due Soon</h2>
    <p className="mt-4 text-3xl font-semibold text-primary">{formatNumber(tasks?.dueSoonCount ?? 0)}</p>
    <p className="mt-2 text-sm text-gray-600">
      {tasks?.placeholder
        ? tasks.message || 'Checklist tasks are coming online with the Phase 2 release.'
        : 'Tasks due within the next 7 days.'}
    </p>
  </div>
)

const KpiCard = ({ label, value, sublabel }) => (
  <div className="rounded-xl bg-white p-5 shadow-sm">
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="mt-2 text-3xl font-semibold text-gray-900">{formatNumber(value)}</p>
    {sublabel ? <p className="mt-1 text-xs text-gray-500">{sublabel}</p> : null}
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
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        status,
        count,
      }))
  }, [metrics])

  return (
    <div className="space-y-8">
      <header className="rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">Welcome, {user?.firstName || 'Traveler'}!</h1>
        <p className="mt-2 text-sm text-gray-600">
          Track upcoming trips, see recent changes, and jump into your checklists.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/trips/new"
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
          >
            Plan a New Trip
          </Link>
          <Link
            to="/trips"
            className="inline-flex items-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            View All Trips
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white/50 p-6 text-sm text-gray-500">
          Loading your dashboard metrics…
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>
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

          <section className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Status Breakdown</h2>
            {statusSummary.length === 0 ? (
              <p className="mt-2 text-sm text-gray-600">Create trips and update their status to see insights here.</p>
            ) : (
              <ul className="mt-3 grid gap-2 text-sm text-gray-700 md:grid-cols-2">
                {statusSummary.map(({ status, count }) => (
                  <li key={status} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                    <span className="capitalize text-gray-600">{status}</span>
                    <span className="font-semibold text-gray-900">{formatNumber(count)}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-xs text-gray-400">
              Updated {metrics?.generatedAt ? format(new Date(metrics.generatedAt), 'MMM d, yyyy h:mm a') : 'recently'}
            </p>
          </section>
        </>
      )}
    </div>
  )
}

export default Dashboard
