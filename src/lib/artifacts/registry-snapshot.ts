// Hand-mirrored port: src/lib/artifacts/registry-snapshot.ts <-> internal/plan/song_set_snapshot.go
// A change to one is incomplete until the other matches. (DEC-004 S4/AD-33)

/**
 * One-shot registry read used by plan building.
 *
 * better-sqlite3 is synchronous and server-only, so the whole registry is read
 * once per plan build and handed to hydration as an in-memory map. Hydration
 * never touches the database.
 */
import type Database from 'better-sqlite3';
import { getDb } from '@/lib/db';
import { validateArtifactTemplate } from '@/lib/registry/validate';
import type {
  ArtifactLayout,
  PlaceholderDefinition,
  StoredArtifactTemplate,
} from '@/lib/registry/types';
import { ArtifactHydrationError } from './runtime-contract';

export type RegistrySnapshot = ReadonlyMap<string, StoredArtifactTemplate>;

export type StoredTemplateRow = {
  id: string;
  label?: string;
  base_type?: string;
  payload: string | null;
  updated_at: string;
  ann_set_id?: number | null;
};

type SongSetLayoutTrio = {
  title: ArtifactLayout;
  verse: ArtifactLayout;
  reff: ArtifactLayout;
};

const SONG_SET_PLACEHOLDER_TYPES: Record<string, PlaceholderDefinition['type']> = {
  song_number: 'text',
  song_title: 'text',
  verse_number: 'text',
  'verse_content[]': 'text',
  'reff[]': 'text',
};

export function loadSongSetLayoutTrio(
  database: Database.Database
): SongSetLayoutTrio | null {
  const rows = database
    .prepare(`SELECT role, payload FROM song_set_layouts`)
    .all() as { role: string; payload: string }[];
  if (rows.length === 0) return null;
  const byRole = new Map<string, ArtifactLayout>();
  for (const row of rows) {
    try {
      byRole.set(row.role, JSON.parse(row.payload) as ArtifactLayout);
    } catch {
      return null;
    }
  }
  const title = byRole.get('title');
  const verse = byRole.get('verse');
  const reff = byRole.get('reff');
  if (!title || !verse || !reff) return null;
  return { title, verse, reff };
}

function placeholdersFromLayouts(
  ...layouts: ArtifactLayout[]
): PlaceholderDefinition[] {
  const keys = new Set<string>();
  for (const layout of layouts) {
    for (const element of layout.elements) {
      if (element.placeholderKey) keys.add(element.placeholderKey);
    }
  }
  return [...keys].map((key) => ({
    key,
    type: SONG_SET_PLACEHOLDER_TYPES[key] ?? 'text',
    required:
      key === 'song_number' ||
      key === 'song_title' ||
      key === 'verse_content[]' ||
      key === 'reff[]',
  }));
}

export function composeSongSetEntryTemplate(
  row: { id: string; label: string; updated_at: string; variable_name?: string },
  trio: SongSetLayoutTrio
): StoredArtifactTemplate {
  return {
    schemaVersion: 1,
    id: row.id,
    label: row.label,
    baseType: 'song-set-entry',
    variableName: row.variable_name,
    placeholders: placeholdersFromLayouts(trio.title, trio.verse, trio.reff),
    layouts: {
      title: trio.title,
      // Plan handlers still request layoutKey `lyric`; AD-33's verse role.
      lyric: trio.verse,
      verse: trio.verse,
      reff: trio.reff,
    },
    updatedAt: row.updated_at,
  };
}

function reason(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * A persisted row is only trusted once it passes the same validator the admin
 * editor and the store use.
 *
 * Returning `null` here rejects the persisted row: no layout is available for
 * that id, so the planner omits its slide. This prevents a rejected row from changing
 * the deck — so every rejection is logged with the template id and the reason.
 * Skipping validation is worse: a row that is valid JSON but not a valid
 * template used to reach hydration and crash it with an unattributed
 * `TypeError` on `template.placeholders`.
 */
export function parseStoredTemplateRow(
  row: StoredTemplateRow
): StoredArtifactTemplate | null {
  // DEC-004: song-set-entry and ann-set-marker rows carry NULL payload
  // (their canvas lives in song_set_layouts / announcement_set_slides). The
  // snapshot reader skips these silently — there is no payload to parse, so
  // "no layout is available" would be a misleading log line.
  if (row.payload === null || row.payload === undefined || row.payload === '') {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(row.payload);
  } catch (error) {
    console.error(
      `[registry] template "${row.id}": persisted row rejected (stored payload is not valid JSON); no layout is available: ${reason(error)}`
    );
    return null;
  }

  try {
    const template = validateArtifactTemplate(parsed);
    if (template.id !== row.id) {
      throw new Error(`payload id "${template.id}" does not match the row id`);
    }
    return { ...template, updatedAt: row.updated_at };
  } catch (error) {
    console.error(
      `[registry] template "${row.id}": persisted row rejected (stored payload is not a valid template); no layout is available: ${reason(error)}`
    );
    return null;
  }
}

/**
 * Every template keyed by id, in the order `artifact_templates.position`
 * defines (AC-1) — `buildRequestPlan` reads that iteration order directly, so
 * this is the ordered registry snapshot AC-2 requires.
 *
 * Story 20.1 (AC-7, AC-8) removes the read-time seed fallback entirely: a row
 * absent from the database, or present but rejected by {@link parseRow},
 * contributes no layout — there is no substitution left to distinguish those
 * two cases from each other. A row an administrator deletes directly in SQL
 * therefore stays deleted through this read, and a row that fails validation
 * is never quietly replaced by the shipped template it happens to share an id
 * with; both are logged and both make the planner omit the slide they would
 * have produced (`slide-plan.ts`'s `hydrateLeafOrOmit`).
 */
export function loadRegistrySnapshot(db?: Database.Database): RegistrySnapshot {
  const database = db ?? getDb();
  const trio = loadSongSetLayoutTrio(database);
  const rows = database
    .prepare(
      `SELECT id, label, base_type, payload, updated_at, variable_name, ann_set_id
         FROM artifact_templates
         ORDER BY position`
    )
    .all() as (StoredTemplateRow & { variable_name?: string })[];

  const snapshot = new Map<string, StoredArtifactTemplate>();
  for (const row of rows) {
    if (row.base_type === 'song-set-entry' && trio) {
      snapshot.set(
        row.id,
        composeSongSetEntryTemplate(
          {
            id: row.id,
            label: row.label ?? row.id,
            updated_at: row.updated_at,
            variable_name: row.variable_name,
          },
          trio
        )
      );
      continue;
    }
    if (row.base_type === 'ann-set-marker') {
      snapshot.set(row.id, {
        schemaVersion: 1,
        id: row.id,
        label: row.label ?? row.id,
        baseType: 'ann-set-marker',
        annSetId: row.ann_set_id ?? undefined,
        placeholders: [],
        layouts: {},
        updatedAt: row.updated_at,
      });
      continue;
    }
    const stored = parseStoredTemplateRow(row);
    if (stored) {
      snapshot.set(stored.id, stored);
    }
  }

  return snapshot;
}

export function requireTemplate(
  snapshot: RegistrySnapshot,
  templateId: string,
  instanceId?: string
): StoredArtifactTemplate {
  const template = snapshot.get(templateId);
  if (!template) {
    throw new ArtifactHydrationError('Unknown artifact template', {
      templateId,
      instanceId,
    });
  }
  return template;
}
