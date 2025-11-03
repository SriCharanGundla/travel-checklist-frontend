import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext({
  theme: 'light',
  resolvedTheme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
})

const STORAGE_KEY = 'travel-checklist-theme'

const getSystemPreference = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

const getInitialTheme = () => {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') {
    return stored
  }

  return getSystemPreference() ? 'dark' : 'light'
}

const applyTheme = (theme) => {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.dataset.theme = theme
  root.style.colorScheme = theme
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => getInitialTheme())

  useEffect(() => {
    applyTheme(theme)
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (event) => {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored !== 'light' && stored !== 'dark') {
        setTheme(event.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme: theme,
      setTheme,
      toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
