# Project Journey Card Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align corresponding content rows across visible Project Journey cards and preserve a clear gap between every technology list and GitHub link.

**Architecture:** Keep the existing semantic React markup and make only the Journey layout participate in shared CSS Grid row tracks. Use nested `subgrid` rows for content-driven alignment, retain explicit action spacing, and verify the user-visible result through real rendered geometry.

**Tech Stack:** React 19, TypeScript, CSS Grid `subgrid`, Vitest, Vite, real Chromium geometry checks

## Global Constraints

- Do not change project copy, technology labels, repository URLs, or card order.
- Do not change the flagship project layout.
- Do not add JavaScript height synchronization, fixed section heights, or a new end-to-end test dependency.
- Preserve the existing four-column desktop, two-column tablet, and one-column mobile Journey breakpoints.
- Preserve at least `1.5rem` of technology-to-action spacing before hover.

---

### Task 1: Synchronize Journey Card Rows and Action Spacing

**Files:**
- Modify: `src/index.css:672-722`

**Interfaces:**
- Consumes: the existing `.journey-grid`, `.project-card--journey`, `.project-card__content`, `.project-card__technologies`, and direct GitHub-link selectors.
- Produces: eight shared card tracks, seven inherited content tracks, and an explicit `1.5rem` Journey action margin.

- [ ] **Step 1: Run a failing real-browser geometry regression**

At `1440px`, read each `.project-card--journey` card's bounding rectangles for these selectors:

```js
const selectors = [
  '.project-card__stage',
  'h3',
  'h3 + p',
  '.project-card__contribution',
  '.project-card__growth',
  '.project-card__technologies',
  '.project-card__content > a',
]

const snapshot = Array.from(document.querySelectorAll('.project-card--journey')).map((card) => ({
  id: card.id,
  tops: Object.fromEntries(selectors.map((selector) => [
    selector,
    card.querySelector(selector).getBoundingClientRect().top,
  ])),
  actionGap: card.querySelector('.project-card__content > a').getBoundingClientRect().top
    - card.querySelector('.project-card__technologies').getBoundingClientRect().bottom,
}))
```

For every selector, calculate `Math.max(...tops) - Math.min(...tops)` across all four cards and fail when the result exceeds `1`. Fail when any `actionGap` is below `24`, the pre-hover value required to retain at least `23px` after the existing one-pixel hover translation.

Expected: FAIL because growth and technology positions differ and at least one `actionGap` is `0px`.

- [ ] **Step 2: Apply the minimal shared-row CSS**

Update the existing Journey rules to include this layout behavior while preserving their current sizing, padding, and transition declarations. Override `row-gap` on both subgrids so the parent grid's `20px` gap continues to separate card rows without inserting `20px` between every internal content track:

```css
.project-card--journey {
  display: grid;
  min-width: 0;
  grid-row: span 8;
  grid-template-rows: subgrid;
  row-gap: 0;
  padding: 0.875rem;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast);
}

.project-card--journey .project-card__content {
  display: grid;
  min-width: 0;
  grid-row: span 7;
  grid-template-rows: subgrid;
  row-gap: 0;
  padding: 1.125rem 0.25rem 0.25rem;
}

.project-card--journey .project-card__content > a {
  margin-top: 1.5rem;
  margin-right: auto;
  padding-top: 0.5rem;
}
```

- [ ] **Step 3: Run the existing card and page regression tests**

Run: `npm run test -- src/components/ProjectCard.test.tsx src/App.test.tsx`

Expected: both files pass; card content, semantics, and repository links remain unchanged.

- [ ] **Step 4: Re-run the rendered geometry regression at representative breakpoints**

Use the local Vite page and Chromium to verify:

- At `1440px`, the stage, title, description, contribution, growth, technologies, and GitHub-link top coordinates match across all four cards within `1px`.
- At `1023px`, those coordinates match within `1px` for cards 1–2 and independently for cards 3–4.
- At `390px`, cards retain natural single-column heights and no horizontal overflow occurs.
- At all three widths, the technology bottom remains at least `23px` above the hovered GitHub-link top, accounting for the existing `translateY(-1px)` hover motion.

Expected: all geometry checks pass with no technology/action intersection.

- [ ] **Step 5: Run complete automated verification**

Run:

```powershell
npm run lint
npm run test
npm run build
```

Expected: every command exits with code `0` and no test failures, lint errors, or build errors.

- [ ] **Step 6: Commit the implementation**

```powershell
git add src/index.css
git commit -m "fix(journey): align card content rows"
```
