# Test Parallelism Configuration

## Overview

Both Vitest (unit tests) and Playwright (E2E tests) now support configurable parallelism to significantly speed up test execution.

## Default Behavior

### Local Development
- **Vitest:** Uses 50% of available CPU cores (e.g., 4 workers on 8-core machine)
- **Playwright:** Uses 50% of available CPU cores for web tests, sequential for Tauri tests

### CI Environment
- **Vitest:** Uses 50% of available CPU cores
- **Playwright:** Single worker for deterministic builds

## Configuration

### Environment Variables

| Variable | Scope | Default | Description |
|----------|-------|---------|-------------|
| `VITEST_MAX_WORKERS` | Vitest | 50% of CPU cores | Number of parallel threads for unit tests |
| `PLAYWRIGHT_WORKERS` | Playwright | 50% local, 1 CI | Number of parallel workers for E2E tests |

### Examples

```bash
# Run with maximum parallelism (all CPU cores)
VITEST_MAX_WORKERS=8 PLAYWRIGHT_WORKERS=8 bun test:all

# Run with conservative parallelism (2 workers each)
VITEST_MAX_WORKERS=2 PLAYWRIGHT_WORKERS=2 bun test:all

# Run with single worker (sequential, for debugging)
VITEST_MAX_WORKERS=1 PLAYWRIGHT_WORKERS=1 bun test:all

# Use the fast preset (optimized for 8-core machines)
bun run test:all:fast
```

## NPM Scripts

| Script | Description | Parallelism |
|--------|-------------|-------------|
| `bun test:ui` | Run Vitest unit tests | Default (50% cores) |
| `bun test:ui:cov` | Run with coverage | Default (50% cores) |
| `bun test:ui:watch` | Watch mode | Default (50% cores) |
| `bun test:e2e` | Run Playwright E2E tests | Default (50% cores local, 1 CI) |
| `bun test:all` | Run all tests sequentially | Default for both |
| `bun test:all:fast` | Run with aggressive parallelism | 8 Vitest workers, 4 Playwright workers |

## Playwright Project-Level Parallelism

### Web-Only Tests (`*.web.e2e.ts`)
- **Parallel:** Yes (fully parallel)
- **Reason:** Isolated browser contexts, no shared state
- **Workers:** Configurable via `PLAYWRIGHT_WORKERS`

### Tauri Desktop Tests (`*.tauri.e2e.ts`)
- **Parallel:** No (sequential execution)
- **Reason:** Shared app state, file system operations, single Tauri process
- **Workers:** Always 1 (enforced at project level)

## Performance Impact

### Baseline (Sequential)
```
Unit Tests:    ~18s (1 worker)
E2E Tests:     ~48s (1 worker)
Total:         ~66s
```

### Optimized (4 workers)
```
Unit Tests:    ~6-8s (4 workers, estimated 60-70% speedup)
E2E Tests:     ~20-25s (web tests parallel, Tauri sequential)
Total:         ~26-33s (~50% faster)
```

### Aggressive (8 workers)
```
Unit Tests:    ~4-6s (8 workers, estimated 70-80% speedup)
E2E Tests:     ~15-20s (more web test parallelism)
Total:         ~19-26s (~60-70% faster)
```

**Note:** Actual speedup depends on:
- CPU core count and speed
- Test I/O vs CPU intensity
- Browser startup overhead (E2E tests)
- Test interdependencies

## When to Use Sequential Execution

Use `VITEST_MAX_WORKERS=1 PLAYWRIGHT_WORKERS=1` when:

1. **Debugging flaky tests:** Sequential execution makes timing issues easier to reproduce
2. **Low-resource environments:** Avoid overwhelming CPU/memory
3. **CI stability:** Some CI environments benefit from sequential execution
4. **Coverage accuracy:** Parallel execution shouldn't affect coverage, but sequential can help debug discrepancies

## Implementation Details

### Vitest Configuration

```typescript
// vitest.config.ts
import { availableParallelism } from "os";

const maxWorkers = process.env.VITEST_MAX_WORKERS
  ? parseInt(process.env.VITEST_MAX_WORKERS, 10)
  : Math.max(1, Math.floor(availableParallelism() / 2));

export default defineConfig({
  test: {
    pool: "threads",
    poolOptions: {
      threads: {
        maxThreads: maxWorkers,
        minThreads: 1,
      },
    },
  },
});
```

### Playwright Configuration

```typescript
// playwright.config.ts
import { availableParallelism } from 'os';

const defaultWorkers = process.env.CI ? 1 : Math.max(1, Math.floor(availableParallelism() / 2));
const maxWorkers = process.env.PLAYWRIGHT_WORKERS
  ? parseInt(process.env.PLAYWRIGHT_WORKERS, 10)
  : defaultWorkers;

export default defineConfig({
  fullyParallel: true,
  workers: maxWorkers,
  projects: [
    {
      name: 'web-only-mode',
      fullyParallel: true,  // Parallel within project
    },
    {
      name: 'tauri-desktop-mode',
      fullyParallel: false, // Sequential within project
    },
  ],
});
```

## Troubleshooting

### Tests fail in parallel but pass sequentially

**Symptoms:** Intermittent failures, race conditions, "element not found" errors

**Solutions:**
1. Check for shared state between tests (localStorage, global variables)
2. Ensure proper cleanup in afterEach/afterAll hooks
3. Add explicit waitFor() for async operations
4. Use test.describe.serial() for dependent tests
5. Increase timeouts if needed

### Coverage reports are incomplete

**Symptoms:** Lower coverage in parallel mode than sequential

**Solutions:**
1. Coverage should be identical - this usually indicates a bug
2. Check that all test files are being discovered
3. Verify Istanbul instrumentation is working
4. Run `bun test:ui:cov` with `VITEST_MAX_WORKERS=1` to compare

### Out of memory errors

**Symptoms:** Tests crash with heap allocation failures

**Solutions:**
1. Reduce worker count: `VITEST_MAX_WORKERS=2`
2. Increase Node memory: `NODE_OPTIONS=--max-old-space-size=4096`
3. Check for memory leaks in tests (use vitest --reporter=verbose)

## Best Practices

1. **Start conservative:** Use defaults (50% cores) for everyday development
2. **Use fast mode for CI:** `test:all:fast` optimizes for speed when you need quick feedback
3. **Debug sequentially:** When investigating flakes, use single worker
4. **Monitor resources:** Watch CPU/memory usage to find optimal worker count
5. **Profile tests:** Use `bunx vitest --reporter=verbose` to identify slow tests

## Related Documentation

- **AGENTS.md:** Testing approach section
- **doc/developer.md:** Local setup and test commands
- **.github/copilot-instructions.md:** CI testing notes
- **vitest.config.ts:** Vitest parallelism implementation
- **playwright.config.ts:** Playwright parallelism implementation
