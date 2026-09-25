import { useEffect, useState } from 'react'

export function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return { ...fallback, ...JSON.parse(raw) }
  } catch {
    return fallback
  }
}

export function usePersistentState<T extends object>(
  key: string,
  fallback: T
) {
  const [value, setValue] = useState<T>(() => readStored(key, fallback))

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage full or unavailable; keep in-memory state
    }
  }, [key, value])

  return [value, setValue] as const
}
