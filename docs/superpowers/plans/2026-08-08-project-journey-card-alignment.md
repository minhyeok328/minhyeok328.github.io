# Project Journey Card Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align corresponding content rows across visible Project Journey cards and preserve a clear gap between every technology list and GitHub link.

**Architecture:** Keep the existing semantic React markup and make only the Journey layout participate in shared CSS Grid row tracks. Use nested `subgrid` rows for content-driven alignment, retain explicit action spacing, and verify both the stylesheet contract and real rendered geometry.

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
- Create: `src/index.test.ts`
- Modify: `src/index.css:672-722`

**Interfaces:**
- Consumes: the existing `.journey-grid`, `.project-card--journey`, `.project-card__content`, `.project-card__technologies`, and direct GitHub-link selectors.
- Produces: eight shared card tracks, seven inherited content tracks, and an explicit `1.5rem` Journey action margin.

- [ ] **Step 1: Add a failing stylesheet contract test**

```ts
import { describe, expect, it } from 'vitest'
import stylesheet from './index.css?raw'

function getRule(selector: string) {
  const start = stylesheet.indexOf(`${selector} {`)
  if (start === -1) return ''

  const end = stylesheet.indexOf('}', start)
  return stylesheet.slice(start, end + 1)
}

describe('Project Journey card layout', () => {
  it('shares internal row tracks and reserves space above the GitHub action', () => {
    const cardRule = getRule('.project-card--journey')
    const contentRule = getRule('.project-card--journey .project-card__content')
    const actionRule = getRule('.project-card--journey .project-card__content > a')

    expect(cardRule).toContain('grid-row: span 8;')
    expect(cardRule).toContain('grid-template-rows: subgrid;')
    expect(cardRule).toContain('row-gap: 0;')
    expect(contentRule).toContain('grid-row: span 7;')
    expect(contentRule).toContain('grid-template-rows: subgrid;')
    expect(contentRule).toContain('row-gap: 0;')
    expect(actionRule).toContain('margin-top: 1.5rem;')
    expect(actionRule).not.toContain('margin-top: auto;')
  })
})
```

- [ ] **Step 2: Run the focused test and confirm the missing shared-track failure**

Run: `npm run test -- src/index.test.ts`

Expected: FAIL because `.project-card--journey` does not contain `grid-row: span 8;` or `grid-template-rows: subgrid;` and the action rule still contains `margin-top: auto;`.

- [ ] **Step 3: Apply the minimal shared-row CSS**

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

- [ ] **Step 4: Run the focused test and confirm it passes**

Run: `npm run test -- src/index.test.ts`

Expected: PASS with one test and no warnings.

- [ ] **Step 5: Run the existing card and page regression tests**

Run: `npm run test -- src/components/ProjectCard.test.tsx src/App.test.tsx`

Expected: both files pass; card content, semantics, and repository links remain unchanged.

- [ ] **Step 6: Verify real rendered geometry at representative breakpoints**

Use the local Vite page and Chromium to verify:

- At `1440px`, the stage, title, description, contribution, growth, technologies, and GitHub-link top coordinates match across all four cards within `1px`.
- At `1023px`, those coordinates match within `1px` for cards 1–2 and independently for cards 3–4.
- At `390px`, cards retain natural single-column heights and no horizontal overflow occurs.
- At all three widths, the technology bottom remains at least `23px` above the hovered GitHub-link top, accounting for the existing `translateY(-1px)` hover motion.

Expected: all geometry checks pass with no technology/action intersection.

- [ ] **Step 7: Run complete automated verification**

Run:

```powershell
npm run lint
npm run test
npm run build
```

Expected: every command exits with code `0` and no test failures, lint errors, or build errors.

- [ ] **Step 8: Commit the implementation**

```powershell
git add src/index.css src/index.test.ts
git commit -m "fix(journey): align card content rows"
```
