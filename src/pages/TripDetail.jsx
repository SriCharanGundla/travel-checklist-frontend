import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getTripById, deleteTrip } from '../services/tripService'
import { formatDateRange } from '../utils/dateUtils'

const fieldList = [
  { label: 'Destination', key: 'destination' },
  { label: 'Trip Type', key: 'type' },
  { label: 'Status', key: 'status' },
  { label: 'Budget', key: 'budgetAmount', format: (value, trip) => `${trip.budgetCurrency} ${Number(value || 0).toLocaleString()}` },
  { label: 'Description', key: 'description' },
  { label: 'Notes', key: 'notes' },
]

const TripDetail = () => {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTrip = async () => {
      setLoading(true)
      try {
        const data = await getTripById(tripId)
        setTrip(data)
      } catch (error) {
        const message = error.response?.data?.error?.message || 'Unable to load trip details.'
        toast.error(message)
        navigate('/trips', { replace: true })
      } finally {
        setLoading(false)
      }
    }

    loadTrip()
  }, [tripId, navigate])

  const handleDelete = async () => {
    const confirmed = window.confirm('Delete this trip? This cannot be undone.')
    if (!confirmed) return

    try {
      await deleteTrip(tripId)
      toast.success('Trip deleted')
      navigate('/trips', { replace: true })
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Unable to delete trip.'
      toast.error(message)
    }
  }

  if (loading) {
    return <div className="flex h-full items-center justify-center text-gray-600">Loading trip...</div>
  }

  if (!trip) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{trip.name}</h1>
          <p className="text-sm text-gray-600">{formatDateRange(trip.startDate, trip.endDate)}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/trips"
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Back to Trips
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
          >
            Delete Trip
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {fieldList.map(({ label, key, format }) => (
          <div key={key} className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{label}</h2>
            <p className="mt-2 text-base text-gray-900">
              {format ? format(trip[key], trip) : trip[key] || 'Not provided'}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TripDetail
