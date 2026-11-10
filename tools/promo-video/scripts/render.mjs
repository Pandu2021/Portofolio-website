/**
 * @file render.mjs
 * `pnpm render` — builds the timeline from the measured voice files, renders
 * the Remotion composition with the INSTALLED Chrome/Edge (no browser
 * download), then finishes the file with Remotion's bundled ffmpeg:
 * loudness −14 LUFS (social-media standard), AAC 48 kHz, metadata removed.
 *
 * Output (git-ignored) in out/:
 *   portfolio-demo-4x5.mp4 · portfolio-demo.srt · cover.png · linkedin-post.md
 *
 * Run `pnpm capture`, `pnpm voice` and `pnpm music` first (or `pnpm video`).
 */
import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import { findBrowser } from '../../../scripts/e2e/browser.mjs';
import { FPS, buildTimeline, toSrt } from './lib/timeline.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const OUT = join(ROOT, 'out');
const COMPOSITION = 'PortfolioDemo';

/** Remotion ships ffmpeg/ffprobe inside its platform "compositor" package. */
function remotionBinary(name) {
  const fromRenderer = createRequire(createRequire(import.meta.url).resolve('@remotion/renderer'));
  const platform = {
    'win32-x64': 'win32-x64-msvc',
    'linux-x64': 'linux-x64-gnu',
    'linux-arm64': 'linux-arm64-gnu',
    'darwin-x64': 'darwin-x64',
    'darwin-arm64': 'darwin-arm64',
  }[`${process.platform}-${process.arch}`];
  if (!platform) throw new Error(`No Remotion compositor for ${process.platform}-${process.arch}`);
  const dir = dirname(fromRenderer.resolve(`@remotion/compositor-${platform}/package.json`));
  return join(dir, process.platform === 'win32' ? `${name}.exe` : name);
}

// 1. Timeline from the narration and the measured voice durations.
const narration = JSON.parse(readFileSync(join(ROOT, 'src', 'narration.json'), 'utf8'));
const manifestPath = join(PUBLIC, 'generated', 'voice', 'manifest.json');
if (!existsSync(manifestPath)) throw new Error('No voice files yet — run `pnpm voice` first.');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
for (const shot of ['hero', 'techlab', 'react', 'angular', 'vue', 'dark-mobile']) {
  if (!existsSync(join(PUBLIC, 'generated', 'captures', `${shot}.png`))) {
    throw new Error(`Missing capture ${shot}.png — run \`pnpm capture\` first.`);
  }
}
const timeline = buildTimeline(
  narration.scenes,
  manifest.scenes.map((scene) => scene.seconds),
);
const music = existsSync(join(PUBLIC, 'generated', 'music.wav')) ? 'generated/music.wav' : null;
const inputProps = {
  totalFrames: timeline.totalFrames,
  music,
  scenes: timeline.scenes.map((scene, i) => ({
    ...scene,
    voice: manifest.scenes[i].file,
    voiceFrames: Math.ceil(manifest.scenes[i].seconds * FPS),
  })),
};
console.log(
  `[render] ${timeline.scenes.length} scenes, ${(timeline.totalFrames / FPS).toFixed(1)} s, voice: ${manifest.voice}`,
);

// 2. Bundle and render with the installed browser.
mkdirSync(OUT, { recursive: true });
const browserExecutable = findBrowser();
const chromeMode = 'chrome-for-testing'; // = new headless mode of a normal Chrome/Edge
const serveUrl = await bundle({ entryPoint: join(ROOT, 'src', 'index.ts'), publicDir: PUBLIC });
const composition = await selectComposition({
  serveUrl,
  id: COMPOSITION,
  inputProps,
  browserExecutable,
  chromeMode,
});

const raw = join(OUT, 'raw.mp4');
let lastPercent = -10;
await renderMedia({
  composition,
  serveUrl,
  inputProps,
  codec: 'h264',
  crf: 18,
  pixelFormat: 'yuv420p',
  // Standard HD colours (limited range): looks the same in every player / on LinkedIn.
  colorSpace: 'bt709',
  audioCodec: 'aac',
  audioBitrate: '192k',
  outputLocation: raw,
  browserExecutable,
  chromeMode,
  overwrite: true,
  onProgress: ({ progress }) => {
    const percent = Math.floor(progress * 100);
    if (percent >= lastPercent + 10) {
      lastPercent = percent;
      console.log(`[render] ${percent}%`);
    }
  },
});

// 3. Cover image: the intro title, fully visible.
await renderStill({
  composition,
  serveUrl,
  inputProps,
  output: join(OUT, 'cover.png'),
  frame: Math.min(timeline.scenes[0].durationInFrames - 12, 75),
  browserExecutable,
  chromeMode,
  overwrite: true,
});

// 4. Loudness −14 LUFS, AAC 48 kHz, no metadata, fast start for streaming.
const final = join(OUT, 'portfolio-demo-4x5.mp4');
execFileSync(
  remotionBinary('ffmpeg'),
  [
    '-y',
    '-hide_banner',
    '-loglevel',
    'error',
    '-i',
    raw,
    '-map',
    '0:v:0',
    '-map',
    '0:a:0',
    '-c:v',
    'copy',
    '-af',
    'loudnorm=I=-14:TP=-1.5:LRA=11',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-ar',
    '48000',
    '-map_metadata',
    '-1',
    '-map_chapters',
    '-1',
    '-metadata:s:v',
    'handler_name=',
    '-metadata:s:a',
    'handler_name=',
    '-movflags',
    '+faststart',
    final,
  ],
  { stdio: 'inherit' },
);
rmSync(raw);

// 5. Captions file and the LinkedIn post.
writeFileSync(join(OUT, 'portfolio-demo.srt'), toSrt(timeline));
copyFileSync(join(ROOT, 'linkedin-post.md'), join(OUT, 'linkedin-post.md'));

// 6. Summary from ffprobe.
const probe = JSON.parse(
  execFileSync(
    remotionBinary('ffprobe'),
    ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', final],
    {
      encoding: 'utf8',
    },
  ),
);
const video = probe.streams.find((stream) => stream.codec_type === 'video');
const audio = probe.streams.find((stream) => stream.codec_type === 'audio');
console.log(
  `[render] done: ${final}\n` +
    `  ${video?.width}×${video?.height} ${video?.codec_name} · audio ${audio?.codec_name} ${audio?.sample_rate} Hz · ` +
    `${Number(probe.format.duration).toFixed(1)} s · ${(statSync(final).size / 1024 / 1024).toFixed(1)} MB`,
);
