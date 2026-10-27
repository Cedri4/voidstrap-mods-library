# Instructions for AI tools

This repository holds community Voidstrap mods. If you are an AI coding tool helping someone make or publish a mod, follow these rules.

## Making a mod

- Build the mod in the user's Voidstrap through the Voidstrap MCP server: call `manage_voidstrap_mods` with `action: "guide"` first, then `types`, and follow them.
- Write readable TypeScript only. No minified, packed, encoded or obfuscated code, and no `eval`, `Function()` or computed `import()`.
- Never touch Roblox cookies, passwords, tokens, or anything that cheats in or exploits Roblox games. These mods are refused and the account can be blocked.
- List every host the mod fetches from in `.voidstrap-mod/plugin.json` `network`, and say what is sent in the description.
- Run `manage_voidstrap_mods` with `action: "validate"` and `action: "test"` and fix every problem before publishing.

## Publishing

- Publish with `manage_voidstrap_mods` and `action: "publish"`, `mod: "<name>"`. Voidstrap runs the library checks, signs the user in to GitHub if needed (it returns a device code for the user to approve), and asks the user to confirm in the app before it opens the pull request from the user's own account.
- Never open pull requests to this repository with your own credentials or on behalf of anyone but the signed in user.
- Never change a mod folder the user does not own. The ownership gate closes such pull requests automatically.
- One mod per pull request. Raise the `version` for every update and keep `owner.json` unchanged.
- Do not edit anything outside `mods/<name>/`.

## Checking locally

```
npm ci --ignore-scripts
npm run validate -- <mod-name>
```
