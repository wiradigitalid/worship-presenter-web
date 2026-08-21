/**
 * Read/delete SQL for the services table. No HTTP concerns live here.
 */
import fs from 'fs';
import type Database from 'better-sqlite3';
import { parseImagesPayloadJson } from '@/lib/images';
import {
  localUploadFilename,
  resolveLocalUploadFsPath,
} from '@/lib/uploads';
import type { ServiceListItem, ServiceRow } from './types';

const LIST_COLUMNS = `id, date, raw_payload, parsed_data, created_at,
                  COALESCE(updated_at, created_at) AS updated_at`;

/** Tolerant parse of a stored JSON column — corrupt rows read as `null`. */
function parseStoredJson(value: string | null): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function toListItem(row: ServiceRow): ServiceListItem {
  return {
    id: row.id,
    date: row.date,
    created_at: row.created_at,
    updated_at: row.updated_at,
    raw_payload: row.raw_payload,
    parsed_data: parseStoredJson(row.parsed_data),
  };
}

/**
 * List services, newest first. A non-empty `q` LIKE-matches date, raw payload
 * and stored parsed data.
 */
export function listServices(
  db: Database.Database,
  q: string
): ServiceListItem[] {
  if (q) {
    const like = `%${q}%`;
    const rows = db
      .prepare<[string, string, string], ServiceRow>(
        `SELECT ${LIST_COLUMNS}
           FROM services
           WHERE date LIKE ?
              OR raw_payload LIKE ?
              OR IFNULL(parsed_data, '') LIKE ?
           ORDER BY date DESC, id DESC`
      )
      .all(like, like, like);
    return rows.map(toListItem);
  }

  const rows = db
    .prepare<[], ServiceRow>(
      `SELECT ${LIST_COLUMNS}
         FROM services
         ORDER BY date DESC, id DESC`
    )
    .all();
  return rows.map(toListItem);
}

function filenamesFromImagesJson(json: string | null | undefined): string[] {
  const extras = parseImagesPayloadJson(json);
  const refs = [
    extras.sermonGraphicUrl,
    extras.familyPhotoUrl,
    extras.youthPhotoUrl,
    ...extras.urls,
  ].filter((x): x is string => typeof x === 'string');
  const names: string[] = [];
  for (const ref of refs) {
    const name = localUploadFilename(ref);
    if (name) names.push(name);
  }
  return names;
}

function collectServiceLocalUploads(
  db: Database.Database,
  serviceId: number
): Set<string> {
  const names = new Set<string>();
  const row = db
    .prepare<[number], { images_payload: string | null }>(
      'SELECT images_payload FROM services WHERE id = ?'
    )
    .get(serviceId);
  if (!row) return names;
  for (const name of filenamesFromImagesJson(row.images_payload)) {
    names.add(name);
  }
  return names;
}

function localUploadStillReferenced(
  db: Database.Database,
  filename: string
): boolean {
  const services = db
    .prepare<[], { images_payload: string | null }>(
      'SELECT images_payload FROM services'
    )
    .all();
  for (const service of services) {
    if (filenamesFromImagesJson(service.images_payload).includes(filename)) {
      return true;
    }
  }
  const items = db
    .prepare<[], { image_url: string }>('SELECT image_url FROM announcement_items')
    .all();
  for (const item of items) {
    if (localUploadFilename(item.image_url) === filename) return true;
  }
  const mainArtifacts = db
    .prepare<[], { payload: string | null }>('SELECT payload FROM artifact_templates WHERE payload IS NOT NULL')
    .all();
  for (const art of mainArtifacts) {
    if (art.payload && art.payload.includes(filename)) return true;
  }
  const annSlides = db
    .prepare<[], { payload: string | null }>('SELECT payload FROM announcement_set_slides WHERE payload IS NOT NULL')
    .all();
  for (const slide of annSlides) {
    if (slide.payload && slide.payload.includes(filename)) return true;
  }
  const bgImages = db
    .prepare<[], { url: string | null }>('SELECT url FROM background_library_images WHERE url IS NOT NULL')
    .all();
  for (const bg of bgImages) {
    if (bg.url && localUploadFilename(bg.url) === filename) return true;
  }
  return false;
}

function unlinkUnreferencedLocalUploads(
  db: Database.Database,
  filenames: Set<string>
): void {
  for (const filename of filenames) {
    if (localUploadStillReferenced(db, filename)) continue;
    const filePath = resolveLocalUploadFsPath(`/api/uploads/${filename}`);
    if (!filePath) continue;
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (error) {
      console.error('Error unlinking service upload:', filename, error);
    }
  }
}

/**
 * Delete a service. Returns false when no row matched.
 * `announcement_items` rows disappear via the FK cascade.
 * Local `/api/uploads/…` files bound only to this Service are unlinked (FR-10).
 * Recurring announcement files stay (BR-5).
 */
export function deleteService(
  db: Database.Database,
  serviceId: number
): boolean {
  const localUploads = collectServiceLocalUploads(db, serviceId);
  const result = db
    .prepare<[number]>('DELETE FROM services WHERE id = ?')
    .run(serviceId);
  if (result.changes === 0) return false;
  unlinkUnreferencedLocalUploads(db, localUploads);
  return true;
}

/** Effective optimistic-concurrency token for a row. */
export function readUpdatedAt(row: {
  updated_at?: string | null;
  created_at?: string | null;
}): string {
  return row.updated_at || row.created_at || '';
}
