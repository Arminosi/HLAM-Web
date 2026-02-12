// ============================================================================
// File History — IndexedDB-based recent file storage
// Stores opened MDL files for quick reopening
// ============================================================================

const DB_NAME = 'hlam-file-history';
const DB_VERSION = 1;
const STORE_NAME = 'files';
const MAX_HISTORY = 50;

export interface HistoryEntry {
  /** file name (unique key) */
  fileName: string;
  /** raw MDL data */
  data: ArrayBuffer;
  /** file size in bytes */
  size: number;
  /** last opened timestamp */
  lastOpened: number;
}

/** Minimal info for UI listing (no heavy ArrayBuffer) */
export interface HistoryMeta {
  fileName: string;
  size: number;
  lastOpened: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'fileName' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Save (or update) a file in history. Deduplicates by fileName. */
export async function saveToHistory(fileName: string, data: ArrayBuffer): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  const entry: HistoryEntry = {
    fileName,
    data,
    size: data.byteLength,
    lastOpened: Date.now(),
  };

  store.put(entry); // put = upsert, deduplicates by fileName key

  // Enforce max history limit — remove oldest entries
  return new Promise((resolve, reject) => {
    tx.oncomplete = async () => {
      try {
        await pruneHistory();
      } catch {
        // pruning failure is non-critical
      }
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/** Remove oldest entries if count exceeds MAX_HISTORY. */
async function pruneHistory(): Promise<void> {
  const all = await getHistoryMeta();
  if (all.length <= MAX_HISTORY) return;

  // Sort oldest first, remove excess
  all.sort((a, b) => a.lastOpened - b.lastOpened);
  const toRemove = all.slice(0, all.length - MAX_HISTORY);

  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  for (const entry of toRemove) {
    store.delete(entry.fileName);
  }

  return new Promise((resolve) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); resolve(); };
  });
}

/** Get metadata for all history entries (lightweight, no ArrayBuffer). */
export async function getHistoryMeta(): Promise<HistoryMeta[]> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => {
      const entries = req.result as HistoryEntry[];
      const metas: HistoryMeta[] = entries.map((e) => ({
        fileName: e.fileName,
        size: e.size,
        lastOpened: e.lastOpened,
      }));
      // Sort by most recent first
      metas.sort((a, b) => b.lastOpened - a.lastOpened);
      db.close();
      resolve(metas);
    };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

/** Load file data from history by fileName. */
export async function loadFromHistory(fileName: string): Promise<ArrayBuffer | null> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const req = store.get(fileName);
    req.onsuccess = () => {
      const entry = req.result as HistoryEntry | undefined;
      if (entry) {
        // Update lastOpened timestamp
        entry.lastOpened = Date.now();
        store.put(entry);
      }
      tx.oncomplete = () => { db.close(); resolve(entry?.data ?? null); };
    };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

/** Remove a single entry from history. */
export async function removeFromHistory(fileName: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  store.delete(fileName);

  return new Promise((resolve) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); resolve(); };
  });
}

/** Clear all history. */
export async function clearHistory(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  store.clear();

  return new Promise((resolve) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); resolve(); };
  });
}
