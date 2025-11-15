# How to Trigger the 0.1.1 Release

## Current Status

✅ **All fixes implemented and committed**
- Windows API compatibility fixed
- Linux build updated to Ubuntu 24.04
- Version bumped to 0.1.1
- Documentation complete

📍 **Current branch:** `copilot/analyze-release-build-failures`
🏷️ **Local tag created:** `0.1.1` (not yet pushed)

## Option 1: Push Tag from Fix Branch (Quickest)

This approach tests the fixes immediately without waiting for PR review:

```bash
# Navigate to your local clone
cd /path/to/loopautoma

# Fetch the latest changes
git fetch origin

# Checkout the fix branch
git checkout copilot/analyze-release-build-failures
git pull origin copilot/analyze-release-build-failures

# Create and push the tag
git tag 0.1.1
git push origin 0.1.1
```

**Pros:** Immediate testing, fastest feedback
**Cons:** Release built from feature branch (non-standard but acceptable for fix validation)

## Option 2: Merge PR First (Recommended for Production)

This is the standard approach for production releases:

```bash
# 1. Review and merge the PR on GitHub
#    PR: copilot/analyze-release-build-failures -> main

# 2. After merge, pull main locally
git checkout main
git pull origin main

# 3. Create and push the tag
git tag 0.1.1
git push origin 0.1.1
```

**Pros:** Clean release from main branch, proper git history
**Cons:** Requires PR review step

## Option 3: Create Release via GitHub UI

1. Go to: https://github.com/chrisgleissner/loopautoma/releases
2. Click "Draft a new release"
3. Click "Choose a tag" → Type `0.1.1` → "Create new tag on publish"
4. Target: Select either:
   - `main` (if PR merged) OR
   - `copilot/analyze-release-build-failures` (to test before merge)
5. Release title: `Loop Automa 0.1.1`
6. Description: Copy from below or customize
7. Check "Set as a pre-release" if testing
8. Click "Publish release"

### Suggested Release Description

```markdown
## Release 0.1.1 - Build Fix Update

This release fixes build failures for Windows and Linux platforms identified in the 0.1.0 release.

### Changes
- **Windows**: Fixed compatibility with Windows crate v0.58 API changes
- **Linux**: Updated to Ubuntu 24.04 for libspa 0.8.0 compatibility
- **Platform requirements**: Linux builds now require Ubuntu 24.04+ or equivalent

### Downloads
Choose the appropriate installer for your platform:
- **Windows**: `.msi` installer
- **Linux**: `.deb` (Debian/Ubuntu) or `.AppImage` (universal)
- **macOS**: `.dmg` installer

See [releaseFixSummary.md](./releaseFixSummary.md) for technical details.
```

## What Happens When You Push the Tag

The `.github/workflows/release.yaml` workflow will automatically:

1. **Trigger on tag push** matching pattern `*.*.*`
2. **Run 4 parallel build jobs:**
   - ✅ macOS ARM64 (Apple Silicon)
   - ✅ macOS x86_64 (Intel)
   - ✅ Windows x86_64 (with fixed API calls)
   - ✅ Linux x86_64 (Ubuntu 24.04 with compatible libspa)
3. **Create release artifacts** for each platform
4. **Create a draft GitHub release** with all artifacts attached

## Monitoring the Release Build

1. **Go to Actions tab:**
   https://github.com/chrisgleissner/loopautoma/actions

2. **Find the "Release" workflow run**
   - Should start within seconds of pushing the tag
   - Look for workflow run named: "Loop Automa 0.1.1" or similar

3. **Watch the 4 build jobs:**
   - Each takes 5-10 minutes
   - Click on any job to see detailed logs
   - Green checkmark = success ✅
   - Red X = failure ❌

4. **Expected results:**
   - All 4 jobs should complete successfully
   - Draft release created with 4+ artifacts
   - Release is NOT published automatically (stays in draft)

## If a Build Still Fails

### Windows Build Fails
- Check the error message carefully
- Verify it's the same SetCursorPos/SendInput errors
- If different error, check Windows crate version in logs
- Review `src-tauri/src/os/windows.rs` changes

### Linux Build Fails
- Check if it's still libspa-related
- Verify runner is actually using ubuntu-24.04 (check logs)
- Confirm libspa-0.2-dev version in build logs
- Review `.github/workflows/release.yaml` platform setting

### macOS Build Fails (Unexpected)
- These were working before and shouldn't fail
- Check if it's a flaky runner issue (re-run the job)
- Review error carefully as it may be unrelated to our changes

## After Successful Build

1. **Review the draft release:**
   - Go to: https://github.com/chrisgleissner/loopautoma/releases
   - Find the draft release for 0.1.1
   - Review the artifacts (should have .msi, .deb, .AppImage, .dmg files)

2. **Test at least one artifact:**
   - Download the installer for your platform
   - Install and run the application
   - Verify basic functionality (open app, UI loads, etc.)

3. **Publish the release:**
   - Click "Edit" on the draft release
   - Review the release notes
   - Click "Publish release"

4. **Update PLANS.md:**
   - Mark the task as complete
   - Note any issues encountered
   - Document final verification steps

## Rollback Plan (If Needed)

If the release build fails and quick fixes aren't obvious:

1. **Delete the tag locally and remotely:**
   ```bash
   git tag -d 0.1.1
   git push origin :refs/tags/0.1.1
   ```

2. **Delete the draft release on GitHub**

3. **Investigate and fix the issue**

4. **Try again with same tag or use 0.1.2**

## Quick Reference Commands

```bash
# Check current branch
git branch --show-current

# Check if tag exists locally
git tag -l | grep 0.1.1

# Create tag
git tag 0.1.1

# Push tag
git push origin 0.1.1

# Delete local tag
git tag -d 0.1.1

# Delete remote tag
git push origin :refs/tags/0.1.1

# View tag details
git show 0.1.1
```

## Support

If you encounter issues not covered here:
- Check `doc/releaseFixSummary.md` for technical details
- Review GitHub Actions logs for specific error messages
- Compare with the successful 0.1.0 macOS builds to identify differences

---

**Ready to proceed?** Choose one of the three options above and trigger the release! 🚀
