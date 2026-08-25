# Project KAI — Founder Vision Intro Experience (Phase 1)

Click-to-play video + humanoid handoff, added to the public homepage.
Repository: `kai-os-website` only. No `KAI_OS` backend files were touched.

## What this is

A premium, honest, click-to-play video experience on the homepage hero, plus a
support section and community CTA row — all built on real, audited components.
Nothing fabricated: no video was generated, no payment processor was added, and
no fake chat feature was created.

## Audit findings (before building anything)

- **Homepage** (`src/pages/index.astro`) already composed 16 sections via
  existing components. No existing "watch a video" or vision-intro flow existed.
- **Hero** (`src/components/Hero.astro`) had two low-emphasis nav-style links
  ("Explore KAI", "View Documentation"). No primary CTA button pattern existed
  yet for hero actions.
- **Design tokens** (`src/styles/global.css`): the real accent is
  `--primary: #38bdf8` (cyan/sky-blue) with `--violet: #818cf8`, not amber as
  initially assumed — the actual existing tokens were used instead of inventing
  a mismatched palette.
- **Chat / "Talk to KAI"**: the only AI-labeled thing on the public website is
  `KaiAssistant.astro`, an honest, explicitly-labeled static keyword-search
  widget with **no LLM backend**, used only on `/media`. There is no `/kai`
  chat route, no browser STT/TTS, no avatar/3D component anywhere in this repo.
  The real conversational KAI backend (`kai_chat.py`, voice runtime, PIN/session
  security) lives only on the separate local `KAI_OS` backend
  (`127.0.0.1:8787`), which is **not reachable from the public website**. Per
  the master prompt's own fallback instruction, "Talk to KAI" routes to
  `/command-center` — the closest existing real KAI-system page — rather than
  faking a working conversation. This gap is documented here, not hidden.
- **Payment processor**: confirmed via repo-wide grep (`src/`, `package.json`)
  — zero hits for Stripe/PayPal/checkout/payment SDKs. None was added.
- **Video/media components**: none existed. Native `<video controls>` was used
  per the explicit "prefer native HTML5 video over a heavy player dependency"
  instruction — play/pause, mute/volume, fullscreen, and per-track captions
  toggle all come free, fully accessible, with zero added dependency.

## What was built

### 1. Hero CTAs (`src/components/Hero.astro`)
- Primary: **"▶ Watch the KAI Vision"** button — opens the modal via
  `data-open-vision-modal`, never navigates, never autoplays anything on load.
- Secondary: **"Talk to KAI"** — links to `/command-center`.
- The original two links ("Explore KAI", "View Documentation") were kept as a
  smaller tertiary row underneath, so no existing navigation was removed.

### 2. Click-to-play video modal (`src/components/VisionVideoModal.astro`, new)
- **No `autoplay` attribute exists anywhere in the markup.** Playback is only
  ever started inside the real click handler for the trigger button — never on
  page load, never via a timer, never via IntersectionObserver.
- `preload="metadata"` (not `"auto"`) — homepage stays fast for visitors who
  never click; only a poster/metadata fetch happens, and only after the page
  has otherwise loaded.
- Native `<video controls playsinline>` provides Play/Pause, Mute/Unmute,
  Volume, and Fullscreen (where the platform supports it) with zero JS needed.
- `<track kind="captions" src="/media/vision/kai-vision-captions.vtt">` wires
  up caption/subtitle support; a minimal valid placeholder `.vtt` file is
  committed so the `<track>` element never 404s even before a real video ships.
- Custom script (small, dependency-free) adds only what native video lacks:
  a real **Close** button, **Escape**-to-close, a focus trap while open,
  focus restoration to the trigger element on close, and the post-video
  handoff panel.
- **Never auto-reopens, never auto-replays.** Closing just hides the modal —
  nothing is written to `localStorage`/cookies/session state to "remember" to
  show it again on a later visit or page load. It only ever opens from an
  explicit click on a `[data-open-vision-modal]` trigger.
- On the video's native `ended` event, a post-video panel appears with the
  required copy — "That is the vision. Now meet the intelligence we're
  building." — and a **"✦ Talk to KAI"** button to `/command-center`.
- **Honest failure state**: if the video source is missing/unavailable (true
  today, since no real video file exists yet), the player shows a "Coming
  Soon" message instead of a broken/silent player. A proactive
  `checkVideoHealth()` check (state-based, not just event-based) catches the
  case where `preload="metadata"`'s eager fetch resolves and fails *before*
  the page's own script attaches its `error` listener — found and fixed
  during verification (see Testing below).

### 3. Support section (`src/components/SupportKai.astro`, new)
- "Build KAI with us" copy, five tiers exactly as specified: $5 one-time
  ("Support KAI"), $10/mo ("KAI Supporter", marked Recommended/default),
  $25/mo ("KAI Builder"), $50/mo ("KAI Pioneer"), $100+ ("Project Sponsor").
- Every tier button routes to the existing, real `/contact` page — **not** a
  checkout flow, since no payment processor exists or was added.
- Required disclosure rendered verbatim: *"Support contributions do not
  represent equity, investment ownership, employment, or guaranteed financial
  returns. Contributing does not automatically make someone a developer,
  employee, partner, operator, or shareholder of Project KAI."*

### 4. Community CTAs (`src/components/Community.astro`, modified)
- Added a CTA row: **Contribute an Idea** (→ `/media#feature-request`, the
  real, already-live idea-submission form — `id="feature-request"` was added
  to `FeatureRequest.astro`'s section so the anchor resolves), **Join the KAI
  Community** (→ `#community`), **Become a Supporter** (→ `#support`).
- Added the required distinction note that financial support does not
  automatically make someone a developer/employee/partner/operator/shareholder.

## Dropping in the real video

See `public/media/vision/README.md`. Expected files, exact names:

| File | Purpose |
|---|---|
| `public/media/vision/kai-vision.mp4` | The video itself (H.264/AAC MP4 recommended) |
| `public/media/vision/kai-vision-poster.jpg` | Poster frame shown before play |
| `public/media/vision/kai-vision-captions.vtt` | WebVTT captions (placeholder already committed) |

No code or page-structure changes are needed to go live — drop the three files
in at those exact paths and the "Coming Soon" state is automatically replaced
by a working player on the next deploy.

## Security

- No secrets, API keys, Cloudflare tokens, broker credentials, YouTube tokens,
  Supabase service-role keys, local session IDs, PINs, or filesystem paths are
  referenced anywhere in this phase's code.
- No privileged KAI local-session architecture was touched — this phase only
  added public, static, read-only presentation components.
- No payment processor was integrated.
- No `KAI_OS` backend file was read or modified.

## Testing performed

- `npm run build` — clean, 31/31 pages, no errors (final run after all fixes).
- Click-to-play verified: video never plays until the trigger is clicked;
  no `autoplay` attribute present anywhere in source.
- **Bug found and fixed during testing**: `preload="metadata"`'s eager source
  fetch could fail (404, since no real video exists yet) and fire the video's
  `error` event *before* the page script's listener attached, so the failure
  was silently swallowed and no "Coming Soon" message appeared. Fixed by
  adding `checkVideoHealth()`, which re-checks `video.error` /
  `video.networkState === NETWORK_NO_SOURCE` proactively both as the `error`
  handler and at the top of `openModal()`. Verified via direct browser JS
  inspection: `unavailableHidden` correctly flips to `false` and the honest
  message renders.
- **Second bug found and fixed**: the same early-return path (video already
  failed) was skipping the Escape-key listener and focus-trap attachment
  entirely, since they were wired after the `checkVideoHealth()` early return.
  This meant Escape did nothing to close the modal in the current
  (video-not-yet-shipped) state of the site. Fixed by moving focus/Escape
  wiring before the health check, since the modal chrome (Close button,
  backdrop, Escape) must always work regardless of video state. Verified:
  Escape now closes the modal and restores `body` scroll in all cases.
- Verified: Close button click closes the modal.
- Verified: backdrop click closes the modal.
- Verified: synthetic `ended` event correctly reveals the post-video "Talk to
  KAI" panel with the exact required copy and a working `/command-center` link.
  (The real `ended` event cannot be exercised end-to-end without a real video
  file — this specific path is verified via a dispatched `ended` event, not a
  full video playthrough, and should be re-checked once the real video ships.)
- Verified: header and footer navigation are unaffected by these changes.
- Verified: mobile viewport (375×812) — no horizontal overflow, modal fills
  viewport without being oversized, Close button remains visible and reachable.
- Verified: `prefers-reduced-motion: reduce` correctly disables the modal
  backdrop's blur filter in the compiled CSS output.
- Verified: no secrets, keys, tokens, broker credentials, PINs, or local
  filesystem paths appear anywhere in the built `dist/` output.

## Known gaps (honestly documented, not hidden)

- **"Talk to KAI" is a bridge to `/command-center`, not a live conversational
  chat.** No public chat/voice bridge to the real KAI backend exists yet — this
  was true before this phase and remains true after it. Building that bridge
  was explicitly out of scope for this phase.
- **The founder vision video itself does not exist yet.** This phase only
  built the architecture and the honest "Coming Soon" fallback.
- The post-video handoff panel's real trigger path (`ended` firing after an
  actual full-length video finishes) is unverified with a real video file,
  since none exists yet.
