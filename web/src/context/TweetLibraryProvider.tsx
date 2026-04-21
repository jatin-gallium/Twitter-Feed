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
  clearTweetLibraryDoc,
  computeArchiveKey,
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
  saveNotes: Record<string, string>
}

const emptyMarks = (): Marks => ({
  saved: new Set(),
  trash: new Set(),
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

export function TweetLibraryProvider({ children }: { children: ReactNode }) {
  const {
    snapshot,
    lastSourceName,
    hydrated: curationHydrated,
    replaceSnapshot,
  } = useCuration()
  const [hydrated, setHydrated] = useState(false)
  const [view, setView] = useState<LibraryView>('default')
  const [marks, setMarks] = useState<Marks>(emptyMarks)
  const marksRef = useRef(marks)
  const archiveKeyRef = useRef('')

  useEffect(() => {
    marksRef.current = marks
  }, [marks])

  const persist = useCallback((next: Marks, key: string) => {
    if (!key) return
    const saveNotes = pruneNotes(next.saveNotes, next.saved)
    void saveTweetLibraryDoc({
      archiveKey: key,
      savedIds: [...next.saved],
      trashedIds: [...next.trash],
      saveNotes: Object.keys(saveNotes).length ? saveNotes : undefined,
    })
  }, [])

  useEffect(() => {
    if (!curationHydrated) return
    let cancelled = false
    void (async () => {
      try {
        if (!snapshot) {
          archiveKeyRef.current = ''
          if (!cancelled) {
            setMarks(emptyMarks())
            setView('default')
          }
          await clearTweetLibraryDoc()
          return
        }

        const key = computeArchiveKey({
          generatedAt: snapshot.exportMeta.generatedAt,
          postCount: snapshot.exportMeta.postCount,
          lastSourceName,
        })

        const doc = await loadTweetLibraryDoc()
        if (cancelled) return

        if (doc?.archiveKey && doc.archiveKey !== key) {
          await clearTweetLibraryDoc()
        }

        if (doc && doc.archiveKey === key) {
          const saveNotes = { ...(doc.saveNotes ?? {}) }
          setMarks({
            saved: new Set(doc.savedIds),
            trash: new Set(doc.trashedIds),
            saveNotes,
          })
        } else {
          setMarks(emptyMarks())
        }
        archiveKeyRef.current = key
      } finally {
        if (!cancelled) setHydrated(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [curationHydrated, snapshot, lastSourceName])

  const applyMarks = useCallback(
    (fn: (prev: Marks) => Marks) => {
      const key = archiveKeyRef.current
      if (!key) return
      setMarks((prev) => {
        const next = fn(prev)
        persist(next, key)
        return next
      })
    },
    [persist],
  )

  const saveTweet = useCallback(
    (id: string, note?: string) => {
      applyMarks((prev) => {
        const saved = new Set(prev.saved)
        const trash = new Set(prev.trash)
        saved.add(id)
        trash.delete(id)
        const saveNotes = { ...prev.saveNotes }
        if (note !== undefined) {
          if (note.trim()) saveNotes[id] = note.trim()
          else delete saveNotes[id]
        }
        return { saved, trash, saveNotes }
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
        return { saved, trash: new Set(prev.trash), saveNotes }
      })
    },
    [applyMarks],
  )

  const trashTweet = useCallback(
    (id: string) => {
      applyMarks((prev) => {
        const saved = new Set(prev.saved)
        const trash = new Set(prev.trash)
        saved.delete(id)
        trash.add(id)
        const saveNotes = { ...prev.saveNotes }
        delete saveNotes[id]
        return { saved, trash, saveNotes }
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

  const purgeTrashedFromArchive = useCallback(() => {
    if (!snapshot) return
    const prev = marksRef.current
    if (prev.trash.size === 0) return
    const remove = new Set(prev.trash)
    const nextSnap = snapshotWithoutPosts(snapshot, remove)
    replaceSnapshot(nextSnap)
    const nextKey = computeArchiveKey({
      generatedAt: nextSnap.exportMeta.generatedAt,
      postCount: nextSnap.exportMeta.postCount,
      lastSourceName,
    })
    archiveKeyRef.current = nextKey
    const saved = new Set(
      [...prev.saved].filter((id) => nextSnap.posts.some((p) => p.id === id)),
    )
    const saveNotes = pruneNotes(prev.saveNotes, saved)
    const next = { saved, trash: new Set<string>(), saveNotes }
    setMarks(next)
    void saveTweetLibraryDoc({
      archiveKey: nextKey,
      savedIds: [...saved],
      trashedIds: [],
      saveNotes: Object.keys(saveNotes).length ? saveNotes : undefined,
    })
    setView('default')
  }, [snapshot, replaceSnapshot, lastSourceName])

  const savedIds = marks.saved
  const trashedIds = marks.trash
  const saveNotes = marks.saveNotes

  const isSaved = useCallback((id: string) => savedIds.has(id), [savedIds])
  const isTrashed = useCallback((id: string) => trashedIds.has(id), [trashedIds])

  const value = useMemo(
    () => ({
      hydrated,
      view,
      setView,
      savedIds,
      trashedIds,
      saveNotes,
      isSaved,
      isTrashed,
      saveTweet,
      setSaveNote,
      unsaveTweet,
      trashTweet,
      restoreTweet,
      emptyTrash,
      purgeTrashedFromArchive,
    }),
    [
      hydrated,
      view,
      savedIds,
      trashedIds,
      saveNotes,
      isSaved,
      isTrashed,
      saveTweet,
      setSaveNote,
      unsaveTweet,
      trashTweet,
      restoreTweet,
      emptyTrash,
      purgeTrashedFromArchive,
    ],
  )

  return (
    <TweetLibraryContext.Provider value={value}>
      {children}
    </TweetLibraryContext.Provider>
  )
}
