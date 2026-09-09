import { test, expect } from '@playwright/test';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import * as tar from 'tar';

interface TarEntry {
  name: string;
  data: Buffer;
}

function extractTarEntries(buffer: Buffer): Promise<TarEntry[]> {
  return new Promise((resolve, reject) => {
    const files: TarEntry[] = [];
    const entryPromises: Promise<void>[] = [];
    const parser = new tar.Parser();

    parser.on('entry', (entry) => {
      const chunks: Buffer[] = [];
      const entryDone = new Promise<void>((entryResolve) => {
        entry.on('data', (chunk: Buffer) => chunks.push(chunk));
        entry.on('end', () => {
          files.push({ name: entry.path, data: Buffer.concat(chunks) });
          entryResolve();
        });
      });
      entryPromises.push(entryDone);
    });

    parser.on('error', reject);
    parser.on('end', async () => {
      await Promise.all(entryPromises);
      resolve(files);
    });

    parser.end(buffer);
  });
}

let server: http.Server;
let port: number;

test.beforeAll(async () => {
  server = http.createServer((req, res) => {
    const url = new URL(req.url || '/', `http://127.0.0.1:${port}`);
    let filePath = '';

    if (url.pathname === '/' || url.pathname === '/test-sketch.html') {
      filePath = path.resolve('tests/fixtures/test-sketch.html');
    } else if (url.pathname.startsWith('/fixtures/')) {
      filePath = path.resolve('tests', url.pathname.slice(1));
    } else if (url.pathname.startsWith('/dist/')) {
      filePath = path.resolve(url.pathname.slice(1));
    }

    if (filePath && fs.existsSync(filePath)) {
      const ext = path.extname(filePath);
      const mimeTypes: Record<string, string> = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.png': 'image/png',
      };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        port = addr.port;
      }
      resolve();
    });
  });
});

test.afterAll(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test.describe('Frame-perfect capture verification', () => {
  test('captures all frames including frame 0 without dropping or offset', async ({ page }) => {
    // Navigate to test harness page
    await page.goto(`http://127.0.0.1:${port}/test-sketch.html`);

    // Wait until capture finishes and returns TAR data
    await page.waitForFunction(
      () => (window as any).__captureData || (window as any).__captureError,
      { timeout: 15000 }
    );

    const error = await page.evaluate(() => (window as any).__captureError);
    expect(error).toBeUndefined();

    const tarBytes: number[] = await page.evaluate(() => (window as any).__captureData);
    expect(tarBytes).toBeDefined();
    expect(tarBytes.length).toBeGreaterThan(0);

    const tarBuffer = Buffer.from(tarBytes);
    const files = await extractTarEntries(tarBuffer);

    // Expect exactly 5 frames captured
    expect(files.length).toBe(5);

    const { default: pixelmatch } = await import('pixelmatch');

    // Validate each frame matches its expectation fixture exactly (0 mismatched pixels)
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const expectationPath = path.resolve(`tests/fixtures/expectations/frame-${i}.png`);
      const expectationBuffer = fs.readFileSync(expectationPath);

      const actualPng = PNG.sync.read(file.data);
      const expectedPng = PNG.sync.read(expectationBuffer);

      expect(actualPng.width).toBe(expectedPng.width);
      expect(actualPng.height).toBe(expectedPng.height);

      const diffPng = new PNG({ width: actualPng.width, height: actualPng.height });
      const mismatchedPixels = pixelmatch(
        actualPng.data,
        expectedPng.data,
        diffPng.data,
        actualPng.width,
        actualPng.height,
        { threshold: 0 } // strict zero-tolerance pixel comparison
      );

      expect(
        mismatchedPixels,
        `Frame ${i} (${file.name}) had ${mismatchedPixels} mismatched pixels when compared with frame-${i}.png`
      ).toBe(0);
    }
  });
});
