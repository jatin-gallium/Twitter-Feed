import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useCuration } from '@/context/useCuration'
import {
  loadTweetLibraryDoc,
  saveTweetLibraryDoc,
} from '@/lib/tweetLibraryStore'
import {
  TweetLibraryContext,
  type LibraryView,
} from '@/context/tweetLibraryContext'
import { snapshotWithoutPosts } from '@/lib/parseExport'

type Marks = {
  saved: Set<string>
  trash: Set<string>
  seen: Set<string>
  saveNotes: Record<string, string>
}

const emptyMarks = (): Marks => ({
  saved: new Set(),
  trash: new Set(),
  seen: new Set(),
  saveNotes: {},
})

function pruneNotes(
  notes: Record<string, string>,
  saved: Set<string>,
): Record<string, string> {
  const next: Record<string, string> = {}
  for (const id of saved) {
    const n = notes[id]
    if (typeof n === 'string' && n.trim()) next[id] = n
  }
  return next
}

function pruneSeen(seen: Set<string>, validIds: Set<string>): Set<string> {
  const next = new Set<string>()
  for (const id of seen) {
    if (validIds.has(id)) next.add(id)
  }
  return next
}

export function TweetLibraryProvider({ children }: { children: ReactNode }) {
  const {
    snapshot,
    hydrated: curationHydrated,
    replaceSnapshot,
    activeArchiveId,
  } = useCuration()
  const [hydrated, setHydrated] = useState(false)
  const [view, setView] = useState<LibraryView>('default')
  const [hideSeenInFeed, setHideSeenInFeed] = useState(true)
  const [marks, setMarks] = useState<Marks>(emptyMarks)
  const marksRef = useRef(marks)
  const archiveIdRef = useRef<string | null>(null)

  useEffect(() => {
    marksRef.current = marks
  }, [marks])

  const persist = useCallback((next: Marks, archiveId: string) => {
    if (!archiveId) return
    const saveNotes = pruneNotes(next.saveNotes, next.saved)
    void saveTweetLibraryDoc({
      archiveId,
      savedIds: [...next.saved],
      trashedIds: [...next.trash],
      seenIds: [...next.seen],
      saveNotes: Object.keys(saveNotes).length ? saveNotes : undefined,
    })
  }, [])

  useEffect(() => {
    if (!curationHydrated) return
    let cancelled = false
    void (async () => {
      try {
        if (!snapshot || !activeArchiveId) {
          archiveIdRef.current = null
          if (!cancelled) {
            setMarks(emptyMarks())
            setView('default')
          }
          if (!cancelled) setHydrated(true)
          return
        }

        const doc = await loadTweetLibraryDoc(activeArchiveId)
        if (cancelled) return

        const validIds = new Set(snapshot.posts.map((p) => p.id))
        if (doc && doc.archiveId === activeArchiveId) {
          const saveNotes = { ...(doc.saveNotes ?? {}) }
          const saved = new Set(
            doc.savedIds.filter((id) => validIds.has(id)),
          )
          const trash = new Set(
            doc.trashedIds.filter((id) => validIds.has(id)),
          )
          const seen = pruneSeen(new Set(doc.seenIds ?? []), validIds)
          setMarks({
            saved,
            trash,
            seen,
            saveNotes: pruneNotes(saveNotes, saved),
          })
        } else {
          setMarks(emptyMarks())
        }
        archiveIdRef.current = activeArchiveId
      } finally {
        if (!cancelled) setHydrated(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [curationHydrated, snapshot, activeArchiveId])

  const applyMarks = useCallback(
    (fn: (prev: Marks) => Marks) => {
      const id = archiveIdRef.current
      if (!id) return
      setMarks((prev) => {
        const next = fn(prev)
        persist(next, id)
        return next
      })
    },
    [persist],
  )

  const saveTweet = useCallback(
    (tweetId: string, note?: string) => {
      applyMarks((prev) => {
        const saved = new Set(prev.saved)
        const trash = new Set(prev.trash)
        const seen = new Set(prev.seen)
        saved.add(tweetId)
        trash.delete(tweetId)
        const saveNotes = { ...prev.saveNotes }
        if (note !== undefined) {
          if (note.trim()) saveNotes[tweetId] = note.trim()
          else delete saveNotes[tweetId]
        }
        return { saved, trash, seen, saveNotes }
      })
    },
    [applyMarks],
  )

  const setSaveNote = useCallback(
    (id: string, note: string) => {
      applyMarks((prev) => {
        if (!prev.saved.has(id)) return prev
        const saveNotes = { ...prev.saveNotes }
        if (note.trim()) saveNotes[id] = note.trim()
        else delete saveNotes[id]
        return { ...prev, saveNotes }
      })
    },
    [applyMarks],
  )

  const unsaveTweet = useCallback(
    (id: string) => {
      applyMarks((prev) => {
        const saved = new Set(prev.saved)
        saved.delete(id)
        const saveNotes = { ...prev.saveNotes }
        delete saveNotes[id]
        return {
          saved,
          trash: new Set(prev.trash),
          seen: new Set(prev.seen),
          saveNotes,
        }
      })
    },
    [applyMarks],
  )

  const trashTweet = useCallback(
    (id: string) => {
      applyMarks((prev) => {
        const saved = new Set(prev.saved)
        const trash = new Set(prev.trash)
        const seen = new Set(prev.seen)
        saved.delete(id)
        trash.add(id)
        const saveNotes = { ...prev.saveNotes }
        delete saveNotes[id]
        return { saved, trash, seen, saveNotes }
      })
    },
    [applyMarks],
  )

  const restoreTweet = useCallback(
    (id: string) => {
      applyMarks((prev) => {
        const trash = new Set(prev.trash)
        trash.delete(id)
        return {
          saved: new Set(prev.saved),
          trash,
          seen: new Set(prev.seen),
          saveNotes: { ...prev.saveNotes },
        }
      })
    },
    [applyMarks],
  )

  const emptyTrash = useCallback(() => {
    applyMarks((prev) => ({
      ...prev,
      trash: new Set(),
    }))
  }, [applyMarks])

  const markSeen = useCallback(
    (id: string) => {
      applyMarks((prev) => {
        const seen = new Set(prev.seen)
        seen.add(id)
        return { ...prev, seen }
      })
    },
    [applyMarks],
  )

  const markUnseen = useCallback(
    (id: string) => {
      applyMarks((prev) => {
        const seen = new Set(prev.seen)
        seen.delete(id)
        return { ...prev, seen }
      })
    },
    [applyMarks],
  )

  const purgeTrashedFromArchive = useCallback(() => {
    if (!snapshot) return
    const archiveId = archiveIdRef.current
    if (!archiveId) return
    const prev = marksRef.current
    if (prev.trash.size === 0) return
    const remove = new Set(prev.trash)
    const nextSnap = snapshotWithoutPosts(snapshot, remove)
    replaceSnapshot(nextSnap)
    const validIds = new Set(nextSnap.posts.map((p) => p.id))
    const saved = new Set([...prev.saved].filter((id) => validIds.has(id)))
    const saveNotes = pruneNotes(prev.saveNotes, saved)
    const seen = pruneSeen(prev.seen, validIds)
    const next = { saved, trash: new Set<string>(), seen, saveNotes }
    setMarks(next)
    void saveTweetLibraryDoc({
      archiveId,
      savedIds: [...saved],
      trashedIds: [],
      seenIds: [...seen],
      saveNotes: Object.keys(saveNotes).length ? saveNotes : undefined,
    })
    setView('default')
  }, [snapshot, replaceSnapshot])

  const savedIds = marks.saved
  const trashedIds = marks.trash
  const seenIds = marks.seen
  const saveNotes = marks.saveNotes

  const isSaved = useCallback((id: string) => savedIds.has(id), [savedIds])
  const isTrashed = useCallback((id: string) => trashedIds.has(id), [trashedIds])
  const isSeen = useCallback((id: string) => seenIds.has(id), [seenIds])

  const value = useMemo(
    () => ({
      hydrated,
      view,
      setView,
      hideSeenInFeed,
      setHideSeenInFeed,
      savedIds,
      trashedIds,
      seenIds,
      saveNotes,
      isSaved,
      isTrashed,
      isSeen,
      saveTweet,
      setSaveNote,
      unsaveTweet,
      trashTweet,
      restoreTweet,
      emptyTrash,
      purgeTrashedFromArchive,
      markSeen,
      markUnseen,
    }),
    [
      hydrated,
      view,
      hideSeenInFeed,
      savedIds,
      trashedIds,
      seenIds,
      saveNotes,
      isSaved,
      isTrashed,
      isSeen,
      saveTweet,
      setSaveNote,
      unsaveTweet,
      trashTweet,
      restoreTweet,
      emptyTrash,
      purgeTrashedFromArchive,
      markSeen,
      markUnseen,
    ],
  )

  return (
    <TweetLibraryContext.Provider value={value}>
      {children}
    </TweetLibraryContext.Provider>
  )
}
