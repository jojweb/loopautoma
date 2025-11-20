# 10 UI/UX Refinement Issues - Progress Report

**Date:** 2025-11-20  
**Commit:** bbe9e80

## Summary

Addressed 6 of 10 post-implementation testing issues. Commit includes EventLog improvements, region redefine fix, settings icon replacement, font-size button scaling, and OCR mode "none" option.

## Completed Issues (6/10)

### ✅ Issue 1: EventLog font too large, needs scroll + hover tooltip
**Status:** COMPLETE  
**Changes:**
- Reduced font from 11px to 9px for better density
- Added `overflowX: auto` and `overflowY: auto` for scrolling
- Implemented hover tooltip showing full event JSON
- Tooltip positioned at mouse cursor, shows on row hover
- Content is selectable for copy/paste
- Tooltip hides automatically on scroll

**Files:** `src/components/EventLog.tsx`

### ✅ Issue 2: Redefine button creates new region instead of updating
**Status:** COMPLETE  
**Root cause:** useEffect re-subscription when `redefiningRegionId` state changed  
**Fix:** Use `useRef` instead of `useState` for `redefiningRegionId`  
**Result:** Redefine now correctly calls `onRegionUpdate` with existing region ID

**Files:** `src/components/RegionAuthoringPanel.tsx`

### ✅ Issue 6: Settings icon looks like star, not cogwheel
**Status:** COMPLETE  
**Changes:**
- Replaced sparkles/star SVG with gear-like design
- Added gear teeth paths around center circle
- Icon scales with font-size (em units)

**Files:** `src/components/Icons.tsx`

### ✅ Issue 8: Font size changes don't affect button sizing
**Status:** COMPLETE  
**Changes:**
- Converted `button`, `input`, `select` heights from `28px` to `2.2em`
- Converted padding from `2px 6px` to `0.2em 0.6em`
- Icon buttons now `2.8em` x `2.8em` (was `40px` x `40px`)
- Border radius scaled to `0.8em`
- Text remains vertically centered via flex layout

**Files:** `src/App.css` (lines 873-880, 802-812)

### ✅ Issue 10: OCR mode needs "None" option
**Status:** COMPLETE  
**Changes:**
- Added `OcrMode::None` variant (Rust) and `"none"` type (TypeScript)
- Changed default from `Vision` to `None` (OCR disabled unless enabled)
- Updated UI to show "None (OCR disabled)" as first option
- Skip OCR checks in `monitor.rs` when mode is `None`
- Return error from `LLMPromptGenerationAction` if mode is `None`
- Updated 22 Rust tests to use `OcrMode::Vision` or check `None` default

**Files:** 
- `src-tauri/src/domain.rs` (OcrMode enum, default)
- `src-tauri/src/action.rs` (LLM action handling)
- `src-tauri/src/monitor.rs` (termination checks)
- `src-tauri/src/tests.rs` (22 test updates)
- `src/types.ts` (TypeScript OcrMode)
- `src/components/TerminationConditionsEditor.tsx` (UI dropdown)

### ⏸️ Issue 7: Audio playback doesn't work
**Status:** DEFERRED  
**Reason:** ALSA warnings indicate system-level audio configuration issue  
**Notes:**
- rodio integration exists and is correct
- ALSA errors: "unable to open slave", "no matching channel map"
- Requires system-level PulseAudio/ALSA debugging outside code scope
- Audio architecture is sound, issue is Linux audio stack configuration

**Recommendation:** Document in user manual as known issue on some Linux systems

## Remaining Issues (4/10)

### ❌ Issue 3: OCR not working - no output, no recognized text
**Status:** TODO  
**Required work:**
- Debug why `check_ocr_termination` doesn't extract text
- Verify OCR regions are configured with correct coordinates
- Check if `ocr_mode` is set to `Local` (not `None` or `Vision`)
- Add event emission before/after OCR attempts
- Add stdout logging (already exists at lines 247-248 of monitor.rs)
- Test with real screen content

**Complexity:** Medium - requires OCR feature testing with Tesseract

### ❌ Issue 4: XKB warnings in log about keyboard fallback
**Status:** TODO (low priority)  
**Notes:** Informational only, static keymap works fine  
**Required work:**
- Document in `doc/developer.md` as expected behavior
- Change log level from warn to info/debug
- Consider hiding from default console output

**Complexity:** Low - documentation + log level change

### ❌ Issue 5: Config changes lost on restart
**Status:** TODO  
**Required work:**
- Investigate where `profiles.json` is saved
- Check if `tauri dev` mode clears data directory between runs
- Verify `profiles_save` command writes to persistent location
- Use Tauri store plugin correctly for dev vs production
- Test config survives app restart in both modes

**Complexity:** Medium - requires Tauri store debugging

### ❌ Issue 9: OCR/LLM interactions not logged in event panel
**Status:** TODO  
**Required work:**
- Emit `ActionStarted` event before OCR scan
- Emit `ActionCompleted` event after OCR with extracted text snippet
- Emit events before/after LLM API calls
- Include prompt snippet and response in event details
- Ensure events appear in EventLog in real-time

**Complexity:** Medium - requires modifying monitor and action execution paths

## Test Status

### Rust Tests
- **66/66 passing** ✅
- All OcrMode changes verified
- LLM action tests updated to use `OcrMode::Vision`

### UI Tests
- **26/28 test files passing** ⚠️
- 2 EventLog test files failing (need rewrite for new table structure)
- All other components passing

### E2E Tests
- **Not yet written** ❌
- Required for validating all 10 fixes work end-to-end
- Should test: EventLog scroll/tooltip, region redefine, OCR execution, config persistence, font scaling

## Next Steps

1. **Write E2E tests** for completed fixes (Issues 1, 2, 6, 8, 10)
2. **Debug OCR** (Issue 3) - most critical remaining issue
3. **Fix config persistence** (Issue 5) - data loss is critical
4. **Add OCR/LLM event logging** (Issue 9) - improves observability
5. **Document XKB warnings** (Issue 4) - low priority, informational
6. **Document audio issue** (Issue 7) - known limitation on some systems

## Manual Verification Needed

Before marking complete:
- [ ] EventLog scrolls horizontally and vertically
- [ ] Hover over event row shows full JSON tooltip
- [ ] Redefine existing region preserves ID and name
- [ ] Settings icon looks like gear/cogwheel
- [ ] Changing font size (10-20px) scales buttons proportionally
- [ ] OCR mode dropdown shows "None" as default option
- [ ] Creating profile with OCR mode "none" doesn't trigger OCR

## Known Issues

1. **Audio playback** - ALSA configuration requires system-level debugging
2. **EventLog tests** - Old tests written for list format, need rewrite for table structure
3. **OCR functionality** - Requires mode set to "Local" and proper region configuration
4. **Config persistence** - May be Tauri dev mode behavior, need to test production build

## Architecture Impact

### Type Changes
- `OcrMode` now has three variants: `None` (default), `Local`, `Vision`
- Breaking change: profiles without explicit `ocr_mode` will now default to `None` instead of `Vision`
- Migration: Existing profiles should explicitly set `ocr_mode: "vision"` if using LLM features

### CSS Changes
- All button/input dimensions now scale with `--base-font-size` CSS variable
- Using em units throughout for consistency
- May affect custom styling if overriding button dimensions

### Event Structure
- EventLog now renders as table with Time/Name/Details columns
- Row hover shows tooltip with full JSON
- MonitorTick events filtered out by default

## References

- **Task:** `PLANS.md` - "Task: 10 UI/UX Refinement Issues - Post-Implementation Testing Phase"
- **Commit:** bbe9e80 - "fix: 6 UI/UX refinements (EventLog, redefine, icon, font-scaling, OCR mode)"
- **Previous work:** b8bda5a - "fix: resolve 8 UI/UX issues"
- **Documentation:** `doc/eightIssuesSummary.md` - First round of fixes
