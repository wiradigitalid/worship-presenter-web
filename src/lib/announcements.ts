import type Database from 'better-sqlite3';
import { getDb } from './db';
import { STAMP_NOW_SQL } from './db/stamp';
import {
  coerceImageUrls,
  isSafeImageUrl,
  parseImagesPayloadJson,
} from './images';
import type { SlidePlanMedia } from './slide-plan';

export type AnnouncementItem = {
  id: number;
  image_url: string;
  service_id: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type AnnouncementInput = {
  image_url: string;
  service_id?: number | null;
  sort_order?: number;
};

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|avi|mkv)$/i;
const IMAGE_EXT = /\.(jpe?g|png|gif|webp)$/i;

function announcementPathname(ref: string): string | null {
  const trimmed = ref.trim();
  // Relative hub upload paths (not valid absolute URLs).
  if (trimmed.startsWith('/')) {
    try {
      return decodeURIComponent(trimmed.split(/[?#]/, 1)[0]).replace(/\/+$/, '');
    } catch {
      return null;
    }
  }
  try {
    return decodeURIComponent(new URL(trimmed).pathname).replace(/\/+$/, '');
  } catch {
    return null;
  }
}

export function isVideoUrl(ref: string): boolean {
  const path = announcementPathname(ref);
  return path ? VIDEO_EXT.test(path) : false;
}

/** True when URL is SSRF-safe, not video, and has an image pathname extension. */
export function isAnnouncementImageUrl(ref: string): boolean {
  if (!isSafeImageUrl(ref) || isVideoUrl(ref)) return false;
  const path = announcementPathname(ref);
  return !!path && IMAGE_EXT.test(path);
}

/** Validate a single announcement image URL; throws Error with message for API 400. */
export function assertAnnouncementImageUrl(ref: unknown): string {
  if (typeof ref !== 'string' || !ref.trim()) {
    throw new Error('image_url must be a non-empty string');
  }
  const url = ref.trim();
  if (!isSafeImageUrl(url)) {
    throw new Error(
      'image_url must be an http(s) URL or a local /api/uploads/... path'
    );
  }
  if (isVideoUrl(url)) {
    throw new Error('Video/MP4 URLs are not allowed');
  }
  if (!isAnnouncementImageUrl(url)) {
    throw new Error(
      'image_url must end with an image extension (.jpg, .jpeg, .png, .gif, or .webp)'
    );
  }
  return url;
}

function rowToItem(row: {
  id: number;
  image_url: string;
  service_id: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}): AnnouncementItem {
  return {
    id: row.id,
    image_url: row.image_url,
    service_id: row.service_id ?? null,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function listAnnouncementItems(): AnnouncementItem[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, image_url, service_id, sort_order, created_at,
              COALESCE(updated_at, created_at) AS updated_at
       FROM announcement_items
       ORDER BY sort_order ASC, id ASC`
    )
    .all() as AnnouncementItem[];
  return rows.map(rowToItem);
}

/** Resolved flyer URLs for service S: recurring ∪ one-offs for S, in list order. */
export function resolveAnnouncementUrls(serviceId: number): string[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT image_url
       FROM announcement_items
       WHERE service_id IS NULL OR service_id = ?
       ORDER BY sort_order ASC, id ASC`
    )
    .all(serviceId) as { image_url: string }[];

  return rows
    .map((r) => r.image_url)
    .filter((url) => isSafeImageUrl(url) && !isVideoUrl(url));
}

/**
 * Prefer Announcement List; fall back to legacy images_payload when list is empty.
 */
export function resolveImagesForService(
  serviceId: number,
  imagesPayloadJson: string | null | undefined
): string[] {
  const fromList = resolveAnnouncementUrls(serviceId);
  if (fromList.length > 0) return fromList;

  return parseImagesPayloadJson(imagesPayloadJson).urls.filter(
    (url) => !isVideoUrl(url)
  );
}

/** Flyer list + optional sermon/family graphic URLs for the slide plan. */
export function resolveSlideMediaForService(
  serviceId: number,
  imagesPayloadJson: string | null | undefined
): SlidePlanMedia {
  const extras = parseImagesPayloadJson(imagesPayloadJson);
  return {
    flyers: resolveImagesForService(serviceId, imagesPayloadJson),
    sermonGraphicUrl: extras.sermonGraphicUrl,
    familyPhotoUrl: extras.familyPhotoUrl,
    youthPhotoUrl: extras.youthPhotoUrl,
  };
}
