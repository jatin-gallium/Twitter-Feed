import { createContext } from 'react'

export type LibraryView = 'default' | 'saved' | 'trash'

export type TweetLibraryContextValue = {
  hydrated: boolean
  view: LibraryView
  setView: (v: LibraryView) => void
  savedIds: ReadonlySet<string>
  trashedIds: ReadonlySet<string>
  saveNotes: Readonly<Record<string, string>>
  isSaved: (id: string) => boolean
  isTrashed: (id: string) => boolean
  saveTweet: (id: string, note?: string) => void
  setSaveNote: (id: string, note: string) => void
  unsaveTweet: (id: string) => void
  trashTweet: (id: string) => void
  restoreTweet: (id: string) => void
  emptyTrash: () => void
  /** Remove trashed posts from the archive and clear their trash entries. */
  purgeTrashedFromArchive: () => void
}

export const TweetLibraryContext =
  createContext<TweetLibraryContextValue | null>(null)
