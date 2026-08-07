# Project Journey Card Alignment Design

## Goal

Align the internal content rows of the four Project Journey cards and keep a clear gap between each technology list and its GitHub link at every supported breakpoint.

## Confirmed Cause

- Each Journey card currently lays out its content as an independent flex column.
- Variable contribution, growth, and technology wrapping shifts every later section to a different vertical position.
- The Journey-specific GitHub link rule replaces the base `1.5rem` top margin with `margin-top: auto`.
- When a card's content consumes all available height, that auto margin resolves to `0px`; the link's hover translation then moves it one pixel into the technology section.

## Approved Layout

- Cards that share a visible grid row also share internal row tracks for image, stage, title, description, contribution, growth, technologies, and GitHub action.
- Each shared track takes the height of the tallest corresponding item in that grid row.
- The GitHub action retains at least `1.5rem` of space above it before hover and remains aligned with the other actions in the same row.
- Project copy, technology labels, repository URLs, card order, and visual styling outside this alignment fix remain unchanged.

## Implementation Approach

Use CSS Grid `subgrid` on the existing Journey grid and cards.

- A Journey card spans eight shared rows: one image row and seven content rows.
- Its content container inherits the final seven rows so its existing semantic children participate in the shared tracks without duplicating content or measuring elements in JavaScript.
- Replace the Journey link's `margin-top: auto` override with an explicit `1.5rem` top margin.
- Keep the flagship project layout unchanged.

This approach adapts to future text wrapping automatically and avoids fixed section heights, breakpoint-specific magic numbers, resize observers, and layout-time JavaScript.

## Responsive Behavior

- At desktop widths, all four Journey cards share the same eight row tracks.
- At tablet widths, the two cards in each visible grid row share their row tracks.
- At mobile widths, the single-column cards keep natural content-driven heights while preserving the minimum action gap.

## Verification

Follow a red-green regression cycle:

1. Re-run the scripted browser geometry check against the current layout and retain the failing evidence: unequal internal row positions and a `0px` technology-to-link gap.
2. Apply the minimal CSS changes.
3. Verify shared-row alignment and a positive technology-to-link gap, including the link's hover transform, at desktop, tablet, and mobile widths.
4. Run the existing Vitest suite, lint, and production build to catch semantic, quality, and compilation regressions.

## Out of Scope

- Rewriting project content or changing card order.
- Redesigning card typography, colors, borders, images, or hover behavior.
- Adding JavaScript height synchronization or a new end-to-end test dependency.
