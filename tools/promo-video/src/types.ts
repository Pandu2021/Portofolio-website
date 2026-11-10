/**
 * @file types.ts
 * Shape of the timeline that scripts/render.mjs computes from the measured
 * voice durations and passes to the composition as input props.
 */

export interface Caption {
  text: string;
  /** Absolute frames (from the start of the video). */
  from: number;
  to: number;
}

export type SceneId =
  'intro' | 'platform' | 'stack' | 'techlab' | 'quality' | 'certified' | 'outro';

export interface SceneTiming {
  id: SceneId;
  text: string;
  from: number;
  durationInFrames: number;
  /** First frame of the narration of this scene. */
  voiceFrom: number;
  voiceFrames: number;
  /** Path inside public/, e.g. generated/voice/intro.wav */
  voice: string;
  captions: Caption[];
  /** Absolute frame at which a key word is spoken, e.g. { Angular: 812 }. */
  cues: Record<string, number>;
}

export interface VideoProps extends Record<string, unknown> {
  totalFrames: number;
  scenes: SceneTiming[];
  music: string | null;
}
