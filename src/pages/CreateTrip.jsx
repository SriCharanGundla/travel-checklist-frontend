import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { createTrip } from '../services/tripService'

const tripSchema = z.object({
  name: z.string().min(1, 'Trip name is required'),
  destination: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['planning', 'confirmed', 'ongoing', 'completed', 'cancelled']).default('planning'),
  type: z.enum(['leisure', 'business', 'adventure', 'family']).default('leisure'),
  budgetCurrency: z.string().length(3, 'Currency code must be 3 letters').default('USD'),
  budgetAmount: z
    .string()
    .optional()
    .transform((value) => (value ? Number.parseFloat(value) : 0))
    .refine((value) => !Number.isNaN(value) && value >= 0, { message: 'Budget must be a positive number' }),
  description: z.string().optional(),
  notes: z.string().optional(),
})

const CreateTrip = () => {
  const navigate = useNavigate()

  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      name: '',
      destination: '',
      startDate: '',
      endDate: '',
      status: 'planning',
      type: 'leisure',
      budgetCurrency: 'USD',
      budgetAmount: 0,
      description: '',
      notes: '',
    },
  })

  const onSubmit = async (values) => {
    try {
      await createTrip({
        ...values,
        budgetAmount: values.budgetAmount ?? 0,
        destination: values.destination || null,
        description: values.description || null,
        notes: values.notes || null,
        startDate: values.startDate || null,
        endDate: values.endDate || null,
      })
      toast.success('Trip created successfully')
      navigate('/trips', { replace: true })
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Unable to create trip.'
      toast.error(message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Create a New Trip</h1>
        <p className="text-sm text-gray-600">Add details about your upcoming travel to unlock collaborative planning tools.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl bg-white p-6 shadow-sm" noValidate>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Trip name
            </label>
            <input
              id="name"
              type="text"
              className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              {...register('name')}
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="destination" className="block text-sm font-medium text-gray-700">
              Destination
            </label>
            <input
              id="destination"
              type="text"
              className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              {...register('destination')}
            />
            {errors.destination && <p className="mt-1 text-sm text-red-500">{errors.destination.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Start date
              </label>
              <input
                id="startDate"
                type="date"
                className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                {...register('startDate')}
              />
              {errors.startDate && <p className="mt-1 text-sm text-red-500">{errors.startDate.message}</p>}
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                End date
              </label>
              <input
                id="endDate"
                type="date"
                className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                {...register('endDate')}
              />
              {errors.endDate && <p className="mt-1 text-sm text-red-500">{errors.endDate.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              {...register('status')}
            >
              <option value="planning">Planning</option>
              <option value="confirmed">Confirmed</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Trip type
            </label>
            <select
              id="type"
              className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              {...register('type')}
            >
              <option value="leisure">Leisure</option>
              <option value="business">Business</option>
              <option value="adventure">Adventure</option>
              <option value="family">Family</option>
            </select>
          </div>

          <div>
            <label htmlFor="budgetCurrency" className="block text-sm font-medium text-gray-700">
              Budget currency
            </label>
            <input
              id="budgetCurrency"
              type="text"
              className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 uppercase text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              {...register('budgetCurrency')}
            />
            {errors.budgetCurrency && <p className="mt-1 text-sm text-red-500">{errors.budgetCurrency.message}</p>}
          </div>

          <div>
            <label htmlFor="budgetAmount" className="block text-sm font-medium text-gray-700">
              Budget amount
            </label>
            <input
              id="budgetAmount"
              type="number"
              min="0"
              step="0.01"
              className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              {...register('budgetAmount')}
            />
            {errors.budgetAmount && <p className="mt-1 text-sm text-red-500">{errors.budgetAmount.message}</p>}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              {...register('description')}
            />
            {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              {...register('notes')}
            />
            {errors.notes && <p className="mt-1 text-sm text-red-500">{errors.notes.message}</p>}
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/60"
          >
            {isSubmitting ? 'Saving...' : 'Create Trip'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateTrip
