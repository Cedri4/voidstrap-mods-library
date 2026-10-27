# Security

## Reporting a malicious or broken mod

- **Do not** post exploit details in a public issue.
- Use **Report a vulnerability** on the repository's Security tab (private), or open an issue titled `Report: <mod-name>` with no sensitive details and the maintainer will contact you.
- Include the mod name, its version, and what it does wrong.

## What happens next

1. The mod is removed from `main` as soon as the report is confirmed. The index updates within minutes and Voidstrap stops offering it.
2. Users who already installed it can turn it off or delete it on the Voidstrap mods page. Voidstrap mods run in a sandbox without file system or Roblox login access, which limits the damage a bad mod can do.
3. The author may be blocked from the repository.

## Reporting a problem with the checks themselves

If you find a way to get past the ownership gate, the validation, or Voidstrap's install verification, report it privately through **Report a vulnerability**. Please do not test it by publishing a real malicious mod.

## Scope

- The ownership and validation workflows and scripts in this repository.
- The index on the `index` branch.
- Voidstrap's Library install and publish code lives in [Voidstrap](https://github.com/KloBraticc/Voidstrap). Report issues there through its own security policy.
