# Personal Portfolio

Next.js portfolio site for Liam Krivacic. The homepage is a scroll-driven black-hole journey that reveals a recruiter-focused project section.

## Run Locally

```powershell
npm install
npm run dev -- --hostname 127.0.0.1 --port 5176
```

Then open `http://127.0.0.1:5176`.

## Useful Commands

```powershell
npm test
npm run lint
npm run build
npm run test:fluid
```

## Current Structure

- `src/components/scroll-journey.tsx` coordinates the fixed black-hole background, cursor overlay, scroll timing, and project-section handoff.
- `src/components/projects/projects-page.tsx` renders the project cards, filters, and row reveal behavior.
- `src/data/projects.ts` is the source of truth for project titles, blurbs, skills, filters, thumbnails, and ordering.
- `public/black-hole-tsbxw3/` contains the WebGL black-hole iframe.
- `public/black-hole-cursor-streamlets/` contains the cursor-responsive lighting overlay.
- `public/projects/` and `public/skill-logos/` contain the card thumbnails and hard-skill logos.
- `docs/project-case-study-drafts.md` keeps deeper project notes and image references for future project detail pages.
