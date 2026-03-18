import { useEffect, useState } from 'react'

export interface HistoryItem<T = unknown> {
  id: string
  createdAt: number
  data: T
}

function readFromStorage<T>(key: string): HistoryItem<T>[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as HistoryItem<T>[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeToStorage<T>(key: string, items: HistoryItem<T>[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(items))
  } catch {
    // ignore storage failures
  }
}

export function useLocalHistory<T>(key: string, max = 20) {
  const [items, setItems] = useState<HistoryItem<T>[]>([])

  useEffect(() => {
    setItems(readFromStorage<T>(key))
  }, [key])

  const add = (data: T) => {
    const next: HistoryItem<T>[] = [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
        data,
      },
      ...items,
    ].slice(0, max)

    setItems(next)
    writeToStorage(key, next)
  }

  const clear = () => {
    setItems([])
    writeToStorage<T>(key, [])
  }

  return { items, add, clear }
}

