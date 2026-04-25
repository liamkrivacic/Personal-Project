# Plasma Orbital Portfolio Design

## Purpose
Design Liam Krivacic's personal portfolio as a simple, readable site with one memorable interaction system. The site should quickly communicate Liam's Electrical Engineering and Computer Science background while feeling distinctive and technically made.

## Chosen Direction
The active direction is **Plasma Field / Orbital Map**.

The page presents Liam's work as project bodies orbiting a dark central field source. The theme comes from Liam's resume: RF systems, plasma energy transfer, impedance matching, infrastructure, robotics, and systems integration.

The design should feel technical, atmospheric, and playful without becoming gimmicky.

## First Screen
The first viewport should show:

- Liam's name in navigation or supporting identity text.
- A large hero statement: `Liam Builds Systems`.
- A concise overview: Electrical Engineering + Computer Science student working across RF systems, infrastructure, robotics, and practical software.
- A right-side orbital field with compact project capsules.
- Dark technical background with subtle field lines and grid texture.

The first screen should not be a marketing splash page. It should be the actual portfolio interface.

## Visual System
Use a dark technical palette with small plasma/signal accents:

- Background: near-black blue/green.
- Text: warm off-white.
- Secondary text: cool gray-blue.
- Accents: cyan, amber, pink/red, and soft green.

Avoid a one-note blue/purple gradient look. The page should read as RF/plasma/signal-field inspired, not generic space wallpaper.

## Orbital Project Capsules
Projects appear as small compact capsules, not large cards, so the hero text and background field remain visible.

Each capsule should show:

- Project name.
- Short category label such as `hardware`, `systems`, `robotics`, or `teaching`.
- Small colored dot or signal marker.

Initial project capsules from resume:

- `RF Plasma` / hardware.
- `FMCG Web` / systems.
- `SumoBot` / robotics.
- `Lab Demo` / teaching.

More detail appears in a lower detail/readout strip when a capsule is hovered, focused, clicked, or selected.

## Interaction Model
The center object is a black-hole-like field source, not Liam's name. Liam's identity belongs in the hero/nav.

Default behavior:

- Capsules drift or sit on stable orbital paths around the black-hole field source.
- Orbits should feel calm and deliberate, not chaotic.
- The background has subtle field lines and occasional signal motion.

User interaction:

- Users can grab a project capsule.
- Dragging detaches it from its orbit.
- Releasing it gives it a small throw velocity.
- The capsule drifts briefly, then slowly returns to its orbital path using spring/damping behavior.
- The interaction should feel like a charged body returning to a stable field, not like a game with scoring or heavy physics.

## Ambient Motion
Add rare fast signal traces across the page:

- They should zip across quickly.
- They should leave a full-path light trail.
- The trail should fade within about 0.5 to 1 second.
- They should happen infrequently so they feel alive without distracting from reading.

Do not use a strong constant cursor glow. A mild cursor influence may be added later only if it improves the field effect without covering content.

## Layout
Initial structure:

- Top nav: name and section links.
- Hero text on the left.
- Orbital field/project capsules on the right.
- Detail/readout strip below the hero area.
- Later sections can expand selected projects, about, skills, and contact.

On mobile:

- Hero text should come first.
- Orbital interaction should simplify to tap/focus behavior.
- Drag/throw can be disabled or reduced if it hurts usability.
- Project capsules must remain readable and tappable.

## Accessibility And Usability
The interaction is enhancement, not the only way to navigate.

Requirements:

- Project names must be readable without interaction.
- Keyboard users must be able to focus/select project capsules.
- Reduced-motion users should get static or minimal-motion orbits.
- The site must remain understandable if drag physics are disabled.
- Links or buttons to open project details must be clear.

## Implementation Direction
Prototype first in `design/`.

Likely implementation stack once scaffolded:

- Next.js 15 App Router.
- TypeScript.
- Tailwind CSS.
- shadcn/ui where useful.
- Framer Motion or a small custom pointer/physics loop for draggable orbital capsules.

Avoid heavy 3D or Blender/Unity-style pre-rendering for the first version. The visual can be built convincingly with HTML, CSS, SVG/canvas accents, and interaction code.

## MVP Decisions
For the first prototype:

- Use `Liam Builds Systems` as the hero phrase.
- Use the four initial project capsules listed above.
- Keep the full orbital field on the homepage only.
- Use a lower detail/readout strip for selected project details.
- Keep later page sections simpler so the orbital field remains the signature homepage interaction.

## Later Content Needed
Before the production portfolio is final, replace rough project copy with polished real descriptions, links, screenshots where available, and exact technology lists.

## Paused Direction
The worn control-console idea is archived in Obsidian as `concepts/paused-worn-control-console.md`. It is not the current direction because it risked feeling corny or gimmicky as the main portfolio concept.
