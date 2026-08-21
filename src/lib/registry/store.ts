import { createHash, randomBytes } from 'crypto';
import type Database from 'better-sqlite3';
import type {
  ArtifactBaseType,
  ArtifactTemplate,
  ArtifactTemplateSummary,
  StoredArtifactTemplate,
} from './types';
import { isCanvasAuthorable } from './types';
import {
  KEBAB_ID,
  RegistryValidationError,
  validateArtifactTemplate,
} from './validate';
import { getSeedTemplateById } from './seed';

export class RegistryNotFoundError extends Error {
  constructor(id: string) {
    super(`Unknown template: ${id}`);
    this.name = 'RegistryNotFoundError';
  }
}

export class RegistryStaleError extends Error {
  constructor() {
    super('Template was modified by another session');
    this.name = 'RegistryStaleError';
  }
}

export class RegistryConflictError extends Error {
  constructor(message = 'Template id already exists') {
    super(message);
    this.name = 'RegistryConflictError';
  }
}

const RESERVED_TEMPLATE_IDS = new Set(['order']);
const MAX_LABEL_LENGTH = 80;

type Row = {
  id: string;
  label: string;
  base_type: string;
  payload: string;
  updated_at: string;
  seed_hash?: string | null;
};

export type ArtifactTemplateOrderItem = {
  id: string;
  updatedAt: string;
};

function rowToStored(row: Row): StoredArtifactTemplate {
  const parsed = JSON.parse(row.payload) as ArtifactTemplate;
  return { ...parsed, updatedAt: row.updated_at };
}

/**
 * Serialized form of a template as it is persisted. Both the seed loader and
 * every write path go through the validator first, which rebuilds each object
 * with a fixed key order, so two templates with the same content always
 * serialize to the same bytes.
 */
export function serializeTemplate(template: ArtifactTemplate): string {
  return JSON.stringify(template);
}

/** Content hash of a persisted payload string. */
export function hashTemplatePayload(payload: string): string {
  return createHash('sha256').update(payload, 'utf8').digest('hex');
}

export function listArtifactSummaries(
  db: Database.Database
): ArtifactTemplateSummary[] {
  const rows = db
    .prepare(
      `SELECT id, label, base_type, payload, updated_at, seed_hash
       FROM artifact_templates
       ORDER BY position`
    )
    .all() as Row[];

  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    baseType: row.base_type as ArtifactBaseType,
    updatedAt: row.updated_at,
    editable: isCanvasAuthorable(row.base_type as ArtifactBaseType),
    resettable: Boolean(row.seed_hash),
  }));
}

/**
 * AC-1: the persisted position set must be exactly `0..N-1` with no duplicate
 * and no gap after every write path this story leaves in place (the bootstrap
 * and the existing `PUT`, neither of which may leave the column inconsistent).
 */
export function assertContiguousPositions(db: Database.Database): void {
  const rows = db
    .prepare(`SELECT id, position FROM artifact_templates ORDER BY position`)
    .all() as { id: string; position: number }[];

  const seen = new Set<number>();
  rows.forEach((row, index) => {
    if (seen.has(row.position)) {
      throw new Error(
        `artifact_templates.position is not well-formed: duplicate position ${row.position} (row "${row.id}")`
      );
    }
    seen.add(row.position);
    if (row.position !== index) {
      throw new Error(
        `artifact_templates.position is not well-formed: expected ${index} at index ${index}, found ${row.position} (row "${row.id}")`
      );
    }
  });
}

/**
 * A mutation must invalidate every snapshot token it affects. Date's millisecond
 * precision can otherwise reproduce a bootstrap token during a fast test or a
 * pair of back-to-back requests, so advance beyond the newest persisted value.
 */
function nextRegistryUpdatedAt(db: Database.Database): string {
  const row = db
    .prepare(`SELECT MAX(updated_at) AS latest FROM artifact_templates`)
    .get() as { latest?: string | null };
  const latest = row.latest ? Date.parse(row.latest) : Number.NEGATIVE_INFINITY;
  return new Date(Math.max(Date.now(), latest + 1)).toISOString();
}

function normalizeTemplateLabel(raw: unknown): string {
  if (typeof raw !== 'string') {
    throw new RegistryValidationError('label is required');
  }
  const label = raw.trim();
  if (!label) {
    throw new RegistryValidationError('label is required');
  }
  if ([...label].length > MAX_LABEL_LENGTH) {
    throw new RegistryValidationError('label must be at most 80 characters');
  }
  return label;
}

function newAuthoredTemplateId(): string {
  return `custom-${randomBytes(4).toString('hex')}`;
}

function emptyGeneralTemplate(id: string, label: string): ArtifactTemplate {
  return validateArtifactTemplate({
    schemaVersion: 1,
    id,
    label,
    baseType: 'general',
    placeholders: [],
    layouts: {
      default: {
        aspectRatio: '16:9',
        backgroundColor: '#000000',
        elements: [],
      },
    },
  });
}

function isSeededHash(hash: string | null | undefined): boolean {
  return Boolean(hash);
}

function validateWholeOrder(
  items: unknown,
  rows: Pick<Row, 'id' | 'updated_at'>[]
): asserts items is ArtifactTemplateOrderItem[] {
  if (!Array.isArray(items)) {
    throw new RegistryValidationError('items must be an array');
  }
  if (items.length !== rows.length) {
    throw new RegistryValidationError('items must contain every live template exactly once');
  }

  const knownIds = new Set(rows.map((row) => row.id));
  const receivedIds = new Set<string>();
  for (const item of items) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new RegistryValidationError('items must contain id and updatedAt');
    }
    const { id, updatedAt } = item as { id?: unknown; updatedAt?: unknown };
    if (typeof id !== 'string' || !id.trim()) {
      throw new RegistryValidationError('item id is required');
    }
    if (typeof updatedAt !== 'string' || !updatedAt.trim()) {
      throw new RegistryValidationError('item updatedAt is required');
    }
    if (!knownIds.has(id)) {
      throw new RegistryValidationError(`Unknown template: ${id}`);
    }
    if (receivedIds.has(id)) {
      throw new RegistryValidationError(`Duplicate template: ${id}`);
    }
    receivedIds.add(id);
  }
}

/** Delete one live row and compact the remaining ordered registry atomically. */
export function deleteArtifactTemplate(
  db: Database.Database,
  id: string,
  expectedUpdatedAt: string
): ArtifactTemplateSummary[] {
  return db.transaction(() => {
    const target = db
      .prepare(`SELECT id, updated_at FROM artifact_templates WHERE id = ?`)
      .get(id) as Pick<Row, 'id' | 'updated_at'> | undefined;
    if (!target) throw new RegistryNotFoundError(id);
    if (target.updated_at !== expectedUpdatedAt) throw new RegistryStaleError();

    db.prepare(`DELETE FROM artifact_templates WHERE id = ?`).run(id);
    const updatedAt = nextRegistryUpdatedAt(db);
    const survivors = db
      .prepare(`SELECT id FROM artifact_templates ORDER BY position`)
      .all() as Pick<Row, 'id'>[];
    const update = db.prepare(
      `UPDATE artifact_templates SET position = ?, updated_at = ? WHERE id = ?`
    );
    survivors.forEach((row, position) => update.run(position, updatedAt, row.id));
    assertContiguousPositions(db);
    return listArtifactSummaries(db);
  }).immediate();
}

/**
 * Replace the complete registry sequence atomically. Membership and every
 * optimistic-concurrency token are checked before the first row is written.
 */
export function reorderArtifactTemplates(
  db: Database.Database,
  items: unknown
): ArtifactTemplateSummary[] {
  return db.transaction(() => {
    const rows = db
      .prepare(`SELECT id, updated_at FROM artifact_templates ORDER BY position`)
      .all() as Pick<Row, 'id' | 'updated_at'>[];
    validateWholeOrder(items, rows);

    const tokensById = new Map(rows.map((row) => [row.id, row.updated_at]));
    for (const item of items) {
      if (tokensById.get(item.id) !== item.updatedAt) {
        throw new RegistryStaleError();
      }
    }

    const updatedAt = nextRegistryUpdatedAt(db);
    const update = db.prepare(
      `UPDATE artifact_templates SET position = ?, updated_at = ? WHERE id = ?`
    );
    items.forEach((item, position) => update.run(position, updatedAt, item.id));
    assertContiguousPositions(db);
    return listArtifactSummaries(db);
  }).immediate();
}

export function getArtifactTemplate(
  db: Database.Database,
  id: string
): StoredArtifactTemplate | null {
  const row = db
    .prepare(
      `SELECT id, label, base_type, payload, updated_at
       FROM artifact_templates WHERE id = ?`
    )
    .get(id) as Row | undefined;
  if (!row) return null;
  return rowToStored(row);
}

/**
 * Element authoring stability rules (Story 16.5).
 *
 * An administrator may add their own elements and delete the ones they added,
 * but the shipped skeleton must survive every save:
 *  - every element id present in the seed layout must still be present;
 *  - a seeded element's `required` flag may not be changed: flipping it to
 *    `true` would make every later plan build hard-fail hydration for the slide;
 *  - every currently persisted element marked `required` must still be present;
 *  - ids beyond that are the administrator's own and are free to come and go.
 *
 * Duplicate/empty element ids are already rejected by `validateArtifactTemplate`,
 * which runs before this check.
 */
function assertStableAgainstSeed(
  incoming: ArtifactTemplate,
  existing: ArtifactTemplate
) {
  const seed = getSeedTemplateById(incoming.id);
  if (incoming.baseType !== seed.baseType) {
    throw new RegistryValidationError('baseType cannot be changed');
  }

  const seedPlaceholderKeys = new Set(seed.placeholders.map((p) => p.key));
  const incomingPlaceholderKeys = new Set(incoming.placeholders.map((p) => p.key));
  if (seedPlaceholderKeys.size !== incomingPlaceholderKeys.size) {
    throw new RegistryValidationError('placeholder keys cannot be added or removed');
  }
  for (const key of seedPlaceholderKeys) {
    if (!incomingPlaceholderKeys.has(key)) {
      throw new RegistryValidationError(`missing placeholder key: ${key}`);
    }
  }

  const seedLayoutKeys = Object.keys(seed.layouts);
  const incomingLayoutKeys = Object.keys(incoming.layouts);
  if (seedLayoutKeys.length !== incomingLayoutKeys.length) {
    throw new RegistryValidationError('layouts cannot be added or removed');
  }
  for (const layoutKey of seedLayoutKeys) {
    const seedLayout = seed.layouts[layoutKey as keyof typeof seed.layouts];
    const incomingLayout = incoming.layouts[layoutKey as keyof typeof incoming.layouts];
    if (!seedLayout || !incomingLayout) {
      throw new RegistryValidationError(`missing layout: ${layoutKey}`);
    }
    const incomingById = new Map<string, (typeof incomingLayout.elements)[number]>();
    for (const element of incomingLayout.elements) {
      if (!element.id.trim()) {
        throw new RegistryValidationError(
          `element id is required in layout ${layoutKey}`
        );
      }
      if (incomingById.has(element.id)) {
        throw new RegistryValidationError(
          `duplicate element id ${element.id} in layout ${layoutKey}`
        );
      }
      incomingById.set(element.id, element);
    }
    const incomingElementIds = new Set(incomingById.keys());

    const existingLayout =
      existing.layouts[layoutKey as keyof typeof existing.layouts];
    const existingById = new Map(
      (existingLayout?.elements ?? []).map((element) => [element.id, element])
    );

    for (const seedElement of seedLayout.elements) {
      const incomingElement = incomingById.get(seedElement.id);
      if (!incomingElement) {
        throw new RegistryValidationError(
          `element ${seedElement.id} is part of the shipped template and cannot be removed or renamed in layout ${layoutKey}`
        );
      }
      // The stored row is the baseline, so a template that already drifted can
      // still be saved — but the flip itself is always refused.
      const baseline = existingById.get(seedElement.id) ?? seedElement;
      if (Boolean(incomingElement.required) !== Boolean(baseline.required)) {
        throw new RegistryValidationError(
          `element ${seedElement.id} is part of the shipped template and its required flag cannot be changed in layout ${layoutKey}`
        );
      }
    }

    for (const existingElement of existingLayout?.elements ?? []) {
      if (!existingElement.required) continue;
      if (!incomingElementIds.has(existingElement.id)) {
        throw new RegistryValidationError(
          `element ${existingElement.id} is required and cannot be removed in layout ${layoutKey}`
        );
      }
    }
  }
}

export function updateArtifactTemplate(
  db: Database.Database,
  id: string,
  payload: unknown,
  expectedUpdatedAt: string,
  options?: {
    allowReadOnly?: boolean;
    /**
     * Set when this write restores the row to a shipped seed (reset, guarded
     * re-seed), so the row records which seed it now holds. An administrator's
     * own save never sets it: leaving the previous hash in place is exactly
     * what makes the next startup read the row as edited.
     */
    markAsSeeded?: boolean;
  }
): StoredArtifactTemplate {
  const row = db
    .prepare(
      `SELECT id, label, base_type, payload, updated_at, seed_hash
       FROM artifact_templates WHERE id = ?`
    )
    .get(id) as Row | undefined;
  if (!row) {
    throw new RegistryNotFoundError(id);
  }
  const existing = rowToStored(row);
  const persistedBaseType = row.base_type as ArtifactBaseType;
  if (existing.updatedAt !== expectedUpdatedAt) {
    throw new RegistryStaleError();
  }
  if (!options?.allowReadOnly && !isCanvasAuthorable(persistedBaseType)) {
    throw new RegistryValidationError('Template base type is read-only');
  }

  if (
    !options?.allowReadOnly &&
    payload &&
    typeof payload === 'object' &&
    'baseType' in payload &&
    typeof (payload as { baseType?: unknown }).baseType === 'string' &&
    (payload as { baseType: string }).baseType !== persistedBaseType
  ) {
    throw new RegistryValidationError('baseType cannot be changed');
  }

  const validated = validateArtifactTemplate(payload);
  if (validated.id !== id) {
    throw new RegistryValidationError('Template id in payload must match route id');
  }
  if (!options?.allowReadOnly && isSeededHash(row.seed_hash)) {
    assertStableAgainstSeed(validated, existing);
  }

  const nextPayload = serializeTemplate(validated);
  const now = new Date().toISOString();
  const result = options?.markAsSeeded
    ? db
        .prepare(
          `UPDATE artifact_templates
           SET label = ?, base_type = ?, payload = ?, updated_at = ?, seed_hash = ?
           WHERE id = ? AND updated_at = ?`
        )
        .run(
          validated.label,
          validated.baseType,
          nextPayload,
          now,
          hashTemplatePayload(nextPayload),
          id,
          expectedUpdatedAt
        )
    : db
        .prepare(
          `UPDATE artifact_templates
           SET label = ?, base_type = ?, payload = ?, updated_at = ?
           WHERE id = ? AND updated_at = ?`
        )
        .run(
          validated.label,
          validated.baseType,
          nextPayload,
          now,
          id,
          expectedUpdatedAt
        );

  if (result.changes === 0) {
    throw new RegistryStaleError();
  }

  const updated = getArtifactTemplate(db, id);
  if (!updated) {
    throw new RegistryNotFoundError(id);
  }
  return updated;
}

export function resetArtifactTemplate(
  db: Database.Database,
  id: string,
  seedTemplate: ArtifactTemplate,
  expectedUpdatedAt: string
): StoredArtifactTemplate {
  const row = db
    .prepare(`SELECT seed_hash FROM artifact_templates WHERE id = ?`)
    .get(id) as { seed_hash?: string | null } | undefined;
  if (!row) {
    throw new RegistryNotFoundError(id);
  }
  if (!isSeededHash(row.seed_hash)) {
    throw new RegistryValidationError('Authored templates cannot be reset');
  }
  if (seedTemplate.id !== id) {
    throw new RegistryValidationError('Seed template id mismatch');
  }
  return updateArtifactTemplate(db, id, seedTemplate, expectedUpdatedAt, {
    allowReadOnly: true,
    markAsSeeded: true,
  });
}

/**
 * Admin-authored General (AD-22). `seed_hash` stays NULL so Save skips the
 * seed-stability check and Reset is refused.
 */
export function createAuthoredGeneralTemplate(
  db: Database.Database,
  input: { label: unknown; id?: unknown }
): StoredArtifactTemplate {
  const label = normalizeTemplateLabel(input.label);
  let id =
    typeof input.id === 'string' ? input.id.trim() : '';
  if (!id) {
    id = newAuthoredTemplateId();
  }
  if (RESERVED_TEMPLATE_IDS.has(id) || !KEBAB_ID.test(id)) {
    throw new RegistryValidationError('id must be kebab-case');
  }

  const exists = db
    .prepare(`SELECT id FROM artifact_templates WHERE id = ?`)
    .get(id);
  if (exists) {
    throw new RegistryConflictError();
  }

  const template = emptyGeneralTemplate(id, label);
  const payload = serializeTemplate(template);
  const now = nextRegistryUpdatedAt(db);
  const position = (
    db.prepare(`SELECT COUNT(*) AS n FROM artifact_templates`).get() as {
      n: number;
    }
  ).n;

  db.prepare(
    `INSERT INTO artifact_templates (id, label, base_type, payload, updated_at, seed_hash, position)
     VALUES (?, ?, ?, ?, ?, NULL, ?)`
  ).run(template.id, template.label, template.baseType, payload, now, position);
  assertContiguousPositions(db);

  const created = getArtifactTemplate(db, template.id);
  if (!created) {
    throw new RegistryNotFoundError(template.id);
  }
  return created;
}

/**
 * Rename any kind. Updates both the `label` column and `payload.label` in
 * one statement (AD-18 two homes).
 */
export function renameArtifactTemplate(
  db: Database.Database,
  id: string,
  label: unknown,
  expectedUpdatedAt: string
): StoredArtifactTemplate {
  const nextLabel = normalizeTemplateLabel(label);
  const row = db
    .prepare(
      `SELECT id, label, base_type, payload, updated_at
       FROM artifact_templates WHERE id = ?`
    )
    .get(id) as Row | undefined;
  if (!row) {
    throw new RegistryNotFoundError(id);
  }
  if (row.updated_at !== expectedUpdatedAt) {
    throw new RegistryStaleError();
  }

  const parsed = JSON.parse(row.payload) as ArtifactTemplate;
  parsed.label = nextLabel;
  const validated = validateArtifactTemplate(parsed);
  const nextPayload = serializeTemplate(validated);
  const now = nextRegistryUpdatedAt(db);
  const result = db
    .prepare(
      `UPDATE artifact_templates
       SET label = ?, payload = ?, updated_at = ?
       WHERE id = ? AND updated_at = ?`
    )
    .run(validated.label, nextPayload, now, id, expectedUpdatedAt);
  if (result.changes === 0) {
    throw new RegistryStaleError();
  }

  const updated = getArtifactTemplate(db, id);
  if (!updated) {
    throw new RegistryNotFoundError(id);
  }
  return updated;
}

/**
 * Insert one seed template at a fixed position. Used only by the AD-17
 * first-boot bootstrap (AC-7): the table starts empty, so this always inserts.
 * The `if missing` guard stays defensive — it must never overwrite a row a
 * concurrent boot already placed — but it is no longer a per-boot gap-filler.
 */
export function insertArtifactTemplateIfMissing(
  db: Database.Database,
  template: ArtifactTemplate,
  position: number
): boolean {
  const existing = db
    .prepare(`SELECT id FROM artifact_templates WHERE id = ?`)
    .get(template.id);
  if (existing) return false;

  const payload = serializeTemplate(template);
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO artifact_templates (id, label, base_type, payload, updated_at, seed_hash, position)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    template.id,
    template.label,
    template.baseType,
    payload,
    now,
    hashTemplatePayload(payload),
    position
  );
  return true;
}

export function copySlideTemplate(
  db: Database.Database,
  source:
    | { kind: 'main'; id: string }
    | { kind: 'announcement_set'; setId: number; slideId: number },
  target:
    | { kind: 'main' }
    | { kind: 'announcement_set'; setId: number }
): StoredArtifactTemplate | { id: number; annSetId: number; label: string; position: number; updatedAt: string; payload: ArtifactTemplate } {
  let sourcePayloadStr: string;
  let sourceLabel: string;

  if (source.kind === 'main') {
    const row = db
      .prepare(`SELECT label, base_type, payload FROM artifact_templates WHERE id = ?`)
      .get(source.id) as { label: string; base_type: string; payload: string } | undefined;
    if (!row) throw new RegistryNotFoundError(source.id);
    if (!row.payload) {
      throw new RegistryValidationError('Cannot copy slide without payload');
    }
    sourcePayloadStr = row.payload;
    sourceLabel = row.label;
  } else {
    const row = db
      .prepare(`SELECT label, payload FROM announcement_set_slides WHERE id = ? AND ann_set_id = ?`)
      .get(source.slideId, source.setId) as { label: string; payload: string } | undefined;
    if (!row) throw new RegistryNotFoundError(`ann-slide-${source.slideId}`);
    if (!row.payload) {
      throw new RegistryValidationError('Cannot copy slide without payload');
    }
    sourcePayloadStr = row.payload;
    sourceLabel = row.label;
  }

  let parsed: ArtifactTemplate;
  try {
    parsed = JSON.parse(sourcePayloadStr) as ArtifactTemplate;
  } catch {
    throw new RegistryValidationError('Source payload will not parse');
  }

  if (target.kind === 'main') {
    const id = newAuthoredTemplateId();
    const validated = validateArtifactTemplate({
      ...parsed,
      id,
      label: sourceLabel,
      baseType: 'general',
    });
    const payload = serializeTemplate(validated);
    const now = nextRegistryUpdatedAt(db);
    const position = (
      db.prepare(`SELECT COUNT(*) AS n FROM artifact_templates`).get() as {
        n: number;
      }
    ).n;

    db.prepare(
      `INSERT INTO artifact_templates (id, label, base_type, payload, updated_at, seed_hash, position)
       VALUES (?, ?, 'general', ?, ?, NULL, ?)`
    ).run(id, sourceLabel, payload, now, position);
    assertContiguousPositions(db);

    const created = getArtifactTemplate(db, id);
    if (!created) throw new RegistryNotFoundError(id);
    return created;
  } else {
    const setExists = db
      .prepare(`SELECT COUNT(*) AS n FROM announcement_sets WHERE id = ?`)
      .get(target.setId) as { n: number } | undefined;
    if (!setExists || setExists.n === 0) {
      throw new RegistryNotFoundError(`ann-set-${target.setId}`);
    }

    const validated = validateArtifactTemplate({
      ...parsed,
      label: sourceLabel,
      baseType: 'general',
    });
    const payload = serializeTemplate(validated);
    const now = nextRegistryUpdatedAt(db);

    const maxPosRow = db
      .prepare(`SELECT MAX(position) AS maxPos FROM announcement_set_slides WHERE ann_set_id = ?`)
      .get(target.setId) as { maxPos: number | null } | undefined;
    const position = maxPosRow && maxPosRow.maxPos !== null ? maxPosRow.maxPos + 1 : 0;

    const res = db
      .prepare(
        `INSERT INTO announcement_set_slides (ann_set_id, label, payload, updated_at, seed_hash, position)
         VALUES (?, ?, ?, ?, NULL, ?)`
      )
      .run(target.setId, sourceLabel, payload, now, position);

    return {
      id: Number(res.lastInsertRowid),
      annSetId: target.setId,
      label: sourceLabel,
      position,
      updatedAt: now,
      payload: validated,
    };
  }
}

