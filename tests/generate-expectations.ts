/**
 * Script: tests/generate-expectations.ts
 *
 * Usage:
 *   node --input-type=module -e "$(cat tests/generate-expectations.ts)"
 *   or: npx tsx tests/generate-expectations.ts
 *
 * When to use:
 *   Only run this script when intentionally changing the test sketch in
 *   `tests/fixtures/test-sketch.html` (e.g. changing dimensions, total frame count,
 *   color sequence, or marker shapes).
 *
 *   Do NOT run this to fix failing tests caused by library or timing changes in
 *   `src/index.ts` or `src/capturer.ts`. The existing PNGs in `tests/fixtures/expectations/`
 *   are the ground-truth baselines verifying that the library does not drop, skip,
 *   or desync frames.
 */

import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';

const COLORS = [
  [255, 0, 0],     // Frame 0 - Red
  [0, 255, 0],     // Frame 1 - Green
  [0, 0, 255],     // Frame 2 - Blue
  [255, 255, 0],   // Frame 3 - Yellow
  [255, 0, 255],   // Frame 4 - Magenta
];

const width = 100;
const height = 100;
const outDir = path.resolve('tests/fixtures/expectations');
fs.mkdirSync(outDir, { recursive: true });

COLORS.forEach(([r, g, b], frameIndex) => {
  const png = new PNG({ width, height });

  // Fill background
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = 255;
    }
  }

  // Draw white square at x = 10 + frameIndex * 20, y = 10, size 10x10
  const squareX = 10 + frameIndex * 20;
  const squareY = 10;
  const squareSize = 10;

  for (let y = squareY; y < squareY + squareSize; y++) {
    for (let x = squareX; x < squareX + squareSize; x++) {
      const idx = (width * y + x) << 2;
      png.data[idx] = 255;
      png.data[idx + 1] = 255;
      png.data[idx + 2] = 255;
      png.data[idx + 3] = 255;
    }
  }

  const filename = path.join(outDir, `frame-${frameIndex}.png`);
  fs.writeFileSync(filename, PNG.sync.write(png));
  console.log(`Generated ${filename}`);
});
