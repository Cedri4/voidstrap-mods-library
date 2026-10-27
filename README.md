# Voidstrap Mods Library

The community library of **Voidstrap mods**: small, sandboxed TypeScript mods that add pages, panes, themes and tools to [Voidstrap](https://github.com/KloBraticc/Voidstrap).

Every mod here is:

- **checked automatically** for malware patterns, cheats, hidden code and unsafe files
- **owned** by the GitHub account that first published it, so nobody else can change it
- **reviewed by hand** by the maintainer before it reaches anyone
- **verified on install**: Voidstrap checks every downloaded file against a SHA 256 hash before writing it

---

## Contents

- [Installing mods](#installing-mods)
- [Publishing a mod](#publishing-a-mod)
  - [From Voidstrap (recommended)](#from-voidstrap-recommended)
  - [With an AI tool](#with-an-ai-tool)
  - [By hand on GitHub](#by-hand-on-github)
- [Updating your mod](#updating-your-mod)
- [Rules](#rules)
- [How a mod is laid out](#how-a-mod-is-laid-out)
- [Security model](#security-model)
- [What the checks look for](#what-the-checks-look-for)
- [Review process](#review-process)
- [Reporting a bad mod](#reporting-a-bad-mod)
- [FAQ](#faq)
- [For the maintainer](#for-the-maintainer)

---

## Installing mods

1. Open Voidstrap, then **Voidstrap mods**, then the **Library** tab.
2. Search or scroll, then press **Install** on a mod.
3. Voidstrap shows who published it and which websites it may contact (if any). Confirm.
4. Voidstrap asks **Turn on this mod?** the first time it loads. Only turn on mods you trust.

When the author publishes a new version, the button changes to **Update**.

Mods run inside Voidstrap's sandbox. They cannot read your files, your Roblox login, or anything outside the Voidstrap mod API, and they can only reach the websites listed in their manifest.

## Publishing a mod

### From Voidstrap (recommended)

1. Make your mod in **Voidstrap mods**, then **Create**.
2. Press **Publish** on its card.
3. The first time, press **Sign in with GitHub**. Voidstrap shows a short code. Open `github.com/login/device`, paste it and approve. Voidstrap only asks for the `public_repo` permission, which it needs to open a pull request for you.
4. Check the name, version and notes, then press **Publish**.

Voidstrap then does everything for you:

- runs the same checks as this repository, so most problems show up before anything is uploaded
- forks this repository to your account (once)
- uploads your mod to a new branch and writes `owner.json` with your GitHub account
- opens the pull request and shows you its link

You can follow the review on the pull request page.

### With an AI tool

Voidstrap has an MCP server, so AI coding tools can build and publish mods for you:

1. In Voidstrap press **Connect AI** on the Voidstrap mods page and follow the steps.
2. Ask the tool to make a Voidstrap mod, then to publish it.
3. The tool calls `manage_voidstrap_mods` with `action: "publish"`. **Voidstrap always asks you to confirm in the app**, so an AI can never publish on its own, and it publishes from **your** GitHub account.

See [AGENTS.md](AGENTS.md) for the exact rules AI tools must follow.

### By hand on GitHub

1. Fork this repository.
2. Add your mod as `mods/<your-mod-name>/` (see [layout](#how-a-mod-is-laid-out)).
3. Add `mods/<your-mod-name>/owner.json` with **your numeric GitHub user id** and login. Find your id at `https://api.github.com/users/<your-login>` (the `id` field).
4. Run the checks locally: `npm ci --ignore-scripts` then `npm run validate -- <your-mod-name>`.
5. Open a pull request that changes **only** your mod folder.

## Updating your mod

Change your mod in Voidstrap and press **Publish** again, or open a new pull request by hand. Updates must:

- come from the **same GitHub account** that first published the mod
- raise the `version` in `.voidstrap-mod/plugin.json` (for example `1.0.0` to `1.0.1`)
- keep `owner.json` unchanged

## Rules

A mod is **removed or refused** if it:

- cheats, exploits or gives an unfair advantage in Roblox games, or helps bypass Roblox anti cheat
- touches Roblox cookies, passwords, tokens or any login data
- hides what it does (obfuscation, packed or minified code, encoded payloads)
- sends data anywhere without saying so in its description and manifest
- mines cryptocurrency, shows ads, or tracks people
- copies another author's mod and publishes it as their own
- breaks the [Roblox Terms of Use](https://en.help.roblox.com/hc/en-us/articles/115004647846) or the [GitHub Terms](https://docs.github.com/site-policy/github-terms/github-terms-of-service)
- contains hateful, sexual or illegal content

Other requirements:

- One mod per pull request.
- Readable source only. Keep it small: at most 64 files and 1 MB.
- Describe honestly what the mod does.

By publishing here you allow the mod to be redistributed through this library and Voidstrap. You keep the rights to your work.

## How a mod is laid out

```
mods/my-mod/
  owner.json                  { "id": 12345678, "login": "your-login" }
  .voidstrap-mod/plugin.json  name, version, description, network hosts
  hooks/hooks.json            { "modules": ["./register.tsx"] }
  hooks/register.tsx          your mod code
  pane.test.tsx               optional tests
  icon.ico                    optional icon, at most 256 KB
  README.md                   optional
```

`plugin.json`:

```json
{
  "name": "my-mod",
  "version": "1.0.0",
  "description": "What it does in one or two sentences.",
  "network": [],
  "userConfig": {}
}
```

- `name` must match the folder: lowercase letters, digits and hyphens.
- `network` lists every host the mod fetches from. Leave it empty if it never goes online.
- Only these file types are accepted: `.ts .tsx .js .mjs .jsx .json .md .ico`.
- Do not include `node_modules` or `.voidstrap-mod/types` (Voidstrap creates the types folder itself).

The full mod API lives in [`types/voidstrap.d.ts`](types/voidstrap.d.ts). In Voidstrap, the mod editor and the MCP `guide` action explain it in detail.

## Security model

Layers, from submission to your computer:

1. **Identity.** Every mod has an `owner.json` holding the author's **numeric GitHub user id**. Ids never change, even when someone renames their account, and a freed login cannot be reused to take over a mod. All ownership checks use the id, never the login.
2. **Ownership gate** (`.github/workflows/ownership.yml`). It runs on every pull request with `pull_request_target` but **never checks out or runs pull request code**. It only reads the changed file list and the existing `owner.json` through the GitHub API. It closes the pull request automatically when:
   - it changes a mod owned by another account
   - it changes more than one mod
   - it touches anything outside `mods/`
   - it tries to change a mod's owner
   - it does not raise the version of an existing mod
   - it comes from an organization or bot account
3. **Validation** (`.github/workflows/validate.yml`). It runs with a read only token and no secrets, and always uses the **maintainer's copy** of the checking scripts and dependency lock file, so a pull request cannot weaken the checks it is judged by. Install scripts are disabled. See [what the checks look for](#what-the-checks-look-for).
4. **Human review.** `main` is protected:
   - every change needs a pull request approved by the maintainer through `CODEOWNERS`
   - approvals are dismissed when new commits are pushed
   - both checks must pass
   - force pushes and branch deletion are blocked, also for admins
   - secret scanning and push protection are on
5. **Pinned, hashed index** (`.github/workflows/index.yml`). After a merge, CI checks every mod again, then publishes `index.json` to the `index` branch. It lists every file of every mod with its SHA 256 hash, pinned to the exact `main` commit it was built from.
6. **Verified install.** Voidstrap:
   - downloads files only from that pinned commit
   - checks each file's size and SHA 256 against the index and refuses the whole install on any mismatch
   - writes files only inside the mod's own folder
   - refuses an update when the mod's owner id changed
7. **Sandbox and consent.** Installed mods still need your **Turn on this mod?** approval. They run in Voidstrap's sandbox: no file system, no processes, no Roblox login data, and network access only to the hosts in their manifest.
8. **Publishing token.** The GitHub sign in token:
   - is limited to `public_repo`
   - is stored encrypted for your Windows account (or with owner only permissions on Linux)
   - is sent only to `github.com` and `api.github.com`
   - is never logged
   - **Sign out** deletes it

## What the checks look for

The rules live in [`scripts/rules.json`](scripts/rules.json) and [`scripts/validate.mjs`](scripts/validate.mjs).

| Check | Result |
| --- | --- |
| Folder name, `plugin.json` schema, semantic version, description length | fail |
| `owner.json` shape (numeric id and login only) | fail |
| More than 64 files, more than 1 MB in total, any file over 256 KB, nested more than 4 levels | fail |
| File types other than `.ts .tsx .js .mjs .jsx .json .md .ico`, symbolic links, hidden files, `node_modules` | fail |
| `.ico` without a valid icon header | fail |
| `eval`, `Function()`, computed dynamic `import()` | fail |
| `atob`, `btoa`, `unescape`, `decodeURIComponent`, `String.fromCharCode`, long escape sequences | fail |
| Base64 or hex blobs of 200 or more characters, lines longer than 400 characters | fail |
| Invisible or text direction characters | fail |
| Roblox cookies, Discord webhooks | fail |
| Roblox executor functions and names, cheat terms, process memory and injection functions | fail |
| `require`, `child_process`, `process.env`, `XMLHttpRequest`, `WebSocket` | fail |
| Crypto miners | fail |
| TypeScript errors against the Voidstrap mod API | fail |
| Words like password, token, api key, webhook | flagged for review |
| Network hosts not on [`allowed-hosts.json`](allowed-hosts.json), or new hosts in an update | flagged for review and labelled `needs-review` |

Passing the automatic checks does **not** mean a mod is accepted. The maintainer still reads every change.

## Review process

1. You open a pull request. The ownership gate labels it `new-mod`, `update` or `remove`, plus `network` and `needs-review` when relevant, or closes it with an explanation.
2. Validation runs. Fix any problems by pushing to the same branch (or pressing **Publish** again in Voidstrap).
3. The maintainer reviews the code and the description. The maintainer may ask for changes.
4. After approval the pull request is merged and the index updates within a few minutes. Voidstrap shows the mod, or its update, the next time the Library tab loads.

## Reporting a bad mod

See [SECURITY.md](SECURITY.md). Malicious mods are removed from `main` immediately, which removes them from the index, and the author can be blocked from the repository.

## FAQ

**Do I need a GitHub account to install mods?** No. Only publishing needs one.

**Why does Voidstrap ask for `public_repo`?** It needs it to fork this repository and open the pull request from your account. It cannot touch private repositories.

**I renamed my GitHub account. Can I still update my mod?** Yes. Ownership uses your numeric id, which does not change. Update the `login` in `owner.json` in your next pull request if you like (the id must stay the same).

**Someone else wants to take over my mod.** Ownership can only be moved by the maintainer, after the current owner asks in an issue.

**My pull request was closed automatically.** Read the comment on it. Usually you changed a mod you do not own, changed more than one mod, or forgot to raise the version.

## For the maintainer

- `npm ci --ignore-scripts` then `npm run validate` checks every mod locally.
- `node scripts/build-index.mjs <commit> index.json` builds an index locally.
- When the Voidstrap mod API changes, copy `src/Voidstrap.App/Resources/ModTypes.d.ts` from Voidstrap to `types/voidstrap.d.ts`.
- Add a host to `allowed-hosts.json` only when it is a well known public API.
- To remove a mod, delete its folder in a pull request. The index drops it on merge.
- To move ownership, edit `owner.json` yourself after the current owner agrees in an issue.
