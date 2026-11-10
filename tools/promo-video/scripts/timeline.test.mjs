/**
 * @file timeline.test.mjs
 * Caption splitting, scene timing, SRT output and WAV duration parsing.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  FPS,
  MAX_CAPTION_CHARS,
  buildTimeline,
  splitCaptions,
  toSrt,
  wavDuration,
} from './lib/timeline.mjs';

const narration = JSON.parse(
  readFileSync(new URL('../src/narration.json', import.meta.url), 'utf8'),
);

describe('splitCaptions', () => {
  it('keeps every word in order, respects the limit and has no orphan chunk', () => {
    const words = (value) => value.split(/\s+/).filter((word) => word !== '—');
    for (const { text } of narration.scenes) {
      const chunks = splitCaptions(text);
      assert.deepEqual(words(chunks.join(' ')), words(text));
      for (const chunk of chunks) {
        assert.ok(chunk.length <= MAX_CAPTION_CHARS, chunk);
        if (chunks.length > 1) assert.ok(chunk.length >= 18, `orphan: "${chunk}"`);
      }
    }
  });

  it('prefers to break after punctuation when the halves stay balanced', () => {
    const chunks = splitCaptions(
      'Every app is bilingual and accessible, protected by a strict policy and tested end to end.',
    );
    assert.deepEqual(chunks, [
      'Every app is bilingual and accessible,',
      'protected by a strict policy and tested end to end.',
    ]);
  });

  it('never starts a caption with a dash', () => {
    for (const { text } of narration.scenes) {
      for (const chunk of splitCaptions(text)) assert.ok(!chunk.startsWith('—'), chunk);
    }
  });
});

describe('buildTimeline', () => {
  const seconds = narration.scenes.map(() => 5);
  const timeline = buildTimeline(narration.scenes, seconds);

  it('places scenes back to back, each with lead-in and tail', () => {
    let expected = 0;
    for (const scene of timeline.scenes) {
      assert.equal(scene.from, expected);
      assert.ok(scene.voiceFrom > scene.from);
      expected += scene.durationInFrames;
    }
    assert.equal(timeline.totalFrames, expected);
  });

  it('captions cover the spoken time without gaps or overlap', () => {
    for (const scene of timeline.scenes) {
      assert.equal(scene.captions[0]?.from, scene.voiceFrom);
      for (let i = 1; i < scene.captions.length; i++) {
        assert.equal(scene.captions[i]?.from, scene.captions[i - 1]?.to);
      }
      assert.equal(scene.captions.at(-1)?.to, scene.voiceFrom + Math.ceil(5 * FPS));
    }
  });

  it('exposes cues in spoken order inside the narration of the Tech Lab scene', () => {
    const techlab = timeline.scenes.find((scene) => scene.id === 'techlab');
    const { React: react, Angular: angular, Vue: vue } = techlab?.cues ?? {};
    assert.ok(
      react > techlab.voiceFrom && react < angular && angular < vue,
      JSON.stringify(techlab?.cues),
    );
    assert.ok(vue < techlab.from + techlab.durationInFrames);
  });

  it('rejects missing or invalid durations', () => {
    assert.throws(() => buildTimeline(narration.scenes, [1]));
    assert.throws(() => buildTimeline([{ id: 'x', text: 'Hi' }], [0]));
  });

  it('writes a valid SRT file', () => {
    const srt = toSrt(timeline);
    assert.match(srt, /^1\n00:00:00,\d{3} --> 00:00:0\d,\d{3}\nMeet Pandu Wicaksono/);
    assert.ok(srt.includes('portfolio link is in the comments'));
  });
});

describe('wavDuration', () => {
  it('reads the length from the header', () => {
    const byteRate = 48_000 * 2 * 2; // 48 kHz, 16-bit, stereo
    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + byteRate * 2, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(2, 22);
    header.writeUInt32LE(48_000, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(4, 32);
    header.writeUInt16LE(16, 34);
    header.write('data', 36);
    header.writeUInt32LE(byteRate * 2, 40);
    assert.equal(wavDuration(header), 2);
  });

  it('rejects other files', () => {
    assert.throws(() => wavDuration(Buffer.from('not a wav file at all')));
  });
});
