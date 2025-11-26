# Input Capture Auto-Transform Implementation

## Summary

Implemented automatic transformation of captured input events into ActionSequence when stopping recording. Users no longer need to click a separate "Save as ActionSequence" button.

## Changes Made

### 1. RecordingBar Component (`src/components/RecordingBar.tsx`)

**Removed:**
- `onSave` prop from component interface
- "Save as ActionSequence" button from UI

**Updated:**
- Changed button text hint to indicate actions will be added to profile automatically
- Removed the separate save button workflow

### 2. App Integration (`src/App.tsx`)

**Changed:**
- Replaced `onSave` callback with `onStop` callback
- `onStop` now automatically transforms events to actions and updates the profile
- Logic flow: Record → Stop → **Auto-transform** → Actions added to profile

**Code:**
```typescript
<RecordingBar
  onStop={async (evts) => {
    if (!selectedProfile) return;
    if (evts.length === 0) return;
    const newActions = toActions(evts);
    await updateProfile({
      ...selectedProfile,
      actions: [...selectedProfile.actions, ...newActions],
    });
  }}
/>
```

### 3. E2E Tests (`tests/e2e/03-input-recording.web.e2e.ts`)

**Updated Tests:**
- Test 4.1: Now verifies automatic transformation on stop (mouse click + keyboard typing)
- Test 4.11: Renamed to "Stop converts events to ActionConfig correctly"
- Test 4.12: Renamed to "Actions automatically appear in profile after stop"

**Test Coverage:**
- ✅ Mouse clicks captured with coordinates
- ✅ Keyboard text buffered and flushed
- ✅ Actions automatically added to profile config
- ✅ Type actions contain typed text
- ✅ Click actions have correct button and position

All 16 E2E tests passing.

## User Workflow

### Before:
1. Click "Record"
2. Perform actions (mouse, keyboard)
3. Click "Stop"
4. **Manually click "Save as ActionSequence"**
5. Actions added to profile

### After:
1. Click "Record"
2. Perform actions (mouse, keyboard)
3. Click "Stop" → **Actions automatically added to profile**
4. Done!

## Technical Details

### Event Flow

```
User Input → XRecord (rdev) → Tauri Event → RecordingBar Listener
            → Event Buffer → Stop Button → toActions() → Profile Update
```

### Event Types Supported

- **Mouse Clicks:** Captured on `button_down` event (button_up only updates timeline)
- **Keyboard Typing:** Plain characters buffered into single `Type` action
- **Special Keys:** Enter, Escape, Tab, etc. captured as `{Key:name}` syntax
- **Modifiers:** Ctrl, Alt, Shift combinations preserved

### Action Transformation

The `toActions()` helper converts:
- `{ t: "click", button, x, y }` → `{ type: "Click", button, x, y }`
- `{ t: "type", text }` → `{ type: "Type", text }`
- `{ t: "key", key }` → `{ type: "Type", text: "{Key:name}" }`

## Testing

Run E2E tests:
```bash
bun run test:e2e tests/e2e/03-input-recording.web.e2e.ts
```

Manual testing (requires Linux with X11 + rdev working):
```bash
bun run tauri dev
# 1. Click "Record"
# 2. Move mouse, click, type some text
# 3. Click "Stop"
# 4. Verify actions appear in GraphComposer
```

## Future Enhancements

- [ ] Optional: Add "Save" button for explicit control (toggle via preferences)
- [ ] Show toast notification when actions are added
- [ ] Add undo/redo for auto-transformed actions
- [ ] Preview actions before they're added to profile
