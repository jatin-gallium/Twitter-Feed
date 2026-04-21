import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { TweetPost } from '@/types/export'
import {
  clearForeverLibrary,
  deleteForeverEntry,
  loadAllForeverEntries,
  upsertForeverEntry,
  type ForeverEntry,
} from '@/lib/foreverLibraryStore'
import { ForeverLibraryContext } from '@/context/foreverLibraryContext'

function entriesToMap(entries: ForeverEntry[]): Map<string, ForeverEntry> {
  const m = new Map<string, ForeverEntry>()
  for (const e of entries) m.set(e.id, e)
  return m
}

export function ForeverLibraryProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false)
  const [entries, setEntries] = useState<Map<string, ForeverEntry>>(
    () => new Map(),
  )

  useEffect(() => {
    let cancelled = false
    void loadAllForeverEntries()
      .then((list) => {
        if (!cancelled) setEntries(entriesToMap(list))
      })
      .finally(() => {
        if (!cancelled) setHydrated(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const persistEntry = useCallback((e: ForeverEntry) => {
    void upsertForeverEntry(e)
  }, [])

  const pinForever = useCallback(
    (post: TweetPost, note?: string) => {
      const pinnedAt = new Date().toISOString()
      const e: ForeverEntry = {
        id: post.id,
        post,
        pinnedAt,
        note: note?.trim() ? note.trim() : undefined,
      }
      setEntries((prev) => {
        const next = new Map(prev)
        next.set(post.id, e)
        return next
      })
      persistEntry(e)
    },
    [persistEntry],
  )

  const unpinForever = useCallback((id: string) => {
    setEntries((prev) => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
    void deleteForeverEntry(id)
  }, [])

  const setForeverNote = useCallback(
    (id: string, note: string) => {
      setEntries((prev) => {
        const cur = prev.get(id)
        if (!cur) return prev
        const trimmed = note.trim()
        const nextE: ForeverEntry = {
          ...cur,
          note: trimmed ? trimmed : undefined,
        }
        const next = new Map(prev)
        next.set(id, nextE)
        void upsertForeverEntry(nextE)
        return next
      })
    },
    [],
  )

  const clearAllForever = useCallback(() => {
    setEntries(new Map())
    void clearForeverLibrary()
  }, [])

  const foreverPosts = useMemo(() => {
    return [...entries.values()]
      .sort(
        (a, b) =>
          new Date(b.pinnedAt).getTime() - new Date(a.pinnedAt).getTime(),
      )
      .map((e) => e.post)
  }, [entries])

  const foreverNotes = useMemo(() => {
    const o: Record<string, string> = {}
    for (const e of entries.values()) {
      if (e.note) o[e.id] = e.note
    }
    return o
  }, [entries])

  const isForeverPinned = useCallback(
    (id: string) => entries.has(id),
    [entries],
  )

  const getForeverPost = useCallback(
    (id: string) => entries.get(id)?.post,
    [entries],
  )

  const value = useMemo(
    () => ({
      hydrated,
      foreverCount: entries.size,
      foreverPosts,
      foreverNotes,
      isForeverPinned,
      getForeverPost,
      pinForever,
      unpinForever,
      setForeverNote,
      clearAllForever,
    }),
    [
      hydrated,
      entries,
      foreverPosts,
      foreverNotes,
      isForeverPinned,
      getForeverPost,
      pinForever,
      unpinForever,
      setForeverNote,
      clearAllForever,
    ],
  )

  return (
    <ForeverLibraryContext.Provider value={value}>
      {children}
    </ForeverLibraryContext.Provider>
  )
}
