/**
 * @file voice.mjs
 * `pnpm voice` — narration with an offline Windows voice (scripts/tts.ps1):
 * one WAV per sentence in public/generated/voice/, plus manifest.json with the
 * measured duration of each file (the video timeline follows these lengths).
 *
 * Nothing is sent over the network.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { wavDuration } from './lib/timeline.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'generated', 'voice');
/** Speaking rate (SSML prosody). The default rate keeps the video under 60 s. */
const RATE = '0%';

if (process.platform !== 'win32') {
  console.error('[voice] The offline voice uses Windows speech synthesis; run this on Windows.');
  process.exit(1);
}

const narration = JSON.parse(readFileSync(join(ROOT, 'src', 'narration.json'), 'utf8'));
mkdirSync(OUT, { recursive: true });
const request = join(OUT, 'request.json');
writeFileSync(request, JSON.stringify({ ...narration, rate: RATE }));

const output = execFileSync(
  'powershell.exe',
  [
    '-NoProfile',
    '-NonInteractive',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    join(ROOT, 'scripts', 'tts.ps1'),
    '-In',
    request,
    '-OutDir',
    OUT,
  ],
  { encoding: 'utf8' },
);

const files = output
  .trim()
  .split(/\r?\n/)
  .map((line) => line.split('|'))
  .filter((parts) => parts.length === 3);
const voiceUsed = files[0]?.[2] ?? 'unknown';
const scenes = narration.scenes.map((scene) => {
  const file = join(OUT, `${scene.id}.wav`);
  const seconds = wavDuration(readFileSync(file));
  return {
    id: scene.id,
    file: `generated/voice/${scene.id}.wav`,
    seconds: Number(seconds.toFixed(3)),
  };
});

writeFileSync(
  join(OUT, 'manifest.json'),
  JSON.stringify({ voice: voiceUsed, rate: RATE, scenes }, null, 2),
);
const total = scenes.reduce((sum, scene) => sum + scene.seconds, 0);
for (const scene of scenes)
  console.log(`[voice] ${scene.id.padEnd(10)} ${scene.seconds.toFixed(2)} s`);
console.log(`[voice] ${voiceUsed}, speech ${total.toFixed(1)} s → ${dirname(join(OUT, 'x'))}`);
