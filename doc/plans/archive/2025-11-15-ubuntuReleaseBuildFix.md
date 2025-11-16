# Task: Fix Ubuntu Release Build - Comprehensive Dependency Fix

**Started:** 2025-11-15  
**Completed:** 2025-11-15

## User request (summary)
- Fix the Ubuntu release build that is failing with missing glib-2.0 and other GTK dependencies
- Analyze the root cause thoroughly and predict future issues
- Implement a comprehensive fix that will work once and for all
- Most recent error: "The system library `glib-2.0` required by crate `glib-sys` was not found"

## Context and constraints
- Ubuntu 24.04 is required for libspa 0.8.0 compatibility (xcap dependency)
- Previous fix changed platform to ubuntu-24.04 but didn't update the if condition
- Need to ensure ALL GTK/GLib development packages are installed
- Build must succeed locally before considering it fixed

## Implementation Summary
All steps completed successfully - build verified locally in 31 seconds.

###Root Cause
- The if condition in release.yaml was checking ubuntu-22.04 but platform was ubuntu-24.04
- This caused ALL dependency installation to be skipped
- Fixed by updating condition to match ubuntu-24.04

### Packages Installed
Installed missing packages locally one by one as build revealed them:
- libglib2.0-dev (glib-2.0.pc, gobject-2.0.pc, gio-2.0.pc)
- libcairo2-dev, libpango1.0-dev, libgdk-pixbuf-2.0-dev, libatk1.0-dev
- libjavascriptcoregtk-4.1-dev
- libsoup-3.0-dev
- libwebkit2gtk-4.1-dev (also installs javascriptcore and soup as deps)
- libpipewire-0.3-dev (also installs libspa-0.2-dev)
- libxkbcommon-x11-dev, libgbm-dev

### Deliverables
- Fixed release.yaml if condition: ubuntu-22.04 → ubuntu-24.04
- Added comprehensive package list (32 packages total)
- Added validation step to check for required .pc files
- Created doc/ubuntuBuildFixSummary.md with comprehensive documentation

## Follow-ups / future work
- Monitor next release build to confirm success
- Consider adding similar validation to CI workflow
- Update install.md to document Ubuntu 24.04 minimum requirement
