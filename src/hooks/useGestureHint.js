import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const STORAGE_PREFIX = 'travel-checklist:gesture-hint:'
const DISMISS_VALUE = 'dismissed'

export function useGestureHint(key, { autoHideMs = 6000 } = {}) {
  const storageKey = useMemo(() => `${STORAGE_PREFIX}${key}`, [key])
  const isClient = typeof window !== 'undefined'
  const initialRef = useRef(isClient ? window.localStorage.getItem(storageKey) : null)
  const [visible, setVisible] = useState(() => initialRef.current !== DISMISS_VALUE)

  useEffect(() => {
    if (!isClient) return
    const stored = window.localStorage.getItem(storageKey)
    setVisible(stored !== DISMISS_VALUE)
  }, [isClient, storageKey])

  const acknowledge = useCallback(() => {
    if (!isClient) {
      setVisible(false)
      return
    }
    window.localStorage.setItem(storageKey, DISMISS_VALUE)
    setVisible(false)
  }, [isClient, storageKey])

  const reset = useCallback(() => {
    if (!isClient) {
      setVisible(true)
      return
    }
    window.localStorage.removeItem(storageKey)
    setVisible(true)
  }, [isClient, storageKey])

  useEffect(() => {
    if (!visible || !autoHideMs) {
      return
    }
    const timeout = setTimeout(() => {
      acknowledge()
    }, autoHideMs)
    return () => clearTimeout(timeout)
  }, [acknowledge, autoHideMs, visible])

  return {
    visible,
    acknowledge,
    reset,
  }
}

export default useGestureHint
