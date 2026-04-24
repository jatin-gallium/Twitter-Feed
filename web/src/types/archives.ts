import type { CurationSnapshot } from '@/types/export'

export type ArchivedDataset = {
  id: string
  label: string
  addedAt: string
  snapshot: CurationSnapshot
}

export type ArchivesCatalog = {
  activeId: string | null
  orderedIds: string[]
}
