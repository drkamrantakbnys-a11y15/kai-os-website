# Project KAI Website Roadmap

Derived directly from `PROJECT_KAI_WEBSITE_AUDIT.md`. Nothing in this roadmap has been implemented — it is a prioritized plan awaiting approval. Every item respects the standing engineering rule: extend the existing Astro/CSS structure, don't redesign or rewrite what already works structurally (routing, component boundaries, the CSS-variable system, the reduced-motion handling). No fabricated stats, no capability overclaiming, no invented achievements are proposed anywhere below.

Grouped into four priority tiers. Within each tier, items are ordered roughly by effort (cheapest first).

---

## Priority A — Fixes usability or trust, should happen before any public launch push

1. **Add a mobile navigation menu.** `.nav-links` currently just vanishes below 980px with nothing replacing it. Add a simple toggle (hamburger button + slide-down/drawer panel) reusing the existing `nav-links` markup and link list — no new navigation taxonomy needed, just a way to reveal the existing one on narrow screens.
2. **Add `og:image` and `twitter:card` meta tags** to `Layout.astro`, with a real, static share image (even a simple branded card, not a screenshot of a nonexistent product). Without this, every link shared on social/Slack/iMessage shows no preview.
3. **Confirm or soften the homepage stat numbers** ("11+ AI Agents", "100+ Workflows", "25+ Research Areas") against what's actually true today before this becomes a public-facing launch page — per the standing "never fabricate/overclaim" rule. If they're accurate, keep them; if they're aspirational, either substantiate them or reword as roadmap language rather than present-tense counts.
4. **Give Contact a real path.** Add at least one concrete, real contact method (email address, or a single verified social/profile link) so "use your preferred direct contact channel" has something to point to. No form, no CRM, no automation needed — just a real, honest link.

## Priority B — Brings the visual language in line with the stated calm/blueprint direction

This is the largest single body of work in the roadmap, and it's a design-direction shift, not a bug fix — worth doing deliberately rather than piecemeal. Suggested approach: strip first, restyle second.

5. **Remove or gate the HUD/gaming effects** identified in Audit §1: the animated grid-drift background, the scanline sweep, the glitch-flicker text effect, the HUD corner brackets on card hover, and the cursor-glow trail. These can be deleted from `global.css`/`interactions.js` outright, or — if some ambient motion is still wanted — replaced with something much subtler (e.g. a single soft static gradient, no scanlines, no glitch, no crosshair brackets).
6. **Reduce simultaneous background animation load.** Even after (5), re-evaluate whether the remaining ambient effects (particles, brand-mark pulse, hero glow drift) all need to run at once, indefinitely, on every page. Fewer, calmer, or scroll-triggered-once versions would match "calm confidence" better than always-on loops.
7. **Move to a more restrained accent palette.** Keep the existing `--primary`/`--violet`/background variables as the base (no redesign of the token system itself — see Audit §10), but reduce how often glow-shadows and saturated cyan are layered on top of each other (buttons, borders, card hovers, brand mark all currently glow simultaneously). Fewer, more intentional accent moments read as more "engineering precision," closer to the Stripe/Linear/Notion register named in the brief.
8. **Unify the card-hover treatment.** Once HUD brackets are gone, standardize on the existing `.card:hover` lift-and-border-brighten pattern already defined in `global.css`, and remove the separate hover rules duplicated per-component (Audit §5) in favor of that one shared rule.

## Priority C — Structural cleanup and SEO completeness

9. **Delete `src/components/Welcome.astro`** and its two orphaned assets (`astro.svg`, `background.svg`) if nothing else references them — confirmed unused in this audit (Audit §15).
10. **Add `sitemap.xml` and `robots.txt`** to `public/` (or via `@astrojs/sitemap` in `astro.config.mjs`), so the ten existing routes are discoverable.
11. **Add JSON-LD structured data** for `Organization`/`Person` (Kamran Tak as founder) on the homepage and About page — low-effort, real SEO value, nothing fabricated since it's just marking up facts already on the page.
12. **Consolidate the CSS custom-property usage.** `Features.astro`, `Roadmap.astro`, and `Research.astro` hardcode raw hex colors instead of the `var(--primary)`/`var(--text-soft)` tokens already used elsewhere (Audit §5) — switch them to the existing variables so a future palette adjustment (e.g. Priority B's restrained-accent work) only touches `global.css`.
13. **Deduplicate Agents/About copy** between the homepage sections and the standalone `/agents`/`/about` pages — pull the per-agent description text into one shared source (an Astro content collection or a simple shared data file) so it's edited once, not twice.

## Priority D — Nice-to-have, no urgency

14. **Add a low-effort email/newsletter signup**, tied to the real Blog cadence already promised on `/blog` — the one conversion mechanism currently missing site-wide (Audit §17). Only worth doing once there's somewhere for signups to actually go (even a simple mailto-based or manually-managed list is fine at this stage — no need to stand up new infrastructure prematurely).
15. **Reorder the homepage** so `About` precedes `Stats` (Audit §17), giving the numbers context before they're presented.
16. **Add `:focus-visible` styling** for keyboard navigation, once real interactive elements (nav, buttons, future form fields) are audited for contrast against the dark background (Audit §8).
17. **Set up an optimized-image pipeline** (`astro:assets`) ahead of adding the first real photography (founder photo, OG image, blog art) rather than retrofitting it after images already exist unoptimized (Audit §11, §13).

---

## What this roadmap deliberately does not propose

- No new pages, no new navigation items, no new "sections" beyond what already exists — the site's actual information architecture is sound and doesn't need expanding right now.
- No CMS, no backend, no analytics, no forms beyond the single honest contact link in Priority A — matching the site's current, accurately-described capability level.
- No wholesale rebuild of `global.css`'s variable system, grid system, or component structure — Priority B changes the *values* and *which effects run*, not the underlying architecture.

Waiting for approval before implementing any of the above.
