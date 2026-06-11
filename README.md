# Liam Krivacic Portfolio

[![CI](https://github.com/liamkrivacic/Personal-Project/actions/workflows/ci.yml/badge.svg)](https://github.com/liamkrivacic/Personal-Project/actions/workflows/ci.yml)

Personal portfolio website for Liam Krivacic, built as an interactive Next.js experience. The homepage opens with a scroll-driven black-hole hero and transitions into a recruiter-focused project section. Individual case-study pages live at `/projects/<slug>` and are driven by MDX files.

## Features

- WebGL black-hole hero with scroll-driven camera motion.
- Cursor-responsive lighting overlay with velocity-sensitive wavefront behaviour.
- Smooth transition from the hero into the project section.
- Recruiter-focused project cards with category filters, concise blurbs, hard skills, soft skills, thumbnails, and software/tool logos.
- Responsive project layout with scroll and filter reveal animations.
- Full case-study pages rendered from MDX with structured frontmatter.
- SEO: Open Graph image, sitemap, robots.txt, JSON-LD Person schema.
- CI: lint, Vitest, production build, and Playwright smoke tests run on every push.

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
npm run test:fluid # Run Playwright end-to-end browser tests
```

## Project Structure

```text
content/projects/                 MDX case-study files (one per project)
src/app/                          Next.js app entry, global styles, metadata
src/app/projects/[slug]/          Case-study page (auto-generated from MDX)
src/components/scroll-journey.tsx Hero-to-project scroll orchestration
src/components/projects/          Project section components
src/components/case-study/        Case-study page components
src/components/mini-nav.tsx       Fixed top navigation bar
src/components/site-footer.tsx    Site footer
src/data/projects.ts              Project card content, ordering, filters, skills, images
src/lib/                          Scroll timing, reveal helpers, and tests
public/black-hole-tsbxw3/         WebGL black-hole background iframe
public/black-hole-cursor-streamlets/
                                  Cursor-responsive lighting overlay iframe
public/projects/                  Project thumbnails
public/skill-logos/               Hard-skill/software logos
e2e/                              Playwright end-to-end tests
```

## Adding a Case Study

1. Add a project entry to `src/data/projects.ts` (or confirm it already exists).
2. Add a thumbnail to `public/projects/<slug>/` and reference it in the project entry.
3. Create `content/projects/<slug>.mdx` with the required frontmatter:

```yaml
---
slug: your-project-slug
title: "Project Title"
summary: "One-sentence description shown in meta and hero."
heroImage: /projects/your-project-slug/hero.jpg
date: YYYY-MM
status: draft      # change to "published" when ready
---
```

4. Write the case-study body in MDX below the frontmatter.
5. Set `status: published` when the page is ready — the project will appear in the sitemap automatically.

## Testing

The repository includes both source-level tests and browser-level smoke tests.

- Vitest checks project data, shader/source invariants, scroll timing, and project-card layout expectations.
- Playwright opens the site in a real browser and verifies the black-hole hero, project section, filters, key UI text, and navigation — on both desktop and mobile (Pixel 7).

Run the full gate:

```powershell
npm run lint
npm test
npm run build
npm run test:fluid
```

## Status

Hero, project grid, and case-study pages are complete. Current follow-up work focuses on polishing case-study content and visual refinements (CP10).
