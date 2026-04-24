import type { CurationSnapshot } from '@/types/export'
import type { ArchivedDataset, ArchivesCatalog } from '@/types/archives'

const DB_NAME = 'precision-curator-v1'
const DB_VERSION = 2
const STORE = 'snapshots'
const LEGACY_KEY = 'current'
const CATALOG_KEY = '__catalog__'
const archiveRowKey = (id: string) => `archive:${id}`

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'))
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = (ev) => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE)
      }
      void ev.oldVersion
    }
  })
}

async function readRaw(db: IDBDatabase, key: string): Promise<unknown> {
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const r = tx.objectStore(STORE).get(key)
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error ?? new Error('IndexedDB read failed'))
  })
}

async function writeRaw(db: IDBDatabase, key: string, value: unknown): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB write failed'))
    tx.objectStore(STORE).put(value, key)
  })
}

async function deleteRaw(db: IDBDatabase, key: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB delete failed'))
    tx.objectStore(STORE).delete(key)
  })
}

async function migrateLegacyIfNeeded(db: IDBDatabase): Promise<void> {
  const legacy = (await readRaw(db, LEGACY_KEY)) as CurationSnapshot | undefined
  if (!legacy) return
  const catalog = (await readRaw(db, CATALOG_KEY)) as ArchivesCatalog | undefined
  if (catalog?.orderedIds?.length) {
    await deleteRaw(db, LEGACY_KEY)
    return
  }
  const id = crypto.randomUUID()
  const row: ArchivedDataset = {
    id,
    label: 'Import',
    addedAt: new Date().toISOString(),
    snapshot: legacy,
  }
  await writeRaw(db, archiveRowKey(id), row)
  await writeRaw(db, CATALOG_KEY, {
    activeId: id,
    orderedIds: [id],
  } satisfies ArchivesCatalog)
  await deleteRaw(db, LEGACY_KEY)
}

export async function loadArchivesState(): Promise<{
  catalog: ArchivesCatalog
  datasets: ArchivedDataset[]
}> {
  const db = await openDb()
  try {
    await migrateLegacyIfNeeded(db)
    let catalog = ((await readRaw(db, CATALOG_KEY)) as ArchivesCatalog) ?? {
      activeId: null,
      orderedIds: [],
    }
    const datasets: ArchivedDataset[] = []
    for (const id of catalog.orderedIds) {
      const row = (await readRaw(db, archiveRowKey(id))) as ArchivedDataset | undefined
      if (row) datasets.push(row)
    }
    const validIds = new Set(datasets.map((d) => d.id))
    const prunedOrder = catalog.orderedIds.filter((id) => validIds.has(id))
    let activeId = catalog.activeId
    if (activeId && !validIds.has(activeId)) {
      activeId = prunedOrder[0] ?? null
    }
    if (
      prunedOrder.length !== catalog.orderedIds.length ||
      activeId !== catalog.activeId
    ) {
      catalog = { activeId, orderedIds: prunedOrder }
      await writeRaw(db, CATALOG_KEY, catalog)
    }
    return { catalog, datasets }
  } finally {
    db.close()
  }
}

export async function persistArchivedDataset(row: ArchivedDataset): Promise<void> {
  const db = await openDb()
  try {
    await writeRaw(db, archiveRowKey(row.id), row)
  } finally {
    db.close()
  }
}

async function persistCatalogInner(catalog: ArchivesCatalog): Promise<void> {
  const db = await openDb()
  try {
    await writeRaw(db, CATALOG_KEY, catalog)
  } finally {
    db.close()
  }
}

export async function addArchiveAndActivate(row: ArchivedDataset): Promise<ArchivesCatalog> {
  const { catalog } = await loadArchivesState()
  const orderedIds = [...catalog.orderedIds.filter((x) => x !== row.id), row.id]
  const next: ArchivesCatalog = { activeId: row.id, orderedIds }
  await persistArchivedDataset(row)
  await persistCatalogInner(next)
  return next
}

export async function setActiveArchiveId(id: string | null): Promise<void> {
  const { catalog, datasets } = await loadArchivesState()
  if (id != null && !datasets.some((d) => d.id === id)) return
  await persistCatalogInner({ ...catalog, activeId: id })
}

export async function removeArchiveFromCatalog(id: string): Promise<ArchivesCatalog> {
  const { catalog } = await loadArchivesState()
  const orderedIds = catalog.orderedIds.filter((x) => x !== id)
  const db = await openDb()
  try {
    await migrateLegacyIfNeeded(db)
    await deleteRaw(db, archiveRowKey(id))
  } finally {
    db.close()
  }
  let activeId = catalog.activeId
  if (activeId === id) {
    activeId = orderedIds[orderedIds.length - 1] ?? null
  }
  const next: ArchivesCatalog = { activeId, orderedIds }
  await persistCatalogInner(next)
  return next
}

export async function clearAllArchives(): Promise<void> {
  const db = await openDb()
  try {
    await migrateLegacyIfNeeded(db)
    const catalog = ((await readRaw(db, CATALOG_KEY)) as ArchivesCatalog) ?? {
      activeId: null,
      orderedIds: [],
    }
    for (const id of catalog.orderedIds) {
      await deleteRaw(db, archiveRowKey(id))
    }
    await deleteRaw(db, CATALOG_KEY)
    await deleteRaw(db, LEGACY_KEY)
  } finally {
    db.close()
  }
}
