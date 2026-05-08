# Liam Krivacic Portfolio

Personal portfolio website for Liam Krivacic, built as an interactive Next.js experience. The homepage opens with a scroll-driven black-hole hero and transitions into a recruiter-focused project section covering engineering, software, and personal work.

## Features

- WebGL black-hole hero with scroll-driven camera motion.
- Cursor-responsive lighting overlay with velocity-sensitive wavefront behaviour.
- Smooth transition from the hero into the project section.
- Recruiter-focused project cards with category filters, concise blurbs, hard skills, soft skills, thumbnails, and software/tool logos.
- Responsive project layout with scroll and filter reveal animations.
- Source-backed project notes for future case-study pages.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- WebGL iframe shaders
- Vitest
- Playwright

## Getting Started

Install dependencies:

```powershell
npm install
```

Start the development server:

```powershell
npm run dev -- --hostname 127.0.0.1 --port 5176
```

Open:

```text
http://127.0.0.1:5176
```

## Scripts

```powershell
npm run dev        # Start the local Next.js dev server
npm run build      # Create a production build
npm run start      # Start the production server after building
npm run lint       # Run ESLint
npm test           # Run Vitest unit/source tests
npm run test:fluid # Run Playwright end-to-end browser test
```

## Project Structure

```text
src/app/                         Next.js app entry, global styles, metadata
src/components/scroll-journey.tsx Hero-to-project scroll orchestration
src/components/projects/          Project page components
src/data/projects.ts              Project card content, ordering, filters, skills, images
src/lib/                          Scroll timing, reveal helpers, and tests
public/black-hole-tsbxw3/         WebGL black-hole background iframe
public/black-hole-cursor-streamlets/
                                  Cursor-responsive lighting overlay iframe
public/projects/                  Project thumbnails
public/skill-logos/               Hard-skill/software logos
docs/project-case-study-drafts.md Deeper source notes for future project pages
e2e/                              Playwright end-to-end test
```

## Testing

The repository includes both source-level tests and a browser-level smoke test.

- Vitest checks project data, shader/source invariants, scroll timing, and project-card layout expectations.
- Playwright opens the site in a real browser and verifies the black-hole hero, project section, filters, and key UI text.

Run the main checks with:

```powershell
npm test
npm run lint
npm run build
npm run test:fluid
```

## Status

The hero page and project page are complete at the experience/layout level. Current follow-up work is focused on polishing project images and text, then building individual project case-study pages.
