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

function runWorker(payload, options = {}) {
  const timeoutMs = options.timeoutMs ?? 45_000;
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
    let timer = null;
    let timedOut = false;
    let settled = false;

    const cleanupTimer = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    if (timeoutMs > 0) {
      timer = setTimeout(() => {
        timedOut = true;
        try {
          proc.kill('SIGKILL');
        } catch {
          /* ignore */
        }
      }, timeoutMs);
    }

    proc.stdout.on('data', (c) => stdout.push(c));
    proc.stderr.on('data', (c) => stderr.push(c));
    proc.on('error', (err) => {
      cleanupTimer();
      if (!settled) {
        settled = true;
        reject(err);
      }
    });
    const onExit = (code, signal) => {
      cleanupTimer();
      if (!settled) {
        settled = true;
        resolve({
          code,
          signal,
          timedOut,
          stdout: Buffer.concat(stdout),
          stderr: Buffer.concat(stderr).toString('utf8'),
        });
      }
    };
    proc.on('close', onExit);
    proc.on('exit', (code, signal) => {
      if (timedOut) {
        onExit(code, signal);
      }
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

test('worker times out and is reaped when execution exceeds deadline', async () => {
  const { buildSlidePlan } = await import(srcUrl('lib', 'slide-plan.ts'));
  const { parseRundown } = await import(srcUrl('lib', 'parser.ts'));
  const rundown = fs.readFileSync(
    path.join(__dirname, 'fixtures', 'sample-rundown.txt'),
    'utf8'
  );
  const parsed = parseRundown(rundown);
  const plan = buildSlidePlan('2026-07-11', parsed, []);
  // A 1ms timeout will reliably trigger the reaper before draw completes
  const { timedOut, code } = await runWorker(
    {
      serviceDate: '2026-07-11',
      transition: 'fade',
      plan,
    },
    { timeoutMs: 1 }
  );
  assert.equal(timedOut, true, 'expected worker to trip timeout');
  assert.notEqual(code, 0, 'timed-out worker must not exit 0');
});

