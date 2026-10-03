/**
 * Ratings and flags survive reloads via IndexedDB, keyed by the file's
 * identity (name + size + mtime) so a reopened folder picks up where it left.
 */

export interface Mark {
  rating: number;
  flag: 'pick' | 'reject' | null;
}

const DB_NAME = 'onlinecull';
const STORE = 'marks';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

let dbPromise: Promise<IDBDatabase> | null = null;
function db(): Promise<IDBDatabase> {
  if (!dbPromise) dbPromise = openDb();
  return dbPromise;
}

export function markKey(name: string, size: number, lastModified: number): string {
  return `${name}|${size}|${lastModified}`;
}

export async function saveMark(key: string, mark: Mark): Promise<void> {
  try {
    const d = await db();
    const tx = d.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({ ...mark, ts: Date.now() }, key);
  } catch {
    // Private browsing or storage denial: the session still works in memory.
  }
}

export async function loadMarks(keys: string[]): Promise<Map<string, Mark>> {
  const out = new Map<string, Mark>();
  try {
    const d = await db();
    const store = d.transaction(STORE, 'readonly').objectStore(STORE);
    await Promise.all(
      keys.map(
        (key) =>
          new Promise<void>((resolve) => {
            const req = store.get(key);
            req.onsuccess = () => {
              const v = req.result;
              if (v && (v.rating > 0 || v.flag)) out.set(key, { rating: v.rating, flag: v.flag });
              resolve();
            };
            req.onerror = () => resolve();
          }),
      ),
    );
  } catch {
    // No persistence available: start clean.
  }
  return out;
}
