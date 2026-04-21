import type { TweetPost } from '@/types/export'

const DB_NAME = 'precision-curator-forever-v1'
const STORE = 'posts'
const DB_VERSION = 1

export type ForeverEntry = {
  id: string
  post: TweetPost
  pinnedAt: string
  note?: string
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'))
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
  })
}

export async function loadAllForeverEntries(): Promise<ForeverEntry[]> {
  const db = await openDb()
  const rows = await new Promise<ForeverEntry[]>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const r = tx.objectStore(STORE).getAll()
    r.onsuccess = () => resolve((r.result as ForeverEntry[]) ?? [])
    r.onerror = () => reject(r.error ?? new Error('IndexedDB read failed'))
  })
  db.close()
  return rows
}

export async function upsertForeverEntry(entry: ForeverEntry): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB write failed'))
    tx.objectStore(STORE).put(entry)
  })
  db.close()
}

export async function deleteForeverEntry(id: string): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB delete failed'))
    tx.objectStore(STORE).delete(id)
  })
  db.close()
}

export async function clearForeverLibrary(): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB clear failed'))
    const store = tx.objectStore(STORE)
    store.clear()
  })
  db.close()
}
