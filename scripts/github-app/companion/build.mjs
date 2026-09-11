import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rolldown } from 'rolldown';
import { COMPANION_FILES, createCompanionArchive } from './archive.mjs';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const source = path.join(root, 'src/companion');

async function plugins() {
  const localization = await fs.readFile(path.join(root, 'src/localization.tsx'), 'utf8');
  const names = {};
  for (const key of ['koAgentNames', 'koEngineNames', 'koDiscNames']) {
    const body = localization.match(new RegExp(`const ${key} = \\{([\\s\\S]*?)\\} as const`))?.[1];
    if (!body) throw Error(`Missing locale map: ${key}`);
    const entries = [...body.matchAll(/(\w+): '([^'\\]*)'/g)];
    if (body.replace(/(\w+): '([^'\\]*)'/g, '').replace(/[\s,]/g, '')) throw Error('Locale map is not a simple string literal map.');
    names[key] = Object.fromEntries(entries.map(match => [match[1], match[2]]));
  }
  return [{
    name: 'companion-source',
    resolveId(id) {
      if (id === 'source-names') return '\0companion-names';
      if (/\.(webp|png|svg)$/.test(id)) return '\0companion-image';
    },
    load(id) {
      if (id === '\0companion-names') return Object.entries(names).map(([key, value]) => `export const ${key}=${JSON.stringify(value)};`).join('\n');
      if (id === '\0companion-image') return 'export default "";';
    },
  }];
}

async function bundle(entry, minify, external = []) {
  const build = await rolldown({ input: path.join(source, entry), external, plugins: await plugins() });
  try {
    const { output } = await build.generate({ format: 'es', minify, sourcemap: false });
    if (output.length !== 1 || output[0].type !== 'chunk') throw Error('Companion must be a self-contained runtime bundle.');
    return Buffer.from(output[0].code);
  } finally { await build.close(); }
}

export async function buildCompanion() {
  const adapter = await bundle('adapter.ts', true);
  const files = await Promise.all(COMPANION_FILES.map(async name => ({
    path: name,
    bytes: name === 'adapter.js' ? adapter : name.endsWith('.js')
      ? await bundle(name, true, ['./adapter.js', './collect.js'])
      : await fs.readFile(path.join(source, name)),
  })));
  return createCompanionArchive(files);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const output = path.join(source, '.test');
  await fs.mkdir(output, { recursive: true });
  await fs.writeFile(path.join(output, 'bridge.mjs'), await bundle('test-bridge.ts', false));
}
