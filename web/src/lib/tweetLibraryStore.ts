const DB_NAME = 'precision-curator-library-v1'
const STORE = 'marks'
const DOC_KEY = 'default'

export type TweetLibraryDoc = {
  archiveKey: string
  savedIds: string[]
  trashedIds: string[]
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'))
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE)
      }
    }
  })
}

export async function loadTweetLibraryDoc(): Promise<TweetLibraryDoc | null> {
  const db = await openDb()
  const doc = await new Promise<TweetLibraryDoc | null>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const r = tx.objectStore(STORE).get(DOC_KEY)
    r.onsuccess = () => resolve((r.result as TweetLibraryDoc) ?? null)
    r.onerror = () => reject(r.error ?? new Error('IndexedDB read failed'))
  })
  db.close()
  return doc
}

export async function saveTweetLibraryDoc(doc: TweetLibraryDoc): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB write failed'))
    tx.objectStore(STORE).put(doc, DOC_KEY)
  })
  db.close()
}

export async function clearTweetLibraryDoc(): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB clear failed'))
    tx.objectStore(STORE).delete(DOC_KEY)
  })
  db.close()
}

export function computeArchiveKey(input: {
  generatedAt?: string
  postCount: number
  lastSourceName: string | null
}): string {
  return `${input.generatedAt ?? ''}|${input.postCount}|${input.lastSourceName ?? ''}`
}
