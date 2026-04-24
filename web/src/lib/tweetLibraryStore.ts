const DB_NAME = 'precision-curator-library-v1'
const STORE = 'marks'
const LEGACY_DOC_KEY = 'default'
const DB_VERSION = 3

export type TweetLibraryDoc = {
  archiveId: string
  savedIds: string[]
  trashedIds: string[]
  seenIds: string[]
  saveNotes?: Record<string, string>
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
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

function docKey(archiveId: string): string {
  return `marks:${archiveId}`
}

function normalizeDoc(raw: unknown): TweetLibraryDoc | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const archiveId = typeof o.archiveId === 'string' ? o.archiveId : ''
  const archiveKey = typeof o.archiveKey === 'string' ? o.archiveKey : ''
  const key = archiveId || archiveKey
  if (!key) return null
  const savedIds = Array.isArray(o.savedIds)
    ? o.savedIds.filter((x): x is string => typeof x === 'string')
    : []
  const trashedIds = Array.isArray(o.trashedIds)
    ? o.trashedIds.filter((x): x is string => typeof x === 'string')
    : []
  const seenIds = Array.isArray(o.seenIds)
    ? o.seenIds.filter((x): x is string => typeof x === 'string')
    : []
  let saveNotes: Record<string, string> | undefined
  if (o.saveNotes && typeof o.saveNotes === 'object' && !Array.isArray(o.saveNotes)) {
    const sn: Record<string, string> = {}
    for (const [k, v] of Object.entries(o.saveNotes as Record<string, unknown>)) {
      if (typeof v === 'string') sn[k] = v
    }
    saveNotes = Object.keys(sn).length ? sn : undefined
  }
  return {
    archiveId: archiveId || archiveKey,
    savedIds,
    trashedIds,
    seenIds,
    saveNotes,
  }
}

export async function loadTweetLibraryDoc(
  archiveId: string,
): Promise<TweetLibraryDoc | null> {
  const db = await openDb()
  const doc = await new Promise<TweetLibraryDoc | null>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const r = tx.objectStore(STORE).get(docKey(archiveId))
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
    tx.objectStore(STORE).put(
      {
        archiveId: doc.archiveId,
        savedIds: doc.savedIds,
        trashedIds: doc.trashedIds,
        seenIds: doc.seenIds,
        saveNotes: doc.saveNotes,
      },
      docKey(doc.archiveId),
    )
  })
  db.close()
}

export async function deleteTweetLibraryDoc(archiveId: string): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB delete failed'))
    tx.objectStore(STORE).delete(docKey(archiveId))
  })
  db.close()
}

export async function clearTweetLibraryDoc(): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB clear failed'))
    tx.objectStore(STORE).delete(LEGACY_DOC_KEY)
  })
  db.close()
}

export async function clearAllTweetLibraryDocs(): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB clear failed'))
    const store = tx.objectStore(STORE)
    const r = store.openCursor()
    r.onerror = () => reject(r.error ?? new Error('IndexedDB cursor failed'))
    r.onsuccess = () => {
      const cur = r.result
      if (!cur) return
      const k = String(cur.key)
      if (k === LEGACY_DOC_KEY || k.startsWith('marks:')) {
        cur.delete()
      }
      cur.continue()
    }
    tx.oncomplete = () => resolve()
  })
  db.close()
}

/** Copy legacy `default` doc to `marks:<archiveId>` and delete default */
export async function migrateLegacyTweetLibraryDoc(
  archiveId: string,
): Promise<void> {
  const db = await openDb()
  const hasNew = await new Promise<boolean>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const r = tx.objectStore(STORE).get(docKey(archiveId))
    r.onsuccess = () => resolve(!!r.result)
    r.onerror = () => reject(r.error ?? new Error('IndexedDB read failed'))
  })
  if (hasNew) {
    db.close()
    return
  }
  const old = await new Promise<TweetLibraryDoc | null>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const r = tx.objectStore(STORE).get(LEGACY_DOC_KEY)
    r.onsuccess = () => resolve(normalizeDoc(r.result))
    r.onerror = () => reject(r.error ?? new Error('IndexedDB read failed'))
  })
  db.close()
  if (!old) return
  await saveTweetLibraryDoc({
    archiveId,
    savedIds: old.savedIds,
    trashedIds: old.trashedIds,
    seenIds: old.seenIds?.length ? old.seenIds : [],
    saveNotes: old.saveNotes,
  })
  const db2 = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db2.transaction(STORE, 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB delete failed'))
    tx.objectStore(STORE).delete(LEGACY_DOC_KEY)
  })
  db2.close()
}
