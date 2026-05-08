# Project Cards Refinement Design

## Goal

Refine the project page after the first recruiter-card pass by simplifying filtering, replacing synthetic thumbnails with real local project imagery, adding a personal-website project card, improving card order, and adding compact hard-skill logos where useful.

This builds on `docs/superpowers/specs/2026-05-08-project-cards-design.md`.

## Approved Direction

Keep the current project-card visual style and overall page layout. The change should improve content, filtering, project order, thumbnail authenticity, and hard-skill scanability without turning the page into a new design.

## Filter Design

Replace the current two-axis filter system with one filter row labelled `Focus`.

Categories:

- `All`
- `Electrical Engineering`
- `Software & Computer Science`
- `Personal & Creative`

Each project card receives one `focus` value. Filtering should use only this value; remove the separate context filter.

## Project Order

Order cards to put concrete project/build work before broader leadership and personal work:

1. HFSS Directional Coupler and Coax Adapter
2. Automated Stub-Tuner Optimisation
3. High-Voltage Magnetron Supply and Safety Enclosure
4. UNSW SumoBots Advanced Stream Winner
5. NAS and Self-Hosted Web Infrastructure
6. WordPress Websites and Marketing Systems
7. AtomCraft RF Heating System Leadership
8. Personal Website and Black-Hole Interface
9. Visual Arts Portfolio

Remove `FMCG` from the two FMCG project headings.

## Thumbnail Rules

Use real local imagery for card thumbnails.

Allowed for thumbnails:

- Liam's own CAD images
- Liam's own HFSS screenshots
- Liam's own LTspice screenshots
- Local project images from SumoBot and Art folders
- Screenshots generated from this personal website
- Verified screenshots of Liam's own websites only if the exact URLs are confirmed by local documents or by Liam

Do not use synthetic SVG card art as a final thumbnail. Do not use downloaded academic paper/reference figures as thumbnails.

If no real local image exists for a project, use the best available real screenshot from the repo or ask Liam for an asset rather than inventing one.

## Relevant Image Notes For Future Pages

Update `docs/project-case-study-drafts.md` so each project lists relevant image candidates for future detail pages. This list may include plots, report figures, simulations, and reference material, but it must clearly label where each image came from.

For thumbnails, prefer these known local candidates from the audit:

- Final report embedded HFSS/CAD images for RF cards, including the three-stub tuner and cross-coupler/coax transition images.
- `Power Measurement/Main/Scripting.docx` and `Power Measurement/Main/Simulations.docx` embedded HFSS/script images for the stub-tuner card.
- `Enclosure/Enclosure.docx` embedded enclosure CAD images and power/hardware images for the high-voltage supply card.
- Local SumoBot chassis image for the SumoBots card.
- Local artwork image for the Visual Arts card.
- Fresh Playwright screenshot of this portfolio for the personal-website card.

## Personal Website Card

Add a new project card:

**Title:** Personal Website and Black-Hole Interface

**Recruiter angle:** modern frontend engineering, interactive graphics, TypeScript/React/Next.js, performance-minded UI, and iterative product polish.

**Supported facts from repo:**

- Next.js 16 / React 19 / TypeScript app.
- Scroll-driven portfolio journey in `src/components/scroll-journey.tsx`.
- Project card system in `src/components/projects/projects-page.tsx` and `src/data/projects.ts`.
- Interactive black-hole shader/cursor systems in `public/black-hole-tsbxw3` and `public/black-hole-cursor-streamlets`.
- Vitest and Playwright-based verification files exist in the repo.

Do not claim production traffic, deployed usage, or external users unless Liam provides evidence.

## Hard-Skill Logos

Add compact logos/icons to hard-skill pills where they improve recognition.

Recommended placement:

- Inside hard-skill pills, before the skill text.
- Keep soft-skill pills text-only.
- Use simple, small, non-disruptive icons so the existing project-card layout remains intact.

Logo/icon sourcing:

- Prefer existing icon libraries already installed in the repo when they fit.
- Use local inline SVG/simple initials when a clean official logo asset is not available or would add licensing/copyright risk.
- Keep text labels alongside icons for accessibility and recruiter scanability.

Initial icon mappings:

- ANSYS HFSS: `HFSS` mark
- Python/IronPython: Python-style mark or `Py`
- Fusion 360: `F360` mark
- LTspice: `LT`
- Arduino: Arduino-style mark
- C/C++: `C++`
- WordPress: WordPress-style mark or `WP`
- PHP: `PHP`
- Next.js: `Next`
- React: React-style mark or `React`
- TypeScript: `TS`
- Synology NAS: `NAS`
- VNA/S-parameters/RF systems/WR340/safety docs: text-only unless a clean compact technical mark is obvious

## Implementation Scope

Likely files:

- `src/data/projects.ts`
- `src/data/projects.test.ts`
- `src/components/projects/projects-page.tsx`
- `src/app/globals.css` for small skill-logo styling only
- `docs/project-case-study-drafts.md`
- `public/projects/*` for extracted/cropped real project thumbnails

Temporary extraction/contact-sheet files must not be committed.

## Verification

After implementation:

- Run the project data tests.
- Run the full Vitest suite.
- Run production build.
- Confirm the website responds at `http://127.0.0.1:5176`.
- Use Playwright/browser inspection to confirm:
  - The single `Focus` filter works.
  - All nine cards render.
  - New card order is correct.
  - Thumbnails are real images, not synthetic SVG symbols.
  - Hard-skill logos do not break wrapping or mobile layout.

