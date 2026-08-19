import fs from 'node:fs';
import path from 'node:path';

export const PROJECTED_ROUTE_GROUP = 'src/app/(projected)';

const SPA_PROJECTED_PAGES = [
  'spa/src/pages/SlideshowPage.tsx',
  'spa/src/pages/ProjectorPage.tsx',
];

const SPA_PROJECTED_FALLBACKS = [
  'spa/src/projected/not-found.tsx',
  'spa/src/projected/error.tsx',
];

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
  const normalized = file.replaceAll('\\', '/');
  if (normalized.endsWith('spa/src/pages/ProjectorPage.tsx')) {
    return '/services/:id/present/projector';
  }
  if (normalized.endsWith('spa/src/pages/SlideshowPage.tsx')) {
    return '/services/:id/slideshow';
  }
  throw new Error(`not a projected page file: ${file}`);
}

export function discoverAppPages(repoRoot) {
  return walkFiles(repoRoot, 'spa/src/pages')
    .filter((file) => /\.tsx$/.test(file))
    .sort();
}

export function discoverProjectedRoutes(repoRoot) {
  const pages = SPA_PROJECTED_PAGES.filter((file) =>
    fs.existsSync(path.join(repoRoot, file))
  );
  const fallbacks = SPA_PROJECTED_FALLBACKS.filter((file) =>
    fs.existsSync(path.join(repoRoot, file))
  );
  const specialFiles = [...pages, ...fallbacks];
  const clientFiles = walkFiles(repoRoot, PROJECTED_ROUTE_GROUP)
    .filter((file) => ROUTE_EXTENSIONS.has(path.posix.extname(file)))
    .sort();
  return {
    files: [...new Set([...specialFiles, ...clientFiles])],
    specialFiles,
    pages,
    layouts: ['spa/projected.html'],
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
    if (!fs.existsSync(path.join(repoRoot, file))) continue;
    if (path.posix.extname(file) === '.html') continue;
    for (const { specifier, resolved } of discoverLocalModuleImports(repoRoot, file)) {
      if (seen.has(resolved)) continue;
      seen.set(resolved, `${file} -> ${specifier}`);
      queue.push(resolved);
    }
  }
  return [...seen].map(([file, via]) => ({ file, via }));
}
