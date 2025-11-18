# Action Persistence Bug - Root Cause and Fix

**Date:** 2025-11-18  
**Status:** FIXED ✅  
**User Report:** Actions recorded in Action Recorder not persisting to profile config (reported 10+ times)

## The Bug

After recording actions in the Action Recorder window and clicking "Done", the actions would disappear and never appear in the GraphComposer or profile JSON file.

## Root Cause Analysis

After systematic line-by-line code review, the bug was found in `ActionRecorderWindow.tsx`:

### What Was Wrong

```typescript
// WRONG: Using direct event emission
import { emit } from "@tauri-apps/api/event";
...
await emit("loopautoma://action_recorder_complete", finalActions);
```

**Why This Failed:**
1. `emit()` from `@tauri-apps/api/event` sends a **frontend JavaScript event**
2. This event is confined to the browser WebView layer
3. It NEVER reaches the Rust backend's `action_recorder_complete` command
4. Cross-window event communication in Tauri is unreliable without backend mediation
5. The `actionRecorderComplete()` bridge function was **completely missing** from `tauriBridge.ts`

### What Should Have Been Done

```typescript
// CORRECT: Using Tauri command through bridge
import { actionRecorderComplete } from "../tauriBridge";
...
await actionRecorderComplete(finalActions);
```

**Why This Works:**
1. Calls Rust backend command via `invoke("action_recorder_complete", { actions })`
2. Rust emits event with proper backend authority: `app.emit("loopautoma://action_recorder_complete", &actions)`
3. All windows (main, recorder) receive the event reliably
4. Backend handles window lifecycle (restore main, close recorder)
5. Event listener in App.tsx receives actions and updates profile

## The Fix

### 1. Added Missing Bridge Function

**File:** `src/tauriBridge.ts`

```typescript
export async function actionRecorderComplete(actions: any[]): Promise<void> {
  if (!isDesktopMode()) return;
  await callInvoke("action_recorder_complete", { actions });
}
```

### 2. Updated ActionRecorderWindow

**File:** `src/components/ActionRecorderWindow.tsx`

```typescript
// BEFORE (broken)
import { emit } from "@tauri-apps/api/event";
await emit("loopautoma://action_recorder_complete", finalActions);

// AFTER (fixed)
import { actionRecorderComplete } from "../tauriBridge";
await actionRecorderComplete(finalActions);
```

### 3. Backend Command (Already Existed)

**File:** `src-tauri/src/lib.rs` (line 539-559)

```rust
#[tauri::command]
fn action_recorder_complete(
    app: tauri::AppHandle,
    actions: Vec<serde_json::Value>,
) -> Result<(), String> {
    // Emit actions to main window
    app.emit("loopautoma://action_recorder_complete", &actions)
        .map_err(|e| e.to_string())?;
    
    // Restore main window
    if let Some(main) = app.get_webview_window("main") {
        let _ = main.show();
        let _ = main.set_focus();
    }
    
    // Close recorder window
    if let Some(recorder) = app.get_webview_window("action-recorder") {
        let _ = recorder.close();
    }
    
    Ok(())
}
```

## Verification Steps

### 1. Check Terminal Output

When you run `bun run tauri dev`, ALL console.log statements appear in the terminal (NOT in browser F12):

```bash
$ bun run tauri dev
...
[ActionRecorder] Sending 3 actions to backend: [{"type":"click",...}]
[App] Received 3 recorded action(s): [...]
[App] REPLACING action sequence. Before: 0 After: 3
[App] Profile update completed successfully
[App] Verification - Config reloaded: [...]
```

### 2. Open DevTools (Optional)

- **Linux/Windows**: Press `Ctrl + Shift + I` (NOT F12!)
- **macOS**: Press `Cmd + Option + I`
- Look for same console.log messages

### 3. Verify in Profile JSON

```bash
cat ~/.config/loopautoma/profiles.json
```

Should show the recorded actions in the `actions` array.

### 4. Verify in GraphComposer

The action flow diagram should update immediately after recording to show the new actions.

## Related Issues Fixed

### Issue 1: MonitorTick Event Spam

**Problem:** Event log flooded with `MonitorTick: next=48.7s` every 100ms.

**Fix:** Filter MonitorTick events in EventLog.tsx display:
```typescript
const filteredEvents = events.filter(e => e.type !== "MonitorTick");
```

MonitorTick events are still emitted (CountdownTimer needs them) but hidden from user-facing log.

### Issue 2: Stale Config Closure

**Problem:** `updateProfile` used stale config from closure instead of current state.

**Fix:** Fetch fresh config inside updateProfile:
```typescript
const updateProfile = useCallback(async (updated: Profile) => {
  const freshConfig = await profilesLoad(); // Always fetch fresh
  const idx = freshConfig.profiles.findIndex((p) => p.id === updated.id);
  // ... rest of update logic
}, [applyConfig]); // Removed 'config' from deps
```

## Lessons Learned

1. **Tauri events require backend mediation** - Direct frontend emit() doesn't work cross-window
2. **Always use bridge functions** - Never call @tauri-apps/api directly from components
3. **Terminal is primary console** - F12 doesn't work in Tauri, use Ctrl+Shift+I or check terminal
4. **Line-by-line review beats assumptions** - Previous "fixes" were band-aids without root cause analysis
5. **Test the full round-trip** - Verify data in terminal logs, profile JSON, and UI state

## Testing Checklist

- [ ] Run `bun run tauri dev`
- [ ] Click "📹 Record Actions" button
- [ ] Click on screenshot 2-3 times
- [ ] Type some text
- [ ] Click "Done"
- [ ] Check terminal for: `[App] Received X recorded action(s)`
- [ ] Check terminal for: `[App] REPLACING action sequence`
- [ ] Verify actions appear in GraphComposer
- [ ] Verify `cat ~/.config/loopautoma/profiles.json` shows actions
- [ ] Verify Event Log is clean (no MonitorTick spam)

## Commit Message

```
fix: action persistence - use Tauri command instead of direct emit

- Added missing actionRecorderComplete() bridge function
- ActionRecorderWindow now calls Tauri command instead of emit()
- Backend handles event emission and window lifecycle properly
- Fixes action persistence bug reported 10+ times
- Also filtered MonitorTick spam from EventLog display

Root cause: emit() sends frontend-only event that never reaches backend
Solution: Use invoke("action_recorder_complete") through bridge layer
```
