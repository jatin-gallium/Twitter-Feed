import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { CurationSnapshot } from '@/types/export'
import { parseTweetExportJson } from '@/lib/parseExport'
import { clearSnapshot, loadSnapshot, saveSnapshot } from '@/lib/archiveStore'
import { CurationContext } from '@/context/curationContext'

export function CurationProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<CurationSnapshot | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [lastSourceName, setLastSourceName] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void loadSnapshot()
      .then((s) => {
        if (!cancelled && s) setSnapshot(s)
      })
      .finally(() => {
        if (!cancelled) setHydrated(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!hydrated || !snapshot) return
    void saveSnapshot(snapshot)
  }, [snapshot, hydrated])

  const ingestJsonText = useCallback((text: string, sourceName?: string) => {
    const snap = parseTweetExportJson(text)
    setSnapshot(snap)
    if (sourceName) setLastSourceName(sourceName)
  }, [])

  const ingestFile = useCallback(
    async (file: File) => {
      const text = await file.text()
      ingestJsonText(text, file.name)
    },
    [ingestJsonText],
  )

  const clear = useCallback(async () => {
    setSnapshot(null)
    setLastSourceName(null)
    await clearSnapshot()
  }, [])

  const value = useMemo(
    () => ({
      snapshot,
      hydrated,
      ingestJsonText,
      ingestFile,
      clear,
      lastSourceName,
    }),
    [snapshot, hydrated, ingestJsonText, ingestFile, clear, lastSourceName],
  )

  return (
    <CurationContext.Provider value={value}>{children}</CurationContext.Provider>
  )
}
