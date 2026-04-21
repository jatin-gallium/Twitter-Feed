import { useContext } from 'react'
import {
  ForeverLibraryContext,
  type ForeverLibraryContextValue,
} from '@/context/foreverLibraryContext'

export function useForeverLibrary(): ForeverLibraryContextValue {
  const ctx = useContext(ForeverLibraryContext)
  if (!ctx)
    throw new Error('useForeverLibrary must be used within ForeverLibraryProvider')
  return ctx
}
