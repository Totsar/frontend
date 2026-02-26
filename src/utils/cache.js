import { openDB } from "idb";

const DB_NAME = "lost-found-cache";
const STORE_NAME = "items";

export async function getCacheDB() {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        },
    });
}

export async function cacheSet(key, value) {
    const db = await getCacheDB();
    await db.put(STORE_NAME, value, key);
}

export async function cacheGet(key) {
    const db = await getCacheDB();
    return db.get(STORE_NAME, key);
}
