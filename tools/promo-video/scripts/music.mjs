/**
 * @file music.mjs
 * `pnpm music` — a soft background pad generated from code (no samples, no
 * copyright): four warm chords, slow fades and a gentle shimmer, written as a
 * 48 kHz stereo WAV to public/generated/music.wav. Its length follows the
 * voice manifest, so run `pnpm voice` first. The render ducks it under speech.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FPS, buildTimeline } from './lib/timeline.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SAMPLE_RATE = 48_000;

const narration = JSON.parse(readFileSync(join(ROOT, 'src', 'narration.json'), 'utf8'));
const manifest = JSON.parse(
  readFileSync(join(ROOT, 'public', 'generated', 'voice', 'manifest.json'), 'utf8'),
);
const timeline = buildTimeline(
  narration.scenes,
  manifest.scenes.map((scene) => scene.seconds),
);
const seconds = timeline.totalFrames / FPS + 0.5;

/** Note name → frequency (A4 = 440 Hz). */
const NOTES = {
  C3: 130.81,
  E3: 164.81,
  G3: 196.0,
  A2: 110.0,
  A3: 220.0,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F3: 174.61,
  G4: 392.0,
};
/** Cmaj9 → Am7 → Fmaj7 → G6, 4 s each, looping. */
const CHORDS = [
  ['C3', 'G3', 'B3', 'D4', 'E4'],
  ['A2', 'E3', 'G3', 'C4', 'E4'],
  ['F3', 'A3', 'C4', 'E4', 'G4'],
  ['G3', 'B3', 'D4', 'E4', 'G4'],
].map((chord) => chord.map((note) => NOTES[note]));
const CHORD_SECONDS = 4;

const frames = Math.ceil(seconds * SAMPLE_RATE);
const data = Buffer.alloc(frames * 4); // 16-bit stereo
let peak = 0;
const samples = new Float32Array(frames * 2);

for (let i = 0; i < frames; i++) {
  const t = i / SAMPLE_RATE;
  const position = t / CHORD_SECONDS;
  const index = Math.floor(position) % CHORDS.length;
  const next = (index + 1) % CHORDS.length;
  const within = position - Math.floor(position);
  // Crossfade into the next chord during the last 30 % of each chord.
  const blend = within < 0.7 ? 0 : (within - 0.7) / 0.3;
  let left = 0;
  let right = 0;
  for (const [chord, weight] of [
    [CHORDS[index], 1 - blend],
    [CHORDS[next], blend],
  ]) {
    if (weight === 0) continue;
    chord.forEach((frequency, n) => {
      // Two slightly detuned sines per note: a soft, chorus-like pad.
      const phase = 2 * Math.PI * frequency * t;
      const tone = Math.sin(phase) * 0.6 + Math.sin(phase * 1.003 + n) * 0.4;
      const level = weight * (n === 0 ? 0.5 : 0.32);
      left += tone * level * (1 - n * 0.06);
      right += tone * level * (0.76 + n * 0.06);
    });
  }
  // Slow breathing and a fade in / fade out.
  const breath = 0.85 + 0.15 * Math.sin(2 * Math.PI * 0.12 * t);
  const fade = Math.min(1, t / 2.5, (seconds - t) / 3);
  left *= breath * fade;
  right *= breath * fade;
  samples[i * 2] = left;
  samples[i * 2 + 1] = right;
  peak = Math.max(peak, Math.abs(left), Math.abs(right));
}

// Normalise to −18 dBFS peak: a quiet bed under the voice.
const gain = 10 ** (-18 / 20) / peak;
for (let i = 0; i < samples.length; i++) {
  data.writeInt16LE(Math.round(samples[i] * gain * 32_767), i * 2);
}

const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + data.length, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20); // PCM
header.writeUInt16LE(2, 22); // stereo
header.writeUInt32LE(SAMPLE_RATE, 24);
header.writeUInt32LE(SAMPLE_RATE * 4, 28);
header.writeUInt16LE(4, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(data.length, 40);

const out = join(ROOT, 'public', 'generated', 'music.wav');
writeFileSync(out, Buffer.concat([header, data]));
console.log(`[music] ${seconds.toFixed(1)} s pad → ${out}`);
