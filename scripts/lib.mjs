import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
export const MODS = path.join(ROOT, 'mods');
export const RULES = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'rules.json'), 'utf8'));
export const ALLOWED_HOSTS = JSON.parse(fs.readFileSync(path.join(ROOT, 'allowed-hosts.json'), 'utf8')).hosts;
export const NAME_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;
export const SEMVER = /^(0|[1-9]\d{0,5})\.(0|[1-9]\d{0,5})\.(0|[1-9]\d{0,5})$/;
export const HOST_PATTERN = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

export function listMods() {
  if (!fs.existsSync(MODS)) return [];
  return fs.readdirSync(MODS, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name).sort();
}

export function walk(dir, base = dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(base, full).split(path.sep).join('/');
    const stat = fs.lstatSync(full);
    if (stat.isSymbolicLink()) out.push({ rel, symlink: true, size: 0, full });
    else if (stat.isDirectory()) walk(full, base, out);
    else out.push({ rel, symlink: false, size: stat.size, full });
  }
  return out;
}

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

export function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
  return 0;
}

export const TAGS = JSON.parse(fs.readFileSync(path.join(ROOT, 'tags.json'), 'utf8')).tags;

export function fingerprint(files) {
  const lines = files.map(f => `${f.path}:${f.sha256}`).sort().join('\n');
  return crypto.createHash('sha256').update(lines).digest('hex');
}

export const EMPTY_MODERATION = { schema: 1, trusted: [], verified: {}, featured: {}, takedowns: {}, banned: [] };
