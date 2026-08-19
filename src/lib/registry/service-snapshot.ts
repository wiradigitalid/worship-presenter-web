/**
 * AD-16 durable per-Service freeze. Distinct from `RegistrySnapshot`, which is
 * the live-registry map assembled for one plan build.
 *
 * AD-22 override records are not a table yet; the clone carries them by
 * copying each validated live payload (the rendered structure).
 */
import type Database from 'better-sqlite3';
import {
  parseStoredTemplateRow,
  type RegistrySnapshot,
} from '@/lib/artifacts/registry-snapshot';
import { DATA_VERSION_KEY } from '@/lib/registry/seed';
import { serializeTemplate } from '@/lib/registry/store';
import type { StoredArtifactTemplate } from '@/lib/registry/types';

type LiveRow = {
  id: string;
  label: string;
  base_type: string;
  payload: string;
  updated_at: string;
};

export class ServiceNotFoundError extends Error {
  constructor() {
    super('Service not found');
    this.name = 'ServiceNotFoundError';
  }
}

export class ServiceStaleError extends Error {
  readonly updatedAt: string;
  constructor(updatedAt: string) {
    super('Conflict: service was modified; refresh and retry');
    this.name = 'ServiceStaleError';
    this.updatedAt = updatedAt;
  }
}

function liveRows(db: Database.Database): LiveRow[] {
  return db
    .prepare(
      `SELECT id, label, base_type, payload, updated_at
         FROM artifact_templates
         ORDER BY position`
    )
    .all() as LiveRow[];
}

function cloneValidLiveRows(db: Database.Database, serviceId: number): number {
  db.prepare(`DELETE FROM service_registry_snapshots WHERE service_id = ?`).run(
    serviceId
  );
  const insert = db.prepare(
    `INSERT INTO service_registry_snapshots
       (service_id, template_id, position, label, base_type, payload, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  let position = 0;
  for (const row of liveRows(db)) {
    const stored = parseStoredTemplateRow(row);
    if (!stored) continue;
    const { updatedAt: _token, ...template } = stored;
    insert.run(
      serviceId,
      stored.id,
      position,
      stored.label,
      stored.baseType,
      serializeTemplate(template),
      row.updated_at
    );
    position += 1;
  }
  db.prepare(
    `UPDATE services
        SET registry_snapshot_at = CURRENT_TIMESTAMP
      WHERE id = ?`
  ).run(serviceId);
  return position;
}

/** First freeze for a newly inserted service. Does not bump `services.updated_at`. */
export function cloneRegistryToNewService(
  db: Database.Database,
  serviceId: number
): void {
  cloneValidLiveRows(db, serviceId);
}

/**
 * AD-21 transition 1→2: clone the live registry onto every existing service
 * that has not been frozen yet, closing AD-16's pre-existing-Service exception.
 */
export function migrateServiceBoundSnapshots(database: Database.Database): void {
  const versionRow = database
    .prepare(`SELECT value FROM settings WHERE key = ?`)
    .get(DATA_VERSION_KEY) as { value: string } | undefined;
  if (!versionRow) return;
  const version = Number(versionRow.value);
  if (!Number.isFinite(version) || version >= 2) return;

  const ids = database
    .prepare(
      `SELECT id FROM services WHERE registry_snapshot_at IS NULL ORDER BY id`
    )
    .all() as { id: number }[];
  const tx = database.transaction(() => {
    for (const row of ids) {
      cloneValidLiveRows(database, row.id);
    }
    database
      .prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`)
      .run(DATA_VERSION_KEY, '2');
  });
  tx.immediate();
  console.info(
    `[registry] AD-16: cloned live registry onto ${ids.length} existing service(s); data_version=2`
  );
}

export function serviceHasRegistrySnapshot(
  db: Database.Database,
  serviceId: number
): boolean {
  const row = db
    .prepare(`SELECT registry_snapshot_at FROM services WHERE id = ?`)
    .get(serviceId) as { registry_snapshot_at: string | null } | undefined;
  return Boolean(row?.registry_snapshot_at);
}

export function loadServiceRegistrySnapshot(
  db: Database.Database,
  serviceId: number
): RegistrySnapshot {
  const rows = db
    .prepare(
      `SELECT template_id AS id, payload, updated_at
         FROM service_registry_snapshots
        WHERE service_id = ?
        ORDER BY position`
    )
    .all(serviceId) as { id: string; payload: string; updated_at: string }[];

  const snapshot = new Map<string, StoredArtifactTemplate>();
  for (const row of rows) {
    const stored = parseStoredTemplateRow(row);
    if (stored) snapshot.set(stored.id, stored);
  }
  return snapshot;
}

function readServiceUpdatedAt(db: Database.Database, serviceId: number): string | null {
  const row = db
    .prepare(
      `SELECT COALESCE(updated_at, created_at) AS updated_at FROM services WHERE id = ?`
    )
    .get(serviceId) as { updated_at: string } | undefined;
  return row?.updated_at ?? null;
}

/**
 * Destructive re-clone (Sync Artifact). Bumps `services.updated_at`; does not
 * touch entered weekly fields.
 */
export function syncArtifactToService(
  db: Database.Database,
  serviceId: number,
  expectedUpdatedAt: string
): { updatedAt: string; templateCount: number } {
  const current = readServiceUpdatedAt(db, serviceId);
  if (current === null) throw new ServiceNotFoundError();
  if (expectedUpdatedAt !== current) throw new ServiceStaleError(current);

  class GuardMissed extends Error {
    constructor() {
      super('services: sync guard matched no row');
      this.name = 'GuardMissed';
    }
  }

  const tx = db.transaction(() => {
    const count = cloneValidLiveRows(db, serviceId);
    const result = db
      .prepare(
        `UPDATE services
            SET updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND COALESCE(updated_at, created_at) = ?`
      )
      .run(serviceId, expectedUpdatedAt);
    if (result.changes !== 1) throw new GuardMissed();
    return count;
  });

  let templateCount: number;
  try {
    templateCount = tx.immediate();
  } catch (error) {
    if (error instanceof GuardMissed) {
      const latest = readServiceUpdatedAt(db, serviceId);
      if (latest === null) throw new ServiceNotFoundError();
      throw new ServiceStaleError(latest);
    }
    throw error;
  }

  const updatedAt = readServiceUpdatedAt(db, serviceId);
  if (updatedAt === null) throw new ServiceNotFoundError();
  return { updatedAt, templateCount };
}
