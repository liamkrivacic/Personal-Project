# Project Card Scroll Reveal and Skill Stack Design

Date: 2026-05-08

## Goal

Restore the project-page feeling where project cards progressively fade in as the user scrolls down, while refining spacing and skill-logo hierarchy after the latest card layout pass.

## Scroll Reveal

Keep the existing global project-section reveal controlled by `--reveal-col` and `--reveal-list`. Add a row-level reveal on top of that so each project card responds to its own viewport position.

Each `.prj-row-wrap` should receive a CSS variable such as `--row-reveal` in the range `0` to `1`. The value should be updated on scroll, resize, and after filtering. A card should be dimmer and slightly lower before it enters, then fade to full opacity and translate to its resting position as it comes into view.

The reveal should be subtle and professional:

- opacity starts low enough to notice the next project arriving;
- vertical motion is `14px`;
- transition is smooth but not bouncy;
- reduced-motion users should see all rows fully visible without movement.

## Card Gap

Add a small vertical gap between project cards. The gap should be visible enough to separate each card, but it should preserve the current editorial/list feel rather than turning the rows into floating cards.

Use a `12px` gap between `.prj-row-wrap` items. Keep the thin border/divider styling inside each row.

## Skill Stack

Change the skills layout to a single vertical stack:

1. Hard skills label and hard-skill pills.
2. Larger hard-skill logos directly underneath.
3. Soft skills label and soft-skill pills underneath the hard-skill/logo section.

Hard-skill logos should be larger and should not sit inside boxes. The logo row should use bare logo images with enough spacing to read clearly on the dark background. Target logo images should fit inside a `42px` wide by `30px` high area.

Soft skills should no longer sit beside the hard skills on desktop. They should sit underneath with a modest vertical gap.

## Filtering Interaction

Filtering should continue to work with the existing focus buttons. When a filter changes, visible rows should be recalculated so the row-level reveal and filtered display state agree with each other.

## Testing

Add a small unit-level test for the row reveal helper. Verify manually or with Playwright that:

- 9 project cards render.
- project rows expose row-level reveal variables or styles.
- scrolling down increases row reveal values for entering cards.
- there is a visible gap between rows.
- logos render larger, without box borders.
- soft skills render below hard skills and logos.
- mobile has no horizontal overflow.
