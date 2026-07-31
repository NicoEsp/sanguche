/*
 * Render paralelo: N workers (browser propio cada uno) sobre rangos de
 * frames disjuntos → segmentos H.264 → concat sin re-encode.
 *   node render_par.mjs out.mp4 [fps=60] [dsf=2] [workers=3]
 */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

const here = path.dirname(fileURLToPath(import.meta.url));
const PAGE = 'file://' + path.join(here, 'index.html');

const out = process.argv[2] ?? path.join(here, 'video_silent.mp4');
const fps = Number(process.argv[3] ?? 60);
const dsf = Number(process.argv[4] ?? 2);
const NW = Number(process.argv[5] ?? 3);

const X264 = [
  '-vf', 'scale=1920:1080:flags=lanczos',
  '-c:v', 'libx264', '-preset', 'fast', '-crf', '16',
  '-profile:v', 'high', '-pix_fmt', 'yuv420p',
  '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
];

async function worker(id, start, end) {
  const seg = path.join(here, `seg${id}.mp4`);
  const browser = await chromium.launch({
    args: ['--force-color-profile=srgb', '--hide-scrollbars', '--disable-lcd-text'],
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: dsf });
  page.on('pageerror', (e) => { console.error(`[w${id}] PAGE ERROR:`, e.message); process.exitCode = 1; });
  await page.goto(PAGE);
  await page.waitForFunction(() => window.__ready && true);
  await page.evaluate(() => window.__ready);

  const ff = spawn(ffmpegPath, [
    '-y', '-hide_banner', '-loglevel', 'error', '-nostats',
    '-f', 'image2pipe', '-framerate', String(fps), '-i', 'pipe:0',
    ...X264, seg,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const ffDone = new Promise((res, rej) => {
    ff.on('close', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg seg${id} exit ${c}`))));
    ff.on('error', rej);
  });

  const t0 = Date.now();
  for (let i = start; i < end; i++) {
    const ms = (i / fps) * 1000;
    await page.evaluate((m) => window.seek(m), ms);
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if ((i - start) % 150 === 0) {
      const done = i - start + 1, left = end - i - 1;
      const rate = done / ((Date.now() - t0) / 1000);
      console.log(`[w${id}] ${done}/${end - start}  ${rate.toFixed(2)}fps  eta=${(left / rate).toFixed(0)}s`);
    }
  }
  ff.stdin.end();
  await ffDone;
  await browser.close();
  console.log(`[w${id}] listo → ${seg}`);
  return seg;
}

const totalMs = await (async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto(PAGE);
  await p.waitForFunction(() => window.__ready && true);
  const t = await p.evaluate(() => window.__TOTAL_MS);
  await b.close();
  return t;
})();

const frames = Math.round((totalMs / 1000) * fps);
const per = Math.ceil(frames / NW);
console.log(`total ${frames} frames, ${NW} workers × ~${per}`);

const segs = await Promise.all(
  Array.from({ length: NW }, (_, k) => worker(k, k * per, Math.min(frames, (k + 1) * per))),
);

const listFile = path.join(here, 'concat.txt');
writeFileSync(listFile, segs.map((s) => `file '${s}'`).join('\n') + '\n');
await new Promise((res, rej) => {
  const ff = spawn(ffmpegPath, [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-f', 'concat', '-safe', '0', '-i', listFile,
    '-c', 'copy', '-movflags', '+faststart', out,
  ], { stdio: 'inherit' });
  ff.on('close', (c) => (c === 0 ? res() : rej(new Error('concat exit ' + c))));
});
console.log('done →', out);
