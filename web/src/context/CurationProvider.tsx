import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { CurationSnapshot } from '@/types/export'
import type { ArchivedDataset, ArchivesCatalog } from '@/types/archives'
import { parseTweetExportJson } from '@/lib/parseExport'
import {
  addArchiveAndActivate,
  clearAllArchives,
  loadArchivesState,
  persistArchivedDataset,
  removeArchiveFromCatalog,
  setActiveArchiveId as persistActiveArchiveId,
} from '@/lib/archiveStore'
import {
  clearAllTweetLibraryDocs,
  deleteTweetLibraryDoc,
  migrateLegacyTweetLibraryDoc,
} from '@/lib/tweetLibraryStore'
import { CurationContext } from '@/context/curationContext'

export function CurationProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false)
  const [catalog, setCatalog] = useState<ArchivesCatalog>({
    activeId: null,
    orderedIds: [],
  })
  const [archives, setArchives] = useState<ArchivedDataset[]>([])
  const activeIdRef = useRef<string | null>(null)

  useEffect(() => {
    activeIdRef.current = catalog.activeId
  }, [catalog.activeId])

  useEffect(() => {
    let cancelled = false
    void loadArchivesState().then(async ({ catalog: c, datasets }) => {
      if (cancelled) return
      if (datasets.length === 1 && c.activeId) {
        await migrateLegacyTweetLibraryDoc(c.activeId)
      }
      setCatalog(c)
      setArchives(datasets)
    }).finally(() => {
      if (!cancelled) setHydrated(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const activeRow = useMemo(
    () => archives.find((a) => a.id === catalog.activeId) ?? null,
    [archives, catalog.activeId],
  )

  const snapshot = activeRow?.snapshot ?? null
  const lastSourceName = activeRow?.label ?? null

  const replaceSnapshot = useCallback((snap: CurationSnapshot) => {
    const id = activeIdRef.current
    if (!id) return
    setArchives((prev) => {
      const next = prev.map((a) =>
        a.id === id ? { ...a, snapshot: snap } : a,
      )
      const row = next.find((a) => a.id === id)
      if (row) void persistArchivedDataset(row)
      return next
    })
  }, [])

  const setActiveArchiveId = useCallback(async (id: string | null) => {
    await persistActiveArchiveId(id)
    setCatalog((c) => ({ ...c, activeId: id }))
  }, [])

  const ingestJsonText = useCallback(
    async (text: string, sourceName?: string) => {
      const snap = parseTweetExportJson(text)
      const id = crypto.randomUUID()
      const label = sourceName?.trim() || `Dataset ${archives.length + 1}`
      const row: ArchivedDataset = {
        id,
        label,
        addedAt: new Date().toISOString(),
        snapshot: snap,
      }
      const nextCatalog = await addArchiveAndActivate(row)
      setArchives((prev) => {
        const rest = prev.filter((a) => a.id !== id)
        return [...rest, row]
      })
      setCatalog(nextCatalog)
    },
    [archives.length],
  )

  const ingestFile = useCallback(
    async (file: File) => {
      const text = await file.text()
      await ingestJsonText(text, file.name)
    },
    [ingestJsonText],
  )

  const removeArchive = useCallback(async (id: string) => {
    const nextCatalog = await removeArchiveFromCatalog(id)
    await deleteTweetLibraryDoc(id)
    setCatalog(nextCatalog)
    setArchives((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const clear = useCallback(async () => {
    await clearAllArchives()
    await clearAllTweetLibraryDocs()
    setCatalog({ activeId: null, orderedIds: [] })
    setArchives([])
  }, [])

  const value = useMemo(
    () => ({
      snapshot,
      hydrated,
      activeArchiveId: catalog.activeId,
      archives,
      catalog,
      ingestJsonText,
      ingestFile,
      setActiveArchiveId,
      removeArchive,
      clear,
      replaceSnapshot,
      lastSourceName,
    }),
    [
      snapshot,
      hydrated,
      catalog,
      archives,
      ingestJsonText,
      ingestFile,
      setActiveArchiveId,
      removeArchive,
      clear,
      replaceSnapshot,
      lastSourceName,
    ],
  )

  return (
    <CurationContext.Provider value={value}>{children}</CurationContext.Provider>
  )
}
