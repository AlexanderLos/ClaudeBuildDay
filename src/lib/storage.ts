/** Versioned local storage for published notices. Read by the resident experience in Chunk 2. */
import {
  PUBLISHED_SCHEMA_VERSION,
  PUBLISHED_STORAGE_KEY,
  publishedStoreSchema,
  type PublishedNotice,
} from "./contracts";

/** Newest first. Missing, unreadable, or wrong-version data reads as an empty list. */
export function loadPublishedNotices(storage: Storage): PublishedNotice[] {
  try {
    const raw = storage.getItem(PUBLISHED_STORAGE_KEY);
    if (raw === null) return [];
    const parsed = publishedStoreSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data.notices : [];
  } catch {
    return [];
  }
}

/** Returns false when the browser refuses the write (private mode, quota), so the UI can say so. */
export function savePublishedNotice(storage: Storage, notice: PublishedNotice): boolean {
  try {
    const notices = [notice, ...loadPublishedNotices(storage)];
    storage.setItem(
      PUBLISHED_STORAGE_KEY,
      JSON.stringify({ schemaVersion: PUBLISHED_SCHEMA_VERSION, notices }),
    );
    return true;
  } catch {
    return false;
  }
}
