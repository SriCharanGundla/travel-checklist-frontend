import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getTrips, deleteTrip } from '../services/tripService'
import { formatDateRange } from '../utils/dateUtils'

const statusColors = {
  planning: 'bg-sky-100 text-sky-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  ongoing: 'bg-amber-100 text-amber-700',
  completed: 'bg-gray-200 text-gray-700',
  cancelled: 'bg-rose-100 text-rose-700',
}

const TripList = () => {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)

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

  const handleDelete = async (tripId) => {
    const confirmed = window.confirm('Are you sure you want to delete this trip?')
    if (!confirmed) return

    try {
      await deleteTrip(tripId)
      toast.success('Trip deleted')
      setTrips((prev) => prev.filter((trip) => trip.id !== tripId))
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Unable to delete trip.'
      toast.error(message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Trips</h1>
          <p className="text-sm text-gray-600">Manage destinations, dates, documents, and collaborators.</p>
        </div>
        <Link
          to="/trips/new"
          className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
        >
          Create Trip
        </Link>
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-600">Loading trips...</div>
          ) : trips.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-gray-600">
              <span className="text-lg font-medium">No trips yet</span>
              <p className="text-sm">Create your first trip to start building checklists and itineraries.</p>
            </div>
          ) : (
            trips.map((trip) => (
              <article key={trip.id} className="flex flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <Link to={`/trips/${trip.id}`} className="text-lg font-semibold text-gray-900 hover:text-primary">
                    {trip.name}
                  </Link>
                  <p className="text-sm text-gray-600">{trip.destination || 'Destination TBD'}</p>
                  <p className="text-sm text-gray-500">{formatDateRange(trip.startDate, trip.endDate)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      statusColors[trip.status] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {trip.status}
                  </span>
                  <Link
                    to={`/trips/${trip.id}`}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    View
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(trip.id)}
                    className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default TripList
