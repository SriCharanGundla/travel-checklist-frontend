export const cn = (...inputs) => {
  const classes = []

  inputs.forEach((input) => {
    if (!input) return

    if (typeof input === 'string') {
      classes.push(...input.split(' '))
      return
    }

    if (Array.isArray(input)) {
      classes.push(...input)
      return
    }

    if (typeof input === 'object') {
      Object.entries(input).forEach(([key, value]) => {
        if (value) {
          classes.push(key)
        }
      })
    }
  })

  return classes
    .map((className) => className.trim())
    .filter(Boolean)
    .join(' ')
}
