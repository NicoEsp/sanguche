/*
 * Sound design del promo, 100% sintetizado y determinístico.
 * Compatible con ffmpeg estático 2018 (sin amix normalize): mezcla de 3
 * pistas de idéntica duración → escala constante, compensada con volume.
 */
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const FF = require('@ffmpeg-installer/ffmpeg').path;
const here = path.dirname(fileURLToPath(import.meta.url));
const DUR = 43;

const esc = (s) => s.replace(/,/g, '\\,');

/* ---------- pista 1: eventos tonales (una sola expresión) ---------- */
const parts = [];
// click UI: tap 1700+3400 Hz con decay rápido
const CLICKS = [
  [10.45, 0.85], [13.95, 0.80], [14.95, 0.70], [16.45, 0.80],
  [17.15, 0.70], [20.75, 0.80], [21.25, 0.60], [23.15, 0.85],
];
for (const [T, v] of CLICKS) {
  parts.push(
    `between(t,${T},${T + 0.12})*${(0.5 * v).toFixed(3)}*sin(2*PI*1700*(t-${T}))*exp(-(t-${T})*95)`,
    `between(t,${T},${T + 0.10})*${(0.22 * v).toFixed(3)}*sin(2*PI*3400*(t-${T}))*exp(-(t-${T})*160)`,
  );
}
// typing: tick 2600 Hz cada 105 ms (21.40–22.66)
parts.push(`between(t,21.40,22.66)*0.11*sin(2*PI*2600*t)*exp(-mod(t-21.40,0.105)*140)`);
// montage: tick 1500 Hz por card (262.5 ms) (17.35–19.45)
parts.push(`between(t,17.35,19.45)*0.185*sin(2*PI*1500*t)*exp(-mod(t-17.35,0.2625)*110)`);
// pops del radar: blips 760 Hz cada 70 ms (31.35–32.10)
parts.push(`between(t,31.35,32.10)*0.082*sin(2*PI*760*t)*exp(-mod(t-31.35,0.07)*120)`);
// chime del score: arpegio C5-E5-G5
const CH = [[25.90, 523.25, 0.21], [25.99, 659.25, 0.196], [26.08, 783.99, 0.182]];
for (const [T, f, a] of CH) {
  parts.push(`between(t,${T},${T + 1.6})*${a}*sin(2*PI*${f}*(t-${T}))*exp(-(t-${T})*3.3)`);
}
// nota final G4+G5 al aparecer el CTA
parts.push(`between(t,37.95,39.6)*0.143*sin(2*PI*392*(t-37.95))*exp(-(t-37.95)*2.6)`);
parts.push(`between(t,37.95,39.6)*0.055*sin(2*PI*784*(t-37.95))*exp(-(t-37.95)*3.2)`);

const eventsExpr = parts.join('+');

/* ---------- pista 2: whooshes (ruido con envolvente) ---------- */
const WH = [
  [4.03, 0.50, 0.16], [10.63, 0.72, 0.17], [23.48, 0.60, 0.16],
  [28.48, 0.46, 0.15], [36.48, 0.60, 0.16],
];
const whooshEnv = WH.map(([T, v, w]) => `${v}*exp(-pow((t-${T})/${w},2))`).join('+');

/* ---------- render de las 3 pistas ---------- */
const run = (args) => execFileSync(FF, ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: 'inherit', cwd: here });

run(['-f', 'lavfi', '-i', `aevalsrc=${esc(eventsExpr)}:d=${DUR}:s=48000`, 'sfx_events.wav']);
run(['-f', 'lavfi',
  '-i', `anoisesrc=color=white:seed=42:duration=${DUR}:amplitude=0.5`,
  '-af', `highpass=f=300,lowpass=f=1500,volume=volume='${esc(whooshEnv)}':eval=frame`,
  'sfx_whoosh.wav']);
run(['-f', 'lavfi',
  '-i', `anoisesrc=color=pink:seed=7:duration=${DUR}:amplitude=0.35`,
  '-af', `highpass=f=45,lowpass=f=420,volume=0.040,afade=t=in:st=0:d=1.2,afade=t=out:st=${DUR - 2.4}:d=2.4`,
  'sfx_bed.wav']);

/* ---------- mezcla (3 pistas de igual duración → 1/3 constante) ---------- */
run(['-i', 'sfx_events.wav', '-i', 'sfx_whoosh.wav', '-i', 'sfx_bed.wav',
  '-filter_complex', '[0:a][1:a][2:a]amix=inputs=3,volume=3,alimiter=limit=0.891,aformat=sample_rates=48000:channel_layouts=stereo',
  '-c:a', 'pcm_s16le', 'mix.wav']);

console.log('mix listo →', path.join(here, 'mix.wav'));
