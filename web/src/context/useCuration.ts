import { useContext } from 'react'
import { CurationContext, type CurationContextValue } from '@/context/curationContext'

export function useCuration(): CurationContextValue {
  const ctx = useContext(CurationContext)
  if (!ctx) throw new Error('useCuration must be used within CurationProvider')
  return ctx
}
