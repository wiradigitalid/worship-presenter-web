/**
 * Local development: Go API on :3000 and the Vite SPA on :5173.
 * The SPA proxies `/api` to the Go process.
 */
import { spawn } from 'child_process';

const children = [];

function run(command, args, name) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });
  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`${name} exited with ${code}`);
    }
  });
  children.push(child);
}

function stop() {
  for (const child of children) {
    if (!child.pid) continue;
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
        shell: true,
      });
    } else {
      child.kill('SIGTERM');
    }
  }
}

process.on('SIGINT', () => {
  stop();
  process.exit(0);
});
process.on('SIGTERM', stop);

console.log('API  http://127.0.0.1:3000  (Go; serves spa/dist when built)');
console.log('SPA  http://127.0.0.1:5173  (Vite; proxy /api → :3000)');

run('go', ['run', './cmd/api'], 'api');
run('npx', ['vite', '--config', 'spa/vite.config.ts'], 'spa');
