# Project Card Layout and Skill Logo Design

Date: 2026-05-08

## Goal

Refine the project cards so the technical thumbnails have more visual presence, the text column breathes better, and hard skills read as recruiter-relevant software or programming tools instead of broad technical concepts.

## Approved Layout Direction

Use the approved "A. Balanced wider image" proportions:

- Slightly widen the overall project-card content area.
- Increase the desktop image column from 240px to 310px at wide desktop widths.
- Push the project text column farther right with about 40px of left padding on desktop.
- Make each project row slightly shorter than the current 200px minimum, targeting a 178px desktop minimum while preserving enough height for title, blurb, hard skills, logos, soft skills, and CTA.
- Keep the existing visual style: dark editorial layout, thin dividers, small uppercase labels, badge styling, hover treatment, and project ordering.

## Thumbnail Fit

Project thumbnails should fill the available image area more confidently. The image column should use a fixed, stable aspect region with cropping rather than letterboxing, so CAD/HFSS/LTspice screenshots feel intentionally framed inside the wider space.

Implementation should use normal image rendering behavior with `object-fit: cover` and an `imagePosition` field on each project. Projects that do not need special framing should use `center center`; projects with CAD or page screenshots should set a more precise position to keep the important technical content visible.

## Hard Skills and Logos

Hard skills should be restricted to concrete software platforms, programming languages, or technical tools Liam can reasonably name in a recruiter-facing skills list.

Examples that should remain or be introduced where source-supported:

- ANSYS HFSS
- IronPython
- Python
- LTspice
- Fusion 360
- Arduino
- C/C++
- Synology DSM / NAS
- WordPress
- PHP
- Mailchimp
- Next.js
- React
- TypeScript
- Canvas / WebGL

Examples to remove from hard skills:

- WR340 waveguide
- S-parameters
- VNA planning
- Gradient descent
- Impedance matching
- 4 kV HV safety
- Enclosure design
- Ultrasonic sensors
- RAID
- Reverse proxy
- SSL certificates
- RF systems
- Safety docs
- Visual composition
- Concept development
- Presentation
- Iteration

The removed items can remain implied in blurbs, soft skills, or later case-study pages, but they should not be displayed as hard-skill pills on the cards.

Logos should be rendered below the hard-skill pills, not inside the pills. The logo row should use actual logo image assets for the supported software and languages. These assets may be sourced from official product or technology brand files online, with stable local copies stored in the site so the page does not depend on remote images at runtime.

## Spacing

The hard-skill pills should remain compact. Logo images should sit as a separate row directly below hard skills. Soft skills should move down slightly so the logo row has enough breathing room and the two skill groups do not feel cramped.

## Testing

Add or update data tests so they verify:

- Every project has at least one hard skill.
- Hard skills are restricted to the approved software/language/tool list.
- No hard-skill labels contain the removed concept/process labels.
- Skill logo assets are stored as local paths rather than inline text marks.

Add or update UI-level checks to verify:

- Hard-skill logos render in their own row.
- Project thumbnails use image rendering that can crop/fill the media region.
