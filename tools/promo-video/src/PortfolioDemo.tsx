/**
 * @file PortfolioDemo.tsx
 * The promo video: 7 scenes in the portfolio's own design (tokens, fonts,
 * cards, chips), narration per scene, burned-in captions, a quiet music bed
 * that ducks under the voice, and a thin progress bar.
 *
 * All facts come from @portfolio/content (the website's data) — nothing is
 * retyped here. No client screenshots: the client project is text only.
 */
import { certifications, getContent, showcase } from '@portfolio/content';
import { useEffect, useState, type ReactNode } from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type { SceneId, SceneTiming, VideoProps } from './types';

const content = getContent('en');
const capture = (name: string) => staticFile(`generated/captures/${name}.png`);

/* ---------------------------------------------------------------- helpers */

/** Every scene gets its length and the spoken-word cues (frames from the scene start). */
interface SceneProps {
  d: number;
  cues: Record<string, number>;
}

function relativeCues(scene: SceneTiming): Record<string, number> {
  return Object.fromEntries(
    Object.entries(scene.cues).map(([word, frame]) => [word, frame - scene.from]),
  );
}

/** Spring from 0 to 1 starting `delay` frames into the scene (no overshoot). */
function useAppear(delay = 0): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 200, mass: 0.6 } });
}

/** Fade + rise in. */
function Rise({
  delay = 0,
  children,
  className,
}: {
  delay?: number;
  children: ReactNode;
  className?: string;
}) {
  const p = useAppear(delay);
  return (
    <div className={className} style={{ opacity: p, transform: `translateY(${(1 - p) * 28}px)` }}>
      {children}
    </div>
  );
}

/** Fades the whole scene out during its last 9 frames (transitions ≤ 0.5 s). */
function SceneFrame({
  durationInFrames,
  children,
  dark = false,
}: {
  durationInFrames: number;
  children: ReactNode;
  dark?: boolean;
}) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 9, durationInFrames - 9, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill className={dark ? 'scene scene--dark' : 'scene'} style={{ opacity }}>
      {children}
    </AbsoluteFill>
  );
}

/** Counts a highlight value such as "45+" or "~95" up from 0. */
function CountUp({ value, delay }: { value: string; delay: number }) {
  const frame = useCurrentFrame();
  const match = /^(\D*?)(\d+)(\D*)$/.exec(value);
  if (!match) return <>{value}</>;
  const [, prefix = '', digits = '0', suffix = ''] = match;
  const progress = interpolate(frame - delay, [0, 36], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const eased = 1 - (1 - progress) ** 3;
  return (
    <>
      {prefix}
      {Math.round(Number(digits) * eased)}
      {suffix}
    </>
  );
}

/** The "Open to roles" pill with the same glowing dot as the website. */
function OpenPill() {
  const frame = useCurrentFrame();
  const pulse = (frame % 45) / 45; // 1.5 s per pulse
  const glow = Math.sin(pulse * Math.PI);
  return (
    <span className="pill">
      <span className="pill__dot">
        <span
          className="pill__glow"
          style={{ opacity: 0.85 * glow, transform: `scale(${0.6 + glow * 0.6})` }}
        />
      </span>
      {content.hero.eyebrow}
    </span>
  );
}

/** A screenshot in a soft card with a slow zoom (Ken Burns). */
function Shot({
  src,
  durationInFrames,
  className = '',
}: {
  src: string;
  durationInFrames: number;
  className?: string;
}) {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, durationInFrames], [1, 1.06], { extrapolateRight: 'clamp' });
  return (
    <div className={`shot ${className}`}>
      <Img src={src} className="shot__img" style={{ transform: `scale(${scale})` }} />
    </div>
  );
}

/* ----------------------------------------------------------------- scenes */

function Intro({ d }: SceneProps) {
  return (
    <SceneFrame durationInFrames={d}>
      <div className="center">
        <Rise delay={0}>
          <span className="brand-mark brand-mark--large">PW</span>
        </Rise>
        <Rise delay={6}>
          <OpenPill />
        </Rise>
        <Rise delay={10}>
          <h1 className="title">{content.hero.name}</h1>
        </Rise>
        <Rise delay={16}>
          <p className="role">{content.hero.role}</p>
        </Rise>
      </div>
    </SceneFrame>
  );
}

function Platform({ d }: SceneProps) {
  const modules = ['Customer storefront', 'B2B partner portal', 'Admin console', 'REST API'];
  const stats = content.highlights.slice(1, 3); // 45+ pages, ~95 test files
  return (
    <SceneFrame durationInFrames={d}>
      <div className="stack-layout">
        <Rise delay={0}>
          <p className="kicker">Sole developer · {content.experience.items[0]?.period}</p>
          <h2 className="heading">Production ordering platform</h2>
        </Rise>
        <div className="grid-2">
          {modules.map((name, i) => (
            <Rise key={name} delay={12 + i * 8} className="card module">
              <span className="module__index">0{i + 1}</span>
              {name}
            </Rise>
          ))}
        </div>
        <div className="grid-2">
          {stats.map((stat, i) => (
            <Rise key={stat.label} delay={50 + i * 10} className="card stat">
              <span className="stat__value">
                <CountUp value={stat.value} delay={50 + i * 10} />
              </span>
              <span className="stat__label">{stat.label}</span>
            </Rise>
          ))}
        </div>
      </div>
    </SceneFrame>
  );
}

function Stack({ d }: SceneProps) {
  const wanted = ['React', 'TypeScript', 'NestJS', 'Prisma', 'PostgreSQL'];
  const chips = content.featuredProject.stack.filter((tech) => wanted.includes(tech));
  const features = ['Secure payments', 'Configurable pricing engine', 'Real-time order tracking'];
  return (
    <SceneFrame durationInFrames={d}>
      <div className="stack-layout">
        <Rise delay={0}>
          <p className="kicker">{content.featuredProject.name}</p>
          <h2 className="heading">The stack</h2>
        </Rise>
        <div className="chips">
          {chips.map((chip, i) => (
            <Rise key={chip} delay={8 + i * 6}>
              <span className="chip">{chip}</span>
            </Rise>
          ))}
        </div>
        <div className="card checklist">
          {features.map((feature, i) => (
            <Rise key={feature} delay={50 + i * 12} className="check">
              <span className="check__mark">✓</span>
              {feature}
            </Rise>
          ))}
        </div>
        <Rise delay={90}>
          <p className="note">
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            {content.featuredProject.confidentialityNote}
          </p>
        </Rise>
      </div>
    </SceneFrame>
  );
}

function TechLab({ d, cues }: SceneProps) {
  const frame = useCurrentFrame();
  const demos = ['react-storefront', 'angular-dashboard', 'vue-invoice']
    .map((id) => showcase.find((app) => app.id === id))
    .filter((app) => app !== undefined);
  const files: Record<string, string> = {
    'react-storefront': 'react',
    'angular-dashboard': 'angular',
    'vue-invoice': 'vue',
  };
  // Each demo appears just before the narration names it ("React", "Angular", "Vue").
  const lead = 4;
  const starts = [
    0,
    Math.max(12, (cues['Angular'] ?? Math.floor(d / 3)) - lead),
    Math.max(24, (cues['Vue'] ?? Math.floor((2 * d) / 3)) - lead),
  ];
  return (
    <SceneFrame durationInFrames={d}>
      <div className="stack-layout">
        <Rise delay={0}>
          <p className="kicker">One portfolio · one link</p>
          <h2 className="heading">Three live demos</h2>
        </Rise>
        <div className="demo-stage">
          {demos.map((app, i) => {
            const start = starts[i] ?? 0;
            const end = starts[i + 1] ?? d + 6;
            const last = i === demos.length - 1;
            const opacity = interpolate(
              frame,
              [start - 6, start + 6, end - 6, end + 6],
              [i === 0 ? 1 : 0, 1, 1, last ? 1 : 0],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
            );
            return (
              <div key={app.id} className="demo" style={{ opacity }}>
                <Sequence from={start} durationInFrames={end - start + 12} layout="none">
                  <Shot src={capture(files[app.id] ?? 'react')} durationInFrames={end - start} />
                </Sequence>
                <div className="demo__label">
                  <span className={`badge badge--${app.brand}`}>{app.framework}</span>
                  <span className="demo__title">{app.title.en}</span>
                  <span className="demo__path">/{app.path}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SceneFrame>
  );
}

function Quality({ d }: SceneProps) {
  const badges = [
    'English · Bahasa Indonesia',
    'WCAG accessibility',
    'Strict Content Security Policy',
    'End-to-end tested',
  ];
  return (
    <SceneFrame durationInFrames={d} dark>
      <div className="quality">
        <Rise delay={0} className="phone">
          <Shot src={capture('dark-mobile')} durationInFrames={d} className="shot--phone" />
        </Rise>
        <div className="quality__list">
          <Rise delay={4}>
            <h2 className="heading heading--small">Built to a high bar</h2>
          </Rise>
          {badges.map((badge, i) => (
            <Rise key={badge} delay={14 + i * 12} className="card quality__item">
              <span className="quality__dot" />
              {badge}
            </Rise>
          ))}
        </div>
      </div>
    </SceneFrame>
  );
}

function Certified({ d }: SceneProps) {
  const issuers = ['Google', 'IBM', 'Microsoft', 'Amazon'];
  const count = (issuer: string) =>
    certifications.filter((cert) => cert.issuer.includes(issuer)).length;
  return (
    <SceneFrame durationInFrames={d}>
      <div className="stack-layout">
        <Rise delay={0}>
          <p className="kicker">{content.highlights[3]?.value} professional certificates</p>
          <h2 className="heading">Certified by</h2>
        </Rise>
        <div className="grid-2">
          {issuers.map((issuer, i) => (
            <Rise key={issuer} delay={10 + i * 8} className="card issuer">
              <span className="issuer__badge">{issuer[0]}</span>
              <span className="issuer__name">{issuer}</span>
              <span className="issuer__count">
                {count(issuer)} certificate{count(issuer) === 1 ? '' : 's'}
              </span>
            </Rise>
          ))}
        </div>
        <Rise delay={60}>
          <OpenPill />
        </Rise>
      </div>
    </SceneFrame>
  );
}

function Outro({ d }: SceneProps) {
  const linkedin = content.contact.links.find((link) => link.label === 'LinkedIn')?.href ?? '';
  return (
    <SceneFrame durationInFrames={d}>
      <div className="center">
        <Rise delay={0}>
          <h2 className="title title--connect">Let&apos;s connect</h2>
        </Rise>
        <Rise delay={8} className="card link-card">
          <span className="link-card__label">Portfolio</span>
          <span className="link-card__url">pandu2021.github.io/Portofolio-website</span>
          <span className="link-card__label">LinkedIn</span>
          <span className="link-card__url">
            {linkedin.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, '')}
          </span>
        </Rise>
        <Rise delay={16}>
          <span className="brand-mark">PW</span>
        </Rise>
      </div>
    </SceneFrame>
  );
}

const SCENES: Record<SceneId, (props: SceneProps) => ReactNode> = {
  intro: Intro,
  platform: Platform,
  stack: Stack,
  techlab: TechLab,
  quality: Quality,
  certified: Certified,
  outro: Outro,
};

/* ------------------------------------------------------- shared overlays */

function Background() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const drift = interpolate(frame, [0, durationInFrames], [0, 1]);
  return (
    <AbsoluteFill className="backdrop">
      <div
        className="backdrop__glow"
        style={{
          transform: `translate(${drift * -40}px, ${drift * 30}px) scale(${1 + drift * 0.08})`,
        }}
      />
    </AbsoluteFill>
  );
}

function TopBar() {
  return (
    <div className="topbar">
      <span className="brand-mark brand-mark--small">PW</span>
      <span className="topbar__name">{content.hero.name}</span>
    </div>
  );
}

function Captions({ scenes }: { scenes: SceneTiming[] }) {
  const frame = useCurrentFrame();
  const caption = scenes
    .flatMap((scene) => scene.captions)
    .find((c) => frame >= c.from && frame < c.to);
  if (!caption) return null;
  const opacity = interpolate(frame, [caption.from, caption.from + 4], [0, 1], {
    extrapolateRight: 'clamp',
  });
  return (
    <div className="captions">
      <p className="captions__text" style={{ opacity }}>
        {/* Non-breaking hyphens: "front-end" never splits across lines. */}
        {caption.text.replace(/-/g, '\u2011')}
      </p>
    </div>
  );
}

function Progress() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return <div className="progress" style={{ transform: `scaleX(${frame / durationInFrames})` }} />;
}

/** Music volume: quieter while someone speaks, smooth 10-frame transitions. */
function musicVolume(frame: number, scenes: SceneTiming[]): number {
  const distance = Math.min(
    ...scenes.map((scene) => {
      const end = scene.voiceFrom + scene.voiceFrames;
      if (frame >= scene.voiceFrom && frame <= end) return 0;
      return frame < scene.voiceFrom ? scene.voiceFrom - frame : frame - end;
    }),
  );
  return interpolate(distance, [0, 10], [0.22, 0.5], { extrapolateRight: 'clamp' });
}

/* ------------------------------------------------------------ composition */

export function PortfolioDemo({ scenes, music }: VideoProps) {
  // Hold the first frame until the self-hosted fonts are ready (exact website typography).
  const [handle] = useState(() => delayRender('Loading fonts'));
  useEffect(() => {
    Promise.all([
      document.fonts.load('800 64px "Plus Jakarta Sans Variable"'),
      document.fonts.load('600 32px "JetBrains Mono Variable"'),
    ])
      .then(() => document.fonts.ready)
      .finally(() => continueRender(handle));
  }, [handle]);

  return (
    <AbsoluteFill className="video">
      <Background />
      {scenes.map((scene) => {
        const Scene = SCENES[scene.id];
        return (
          <Sequence key={scene.id} from={scene.from} durationInFrames={scene.durationInFrames}>
            <Scene d={scene.durationInFrames} cues={relativeCues(scene)} />
          </Sequence>
        );
      })}
      {scenes.map((scene) => (
        <Sequence
          key={`voice-${scene.id}`}
          from={scene.voiceFrom}
          durationInFrames={scene.voiceFrames + 6}
          layout="none"
        >
          <Audio src={staticFile(scene.voice)} />
        </Sequence>
      ))}
      {music && <Audio src={staticFile(music)} volume={(frame) => musicVolume(frame, scenes)} />}
      <TopBar />
      <Captions scenes={scenes} />
      <Progress />
    </AbsoluteFill>
  );
}
