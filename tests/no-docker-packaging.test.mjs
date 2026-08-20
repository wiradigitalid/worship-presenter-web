/**
 * Docker packaging must not return as the deploy path.
 *
 * Surfaces this guard protects:
 * - repo-root `Dockerfile`
 * - repo-root `docker-compose.yml` and `docker-compose.override*.yml`
 * - repo-root `.dockerignore`
 *
 * Proof (re-runnable; inject, watch fail, revert):
 * 1. Create empty `Dockerfile` at repo root → "Docker packaging files must stay absent" fails.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const FORBIDDEN = [
  'Dockerfile',
  'docker-compose.yml',
  'docker-compose.override.yml',
  'docker-compose.override.example.yml',
  '.dockerignore',
];

test('Docker packaging files must stay absent', () => {
  const hits = FORBIDDEN.filter((name) => fs.existsSync(path.join(root, name)));
  assert.deepEqual(
    hits,
    [],
    `Docker packaging returned at repo root: ${hits.join(', ')}`
  );
});
