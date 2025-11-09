export const tripStatusVariantMap = {
  planning: 'info',
  confirmed: 'success',
  ongoing: 'warning',
  completed: 'default',
  cancelled: 'danger',
}

export const tripStatusLabelMap = {
  planning: 'Planning',
  confirmed: 'Confirmed',
  ongoing: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export function getTripStatusLabel(status) {
  return tripStatusLabelMap[status] || status || 'Unknown'
}
