const DB_NAME = 'precision-curator-library-v1'
const STORE = 'marks'
const DOC_KEY = 'default'
const DB_VERSION = 2

export type TweetLibraryDoc = {
  archiveKey: string
  savedIds: string[]
  trashedIds: string[]
  /** Optional per-tweet note when saved (shown in Saved view). */
  saveNotes?: Record<string, string>
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'))
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = (ev) => {
      const db = req.result
      if (ev.oldVersion < 1 && !db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE)
      }
    }
  })
}

function normalizeDoc(raw: unknown): TweetLibraryDoc | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const archiveKey = typeof o.archiveKey === 'string' ? o.archiveKey : ''
  if (!archiveKey) return null
  const savedIds = Array.isArray(o.savedIds)
    ? o.savedIds.filter((x): x is string => typeof x === 'string')
    : []
  const trashedIds = Array.isArray(o.trashedIds)
    ? o.trashedIds.filter((x): x is string => typeof x === 'string')
    : []
  let saveNotes: Record<string, string> | undefined
  if (o.saveNotes && typeof o.saveNotes === 'object' && !Array.isArray(o.saveNotes)) {
    const sn: Record<string, string> = {}
    for (const [k, v] of Object.entries(o.saveNotes as Record<string, unknown>)) {
      if (typeof v === 'string') sn[k] = v
    }
    saveNotes = Object.keys(sn).length ? sn : undefined
  }
  return { archiveKey, savedIds, trashedIds, saveNotes }
}

export async function loadTweetLibraryDoc(): Promise<TweetLibraryDoc | null> {
  const db = await openDb()
  const doc = await new Promise<TweetLibraryDoc | null>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const r = tx.objectStore(STORE).get(DOC_KEY)
    r.onsuccess = () => resolve(normalizeDoc(r.result))
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
