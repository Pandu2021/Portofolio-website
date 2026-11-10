/**
 * @file Root.tsx
 * Registers the 1080×1350 (4:5) composition. Its length comes from the input
 * props (the timeline measured from the voice files), see scripts/render.mjs.
 */
import { Composition } from 'remotion';
import '@portfolio/design-tokens/tokens.css';
import '@portfolio/design-tokens/fonts.css';
import '@portfolio/design-tokens/base.css';
import './video.css';
import { PortfolioDemo } from './PortfolioDemo';
import type { VideoProps } from './types';

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1350;

/** Placeholder props for type checking only; render.mjs always passes the real timeline. */
const defaultProps: VideoProps = { totalFrames: FPS * 5, scenes: [], music: null };

export function RemotionRoot() {
  return (
    <Composition
      id="PortfolioDemo"
      component={PortfolioDemo}
      width={WIDTH}
      height={HEIGHT}
      fps={FPS}
      durationInFrames={defaultProps.totalFrames}
      defaultProps={defaultProps}
      calculateMetadata={({ props }) => ({ durationInFrames: Math.max(1, props.totalFrames) })}
    />
  );
}
