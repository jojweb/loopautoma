# Accessing the Developer Console in Tauri

When running `bun run tauri dev`, you have TWO ways to see console logs:

## Method 1: Terminal Output (Primary)
All `console.log()` statements from your TypeScript/React code appear in the terminal where you ran `bun run tauri dev`. This is the MAIN way to debug.

Example terminal output:
```
[ActionRecorder] Sending 3 actions to backend: [{"type":"click",...}]
[App] Received 3 recorded action(s): [...]
[App] REPLACING action sequence. Before: 0 After: 3
```

## Method 2: Browser DevTools (Secondary)
To open the browser developer console:

1. **Run with DevTools flag:**
   ```bash
   bun run tauri dev
   ```
   
2. **Open DevTools in the running app:**
   - **Linux/Windows**: Press `Ctrl + Shift + I`
   - **macOS**: Press `Cmd + Option + I`
   - **Or**: Right-click anywhere in the app → "Inspect Element"

3. **Alternative**: Edit `src-tauri/tauri.conf.json` and add:
   ```json
   {
     "build": {
       "devPath": "http://localhost:1420",
       "devTools": true  // Add this line
     }
   }
   ```

**Note:** F12 does NOT work in Tauri apps by default. Use Ctrl+Shift+I or Cmd+Option+I.

## What to Look For

When debugging action persistence:

1. **In ActionRecorderWindow (action-recorder label):**
   - `[ActionRecorder] Sending X actions to backend: [...]`
   - Should show the actual action data being sent

2. **In MainWindow (main label):**
   - `[App] Received X recorded action(s): [...]`
   - `[App] REPLACING action sequence. Before: Y After: X`
   - `[App] Profile update completed successfully`
   - `[App] Verification - Config reloaded: [...]`

If you don't see the `[App] Received...` message, the event is NOT reaching the main window.

## Rust Logs (Backend)

Tauri backend logs appear in the terminal with the `[tauri]` prefix:
```
[tauri] action_recorder_complete called with 3 actions
```

To enable more verbose Rust logging, set:
```bash
RUST_LOG=debug bun run tauri dev
```
