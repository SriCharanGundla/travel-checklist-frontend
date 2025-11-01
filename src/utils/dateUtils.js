import { format, parseISO, isValid } from 'date-fns'

export const formatDate = (value, fallback = 'TBD') => {
  if (!value) return fallback

  const parsed = typeof value === 'string' ? parseISO(value) : new Date(value)
  if (!isValid(parsed)) return fallback

  return format(parsed, 'MMM d, yyyy')
}

export const formatDateRange = (start, end) => {
  const startLabel = formatDate(start)
  const endLabel = formatDate(end)

  if (!start && !end) return 'Dates coming soon'
  if (start && !end) return `${startLabel} onward`
  if (!start && end) return `Until ${endLabel}`

  return `${startLabel} → ${endLabel}`
}

export const isPastDate = (value) => {
  if (!value) return false
  const parsed = typeof value === 'string' ? parseISO(value) : new Date(value)
  if (!isValid(parsed)) return false
  return parsed < new Date()
}

export default {
  formatDate,
  formatDateRange,
  isPastDate,
}
