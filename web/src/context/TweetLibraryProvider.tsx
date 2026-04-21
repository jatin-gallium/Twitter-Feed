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

type Marks = { saved: Set<string>; trash: Set<string> }

const emptyMarks = (): Marks => ({
  saved: new Set(),
  trash: new Set(),
})

export function TweetLibraryProvider({ children }: { children: ReactNode }) {
  const { snapshot, lastSourceName, hydrated: curationHydrated } = useCuration()
  const [hydrated, setHydrated] = useState(false)
  const [view, setView] = useState<LibraryView>('default')
  const [marks, setMarks] = useState<Marks>(emptyMarks)
  const archiveKeyRef = useRef('')

  const persist = useCallback((next: Marks, key: string) => {
    if (!key) return
    void saveTweetLibraryDoc({
      archiveKey: key,
      savedIds: [...next.saved],
      trashedIds: [...next.trash],
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
          setMarks({
            saved: new Set(doc.savedIds),
            trash: new Set(doc.trashedIds),
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
    (id: string) => {
      applyMarks((prev) => {
        const saved = new Set(prev.saved)
        const trash = new Set(prev.trash)
        saved.add(id)
        trash.delete(id)
        return { saved, trash }
      })
    },
    [applyMarks],
  )

  const unsaveTweet = useCallback(
    (id: string) => {
      applyMarks((prev) => {
        const saved = new Set(prev.saved)
        saved.delete(id)
        return { saved, trash: new Set(prev.trash) }
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
        return { saved, trash }
      })
    },
    [applyMarks],
  )

  const restoreTweet = useCallback(
    (id: string) => {
      applyMarks((prev) => {
        const trash = new Set(prev.trash)
        trash.delete(id)
        return { saved: new Set(prev.saved), trash }
      })
    },
    [applyMarks],
  )

  const emptyTrash = useCallback(() => {
    applyMarks((prev) => ({
      saved: new Set(prev.saved),
      trash: new Set(),
    }))
  }, [applyMarks])

  const savedIds = marks.saved
  const trashedIds = marks.trash

  const isSaved = useCallback((id: string) => savedIds.has(id), [savedIds])
  const isTrashed = useCallback((id: string) => trashedIds.has(id), [trashedIds])

  const value = useMemo(
    () => ({
      hydrated,
      view,
      setView,
      savedIds,
      trashedIds,
      isSaved,
      isTrashed,
      saveTweet,
      unsaveTweet,
      trashTweet,
      restoreTweet,
      emptyTrash,
    }),
    [
      hydrated,
      view,
      savedIds,
      trashedIds,
      isSaved,
      isTrashed,
      saveTweet,
      unsaveTweet,
      trashTweet,
      restoreTweet,
      emptyTrash,
    ],
  )

  return (
    <TweetLibraryContext.Provider value={value}>
      {children}
    </TweetLibraryContext.Provider>
  )
}
