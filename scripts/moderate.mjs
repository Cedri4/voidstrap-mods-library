import fs from 'node:fs';
import path from 'node:path';
import { MODS, NAME_PATTERN, EMPTY_MODERATION, walk, readJson, sha256, fingerprint } from './lib.mjs';

const file = process.argv[2];
const action = (process.env.MOD_ACTION ?? '').trim().toLowerCase();
const target = (process.env.MOD_TARGET ?? '').trim().replace(/^@/, '');
const reason = (process.env.MOD_REASON ?? '').trim().slice(0, 300);
const weight = Number.parseInt(process.env.MOD_WEIGHT ?? '', 10);
const actor = (process.env.MOD_ACTOR ?? 'maintainer').trim();
const token = process.env.GITHUB_TOKEN;
const now = new Date().toISOString();

const moderation = fs.existsSync(file) ? { ...EMPTY_MODERATION, ...JSON.parse(fs.readFileSync(file, 'utf8')) } : structuredClone(EMPTY_MODERATION);

function done(message) {
  fs.writeFileSync(file, JSON.stringify(moderation, null, 2) + '\n');
  console.log(message);
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `message=${message.replace(/\n/g, ' ')}\n`);
}

function fail(message) {
  console.error(message);
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `message=${message.replace(/\n/g, ' ')}\n`);
  process.exit(1);
}

function modInfo(name) {
  if (!NAME_PATTERN.test(name)) fail(`"${name}" is not a mod name`);
  const dir = path.join(MODS, name);
  if (!fs.existsSync(dir)) fail(`there is no mod named ${name} on main`);
  const owner = readJson(path.join(dir, 'owner.json'));
  const files = walk(dir).filter(f => !f.symlink).map(f => ({ path: f.rel, sha256: sha256(f.full) }));
  const manifest = readJson(path.join(dir, '.voidstrap-mod', 'plugin.json'));
  return { id: `${owner.id}/${name}`, owner, version: manifest.version, print: fingerprint(files) };
}

function takedownId(name) {
  if (/^\d+\/[a-z0-9][a-z0-9-]{0,63}$/.test(name)) return name;
  const match = Object.keys(moderation.takedowns).find(id => id.endsWith('/' + name));
  if (match) return match;
  return modInfo(name).id;
}

async function account(login) {
  if (!/^[A-Za-z0-9-]{1,39}$/.test(login)) fail(`"${login}" is not a GitHub login`);
  const res = await fetch(`https://api.github.com/users/${login}`, { headers: { authorization: `Bearer ${token}`, 'user-agent': 'voidstrap-mods-library' } });
  if (!res.ok) fail(`GitHub user ${login} was not found`);
  const user = await res.json();
  return { id: user.id, login: user.login };
}

switch (action) {
  case 'verify': {
    const mod = modInfo(target);
    moderation.verified[mod.id] = { version: mod.version, fingerprint: mod.print, by: actor, at: now };
    done(`Verified ${target} ${mod.version}. The badge stays only while the files match this exact version.`);
    break;
  }
  case 'unverify': {
    const mod = modInfo(target);
    delete moderation.verified[mod.id];
    done(`Removed the verified badge from ${target}.`);
    break;
  }
  case 'feature': {
    const mod = modInfo(target);
    moderation.featured[mod.id] = Number.isFinite(weight) ? Math.max(1, Math.min(100, weight)) : 10;
    done(`Featured ${target} with weight ${moderation.featured[mod.id]}.`);
    break;
  }
  case 'unfeature': {
    const mod = modInfo(target);
    delete moderation.featured[mod.id];
    done(`Stopped featuring ${target}.`);
    break;
  }
  case 'takedown': {
    const id = takedownId(target);
    moderation.takedowns[id] = { reason: reason || 'removed by the maintainer', by: actor, at: now };
    delete moderation.verified[id];
    delete moderation.featured[id];
    done(`Took down ${id}. Voidstrap stops offering it and warns people who installed it.`);
    break;
  }
  case 'restore': {
    const id = takedownId(target);
    delete moderation.takedowns[id];
    done(`Restored ${id}.`);
    break;
  }
  case 'trust': {
    const user = await account(target);
    moderation.trusted = moderation.trusted.filter(t => t.id !== user.id).concat({ id: user.id, login: user.login, by: actor, at: now });
    done(`@${user.login} (${user.id}) is now a trusted author. Their mods install without the warning.`);
    break;
  }
  case 'untrust': {
    const user = await account(target);
    moderation.trusted = moderation.trusted.filter(t => t.id !== user.id);
    done(`@${user.login} is no longer a trusted author.`);
    break;
  }
  case 'ban': {
    const user = await account(target);
    moderation.banned = moderation.banned.filter(b => b.id !== user.id).concat({ id: user.id, login: user.login, reason: reason || 'banned by the maintainer', by: actor, at: now });
    moderation.trusted = moderation.trusted.filter(t => t.id !== user.id);
    done(`Banned @${user.login} (${user.id}). Their mods are hidden and their pull requests are closed automatically.`);
    break;
  }
  case 'unban': {
    const user = await account(target);
    moderation.banned = moderation.banned.filter(b => b.id !== user.id);
    done(`Unbanned @${user.login}.`);
    break;
  }
  default:
    fail(`unknown action "${action}". Use verify, unverify, feature, unfeature, takedown, restore, trust, untrust, ban or unban.`);
}
