# Project Modal Polish and Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a safe modal exit presentation, remove the lingering post-close card elevation, and delete styles that belonged only to removed route-based pages.

**Architecture:** React Router remains the immediate source of navigation truth. A focused presentation hook retains the last valid modal snapshot only while a `160ms` exit animation runs, with animation-end completion, a `220ms` fallback, reduced-motion bypass, and Forward cancellation. Component tests install the real stylesheet and assert computed focus/modal presentation behavior rather than inspecting CSS source text.

**Tech Stack:** React 19, TypeScript, React Router 8, Vitest, Testing Library, Vite, CSS

## Global Constraints

- Keep the only public address at `https://minhyeok328.github.io/`; no path, query, or hash may be added.
- Do not change `useProjectModalHistory` state shapes, depth semantics, or Router keys.
- Preserve body locking, inert background behavior, focus trapping, captured scroll restoration, and exact opening-card focus restoration until final modal unmount.
- Normal modal exit duration is `160ms`; fallback cleanup is `220ms`; reduced-motion exit is immediate.
- Card elevation, strong border, and shadow are pointer-hover-only; restored or keyboard focus keeps the explicit `:focus-visible` outline without elevation.
- Backdrop blur is `4px` in normal colors and disabled in forced-colors mode.
- Do not add dependencies or remove current modal/shared-detail styles.
- Every behavior change starts with a focused failing regression test and records RED before implementation.
- Commit messages use scoped English Conventional Commit headers.

---

### Task 1: Separate card hover elevation from focus restoration

**Files:**
- Create: `src/test/portfolioStylesheet.ts`
- Modify: `src/components/ProjectCard.test.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: `.project-card`, `.project-card__trigger`, and the existing full-card focus restoration behavior.
- Produces: a stylesheet contract in which hover elevation is independent from the trigger's `:focus-visible` outline.

- [ ] **Step 1: Write the failing computed-style regression test**

Create a small test-only helper in `src/test/portfolioStylesheet.ts`:

```ts
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export async function readPortfolioStylesheet() {
  const stylesheet = await readFile(resolve(process.cwd(), 'src/index.css'), 'utf8')
  return stylesheet.replace('@import "tailwindcss";', '')
}

export function installPortfolioStylesheet(stylesheet: string) {
  const style = document.createElement('style')
  style.textContent = stylesheet
  document.head.append(style)
  return () => style.remove()
}
```

Extend `ProjectCard.test.tsx` with a real component and computed-style case:

```ts
it('does not keep the card elevated when the restored trigger receives focus', () => {
  const removeStyles = installPortfolioStylesheet(stylesheet)
  renderProjectCard()
  const card = screen.getByTestId('journey-project')
  const trigger = within(card).getByRole('button')

  trigger.focus()

  expect(getComputedStyle(card).transform).not.toBe('translateY(-3px)')
  expect(getComputedStyle(card).boxShadow).not.toBe('var(--shadow-card)')
  expect(getComputedStyle(trigger).outline).toContain('3px solid')
  removeStyles()
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
npm.cmd test -- src/components/ProjectCard.test.tsx
```

Expected: FAIL because focusing the trigger currently activates `.project-card:is(:hover, :focus-within)` and computes `translateY(-3px)`.

- [ ] **Step 3: Apply the minimal card selector change**

In `src/index.css`, replace only the shared hover/focus-within selector:

```css
.project-card:hover {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-card);
  transform: translateY(-3px);
}
```

Keep `.project-card__trigger:focus-visible` unchanged.

- [ ] **Step 4: Verify GREEN and focused component behavior**

Run:

```powershell
npm.cmd test -- src/components/ProjectCard.test.tsx src/components/ProjectDetailModal.test.tsx
```

Expected: all focused tests pass with no warnings.

- [ ] **Step 5: Inspect and commit only the card visual-state scope**

Inspect `src/test/portfolioStylesheet.ts`, `src/components/ProjectCard.test.tsx`, and the exact `src/index.css` hunk; stage only those paths, verify the cached diff, then commit:

```text
fix(projects): clear card elevation after modal close
```

---

### Task 2: Add Router-safe modal closing presence and visual treatment

**Files:**
- Create: `src/hooks/useProjectModalPresence.ts`
- Create: `src/hooks/useProjectModalPresence.test.tsx`
- Modify: `src/components/ProjectDetailModal.tsx`
- Modify: `src/components/ProjectDetailModal.test.tsx`
- Modify: `src/pages/PortfolioHomePage.tsx`
- Modify: `src/router/AppRouter.test.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Produces: `type ProjectModalPhase = 'open' | 'closing'`.
- Produces: `useProjectModalPresence<T>(currentValue: T | null)` returning `{ displayedValue: T | null; phase: ProjectModalPhase; completeExit: () => void }`.
- `ProjectDetailModal` adds `phase: ProjectModalPhase` and `onExitComplete: () => void` props.
- The hook owns presentation lifetime only and never navigates, captures scroll, or writes history.

- [ ] **Step 1: Write failing presence-hook tests**

Create a `renderHook` suite covering these real state transitions:

```ts
const { result, rerender } = renderHook(
  ({ value }) => useProjectModalPresence(value),
  { initialProps: { value: { id: 'pickle' } as { id: string } | null } },
)

rerender({ value: null })
expect(result.current.displayedValue).toEqual({ id: 'pickle' })
expect(result.current.phase).toBe('closing')

act(() => result.current.completeExit())
expect(result.current.displayedValue).toBeNull()
```

Add separate cases for the `220ms` fallback, a renewed value cancelling close, and `matchMedia('(prefers-reduced-motion: reduce)').matches === true` clearing immediately.

- [ ] **Step 2: Run the hook test and verify RED**

Run:

```powershell
npm.cmd test -- src/hooks/useProjectModalPresence.test.tsx
```

Expected: FAIL because the hook module does not exist.

- [ ] **Step 3: Implement the minimal presence hook**

Use the following fixed behavior:

```ts
export type ProjectModalPhase = 'open' | 'closing'
export const PROJECT_MODAL_EXIT_FALLBACK_MS = 220
```

- Derive `displayedValue` from `currentValue ?? retainedValue` so opening is immediate.
- Retain every non-null current value and set `phase` to `open`.
- On `non-null -> null`, clear immediately for reduced motion or set `phase` to `closing`.
- While closing, schedule the `220ms` fallback and clear it on cancellation/unmount.
- `completeExit` clears only when the latest current value remains `null`.
- A renewed non-null value updates the retained value and cancels closing.

- [ ] **Step 4: Verify hook GREEN**

Run the focused hook suite and require every transition to pass without timer leakage.

- [ ] **Step 5: Write failing modal phase and interaction tests**

Extend `ProjectDetailModal.test.tsx` so a closing modal:

- has `project-detail-modal__backdrop--closing`;
- reports exit completion only when `animationEnd` targets the backdrop itself;
- ignores close-button, Escape, backdrop, previous, and next callbacks while closing;
- preserves the existing pointer-origin drag guard.

Run the file and verify RED because `phase` and `onExitComplete` are not implemented.

- [ ] **Step 6: Implement modal phase handling**

- Add the new props and closing modifier class.
- Route close button, Escape, and backdrop dismissal through one synchronous request guard that marks the first exit request before calling `onClose`; reset it only after a renewed open phase/project.
- Wrap previous and next callbacks with the same open-phase/exit-request guard so interactions cannot race an accepted dismissal.
- Add a React `AnimationEvent` handler that calls `onExitComplete` only when `phase === 'closing'` and `event.target === event.currentTarget`.
- Keep focus trap, inert shell, body lock, pointer-id guard, and cleanup logic unchanged.

Run the modal suite and verify GREEN.

- [ ] **Step 7: Write failing Router integration tests**

Update `AppRouter.test.tsx` to assert:

- close button moves Router state to home immediately but retains a closing dialog;
- the root pathname and empty hash remain unchanged during exit;
- backdrop `animationEnd` removes the dialog, unlocks, restores `640`, and focuses the exact trigger;
- browser Back enters the same closing phase;
- browser Forward before completion cancels exit and restores the matching open dialog;
- project previous/next switching keeps the original outer dialog without a closing class.

Run the focused Router suite and verify RED because `PortfolioHomePage` still unmounts on home state.

- [ ] **Step 8: Integrate the presence hook in PortfolioHomePage**

- Build a memoized live snapshot only from validated project modal state.
- Pass it to `useProjectModalPresence`.
- Render `displayedValue` rather than the live value.
- Pass `phase` and `completeExit` to `ProjectDetailModal`.
- Continue passing the existing history callbacks; closing-phase guards prevent duplicate actions.

Run the Router and modal suites and verify GREEN.

- [ ] **Step 9: Write the failing computed modal-style test**

In `ProjectDetailModal.test.tsx`, install the real portfolio stylesheet and assert consumer-visible computed styles:

- an open backdrop computes `backdropFilter` as `blur(4px)` and an opening animation using `160ms`;
- a closing backdrop computes the exit animation using `160ms`;
- the nested panel computes the matching open/close animation names.

Run the modal test and verify RED because the current backdrop has no filter or phase-specific animation.

- [ ] **Step 10: Add the minimal modal CSS**

- Animate backdrop open from transparent/zero blur to the existing `72%` background and `4px` blur.
- Animate panel open from low opacity, at most `6px` down, and `scale(0.995)` to its current state.
- Add explicit closing animations on `.project-detail-modal__backdrop--closing` and its panel.
- Retain the existing keyed detail fade for project switching.
- In reduced motion, disable all modal backdrop, panel, and detail animations.
- In forced colors, set both standard and WebKit backdrop filters to `none`.

- [ ] **Step 11: Verify the complete modal scope and commit**

Run:

```powershell
npm.cmd test -- src/hooks/useProjectModalPresence.test.tsx src/components/ProjectDetailModal.test.tsx src/router/AppRouter.test.tsx
npm.cmd run lint
npm.cmd run build
```

Inspect every changed file and cached hunk, then commit only this scope:

```text
feat(projects): animate modal dismissal safely
```

---

### Task 3: Remove deleted route and page styles

**Files:**
- Modify: `src/index.css`

**Interfaces:**
- Consumes: the audited stale selector list.
- Produces: no runtime API; the shipped stylesheet contains only current portfolio and modal rules.

- [ ] **Step 1: Establish the green refactor baseline**

Run the current modal/detail suites before deleting styles:

```powershell
npm.cmd test -- src/components/ProjectDetailModal.test.tsx src/components/project-detail/ProjectDetailView.test.tsx
```

Expected: all tests pass. This task is the REFACTOR phase of the prior green behavior cycle; it introduces no new runtime behavior.

- [ ] **Step 2: Remove only audited legacy rules**

Delete:

- desktop `.detail-header__navigation`;
- the entire `.not-found-page` family;
- `.project-detail-page`;
- mobile `.detail-header__inner`, `.detail-header__navigation`, and their descendants.

Do not change any current modal or shared detail rules.

- [ ] **Step 3: Verify behavior remains GREEN and legacy selectors are absent**

Run:

```powershell
npm.cmd test -- src/components/ProjectDetailModal.test.tsx src/components/project-detail/ProjectDetailView.test.tsx
rg -n "detail-header__(inner|navigation)|not-found-page|project-detail-page" src/index.css src
```

Expected: tests pass and `rg` returns no matches.

- [ ] **Step 4: Inspect and commit only cleanup**

Inspect the complete `src/index.css` diff and commit only the audited deletion:

```text
refactor(styles): remove legacy detail page rules
```

---

### Task 4: Whole-change review, final verification, and publication

**Files:**
- Modify only files required by concrete review findings.

**Interfaces:**
- Consumes: Tasks 1-3 and the approved design.
- Produces: reviewed and published `main`.

- [ ] **Step 1: Run a whole-range review**

Review from `c85ae24^` through current HEAD against the design, with explicit Critical, Important, and Minor findings. If Critical or Important findings exist, resolve them in one TDD fix wave and run one scoped re-review.

- [ ] **Step 2: Run fresh final verification**

Run:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
git diff --check c85ae24^..HEAD
git status --short --branch
```

Require clean output, visible final test counts, canonical root/404 artifacts, and no stale nested project output.

- [ ] **Step 3: Run affected production-browser acceptance**

Verify at minimum:

- pointer open and normal close animation;
- body/inert retention during exit and cleanup afterward;
- exact focus restoration without persistent card elevation;
- pointer hover still elevates;
- Back and rapid Forward cancellation;
- reduced-motion immediate close;
- desktop and 360px mobile layout;
- light/dark behavior and empty warning/error console.

- [ ] **Step 4: Audit commits and push main**

Use `commit-workflow` to inspect each commit and every remaining changed file. Confirm the worktree is clean, push `main`, verify local HEAD equals `origin/main` and the remote head, and confirm the new production asset is visible at `https://minhyeok328.github.io/`.
