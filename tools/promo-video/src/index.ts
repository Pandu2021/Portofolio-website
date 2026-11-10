/**
 * @file index.ts
 * Remotion entry point (bundled by scripts/render.mjs).
 */
import { registerRoot } from 'remotion';
import { RemotionRoot } from './Root';

registerRoot(RemotionRoot);
