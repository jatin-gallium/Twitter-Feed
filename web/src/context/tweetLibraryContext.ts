import { createContext } from 'react'

export type LibraryView = 'default' | 'saved' | 'trash' | 'forever' | 'seen'

export type TweetLibraryContextValue = {
  hydrated: boolean
  view: LibraryView
  setView: (v: LibraryView) => void
  hideSeenInFeed: boolean
  setHideSeenInFeed: (v: boolean) => void
  savedIds: ReadonlySet<string>
  trashedIds: ReadonlySet<string>
  seenIds: ReadonlySet<string>
  saveNotes: Readonly<Record<string, string>>
  isSaved: (id: string) => boolean
  isTrashed: (id: string) => boolean
  isSeen: (id: string) => boolean
  saveTweet: (id: string, note?: string) => void
  setSaveNote: (id: string, note: string) => void
  unsaveTweet: (id: string) => void
  trashTweet: (id: string) => void
  restoreTweet: (id: string) => void
  emptyTrash: () => void
  purgeTrashedFromArchive: () => void
  markSeen: (id: string) => void
  markUnseen: (id: string) => void
}

export const TweetLibraryContext =
  createContext<TweetLibraryContextValue | null>(null)
