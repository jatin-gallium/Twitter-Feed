import { useContext } from 'react'
import {
  TweetLibraryContext,
  type TweetLibraryContextValue,
} from '@/context/tweetLibraryContext'

export function useTweetLibrary(): TweetLibraryContextValue {
  const ctx = useContext(TweetLibraryContext)
  if (!ctx)
    throw new Error('useTweetLibrary must be used within TweetLibraryProvider')
  return ctx
}
