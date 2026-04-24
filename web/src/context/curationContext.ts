import { createContext } from 'react'
import type { CurationSnapshot } from '@/types/export'
import type { ArchivedDataset, ArchivesCatalog } from '@/types/archives'

export type CurationContextValue = {
  snapshot: CurationSnapshot | null
  hydrated: boolean
  activeArchiveId: string | null
  archives: ArchivedDataset[]
  catalog: ArchivesCatalog
  ingestJsonText: (text: string, sourceName?: string) => Promise<void>
  ingestFile: (file: File) => Promise<void>
  setActiveArchiveId: (id: string | null) => Promise<void>
  removeArchive: (id: string) => Promise<void>
  clear: () => Promise<void>
  replaceSnapshot: (snapshot: CurationSnapshot) => void
  lastSourceName: string | null
}

export const CurationContext = createContext<CurationContextValue | null>(null)
