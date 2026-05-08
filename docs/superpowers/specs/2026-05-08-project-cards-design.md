# Project Cards Content Design

## Goal

Update the portfolio project page so it shows the projects Liam listed in `Projects.docx`, with recruiter-focused titles, blurbs, skills, and relevant pictures where available.

The implementation must not change the current project card style, layout language, or overall page design. It should only create or edit project cards and their content fields.

## Sources

Use only information supported by these sources:

- `C:\Users\krili\OneDrive - UNSW\UNSW\Resume\Claude Job applications\Projects.docx`
- `C:\Users\krili\OneDrive - UNSW\UNSW\Resume\Claude Job applications\Liam Experience Profile.md`
- `C:\Users\krili\OneDrive - UNSW\UNSW\Atomcraft\RF\Final Report z5592360.docx`
- `C:\Users\krili\OneDrive - UNSW\UNSW\Atomcraft\RF\Power Measurement\Main\Report.docx`
- `C:\Users\krili\OneDrive - UNSW\UNSW\Atomcraft\RF\Enclosure\Enclosure.docx`
- `C:\Users\krili\OneDrive - UNSW\UNSW\Atomcraft\RF\Experiments\AtomCraft RF Heating Experiment - Combined.docx`
- `C:\Users\krili\OneDrive - UNSW\UNSW\Atomcraft\RF\Safety\RF Safety Compliance.docx`
- `C:\Users\krili\OneDrive - UNSW\UNSW\2024\2024 term 2\SumoBot`
- `C:\Users\krili\OneDrive - UNSW\UNSW\Art`
- Liam's public LinkedIn profile URL, where accessible. Public access is limited, so no fact should be used unless it also appears in the local source files or an accessible public snippet.

## Approaches Considered

1. Content-only card update, keeping the current project page style.
   - Pros: matches Liam's request exactly, low visual risk, fast to verify.
   - Cons: does not add richer project-detail navigation yet.
   - Decision: use this approach.

2. Add richer filtering, expandable cards, or a literal tabbed project interface.
   - Pros: could help future case-study browsing.
   - Cons: changes the interaction model and style, which Liam explicitly does not want now.
   - Decision: do not use for this change.

3. Build full project detail pages now.
   - Pros: complete recruiter journey.
   - Cons: Liam asked for the in-depth explanations as a document for pages to make later.
   - Decision: write the page-ready draft document, but do not create detail routes yet.

## Selected Project Cards

Create eight project cards:

1. AtomCraft RF Heating System Leadership
   - Recruiter angle: engineering leadership, RF systems ownership, cross-disciplinary coordination.
   - Supported skills: RF systems, ANSYS HFSS, S-parameters, microwave engineering, documentation, team leadership, safety and compliance.

2. HFSS Directional Coupler and Waveguide-to-Coax Adapter
   - Recruiter angle: simulation-led RF component design with measurable performance targets.
   - Supported skills: ANSYS HFSS, WR340 waveguide, S-parameters, Monte Carlo tolerance analysis, VNA planning, waveguide design.

3. Automated Stub-Tuner Optimisation in HFSS
   - Recruiter angle: software applied to RF design, numerical optimisation, simulation automation.
   - Supported skills: IronPython, Python, impedance matching, gradient descent, HFSS scripting, RF simulation.

4. High-Voltage Magnetron Power Supply and Safety Enclosure
   - Recruiter angle: practical power electronics exploration with high-voltage safety awareness.
   - Supported skills: LTspice, full-wave rectification, 4 kV high-voltage safety, Fusion 360, enclosure design, risk controls.

5. FMCG NAS and Self-Hosted Web Infrastructure
   - Recruiter angle: small-business infrastructure ownership from storage through secure web hosting.
   - Supported skills: Synology NAS, RAID, reverse proxy, SSL certificates, DNS, WordPress hosting, remote access.

6. FMCG WordPress Websites and Marketing Systems
   - Recruiter angle: maintainable web delivery for a small company with automation and integrations.
   - Supported skills: WordPress, PHP, child themes, DNS, hosting, SSL, CRM data, Mailchimp, Python, Excel/VBA.

7. UNSW SumoBots Advanced Stream Winner
   - Recruiter angle: end-to-end autonomous robotics build under competition constraints.
   - Supported skills: Arduino, C/C++, ultrasonic sensors, IR sensing, motor control, Fusion 360, 3D printing, laser cutting.

8. Visual Arts Portfolio
   - Recruiter angle: visual communication, craft, presentation, and creative discipline.
   - Supported skills: visual composition, concept development, exhibition presentation, design iteration.

## Image Plan

Preserve the current card image style. Use relevant pictures only where there is a supported local asset.

- SumoBots: copy a local SumoBot chassis/render image into `public/projects/` and use it on the card.
- Visual Arts: choose one local artwork image from `C:\Users\krili\OneDrive - UNSW\UNSW\Art` after visually checking it, then copy it into `public/projects/`.
- AtomCraft RF cards: use inline technical SVG-style card art consistent with the current page, because the RF folder contains reports and CAD files but no simple, ready-to-use image asset found during exploration.
- FMCG cards: use inline technical SVG-style card art consistent with the current page. Do not use screenshots of `industrialfootbath` or `arirangnoodles` unless Liam separately approves those screenshots or provides local image assets.

## Detailed Project Document

Create a recruiter-oriented markdown document for future project detail pages at:

`docs/project-case-study-drafts.md`

For each of the eight projects, include:

- recruiter-facing title
- short card blurb
- suggested skills list
- deeper explanation for a future project page
- concrete evidence from source documents
- any limitations where the source material does not support a stronger claim

## Implementation Scope

Update only the files needed for project content and image references:

- `src/data/projects.ts`
- `src/components/projects/projects-page.tsx` only if new image symbols or data fields require it
- `public/projects/*` for copied local images
- `docs/project-case-study-drafts.md`

Do not alter the CSS or visual styling for the project cards.

## Verification

After implementation:

- Run the existing test suite.
- Run a production build.
- Start or confirm the dev server is running.
- Visually inspect the project page enough to confirm the new cards render and the layout is not broken.

