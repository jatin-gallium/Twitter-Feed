import { createContext } from 'react'
import type { CurationSnapshot } from '@/types/export'

export type CurationContextValue = {
  snapshot: CurationSnapshot | null
  hydrated: boolean
  ingestJsonText: (text: string, sourceName?: string) => void
  ingestFile: (file: File) => Promise<void>
  clear: () => Promise<void>
  replaceSnapshot: (snapshot: CurationSnapshot) => void
  lastSourceName: string | null
}

export const CurationContext = createContext<CurationContextValue | null>(null)
