/**
 * PPTX worker: finished plan JSON in, OpenXML out, no SQLite in the child graph.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pptx-worker-test-'));
process.env.DB_PATH = path.join(tmp, 'test.db');

const srcUrl = (...parts) =>
  pathToFileURL(path.join(root, 'src', ...parts)).href;

const WORKER_FILES = [
  path.join(root, 'workers', 'pptx', 'draw.mjs'),
  path.join(root, 'workers', 'pptx', 'register.mjs'),
  path.join(root, 'workers', 'pptx', 'ts-resolve-hook.mjs'),
  path.join(root, 'src', 'lib', 'pptx-draw.ts'),
];

const FORBIDDEN = [
  'getDb',
  'buildSlidePlan',
  "from './db'",
  "from '@/lib/db'",
  "from './settings'",
  "from '@/lib/settings'",
  "from './slide-plan'",
  "from '@/lib/slide-plan'",
];

function readWorkerSources() {
  return WORKER_FILES.map((file) => ({
    file,
    text: fs.readFileSync(file, 'utf8'),
  }));
}

test('worker and draw module never import SQLite or the planner', () => {
  for (const { file, text } of readWorkerSources()) {
    for (const needle of FORBIDDEN) {
      assert.equal(
        text.includes(needle),
        false,
        `${path.relative(root, file)} must not contain ${JSON.stringify(needle)}`
      );
    }
  }
});

function runWorker(payload) {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      process.execPath,
      [
        '--import',
        './workers/pptx/register.mjs',
        '--experimental-strip-types',
        './workers/pptx/draw.mjs',
      ],
      { cwd: root, stdio: ['pipe', 'pipe', 'pipe'] }
    );
    const stdout = [];
    const stderr = [];
    proc.stdout.on('data', (c) => stdout.push(c));
    proc.stderr.on('data', (c) => stderr.push(c));
    proc.on('error', reject);
    proc.on('close', (code) => {
      resolve({
        code,
        stdout: Buffer.concat(stdout),
        stderr: Buffer.concat(stderr).toString('utf8'),
      });
    });
    proc.stdin.end(JSON.stringify(payload));
  });
}

test('worker draws a finished plan and exits', async () => {
  const { buildSlidePlan } = await import(srcUrl('lib', 'slide-plan.ts'));
  const { parseRundown } = await import(srcUrl('lib', 'parser.ts'));
  const rundown = fs.readFileSync(
    path.join(__dirname, 'fixtures', 'sample-rundown.txt'),
    'utf8'
  );
  const parsed = parseRundown(rundown);
  const plan = buildSlidePlan('2026-07-11', parsed, []);
  const { code, stdout, stderr } = await runWorker({
    serviceDate: '2026-07-11',
    transition: 'fade',
    plan,
  });
  assert.equal(code, 0, stderr);
  assert.ok(stdout.length > 100, 'expected a PPTX buffer');
  assert.equal(stdout.subarray(0, 2).toString(), 'PK');
});
