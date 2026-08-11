# Project KAI Website Scorecard

**Important**: no analytics, traffic, Lighthouse run, or contrast-checker tool was used to produce this scorecard — the site is pre-launch with no real visitors yet, and this was a read-only source-code audit only. Every rating below is my own subjective judgment from reading the code, not a measured or benchmarked score. Treat this as a structured opinion to guide prioritization, not a certified audit result. Ratings use a 1–5 scale (5 = strong, 1 = missing/broken).

| Dimension | Rating (1–5, subjective) | Basis |
|---|---|---|
| Brand/aesthetic alignment with stated direction | 2 | Current HUD/glitch/scanline/particle treatment is the opposite of the calm blueprint direction described in the brief (Audit §1). Everything else about the brand (honest copy, real founder, no fake claims) is strong — this is purely a visual-language gap. |
| Navigation (desktop) | 4 | Clear seven-item nav, sticky header, correct `aria-label`, clean scroll-state styling. |
| Navigation (mobile/tablet) | 1 | Nav fully disappears below 980px with no replacement — a real defect, not a style preference (Audit §3, §8). |
| Homepage structure & flow | 3 | Content is honest and well-written, but eleven back-to-back sections with three near-identical card grids (Agents/Research/Features) makes the page repetitive by the third grid. |
| Copywriting honesty | 5 | No fabricated capabilities, no fake team, no fake testimonials, no invented achievements anywhere in the copy read. This is the site's clearest strength. |
| Typography | 4 | Consistent scale and hierarchy via shared classes; the only open question is whether the `Inter` font actually loads or silently falls back to system fonts (Audit §9) — worth confirming, not a defect as observed. |
| Color palette (internal consistency) | 4 | Well-defined CSS variable system, used consistently in most components; a few components hardcode hex instead of the variables (Audit §5, §10). |
| Color palette (fit with brand goal) | 2 | Internally consistent, but saturated cyan-on-near-black with heavy glow effects reads closer to gaming/crypto AI sites than the intended calmer register. |
| Spacing & layout rhythm | 4 | `--section-padding` and `--max-width` tokens are used consistently across every section and page. |
| Responsive design (layout/breakpoints) | 4 | Genuinely thorough breakpoint coverage (nine distinct breakpoints), grids degrade sensibly. |
| Responsive design (navigation) | 1 | See "Navigation (mobile/tablet)" above — this pulls the overall responsive score down despite good layout work elsewhere. |
| Accessibility (motion) | 5 | `prefers-reduced-motion` is handled comprehensively and correctly across every animated effect on the site — a real, uncommon strength. |
| Accessibility (structure/semantics) | 3 | Good landmark usage (`header`/`nav`/`main`/`footer`/`article`), but no skip-link and no custom `:focus-visible` styling defined. |
| Accessibility (contrast) | Not rated | No contrast-checking tool was run; flagged as a to-verify item rather than scored (Audit §8). |
| SEO — titles/descriptions | 5 | Every page has a unique, accurate, well-written title and meta description. |
| SEO — technical (sitemap/robots/structured data) | 2 | No `sitemap.xml`, no `robots.txt`, no JSON-LD — all real, fixable gaps (Audit §12). |
| SEO — social sharing (`og:image`/`twitter:card`) | 1 | Entirely absent — any shared link currently shows no preview image (Audit §12). |
| Images | Not rated | No real content images exist yet on the live site, so there's nothing to score for quality/optimization — only the unused `Welcome.astro` scaffold has `<img>` tags (Audit §13). |
| Performance (structural, unmeasured) | 3 | No image weight problem yet, but five simultaneous infinite CSS/JS animations run on every page load, and no build-time optimization (sitemap/compression/image pipeline) is configured (Audit §11). Unmeasured — no Lighthouse run. |
| Buttons & interactive states | 4 | Consistent shared button classes across the whole site; no `:focus-visible` state is the main gap. |
| Forms | Not rated | No forms exist anywhere on the site — intentional and honestly disclosed on the Contact/Privacy pages, not a defect to score. |
| Links (internal integrity) | 4 | Every internal link found in the source resolves to a real route; this was a manual source read, not an automated crawl, so a real link-checker pass is still recommended before launch. |
| Dead/duplicate code | 3 | One clearly dead component (`Welcome.astro` + two orphaned assets) and duplicated Agents/About copy between homepage sections and standalone pages (Audit §15) — both easy, low-risk cleanups. |
| Trust signals | 4 | Real named founder, honest Privacy/Terms pages, no fabricated social proof — strong for a pre-launch site; the only reason this isn't a 5 is that there's necessarily very little third-party trust signal yet (expected at this stage, not a flaw). |
| Conversion paths | 2 | Every CTA site-wide points to only `/blog` or `/contact`, Contact has no real actionable method visible, and there's no email/newsletter capture despite Blog explicitly promising more content (Audit §17). |

## Overall read

The site's content, structure, and engineering fundamentals (routing, componentization, responsive breakpoints, reduced-motion handling, honest copywriting) are solid — meaningfully better than the visual-effects layer suggests at first glance. The two things most worth fixing before treating this as launch-ready are the missing mobile navigation (a functional defect) and the HUD/cyberpunk visual treatment (a brand-direction mismatch) — both are addressed as Priority A/B in `PROJECT_KAI_WEBSITE_ROADMAP.md`. Nothing found in this audit involved fabricated claims or dishonest copy; the gaps are technical/visual, not integrity issues.

No code was changed to produce this scorecard. Waiting for approval before any implementation begins.
