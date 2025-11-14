# Loop Automa — Lean Rollout Plan (Ubuntu/X11‑first MVP)

Global rule: Progress only when the current phase is complete, tests pass, and combined coverage (Rust + UI) is ≥90% for that phase. MVP scope: Ubuntu 24.04 in X11 sessions. macOS and Windows 11 come after the Ubuntu/X11 MVP, behind the same trait‑based backends described in doc/architecture.md.

Required reading: doc/architecture.md for contracts and OS abstraction; this file for acceptance gates. Prefer defaults from Tauri/React/Rust unless architecture requires otherwise.

## Phase 0 — Foundations (done)

- [x] Tauri 2 app with Rust backend + React/TypeScript UI scaffolded.
- [x] Tooling pinned: Rust stable ≥1.75; TypeScript 5.9; Bun ≥1.3.
- [x] Core contracts defined: Trigger, Condition, Action, ActionSequence, ScreenCapture, Automation, Monitor.
- [x] Shared model: Region, Event (incl. WatchdogTripped, MonitorStateChanged), Profile JSON schema.
- [x] Initial implementations: IntervalTrigger, RegionCondition, basic Actions, Monitor with guardrails; fakes for tests.
- [x] Tauri bridge: profiles_load/save, monitor_start/stop, optional region_pick; event delivery to UI over a Tauri event channel.
- [x] UI MVP: Profile editor, Monitor Start/Stop, live Event log, guardrail inputs.
- [x] CI with coverage upload and gate at ≥90%.

## Phase 1 — Ubuntu/X11 Backends (MVP core)

Deliverables: working unattended app on Ubuntu/X11 with first‑class backend support and authoring helpers.

- [x] Backend traits finalized (domain): ScreenCapture, Automation (replay), InputCapture (recording). Unified types: InputEvent, MouseEvent, KeyboardEvent, ScreenFrame, DisplayInfo, BackendError.
- [x] X11 screen capture (xcap with PipeWire + SPA): multi-monitor, ARGB32 conversion, downscale + hash utilities (xxh3 via ahash).
- [x] X11 input capture (XInput2 + XKB): raw motion, buttons, wheel; key down/up with modifiers; background thread; reconnect logic.
- [x] X11 input replay (XTest): absolute pointer move, button up/down, key down/up; layout translation via XKB.
- [x] Tauri commands for authoring flows: region_picker_show/region_picker_complete, region_capture_thumbnail, start_input_recording/stop_input_recording, inject_mouse_event/inject_keyboard_event (throttled; dev-only by default).
- [x] UI authoring helpers: Region overlay for selection (drag-to-select), RegionAuthoringPanel with thumbnails, and a RecordingBar with timeline (start/stop).
- [x] Tests: 16 Rust unit/integration tests (Monitor, Trigger, Condition, Action, Guardrails, E2E, soak); 13 UI test files (components, hooks, integration); coverage measurement pending network access.
- [x] Packaging: Build configuration complete (tauri.conf.json); CI validates bundling; doc/install.md documents Ubuntu packages and X11 requirement.

### Phase 1 status — 2025-11-14 update

- [x] Domain now defines DisplayInfo, ScreenFrame, InputCapture, InputEvent, and BackendError across contracts.
- [x] Linux ScreenCapture uses `xcap` (PipeWire + SPA + clang) by default alongside native XI2 input capture and XTest automation for Ubuntu/X11 sessions.
- [x] Authoring Tauri commands (region picker, thumbnail capture, input recorder, input injection) fully implemented and wired to UI.
- [x] UI authoring helpers complete: Region overlay for selection, RegionAuthoringPanel with thumbnails, RecordingBar with live timeline.
- [x] Monitor runtime hardened: guardrail enforcement (cooldown, max_runtime, max_activations_per_hour) and general stop/shutdown UX.
- [x] Comprehensive test suite: 16 Rust tests + 13 UI test files covering units, integration, edge cases, and E2E happy path.
- [x] Installation documentation created (doc/install.md) with Ubuntu package instructions, X11 requirements, troubleshooting.
- [ ] Outstanding: Coverage measurement (≥90%), Ubuntu bundling verification, CI validation (blocked by network access in current environment).

#### Status Summary
**Core implementation: COMPLETE**  
**Validation: PENDING** (requires network for cargo/bun dependencies)

See [doc/phase1Completion.md](phase1Completion.md) for detailed completion report.

Gate: all tasks done on Ubuntu/X11, tests green, coverage ≥90%, Ubuntu package produced.

**Current Status (2025-11-15)**: Core implementation complete and validation passes locally (tests, coverage, soak, hardware sample). Release builds now block dev-only input injection helpers; see `doc/securityReview.md`. CI will continue enforcing the ≥90% coverage gate.

## Phase 2 — Hardening on Ubuntu/X11

- [x] Performance pass: throttle authoring helpers; buffer reuse; enforce cooldowns/backoff; document CPU/memory baselines.
- [x] Soak test: long-running unattended loops validate guardrails and clean shutdown; memory/cpu bounds checked.
- [x] Security basics: input-synthesis safety, permissions review; dev-only flags locked down for production builds.
- [x] UX polish: clearer preset(s) like “Copilot Keep-Alive”; improved profile validation feedback.

Gate: tests green, coverage ≥90% for domain/runtime/UI; soak stability documented.

### Phase 2 status — 2025-11-15 update

- [x] Region authoring UI reuses buffers and suppresses duplicate renders; ProfileInsights panel surfaces guardrail/preset health inline.
- [x] Stop/shutdown finalizer and soak/monitor regression tests extended to cover guardrail trips plus new throttle helpers.
- [x] Input injection commands require the explicit `LOOPAUTOMA_ALLOW_INJECT=1` env flag, keeping them dev-only.
- [x] Profile editor validates JSON via `auditProfile`, rendering actionable errors before persisting, and includes a one-click preset restore CTA.
- [x] Added `src-tauri/src/bin/soak_report.rs` plus `doc/perfBaseline.md` so we can regenerate soak JSON/CPU baselines on demand (fake backends today, hardware next).
- [x] Security review documented in `doc/securityReview.md`, with release-only guards that disable input injection in packaged builds and env flags for dev simulation.
- [x] Hardware metrics captured via `/usr/bin/time` + soak_report; artifacts stored under `coverage/perf/` and baselines documented in `doc/perfBaseline.md`.

## Phase 3 — Authoring Simplification & Evaluation Cadence

- [x] IntervalTrigger configuration refined as `check_interval_sec` (seconds, 0.1–86 400) across Rust domain, soak tooling, Tauri bridge, UI editors, tests, and docs, with a 60‑second default for the RegionCondition “no change in Regions” preset.
- [x] Screen preview/streaming helpers removed from the runtime, bridge, UI components, and tests so authoring relies solely on the region overlay, thumbnails, and RecordingBar.
- [x] Documentation (architecture, installation, rollout, completion reports) updated to describe periodic trigger evaluation without any live preview stream.

Gate: tests green (Rust + UI), soak runner reflects the new cadence, docs describe the simplified authoring workflow.

### Phase 3 status — 2025-11-15 update

- [x] Codebase now evaluates triggers strictly via `check_interval_sec`; all preview/streaming commands and tests have been removed.
- [x] Profiles, presets, audit tooling, and docs all use the seconds-based cadence with the 60 s default for the RegionCondition preset.
- [x] Authoring instructions emphasize overlay capture, thumbnails, and RecordingBar; no preview stream is exposed in the UI.

## Phase 4 — Productionization & UX Correctness

Goal: move from “feature complete on paper” to “behaves like a polished app in practice,” with a focus on quit behavior, authoring flows, and end-to-end correctness. This phase assumes Linux/X11 remains the primary runtime but the tests and structure should be OS-agnostic where possible.

### 4.1 Quit behavior and lifecycle

- [ ] Backend
  - Implement `app_quit` using Tauri’s app/window API such that:
    - All windows (main + region overlay) are closed.
    - Monitor runner and input capture backends are stopped before exit.
  - Add a small integration test verifying `app_quit` is callable under:
    - Idle state.
    - While monitor is running with fake backends.
- [ ] UI
  - Ensure the “Quit” button in `src/App.tsx`:
    - Calls `appQuit()` when Tauri IPC is present.
    - Falls back to `window.close()` in pure web mode.
    - Logs or shows a toast on failure.
  - Add Vitest tests to verify:
    - Tauri path calls `appQuit` once and does not throw.
    - Web path calls `window.close`.
    - Simulated errors do not break the app (button remains usable).

### 4.2 Region authoring flows (overlay + thumbnails)

- [ ] Overlay interaction
  - Guarantee that `region_picker_show`:
    - Hides the main window while the overlay is active.
    - Reuses an existing overlay if already open instead of creating duplicates.
  - Implement and test `region_picker_complete` / `region_picker_cancel` such that:
    - Overlay is closed on complete/cancel.
    - Main window is brought back to the foreground.
    - Invalid or zero-area selections are rejected with a clear error.
- [ ] Coordinate mapping & thumbnails
  - Add Rust tests to confirm:
    - Rects built from `(start, end)` `PickPoint`s are normalized (min/max x/y).
    - `region_capture_thumbnail` uses `ScreenCapture` to capture the correct region and returns a Base64 PNG.
    - Error paths (no capture backend, capture failure) return errors that the UI can present.
  - Add UI tests:
    - `RegionOverlay`: drag selection translates into the expected submission payload.
    - `RegionAuthoringPanel`: “Capture thumbnail” button calls `captureRegionThumbnail` and renders the image or error.

### 4.3 Input recording & replay fidelity

- [ ] Backend
  - Provide a deterministic fake `InputCapture` under `LOOPAUTOMA_BACKEND=fake`:
    - Emits a known sequence of `InputEvent`s for tests.
    - Can be started/stopped multiple times without leaks.
  - Add tests ensuring:
    - `start_input_recording` refuses to run with incompatible flags/env (e.g., `LOOPAUTOMA_BACKEND=fake` or missing OS features) with a clear `BackendError`.
    - `stop_input_recording` always stops the backend and clears `AuthoringState.input_capture`.
- [ ] UI
  - Extend `RecordingBar` tests to:
    - Verify start/stop calls to `startInputRecording` / `stopInputRecording`.
    - Given a canonical sequence of events (mouse moves + clicks + key presses), assert `toActions` produces the expected `ActionConfig[]` sequence.
    - Confirm the saved actions are appended to the profile and persisted via `profilesSave`.

### 4.4 Monitor + ActionSequence behavior in realistic profiles

- [ ] Domain/runtime tests
  - Add an integration test that:
    - Constructs a profile using actions similar to RecordingBar output (MoveCursor, Click, Type, Key).
    - Uses a fake `ScreenCapture` whose hash stream simulates “no change” then “change.”
    - Asserts:
      - ActionSequence only runs after `stable_ms` with no change.
      - Guardrails (cooldown, `max_activations_per_hour`, `max_runtime_ms`) prevent repeated activations and emit the correct `WatchdogTripped` events.
- [ ] High-level contract test
  - Add a test harness that:
    - Uses `build_monitor_from_profile`.
    - Runs a simulated monitor loop with fake backends.
    - Compares the emitted `Event` sequence against an expected snapshot for a simple “keep agent going” profile.

### 4.5 Profile editing & persistence guarantees

- [ ] UI tests
  - Add a profile persistence test that:
    - Loads the default preset via `profilesLoad`.
    - Modifies regions, actions, and guardrails.
    - Saves via `profilesSave`.
    - “Restarts” by re-rendering `App` with `profilesLoad` mocked to return the saved profiles.
    - Asserts that the UI reflects the saved configuration exactly (regions list, thumbnails, guardrails, actions).
- [ ] Validation
  - Ensure `auditProfile` and related validation logic:
    - Reject invalid profiles before save.
    - Surface errors inline in the editor (and not just in logs).

### 4.6 Usability & ergonomics checks

- [ ] UX checklist
  - Introduce a short “UX validation checklist” in docs that includes:
    - Onboarding: starting app, seeing a preset profile, understanding start/stop/quit.
    - Authoring: creating a region, capturing thumbnail, recording actions, saving profile.
    - Runtime: starting monitor, observing events, using Panic Stop, and quitting.
  - Add tests or scripted steps (e.g., in `doc/phase4Completion.md`) that must be run and checked manually until fully automated.
- [ ] E2E smoke
  - Add at least one automated E2E (Playwright or equivalent) for Linux that:
    - Launches the Tauri app in fake-backend mode.
    - Loads preset, starts monitor, waits for one activation, then stops and quits.
    - Asserts app exits and leaves no hanging processes.

Gate: all above items are either automated tests or documented manual checks with clear pass/fail criteria; test suite (Rust + UI) still achieves ≥90% coverage; at least one E2E “quit and shutdown” scenario passes repeatably.

## Phase 5 — Cross‑OS Enablement (post‑MVP)

- [ ] macOS backends behind existing traits:
  - ScreenCapture implementation reachable via ScreenCapture trait and used by RegionCondition and thumbnails.
  - Automation implementation that supports MoveCursor, Click, Type, and Key actions.
  - InputCapture implementation that feeds InputEvent into the RecordingBar via start_input_recording/stop_input_recording.
  - Packaging/signing and basic smoke tests on supported macOS versions.
- [ ] Windows 11 backends behind existing traits:
  - ScreenCapture implementation reachable via ScreenCapture trait and used by RegionCondition and thumbnails.
  - Automation implementation that supports MoveCursor, Click, Type, and Key actions.
  - InputCapture implementation that feeds InputEvent into the RecordingBar via start_input_recording/stop_input_recording.
  - Packaging/signing and basic smoke tests on supported Windows 11 versions.
- [ ] Authoring parity across OSes:
  - Region overlay works consistently on Linux, macOS, and Windows for selection and highlighting of Regions.
  - Thumbnail capture and region highlighting provide enough visual feedback to validate Regions on each platform.
  - RecordingBar produces ActionSequence definitions with identical semantics on all platforms.
- [ ] Cross‑OS contract tests and documented limitations for ScreenCapture, Automation, InputCapture, RegionCondition, and ActionSequence.

Gate: smoke runs on each OS; domain/runtime coverage ≥90%; UI unchanged across OSes.


## Phase 6 — Backlog / Future

- [ ] Focus‑binding Condition to restrict actions to an app/window.
- [ ] Optional keep‑awake Action (jiggle/sleep inhibition) behind traits.
- [ ] Extension registry and sample plug‑ins (DelayTrigger, NoopAction).
- [ ] OCR/LLM Conditions + Actions (not MVP).
- [ ] Telemetry opt‑in and privacy doc polish.
 
