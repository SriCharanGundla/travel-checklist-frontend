import '@testing-library/jest-dom/vitest'

const originalWarn = console.warn.bind(console)

console.warn = (...args) => {
  const [firstArg] = args
  if (typeof firstArg === 'string' && firstArg.includes('React Router Future Flag Warning')) {
    return
  }
  originalWarn(...args)
}
