# Project Card Inline Skill Logo Design

Date: 2026-05-08

## Goal

Make project cards shorter by removing the separate hard-skill logo row and placing each hard-skill logo directly beside its matching hard-skill label.

## Approved Layout

Each hard skill should render as a compact inline unit:

```txt
ANSYS HFSS [logo]
Python [logo]
Fusion 360 [logo]
```

The logo should sit to the right of the hard-skill label inside the same pill. There should be no separate `.prj-skill-logo-strip` row.

Soft skills should remain below the hard-skill pills, not beside them.

## Image Area

The dedicated image column should still be visually filled by the project thumbnail. The problem is not that the image should be smaller inside its area; the card should be shorter so the image region has a better aspect ratio.

Desktop cards should target a shorter row height around `210px`, with the image filling that full image area using `object-fit: cover`. This should make thumbnails read closer to square or horizontal rather than tall vertical crops.

Mobile should keep its existing mobile crop behavior unless verification shows overflow.

## Existing Behavior To Preserve

- Per-card scroll fade/lift reveal.
- 12px gap between project cards.
- Current filter behavior.
- Current project order and thumbnail assets.

## Testing

Verify with tests and browser checks that:

- Hard-skill logo images are rendered inside `.prj-skill-pill.hard`.
- No separate `.prj-skill-logo-strip` markup remains.
- Soft skills render after hard-skill pills.
- Desktop image column remains 310px wide.
- Desktop image height is capped near the new compact row height and uses `object-fit: cover`.
- Mobile has no horizontal overflow.
