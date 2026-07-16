const DB_NAME = 'forgefit';
const DB_VERSION = 3;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const oldVersion = event.oldVersion;
      if (!db.objectStoreNames.contains('workouts')) {
        const store = db.createObjectStore('workouts', { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('name', 'name', { unique: false });
      }
      if (!db.objectStoreNames.contains('templates')) {
        const store = db.createObjectStore('templates', { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
      }
      if (!db.objectStoreNames.contains('prs')) {
        const store = db.createObjectStore('prs', { keyPath: 'id' });
        store.createIndex('exerciseName', 'exerciseName', { unique: false });
        store.createIndex('prName', 'prName', { unique: false });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains('notes')) {
          const store = db.createObjectStore('notes', { keyPath: 'id' });
          store.createIndex('date', 'date', { unique: false });
        }
        if (!db.objectStoreNames.contains('creatine')) {
          const store = db.createObjectStore('creatine', { keyPath: 'date' });
        }
      }
      if (oldVersion < 3) {
        if (!db.objectStoreNames.contains('events')) {
          const store = db.createObjectStore('events', { keyPath: 'id' });
          store.createIndex('date', 'date', { unique: false });
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getDB() {
  if (!getDB._cache) {
    getDB._cache = openDB();
  }
  return getDB._cache;
}

async function getAll(storeName) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getByIndex(storeName, indexName, value) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const req = index.getAll(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function get(storeName, key) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function put(storeName, value) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function remove(storeName, key) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function clear(storeName) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function getSetting(key, defaultValue = null) {
  const val = await get('settings', key);
  return val ? val.value : defaultValue;
}

async function setSetting(key, value) {
  await put('settings', { key, value });
}

export default {
  getAll,
  getByIndex,
  get,
  put,
  remove,
  clear,
  getSetting,
  setSetting,
  openDB
};
