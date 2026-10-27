import fs from 'node:fs';
import path from 'node:path';
import { MODS, listMods, walk, readJson, sha256 } from './lib.mjs';

const commit = process.env.GITHUB_SHA ?? process.argv[2];
if (!/^[0-9a-f]{40}$/.test(commit ?? '')) {
  console.error('pass the main commit sha');
  process.exit(1);
}
const out = process.argv[3] ?? 'index.json';
const mods = [];
for (const name of listMods()) {
  const dir = path.join(MODS, name);
  const owner = readJson(path.join(dir, 'owner.json'));
  const manifest = readJson(path.join(dir, '.voidstrap-mod', 'plugin.json'));
  const files = walk(dir).filter(f => !f.symlink).map(f => ({ path: f.rel, size: f.size, sha256: sha256(f.full) })).sort((a, b) => a.path.localeCompare(b.path));
  mods.push({
    id: `${owner.id}/${name}`,
    name,
    ownerId: owner.id,
    login: owner.login,
    version: manifest.version,
    description: manifest.description,
    network: Array.isArray(manifest.network) ? manifest.network : [],
    icon: files.some(f => f.path === 'icon.ico') ? 'icon.ico' : null,
    files
  });
}
const index = { schema: 1, repository: process.env.GITHUB_REPOSITORY ?? 'KloBraticc/voidstrap-mods-library', commit, generated: new Date().toISOString(), mods };
fs.writeFileSync(out, JSON.stringify(index, null, 2) + '\n');
console.log(`Wrote ${mods.length} mod(s) to ${out} for ${commit}`);
