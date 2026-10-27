import fs from 'node:fs';
import { ALLOWED_HOSTS, NAME_PATTERN, SEMVER, compareVersions } from './lib.mjs';

const token = process.env.GITHUB_TOKEN;
const repo = process.env.GITHUB_REPOSITORY;
const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
const pr = event.pull_request;
const api = 'https://api.github.com';
const maintainerId = Number(process.env.MAINTAINER_ID);

async function gh(method, url, body) {
  const res = await fetch(url.startsWith('http') ? url : `${api}${url}`, {
    method,
    headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28', 'user-agent': 'voidstrap-mods-library-gate' },
    body: body ? JSON.stringify(body) : undefined
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${method} ${url} returned ${res.status}`);
  return res.status === 204 ? null : res.json();
}

async function readJsonAt(file, ref) {
  const data = await gh('GET', `/repos/${repo}/contents/${encodeURI(file)}?ref=${encodeURIComponent(ref)}`);
  if (!data || data.type !== 'file' || data.size > 65536) return null;
  try { return JSON.parse(Buffer.from(data.content, 'base64').toString('utf8')); } catch { return undefined; }
}

async function listFiles() {
  const files = [];
  for (let page = 1; page <= 30; page++) {
    const batch = await gh('GET', `/repos/${repo}/pulls/${pr.number}/files?per_page=100&page=${page}`);
    files.push(...batch);
    if (batch.length < 100) break;
  }
  return files;
}

async function reject(reasons) {
  const body = [
    'This pull request was closed automatically.',
    '',
    ...reasons.map(r => `- ${r}`),
    '',
    'Only the GitHub account that first published a mod can change it, and every pull request may change exactly one mod inside `mods/`.',
    'If you think this is a mistake, open an issue instead of a new pull request. See CONTRIBUTING.md.'
  ].join('\n');
  await gh('POST', `/repos/${repo}/issues/${pr.number}/comments`, { body });
  await gh('POST', `/repos/${repo}/issues/${pr.number}/labels`, { labels: ['ownership-violation'] });
  await gh('PATCH', `/repos/${repo}/pulls/${pr.number}`, { state: 'closed' });
  console.log(reasons.join('\n'));
  process.exit(1);
}

const authorId = pr.user.id;
const authorLogin = pr.user.login;
const isMaintainer = authorId === maintainerId;
const baseRef = pr.base.sha;
const headRef = `refs/pull/${pr.number}/head`;
const files = await listFiles();
const reasons = [];
const mods = new Set();

if (pr.user.type !== 'User') reasons.push(`pull requests must come from a personal GitHub account, not a ${pr.user.type}`);

for (const file of files) {
  const paths = [file.filename, file.previous_filename].filter(Boolean);
  for (const p of paths) {
    const parts = p.split('/');
    if (parts[0] !== 'mods' || parts.length < 3) {
      if (!isMaintainer) reasons.push(`\`${p}\` is outside a mod folder, only the maintainer can change it`);
      continue;
    }
    if (!NAME_PATTERN.test(parts[1])) reasons.push(`\`${parts[1]}\` is not a valid mod name`);
    else mods.add(parts[1]);
  }
}

if (!isMaintainer && mods.size > 1) reasons.push(`this pull request changes ${mods.size} mods (${[...mods].join(', ')}), publish each mod in its own pull request`);

const labels = new Set();
for (const mod of mods) {
  const baseOwner = await readJsonAt(`mods/${mod}/owner.json`, baseRef);
  const headOwner = await readJsonAt(`mods/${mod}/owner.json`, headRef);
  const removed = headOwner === null;
  if (baseOwner === undefined) { reasons.push(`the existing owner.json of \`${mod}\` cannot be read, ask the maintainer`); continue; }
  if (baseOwner) {
    labels.add(removed ? 'remove' : 'update');
    if (baseOwner.id !== authorId && !isMaintainer) {
      reasons.push(`\`${mod}\` belongs to GitHub user id ${baseOwner.id} (@${baseOwner.login}), you are id ${authorId} (@${authorLogin})`);
      continue;
    }
    if (!removed && (!headOwner || headOwner.id !== baseOwner.id)) reasons.push(`the owner of \`${mod}\` cannot be changed in a pull request`);
  } else {
    labels.add('new-mod');
    if (!headOwner || headOwner.id !== authorId) reasons.push(`new mod \`${mod}\` must have owner.json with your GitHub user id ${authorId}`);
    else if (String(headOwner.login).toLowerCase() !== authorLogin.toLowerCase()) reasons.push(`owner.json login must be ${authorLogin}`);
  }
  if (removed) continue;
  const baseManifest = await readJsonAt(`mods/${mod}/.voidstrap-mod/plugin.json`, baseRef);
  const headManifest = await readJsonAt(`mods/${mod}/.voidstrap-mod/plugin.json`, headRef);
  if (!headManifest) { reasons.push(`\`${mod}\` has no readable .voidstrap-mod/plugin.json`); continue; }
  if (baseManifest && SEMVER.test(String(baseManifest.version)) && SEMVER.test(String(headManifest.version)) && compareVersions(headManifest.version, baseManifest.version) <= 0)
    reasons.push(`\`${mod}\` version must go up, it is ${baseManifest.version} and the pull request has ${headManifest.version}`);
  const hosts = Array.isArray(headManifest.network) ? headManifest.network : [];
  const oldHosts = Array.isArray(baseManifest?.network) ? baseManifest.network : [];
  if (hosts.length) labels.add('network');
  if (hosts.some(h => !ALLOWED_HOSTS.includes(h)) || (baseManifest && hosts.some(h => !oldHosts.includes(h)))) labels.add('needs-review');
}

if (reasons.length) await reject(reasons);
if (labels.size) await gh('POST', `/repos/${repo}/issues/${pr.number}/labels`, { labels: [...labels] });
console.log(`Ownership check passed for ${[...mods].join(', ') || 'maintainer files'} by ${authorLogin} (${authorId}). Labels: ${[...labels].join(', ') || 'none'}`);
