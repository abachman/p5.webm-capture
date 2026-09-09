# Testing Guide

This project includes end-to-end visual regression tests to verify the library's "frame-perfect" guarantee (no dropped frames, no off-by-one timing shifts, and correct frame sequence capture starting from frame 0).

## Running Tests

Run the full test suite (type checking, build, and Playwright visual E2E test):

```bash
npm test
```

Or run just the Playwright test suite:

```bash
npm run test:e2e
```

## How It Works

1. `tests/fixtures/test-sketch.html` runs a deterministic p5.js sketch configured with `format: 'png'` and `frameCount: 5`.
2. Each frame renders a known discrete solid color and marker position (Frame 0: Red, Frame 1: Green, Frame 2: Blue, Frame 3: Yellow, Frame 4: Magenta).
3. The resulting TAR archive containing the PNG frames is parsed in-memory.
4. Each frame is compared pixel-by-pixel against the ground-truth reference images in `tests/fixtures/expectations/` with zero mismatch tolerance (`pixelmatch`, threshold 0).

## When to Use `tests/generate-expectations.ts`

**Only run `tests/generate-expectations.ts` when you are intentionally redesigning the test sketch** (e.g., modifying canvas dimensions, altering test frame count, or changing the expected color sequence).

```bash
# Rebuild expectation images if test sketch specification changes:
node --input-type=module -e "$(cat tests/generate-expectations.ts)"
```

**Do NOT run this script to resolve a failing test** caused by changes to `src/index.ts`, `src/capturer.ts`, or build configurations. A test failure indicates a frame timing, lifecycle, or capture regression that should be fixed in the library code.
