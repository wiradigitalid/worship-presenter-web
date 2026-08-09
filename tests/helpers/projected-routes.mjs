import fs from 'node:fs';
import path from 'node:path';

export const PROJECTED_ROUTE_GROUP = 'src/app/(projected)';

export const PROJECTED_SPECIAL_BASENAMES = new Set([
  'page',
  'layout',
  'not-found',
  'error',
  'loading',
  'template',
  'default',
]);

const ROUTE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);
const MODULE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.json', '.css'];

function walkFiles(root, rel) {
  const absolute = path.join(root, rel);
  if (!fs.existsSync(absolute)) return [];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const child = path.posix.join(rel, entry.name);
    return entry.isDirectory() ? walkFiles(root, child) : [child];
  });
}

export function projectedUrlForPage(file) {
  const relative = path.posix.relative('src/app', file.replaceAll('\\', '/'));
  const segments = relative
    .split('/')
    .filter((segment) => !/^\(.+\)$/.test(segment));
  const last = segments.at(-1) ?? '';
  if (!/^page\.(?:js|jsx|ts|tsx)$/.test(last)) {
    throw new Error(`not a projected page file: ${file}`);
  }
  segments.pop();
  return `/${segments.join('/')}`.replace(/\/$/, '') || '/';
}

export function discoverAppPages(repoRoot) {
  return walkFiles(repoRoot, 'src/app')
    .filter((file) => /^page\.(?:js|jsx|ts|tsx)$/.test(path.posix.basename(file)))
    .sort();
}

export function discoverProjectedRoutes(repoRoot) {
  const files = walkFiles(repoRoot, PROJECTED_ROUTE_GROUP)
    .filter((file) => ROUTE_EXTENSIONS.has(path.posix.extname(file)))
    .sort();
  const specialFiles = files.filter((file) =>
    PROJECTED_SPECIAL_BASENAMES.has(path.posix.basename(file, path.posix.extname(file)))
  );
  const pages = specialFiles.filter((file) =>
    /^page\.(?:js|jsx|ts|tsx)$/.test(path.posix.basename(file))
  );
  const layouts = specialFiles.filter((file) =>
    /^layout\.(?:js|jsx|ts|tsx)$/.test(path.posix.basename(file))
  );
  return {
    files,
    specialFiles,
    pages,
    layouts,
    urls: pages.map(projectedUrlForPage).sort(),
  };
}

function localSpecifiers(source, extension) {
  if (extension === '.css') {
    return [...source.matchAll(/@import\s+(?:url\(\s*)?["']([^"']+)["']/g)].map(
      (match) => match[1]
    );
  }
  if (extension === '.json') return [];
  return [
    ...[
      ...source.matchAll(
        /\b(?:import|export)\s+(?!type\b)[\s\S]*?\bfrom\s+["']([^"']+)["']/g
      ),
    ].map((match) => match[1]),
    ...[...source.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g)].map(
      (match) => match[1]
    ),
    ...[...source.matchAll(/\bimport\s+["']([^"']+)["']/g)].map(
      (match) => match[1]
    ),
    ...[...source.matchAll(/\brequire\s*\(\s*["']([^"']+)["']\s*\)/g)].map(
      (match) => match[1]
    ),
  ];
}

export function discoverLocalModuleImports(repoRoot, file) {
  const absoluteFile = path.join(repoRoot, file);
  const source = fs.readFileSync(absoluteFile, 'utf8');
  const specifiers = localSpecifiers(source, path.posix.extname(file));
  return [...new Set(specifiers)]
    .filter((specifier) => specifier.startsWith('.') || specifier.startsWith('@/'))
    .flatMap((specifier) => {
      const base = specifier.startsWith('@/')
        ? `src/${specifier.slice('@/'.length)}`
        : path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier));
      const hasExtension = path.posix.extname(base) !== '';
      const candidates = hasExtension
        ? [base]
        : [
            ...MODULE_EXTENSIONS.map((extension) => `${base}${extension}`),
            ...MODULE_EXTENSIONS.map((extension) => `${base}/index${extension}`),
          ];
      const resolved = candidates.find((candidate) => {
        const absolute = path.join(repoRoot, candidate);
        return fs.existsSync(absolute) && fs.statSync(absolute).isFile();
      });
      return resolved ? [{ specifier, resolved }] : [];
    });
}

export function discoverModuleGraph(repoRoot, roots) {
  const seen = new Map(roots.map((file) => [file, null]));
  const queue = [...roots];
  while (queue.length > 0) {
    const file = queue.shift();
    for (const { specifier, resolved } of discoverLocalModuleImports(repoRoot, file)) {
      if (seen.has(resolved)) continue;
      seen.set(resolved, `${file} -> ${specifier}`);
      queue.push(resolved);
    }
  }
  return [...seen].map(([file, via]) => ({ file, via }));
}
