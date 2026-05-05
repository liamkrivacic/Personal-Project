# Post-Dive Section Redesign — Handover

You are picking up a portfolio site mid-redesign. The hero (black-hole dive) is finished and the user loves it. The post-dive project section has been stripped — the page currently just shows the hero and ends in black. Your job is to design and build a fresh post-dive section from scratch.

## User's exact requirements (verbatim)

> I like my hero page a lot but i dont like the project pages a lot and i want to redo them from scratch. some things i dont like is how i enter the blackhole and you can see the scroll wheel go down to the project. i want it to be black and then the text just appears onto the screen or something like that (no scroll icon on the right side of page). i also want the project pages themselves to be fully redone in terms of text font etc. The main requirement i have is that its black background to match the blackhole, and everything after that like project information and text is up to you. i would like each project to be displayed so a recruiter can sort of go through them in order. i want the projects to have pictures. and i want it to look very clean and professional, it does not have to exactly match the blackhole theme, but at the very least have the black background and i think it having no real sense of scrolling would be good, so projects sort of appear.

## Current repo state

- `src/app/page.tsx` renders ONLY `<OrbitalHeroTsbxw3 />`. Post-dive area is gone.
- `src/components/projects/project-journey.tsx` still exists but is unmounted. Treat it as a **data dump** — the 4 projects' content is preserved in the `projectCaseStudies` array. You will likely throw the component code away but keep the data.
- `src/app/globals.css` still contains old post-dive styles (`.post-dive-projects`, `.project-sticky-header`, `.project-panel-shell`, `.project-plate*`, `.project-media-*`, plus media queries). All of these are now dead. **Delete or replace them** — don't reskin.
- Old grain/static reveal experiment has been removed.
- No e2e tests currently mounted on the homepage post-dive section after this strip — `e2e/homepage-black-hole.pw.mjs` still exists and will fail until you rebuild matching DOM (or update the test). **You can rewrite the e2e to match your new design.**

## Hard constraints (do not negotiate)

1. **Black `#000` background.** Match the black-hole exit.
2. **Do NOT touch the hero.** Off-limits files: `src/components/orbital/orbital-hero-tsbxw3.tsx`, `public/black-hole-tsbxw3/`, `public/black-hole-cursor-streamlets/`, the hero's dive logic and CSS in `globals.css` (`.hero-*`, `.home-page`, `.hero-dive*`).
3. **No visible browser scrollbar.** The user explicitly called out "scroll icon on the right side of page" as a problem. Sections should *appear*, not be scrolled to. Achieve this by keeping `body { overflow: hidden }` after dive completes and using one of: keyboard/button pagination, `scroll-snap` with hidden scrollbar, or auto-advance.
4. **4 projects shown in order**, recruiter-friendly. Linear progression — no jumping around.
5. **Each project has a picture.** Real images go in `public/projects/<project-id>/hero.jpg` etc. The user does not have these yet → ask, or build with named placeholder slots that gracefully fall back to a clean black/white stand-in.
6. **Clean, professional typography.** Current is JetBrains Mono — swap for a modern sans (Inter or Geist via `next/font/google`). Display weight for titles, regular for body. The project section does NOT need to thematically echo the black hole — it just needs to be black.

## What the dive currently does at completion

When `uDiveProgress` hits ~1.0 the hero releases page scroll and tries to call `scrollToFirstProject()` which looks for `document.getElementById("projects")` and falls back to `window.scrollBy({ top: innerHeight })`. With the post-dive section removed, this currently does nothing visible (no overflow), but it will run. **You have two clean options:**

- **A.** Reintroduce a `#projects` element and have the hero scroll to it (matches existing dive logic with no hero edits).
- **B.** Decouple from scroll entirely: after dive completes, dispatch a custom event or set a flag and render the project section as a full-screen overlay (`position: fixed`, fade-in). This is more aligned with "no real sense of scrolling".

**Recommended: B.** It directly satisfies the "text just appears" wish. You'll need a small bridge: listen on `window` for the existing `black-hole-dive` postMessage with `progress >= 0.995` (or wire your own event from inside the hero — but the user said don't touch the hero, so listen to the existing message in your new component).

## Project data to preserve

Pull these 4 projects from `src/components/projects/project-journey.tsx` (the `projectCaseStudies` array). Keep the fields that matter; reshape as needed:

1. **RF Plasma** — id `rf-plasma`, kicker "RF / Plasma systems", signal "Bench energy made observable.", role/constraint/output present, tools: RF systems, Instrumentation, Plasma, Lab notes.
2. **Sumobot** — id `sumobot`, kicker "Robotics / Control", signal "Small robot, hard real-time instincts.", tools: Embedded C, Sensors, Control, Fabrication.
3. **FMCG Web** — id `fmcg-web`, kicker "Software / Operations", signal "Operational data without the spreadsheet gravity well.", tools: Next.js, TypeScript, UX, Dashboards.
4. **Lab Demo** — id `lab-demo`, kicker "Teaching / Infrastructure", signal "Reliable demos for fragile physical systems.", tools: Reliability, Docs, Testing, Handover.

Full paragraph copy, role, constraint, and output strings are inside the file — read them directly.

## Plan of action

1. **Ask the user** before writing anything: paginated buttons vs. auto-advance vs. keyboard arrows? Font preference (Inter / Geist / other)? Do they have project images yet, or build with placeholders?
2. **Build a new component** (suggest: `src/components/projects/project-deck.tsx`) — single full-screen panel that swaps content based on active project index. Listens for the dive-complete postMessage and fades itself in.
3. **Add `next/font/google` import** in `src/app/layout.tsx` for Inter or Geist.
4. **Delete dead post-dive CSS** from `globals.css` (everything from `.post-dive-projects` down through the project-related media queries).
5. **Add new minimal CSS** scoped to the new component — flexbox/grid layout, generous whitespace, clean type hierarchy.
6. **Wire up `page.tsx`** to render `<OrbitalHeroTsbxw3 />` and `<ProjectDeck />` together. ProjectDeck should be `position: fixed; inset: 0; z-index: 50; opacity: 0; pointer-events: none` until dive completes, then fade in.
7. **Update or replace** `src/components/projects/project-journey.tsx` — either delete it after migrating the data, or keep it as a typed data module (`project-data.ts`).
8. **Replace `e2e/homepage-black-hole.pw.mjs`** with assertions that match the new DOM — or remove it if the user prefers no test for the new section.
9. **Run `npm run build` and `npm run lint`** before declaring done.
10. **Don't commit.** Show the user, get sign-off.

## Suggested layout for each project

- Top-left: project number `01–04` in dim grey, small.
- Below it: large white project title (Inter Display 700, ~5–7rem).
- Below title: kicker / signal as a single accent line (white, ~1.2rem).
- Body: 1–2 short paragraphs, max 60ch line length, `rgba(255,255,255,0.7)`.
- Right side: project hero image (4:5 or 16:10, contained, max 50vw).
- Bottom: "PREV / NEXT" hint or arrows. Keyboard ←→ also navigate.
- Indicator: 4 small dots/lines top-right showing position in the deck.

## Files to touch (write/edit)

- `src/app/page.tsx`
- `src/app/layout.tsx` (font import)
- `src/app/globals.css` (delete dead styles, add new ones)
- `src/components/projects/project-deck.tsx` (new)
- `src/components/projects/project-data.ts` (new, optional)
- `e2e/homepage-black-hole.pw.mjs` (rewrite or remove)

## Files NOT to touch

- `src/components/orbital/orbital-hero-tsbxw3.tsx`
- `public/black-hole-tsbxw3/`
- `public/black-hole-cursor-streamlets/`
- Hero CSS in `globals.css` (`.hero-*`, `.home-page`, `.hero-dive*`, `.eyebrow`, `.primary-link`, `.cursor-streamlet-controls`, `.hero-cursor-frame`, `.hero-background-frame`, `.hero-shell`, `.hero-copy`, `.hero-summary`, `.hero-actions`, `.hero-link`, `.hero-facts`)
- Anything under `src/lib/black-hole-tsbxw3-shader.test.ts`

## Things that previously went wrong (don't repeat)

- A grain/static "reconstitution" effect was tried and the user disliked it.
- A previous attempt reskinned the existing layout with industrial/amber → white. User explicitly didn't want a reskin; they want a fresh design. **Throw the old layout away.**
- Don't add the sticky project header back unless the user asks.
