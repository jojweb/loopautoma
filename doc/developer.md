# Developer Notes — Technical Background

Date: 2025-11-13

This file records environment setup steps already performed locally and offers minimal next steps. It’s not a user guide; it’s a dev scratchpad for context.

## Steps performed

- `bun create tauri-app`
  - Used to scaffold the Tauri v2 project via Bun with React + TypeScript template.
- `curl https://sh.rustup.rs -sSf | sh`
  - Installed Rust toolchain (rustup + cargo) via the official installer.
- `bun run tauri dev`

## Follow-ups and quick checks (local)

- Load cargo in the current shell session after rustup install:
  - source "$HOME/.cargo/env"
- Verify toolchains:
  - cargo --version
  - bun --version
- If you scaffolded into a subfolder (recommended), change into it before running dev:
  - cd <your-app-folder>
  - bun install
  - bun run tauri dev

## Notes

- On Linux, Tauri requires system dependencies (e.g., WebKitGTK, libsoup3, build tools). If missing, the scaffolder/CLI will list required packages. See Tauri prerequisites: https://v2.tauri.app/start/prerequisites/
- Our doc prefer Bun for UI dev/build/test. If a blocking compatibility issue occurs, fall back to Node.js 20 LTS.
- Keep the project idiomatic and minimal; follow the contracts in `doc/architecture.md` and acceptance gates in `doc/rollout-plan.md`.

### Linux prerequisites (Ubuntu/Debian)

Install the core system packages required by Tauri 2 (WebKitGTK 4.1, libsoup3, GTK3, etc.). This resolves errors like "The system library `libsoup-3.0` required by crate `soup3-sys` was not found."

Suggested packages:

- pkg-config
- build-essential
- libssl-dev
- libgtk-3-dev
- libwebkit2gtk-4.1-dev
- libsoup-3.0-dev
- librsvg2-dev
- patchelf

Example (Ubuntu/Debian):

```bash
sudo apt update
sudo apt install -y pkg-config build-essential libssl-dev libgtk-3-dev libwebkit2gtk-4.1-dev libsoup-3.0-dev librsvg2-dev patchelf
```

Then retry:

```bash
source "$HOME/.cargo/env"
bun run tauri dev
```
