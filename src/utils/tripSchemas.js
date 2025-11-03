import { z } from 'zod'

export const statusOptions = [
  { value: 'planning', label: 'Planning' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'ongoing', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export const typeOptions = [
  { value: 'leisure', label: 'Leisure' },
  { value: 'business', label: 'Business' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'family', label: 'Family' },
]

export const tripSchema = z
  .object({
    name: z.string().trim().min(1, 'Trip name is required'),
    destination: z
      .string()
      .optional()
      .transform((value) => (value ? value.trim() : '')),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    status: z.enum(statusOptions.map((option) => option.value)),
    type: z.enum(typeOptions.map((option) => option.value)),
    budgetCurrency: z
      .string()
      .trim()
      .length(3, 'Currency code must be 3 letters')
      .transform((value) => value.toUpperCase()),
    budgetAmount: z
      .union([z.string(), z.number()])
      .transform((value) => {
        if (typeof value === 'number') return value
        if (value === undefined || value === '') return 0
        return Number.parseFloat(value)
      })
      .refine((value) => !Number.isNaN(value) && value >= 0, { message: 'Budget must be zero or greater' }),
    description: z
      .string()
      .optional()
      .transform((value) => (value ? value.trim() : '')),
    notes: z
      .string()
      .optional()
      .transform((value) => (value ? value.trim() : '')),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true
      return new Date(data.startDate) <= new Date(data.endDate)
    },
    { path: ['endDate'], message: 'End date must be on or after start date' },
  )

export default {
  statusOptions,
  typeOptions,
  tripSchema,
}
