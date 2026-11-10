# Promo video (LinkedIn)

A ±57-second, 1080×1350 (4:5) video of the portfolio, **rendered from code** with
[Remotion](https://www.remotion.dev/) in the portfolio's own design (tokens, fonts, cards). Local tooling only:
it is not part of the website build and nothing here is published.

```bash
pnpm --filter @portfolio/promo-video video     # capture → voice → music → render (all steps)

pnpm --filter @portfolio/promo-video capture   # screenshots of the live site (SITE_URL=… to override)
pnpm --filter @portfolio/promo-video voice     # offline Windows narration (one WAV per sentence)
pnpm --filter @portfolio/promo-video music     # code-generated background pad
pnpm --filter @portfolio/promo-video render    # MP4 + SRT + cover + LinkedIn post text
```

Output in `out/` (git-ignored): `portfolio-demo-4x5.mp4`, `portfolio-demo.srt`, `cover.png`,
`linkedin-post.md`. Generated inputs live in `public/generated/` (also git-ignored).

## How it works

| Step      | What                                    | Notes                                                                                                                                                                                                          |
| --------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Narration | `src/narration.json`                    | Single source for voice, captions and SRT. Facts come from the website content.                                                                                                                                |
| Capture   | `scripts/capture.mjs`                   | Installed Chrome/Edge (puppeteer-core), device scale 2, reduced motion. Public pages and fictional demo data only — the client project is never shown.                                                         |
| Voice     | `scripts/voice.mjs` → `scripts/tts.ps1` | Windows OneCore voice "Microsoft Mark" (fallback "David"), fully offline. Each scene lasts as long as its sentence.                                                                                            |
| Music     | `scripts/music.mjs`                     | Four soft chords synthesised in code (no samples, no copyright); ducked under the voice.                                                                                                                       |
| Timeline  | `scripts/lib/timeline.mjs`              | Scene frames, balanced 2-line captions, word cues (the demo screenshots change when "React / Angular / Vue" is spoken), SRT. Unit-tested.                                                                      |
| Render    | `scripts/render.mjs`                    | Remotion with the **installed** browser (`chromeMode: chrome-for-testing`, no browser download); Remotion's bundled ffmpeg normalises loudness to −14 LUFS, writes AAC 48 kHz and strips descriptive metadata. |

## Rules

- No personal data: no e-mail, phone, address, student ID, client or payment-provider names. Links shown are the
  public portfolio and LinkedIn profile only.
- Captions are burned in (46 px, white on ink, ≥ 4.5:1) and also exported as `.srt` for LinkedIn.
- Gentle motion only: fades and slow zooms, transitions ≤ 0.5 s, nothing flashes.
- License: Remotion is free for individuals (see `node_modules/remotion/LICENSE.md`).
