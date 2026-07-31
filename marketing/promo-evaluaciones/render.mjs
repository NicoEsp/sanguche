/*
 * Render del promo "Nuevas evaluaciones" (ProductPrepa).
 *
 * Modos:
 *   node render.mjs stills 0,2000,5000 [outdir]   → PNGs de control
 *   node render.mjs video out.mp4 [fps] [dsf]     → render completo H.264
 *
 * Captura frame a frame con seek(ms) determinístico; nada depende del reloj.
 */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

const here = path.dirname(fileURLToPath(import.meta.url));
const PAGE = 'file://' + path.join(here, 'index.html');

const mode = process.argv[2] ?? 'stills';

async function openPage(dsf) {
  const browser = await chromium.launch({
    args: ['--force-color-profile=srgb', '--hide-scrollbars', '--disable-lcd-text'],
  });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: dsf,
  });
  page.on('pageerror', (e) => { console.error('PAGE ERROR:', e.message); process.exitCode = 1; });
  page.on('console', (m) => { if (m.type() === 'error') console.error('console.error:', m.text()); });
  await page.goto(PAGE);
  await page.waitForFunction(() => window.__ready && true);
  await page.evaluate(() => window.__ready);
  const total = await page.evaluate(() => window.__TOTAL_MS);
  return { browser, page, total };
}

if (mode === 'stills') {
  const times = (process.argv[3] ?? '0').split(',').map(Number);
  const outdir = process.argv[4] ?? path.join(here, 'stills');
  mkdirSync(outdir, { recursive: true });
  const { browser, page } = await openPage(1);
  for (const t of times) {
    await page.evaluate((ms) => window.seek(ms), t);
    const f = path.join(outdir, `t${String(t).padStart(6, '0')}.png`);
    await page.screenshot({ path: f, type: 'png' });
    console.log('still', t, '→', f);
  }
  await browser.close();
} else if (mode === 'video') {
  const out = process.argv[3] ?? path.join(here, 'out.mp4');
  const fps = Number(process.argv[4] ?? 60);
  const dsf = Number(process.argv[5] ?? 2);
  const { browser, page, total } = await openPage(dsf);
  const frames = Math.round((total / 1000) * fps);
  console.log(`render: ${frames} frames @ ${fps}fps, dsf=${dsf}, total=${total}ms`);

  const ff = spawn(ffmpegPath, [
    '-y', '-hide_banner', '-loglevel', 'error', '-stats',
    '-f', 'image2pipe', '-framerate', String(fps), '-i', 'pipe:0',
    '-vf', 'scale=1920:1080:flags=lanczos',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17',
    '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    out,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });

  const ffDone = new Promise((res, rej) => {
    ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg exit ' + c))));
    ff.on('error', rej);
  });

  const t0 = Date.now();
  for (let i = 0; i < frames; i++) {
    const ms = (i / fps) * 1000;
    await page.evaluate((m) => window.seek(m), ms);
    const buf = await page.screenshot({ type: 'jpeg', quality: 96 });
    if (!ff.stdin.write(buf)) {
      await new Promise((r) => ff.stdin.once('drain', r));
    }
    if (i % 120 === 0) {
      const el = (Date.now() - t0) / 1000;
      const eta = el / (i + 1) * (frames - i - 1);
      console.log(`frame ${i}/${frames}  t=${(ms / 1000).toFixed(1)}s  elapsed=${el.toFixed(0)}s  eta=${eta.toFixed(0)}s`);
    }
  }
  ff.stdin.end();
  await ffDone;
  await browser.close();
  console.log('done →', out);
} else {
  console.error('modo desconocido:', mode);
  process.exit(1);
}
