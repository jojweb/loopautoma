# Release Build Fix Summary - 0.1.0 → 0.1.1

## Problem Overview

The release build triggered by tag `0.1.0` failed for Windows and Linux platforms. This document summarizes the root causes, fixes implemented, and next steps to complete a successful release.

### Build Status for Tag 0.1.0

| Platform | Architecture | Status | Issue |
|----------|-------------|--------|-------|
| macOS | aarch64 (Apple Silicon) | ✅ **SUCCESS** | - |
| macOS | x86_64 (Intel) | ✅ **SUCCESS** | - |
| Windows | x86_64 | ❌ **FAILED** | Windows API incompatibility |
| Linux | x86_64 | ❌ **FAILED** | libspa dependency incompatibility |

## Root Causes

### Windows Build Failure

**Location:** `src-tauri/src/os/windows.rs`

The `windows` crate was updated to v0.58, which introduced breaking API changes:

1. **SetCursorPos signature change (line 233)**
   - **Old:** Returns `BOOL` (can call `.as_bool()`)
   - **New:** Returns `Result<(), Error>`
   - **Error:** `error[E0599]: no method named 'as_bool' found for enum Result<T, E>`

2. **SendInput signature change (line 243-246)**
   - **Old:** Takes 3 parameters: `(count: u32, inputs: *const INPUT, size: i32)`
   - **New:** Takes 2 parameters: `(inputs: &[INPUT], size: i32)` - count derived from slice
   - **Error:** `error[E0061]: this function takes 2 arguments but 3 arguments were supplied`

### Linux Build Failure

**Location:** Dependency chain `xcap → libspa v0.8.0`

The `libspa` Rust crate v0.8.0 expects libspa system library features only available in Ubuntu 24.04+:

1. **Missing `flags` field** (3 errors)
   - `spa_video_info_raw` struct no longer has a `flags` field in older libspa versions
   - Errors at libspa-0.8.0/src/param/video/raw.rs:231, 261, 265

2. **Type mismatch for `modifier` field** (2 errors)  
   - Expected `u64` but system library has `i64`
   - Errors at libspa-0.8.0/src/param/video/raw.rs:269, 273

**Note:** The release workflow was using `ubuntu-22.04` but the comment in the file already indicated "Ubuntu 24.04+ required for os-linux-capture-xcap (libspa 0.8.0)"

## Fixes Implemented

### 1. Windows API Compatibility Fix

**File:** `src-tauri/src/os/windows.rs`

```rust
// BEFORE (line 233)
if SetCursorPos(xi, yi).as_bool() {
    Ok(())
} else {
    Err(format!("SetCursorPos failed: {}", WinError::from_win32()))
}

// AFTER
SetCursorPos(xi, yi)
    .map_err(|e| format!("SetCursorPos failed: {}", e))
```

```rust
// BEFORE (line 243-246)
let sent = SendInput(
    inputs.len() as u32,
    inputs.as_ptr(),
    size_of::<INPUT>() as i32,
);

// AFTER
let sent = SendInput(
    inputs,
    size_of::<INPUT>() as i32,
);
```

### 2. Linux Platform Update

**File:** `.github/workflows/release.yaml`

```yaml
# BEFORE (line 23)
- platform: 'ubuntu-22.04'

# AFTER
- platform: 'ubuntu-24.04'
```

This change aligns with the existing comment in the workflow file and ensures the system libspa library is compatible with the Rust `libspa` crate v0.8.0.

### 3. Version Bump

Updated version to `0.1.1` in:
- `package.json`
- `src-tauri/Cargo.toml`
- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.lock`

## Changes Summary

### Modified Files
- `.github/workflows/release.yaml` - Updated Linux runner to ubuntu-24.04
- `src-tauri/src/os/windows.rs` - Fixed Windows API compatibility
- `package.json` - Version bump to 0.1.1
- `src-tauri/Cargo.toml` - Version bump to 0.1.1
- `src-tauri/tauri.conf.json` - Version bump to 0.1.1
- `src-tauri/Cargo.lock` - Updated dependencies for version bump
- `PLANS.md` - Documented fix task

## Next Steps - Action Required

The fixes have been implemented and committed to the branch `copilot/analyze-release-build-failures`. A local git tag `0.1.1` has been created but **cannot be pushed** due to authentication restrictions.

### To Complete the Release:

**Option 1: Push Tag Directly (Recommended)**
```bash
# Merge the PR first if needed, then:
git checkout main
git pull
git tag 0.1.1
git push origin 0.1.1
```

**Option 2: Create Release via GitHub UI**
1. Navigate to Releases page
2. Click "Draft a new release"
3. Create tag `0.1.1`
4. Select target: latest commit from the fix branch
5. Publish release

**Option 3: Merge PR First**
1. Review and merge the PR: `copilot/analyze-release-build-failures`
2. Then follow Option 1 or Option 2

### Verification Steps

Once the tag is pushed:

1. **Monitor the Release Workflow**
   - Navigate to: Actions → Release workflow
   - Verify all 4 jobs complete successfully:
     - ✅ macOS aarch64
     - ✅ macOS x86_64  
     - ✅ Windows x86_64
     - ✅ Linux x86_64 (Ubuntu 24.04)

2. **Download and Test Artifacts**
   - Download installers from the release page
   - Test on at least one platform (Windows .msi, Linux .deb/.AppImage, or macOS .dmg)
   - Verify the app launches and basic functionality works

3. **Publish the Release**
   - The workflow creates a **draft release** by default
   - Review the release notes
   - Click "Publish release" when ready

## Expected Outcomes

✅ **Windows build**: Should compile successfully with updated API calls  
✅ **Linux build**: Should compile successfully on Ubuntu 24.04 with compatible libspa  
✅ **macOS builds**: Should continue to work (no changes needed)  
✅ **All platforms**: Should produce installable release artifacts

## Technical Notes

### Windows API Changes
The Windows crate maintainers are moving towards more Rust-idiomatic error handling using `Result` types instead of C-style boolean returns. This is a breaking change but improves error handling ergonomics.

### Linux Library Requirements
Ubuntu 24.04 ships with libspa 0.8.0+ which has the updated `spa_video_info_raw` structure. This is a hard requirement for the `xcap` screen capture backend used on Linux.

**Minimum Requirements:**
- Linux builds now require **Ubuntu 24.04 or newer**
- Other distros need equivalent libspa versions (e.g., Fedora 40+, Arch with latest pipewire)

### Alternative Solutions Considered

1. **Pin older xcap version**: Would lose screen capture functionality improvements
2. **Use different capture backend**: Major refactoring, not worth for a patch release
3. **Add compatibility shims**: Fragile and maintenance burden

**Decision:** Updating to Ubuntu 24.04 is the cleanest solution as it's now widely available and provides long-term support.

## Related Resources

- **Release Workflow:** `.github/workflows/release.yaml`
- **Windows Implementation:** `src-tauri/src/os/windows.rs`
- **GitHub Actions Run (failed):** https://github.com/chrisgleissner/loopautoma/actions/runs/19389430617
- **Task Documentation:** `PLANS.md` - "Fix Release Build Failures (0.1.0 → 0.1.1)"

## Questions or Issues?

If the release build still fails after these changes:

1. Check the Actions logs for the specific error
2. Verify the Windows crate version is still v0.58.x
3. Verify the Ubuntu runner is actually using 24.04
4. Review this document's "Root Causes" section for comparison

---

**Last Updated:** 2025-11-15  
**Status:** Fixes implemented, awaiting tag push to trigger release
