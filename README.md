# Loop Automa

Desktop automation that watches screen regions and takes actions when conditions are met. Pre‑alpha: fast changes expected.

## Docs

- [Architecture](docs/architecture.md)
- [Rollout plan](docs/rollout-plan.md)
- [Dev setup & prerequisites](docs/developer.md)
- [Agent rules](.github/copilot-instructions.md)

## Install (Linux)

```bash
# Bun
curl -fsSL https://bun.sh/install | bash

# System packages for Tauri
sudo apt update
sudo apt install -y pkg-config build-essential libssl-dev libgtk-3-dev libwebkit2gtk-4.1-dev libsoup-3.0-dev librsvg2-dev patchelf
```

## Run

```bash
# From the app root (once the app is scaffolded)
bun run tauri dev

# Tests (Bun)
bun test

# Rust tests (if src-tauri/ exists)
cd src-tauri && cargo test
```

Coverage target ≥90% (Rust + UI combined) per phase.
