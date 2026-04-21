import { createContext } from 'react'
import type { TweetPost } from '@/types/export'

export type ForeverLibraryContextValue = {
  hydrated: boolean
  foreverCount: number
  foreverPosts: TweetPost[]
  foreverNotes: Readonly<Record<string, string>>
  isForeverPinned: (id: string) => boolean
  getForeverPost: (id: string) => TweetPost | undefined
  pinForever: (post: TweetPost, note?: string) => void
  unpinForever: (id: string) => void
  setForeverNote: (id: string, note: string) => void
  clearAllForever: () => void
}

export const ForeverLibraryContext =
  createContext<ForeverLibraryContextValue | null>(null)
