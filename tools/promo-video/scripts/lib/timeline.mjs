/**
 * @file timeline.mjs
 * Pure helpers that turn narration + measured voice durations into the video
 * timeline (scene frames, caption chunks) and the .srt subtitle file.
 * Used by render.mjs; unit-tested in timeline.test.mjs.
 */

export const FPS = 30;
/** Silence before each sentence and after it, in seconds. */
export const LEAD_IN = 0.25;
export const TAIL = 0.4;
/** At most this many characters per caption (two lines of ~33 at 46 px). */
export const MAX_CAPTION_CHARS = 64;
/** Words whose spoken moment is exposed as a cue (the Tech Lab switches demos on them). */
export const CUE_WORDS = ['React', 'Angular', 'Vue'];

/**
 * Splits a sentence into caption chunks of at most `max` characters.
 *
 * Chooses the break points with a small dynamic programme: chunks should be
 * about equally long (no orphan like "end."), and a break right after
 * punctuation (, : ; .) or before a dash is preferred. A chunk never starts
 * with a dash. Sentences are short, so O(words²) is instant.
 * @param {string} text
 * @param {number} [max]
 * @returns {string[]}
 */
export function splitCaptions(text, max = MAX_CAPTION_CHARS) {
  const words = text.trim().split(/\s+/);
  const n = words.length;
  const chunkText = (i, j) => words.slice(i, j).join(' ').replace(/^—\s*/, '');
  const count = Math.max(1, Math.ceil(text.length / max));
  const target = text.length / count;

  /** Cost of a chunk made of words[i..j-1]; Infinity when it is too long. */
  const cost = (i, j) => {
    const length = chunkText(i, j).length;
    if (length > max) return Infinity;
    let value = (length - target) ** 2;
    const endsSentence = j === n;
    const goodBreak = /[,:;.]$/.test(words[j - 1] ?? '') || words[j] === '—';
    if (!endsSentence && !goodBreak) value += 400;
    if (length < 18) value += 5_000; // avoid orphans
    return value;
  };

  const best = Array(n + 1).fill(Infinity);
  const from = Array(n + 1).fill(0);
  best[0] = 0;
  for (let j = 1; j <= n; j++) {
    for (let i = 0; i < j; i++) {
      const total = best[i] + cost(i, j);
      if (total < best[j]) {
        best[j] = total;
        from[j] = i;
      }
    }
  }
  if (!Number.isFinite(best[n])) throw new Error(`A single word is longer than ${max} characters`);

  const chunks = [];
  for (let j = n; j > 0; j = from[j]) chunks.unshift(chunkText(from[j], j));
  return chunks;
}

/**
 * Builds the scene timeline.
 * @param {{ id: string, text: string }[]} scenes narration, in order
 * @param {number[]} seconds measured duration of each voice file
 * @param {number} [fps]
 * @returns {{ totalFrames: number, scenes: { id: string, text: string, from: number,
 *   durationInFrames: number, voiceFrom: number, captions: { text: string, from: number, to: number }[] }[] }}
 *   frame numbers are absolute (from the start of the video)
 */
export function buildTimeline(scenes, seconds, fps = FPS) {
  if (scenes.length !== seconds.length) throw new Error('One voice duration per scene is required');
  let cursor = 0;
  const out = scenes.map((scene, index) => {
    const voiceSeconds = seconds[index];
    if (!(voiceSeconds > 0))
      throw new Error(`Scene ${scene.id}: invalid voice duration ${voiceSeconds}`);
    const from = cursor;
    const voiceFrom = from + Math.round(LEAD_IN * fps);
    const voiceFrames = Math.ceil(voiceSeconds * fps);
    const durationInFrames = Math.round(LEAD_IN * fps) + voiceFrames + Math.round(TAIL * fps);

    // Captions share the spoken time in proportion to their length.
    const chunks = splitCaptions(scene.text);
    const totalChars = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    let captionCursor = voiceFrom;
    const captions = chunks.map((chunk, i) => {
      const last = i === chunks.length - 1;
      const share = Math.round((chunk.length / totalChars) * voiceFrames);
      const to = last ? voiceFrom + voiceFrames : captionCursor + share;
      const caption = { text: chunk, from: captionCursor, to };
      captionCursor = to;
      return caption;
    });

    // When key words are spoken (proportional to their position in the sentence),
    // so visuals can change exactly when the narration names them.
    const cues = Object.fromEntries(
      CUE_WORDS.flatMap((word) => {
        const index = scene.text.indexOf(word);
        return index < 0
          ? []
          : [[word, voiceFrom + Math.round((index / scene.text.length) * voiceFrames)]];
      }),
    );

    cursor += durationInFrames;
    return { id: scene.id, text: scene.text, from, durationInFrames, voiceFrom, captions, cues };
  });
  return { totalFrames: cursor, scenes: out };
}

/** 00:00:01,234 */
function srtTime(frame, fps) {
  const ms = Math.round((frame / fps) * 1000);
  const pad = (value, size = 2) => String(value).padStart(size, '0');
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms % 1000, 3)}`;
}

/**
 * The timeline's captions as an .srt file (LinkedIn accepts SRT uploads).
 * @param {ReturnType<typeof buildTimeline>} timeline
 * @param {number} [fps]
 */
export function toSrt(timeline, fps = FPS) {
  const captions = timeline.scenes.flatMap((scene) => scene.captions);
  return `${captions
    .map(
      (caption, i) =>
        `${i + 1}\n${srtTime(caption.from, fps)} --> ${srtTime(caption.to, fps)}\n${caption.text}\n`,
    )
    .join('\n')}`;
}

/**
 * Reads the duration of a PCM WAV file from its header.
 * @param {Buffer} buffer
 * @returns {number} seconds
 */
export function wavDuration(buffer) {
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error('Not a WAV file');
  }
  let offset = 12;
  let byteRate = 0;
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    if (id === 'fmt ') byteRate = buffer.readUInt32LE(offset + 16);
    if (id === 'data') {
      if (!byteRate) throw new Error('WAV without fmt chunk');
      return size / byteRate;
    }
    offset += 8 + size + (size % 2);
  }
  throw new Error('WAV without data chunk');
}
