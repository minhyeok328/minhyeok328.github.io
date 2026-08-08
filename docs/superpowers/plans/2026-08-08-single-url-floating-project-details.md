# Single-URL Floating Project Details Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the portfolio at one root URL while opening every reusable project case study in an accessible desktop floating panel and mobile full-screen panel.

**Architecture:** The home page remains the only rendered route. Top-level navigation becomes programmatic scrolling with no hashes. React Router location state stores same-`/` modal history, while a portal-based `ProjectDetailModal` reuses the existing data-driven detail view and isolates focus, scroll, and inert background behavior.

**Tech Stack:** React 19, TypeScript 6, React Router 8, Vite 8, Vitest 4, Testing Library, CSS design tokens.

## Global Constraints

- The visible address is always exactly `https://minhyeok328.github.io/`; section navigation, modal state, and project switching add no path or hash.
- Header navigation contains About, Projects, Skills, optional Experience, and Contact only. `Project Journey` remains inside Projects without a `journey` URL target.
- Refresh, legacy project paths, unknown paths, and legacy hashes normalize to the closed root home view before the Router renders.
- All runtime modal transitions use React Router navigation and `location.state`; raw History writes are limited to pre-Router bootstrap and must preserve Router `idx` and `key` fields.
- Every application load uses a fresh page-session token. Previous-session, unknown-project, or invalid-depth state must never reopen a modal or drive delta navigation.
- Opening a card captures its id and home scroll position. Back traverses viewed projects then home; close, Escape, and backdrop skip directly to the opening home entry.
- Desktop uses a centered panel with a dimmed backdrop and internal scrolling. At the mobile breakpoint the panel uses `100dvh` full-screen layout with safe-area padding.
- The background is inert and scroll-locked while open. Focus enters the active project heading, remains trapped in the dialog, and returns to the opening card or programmatically focusable Projects heading.
- `프로젝트 목록` is removed. `GitHub에서 코드 보기` remains the only detail action and keeps `target="_blank"` and `rel="noreferrer"`.
- Project data remains a single source of truth. Existing de-duplication and empty optional-section rules remain unchanged.
- Use existing color, spacing, transition, theme, reduced-motion, and forced-colors tokens. Add no dependency and write no new project content.
- Work directly on `main` as explicitly requested. Use TDD, scoped English conventional commits, full final verification, and push only after the whole feature passes review.

---

### Task 1: Make home navigation hash-free and nest Journey under Projects

**Files:**
- Create: `src/lib/sectionNavigation.ts`
- Create: `src/lib/sectionNavigation.test.ts`
- Modify: `src/components/Header.tsx`
- Modify: `src/components/Header.test.tsx`
- Modify: `src/components/Footer.tsx`
- Create: `src/components/Footer.test.tsx`
- Modify: `src/sections/ProjectsSection.tsx`
- Modify: `src/hooks/useActiveSection.ts`
- Modify: `src/hooks/useActiveSection.test.tsx`
- Modify: `src/lib/portfolio.ts`
- Modify: `src/lib/portfolio.test.ts`
- Modify: `src/router/AppRouter.test.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Produces: `scrollToSection(sectionId: string): boolean`, returning whether the target existed.
- Produces: Header/Footer/growth controls that scroll without writing history.
- Preserves: `useActiveSection(sectionIds: string[]): string`, now observer-only.

- [ ] **Step 1: Write failing navigation tests**

Add literal behavior assertions before production edits:

```tsx
it('scrolls to a section without changing the root URL', async () => {
  window.history.replaceState(null, '', '/')
  document.body.innerHTML = '<section id="projects"></section>'
  const target = document.getElementById('projects')!
  const scrollIntoView = vi.spyOn(target, 'scrollIntoView')

  expect(scrollToSection('projects')).toBe(true)
  expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
  expect(window.location.pathname).toBe('/')
  expect(window.location.hash).toBe('')
})
```

Update component tests to require native buttons named `MH`, `About`, `Projects`, and `맨 위로`; require the growth line to expose five buttons; require no `Journey` Header item; and require `Project Journey` to remain visible without `id="journey"`. Replace AppRouter's initial-hash, explicit `/#projects`, and hash-restoration assertions with root-address/no-hash behavior so this task leaves no stale hash contract behind.

Replace hash-settlement hook cases with observer-only cases that prove Projects stays selected while the large Projects section intersects and that neither `pushState` nor `replaceState` is called.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```powershell
npm test -- src/lib/sectionNavigation.test.ts src/components/Header.test.tsx src/components/Footer.test.tsx src/hooks/useActiveSection.test.tsx src/router/AppRouter.test.tsx src/App.test.tsx
```

Expected: FAIL because `sectionNavigation` is missing and existing controls are anchors that write hashes.

- [ ] **Step 3: Implement programmatic scrolling and top-level navigation**

Create the helper with reduced-motion awareness:

```ts
export function scrollToSection(sectionId: string) {
  const target = document.getElementById(sectionId)
  if (!target) return false

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  return true
}
```

Use `type="button"` controls in Header and Footer. Header selection calls `scrollToSection(item.id)` and closes the mobile menu; the brand and Footer call `scrollToSection('top')`. Preserve the existing active styling with `aria-current="location"` on the selected section.

Remove Journey from `getNavigationItems`. In Projects, remove `id="journey"`; keep the heading and cards. Convert the growth-line anchors into buttons that call `scrollToSection(project.id)`.

Simplify `useActiveSection` to its IntersectionObserver selection and document-bottom rule. Delete hash ownership, `hashchange`, scroll-settle timers, and all History writes.

Update anchor-specific Header, Footer, growth-line, and card-adjacent CSS selectors to include the new button structure without altering current appearance.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run the Step 2 command.

Expected: all focused tests pass with no hash/history writes.

- [ ] **Step 5: Run regression checks**

Run:

```powershell
npm test
npm run lint
```

Expected: full suite and lint pass without warnings introduced by this task.

- [ ] **Step 6: Commit the navigation scope**

Stage only the files listed in Task 1, inspect the cached diff, and commit:

```text
feat(navigation): keep portfolio navigation on one URL
```

---

### Task 2: Decouple the shared detail view from project routes

**Files:**
- Modify: `src/components/project-detail/ProjectActions.tsx`
- Modify: `src/components/project-detail/ProjectDetailView.tsx`
- Modify: `src/components/project-detail/ProjectDetailView.test.tsx`
- Modify: `src/pages/ProjectDetailPage.tsx`
- Modify: `src/router/AppRouter.test.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Produces: `ProjectDetailView` props `onPreviousProject?: () => void` and `onNextProject?: () => void`.
- Preserves: project, adjacency, heading ref, content de-duplication, and optional-section behavior.
- Removes: all React Router imports from reusable detail components and the `프로젝트 목록` action.

- [ ] **Step 1: Write failing detail-action tests**

Remove `MemoryRouter` from the detail-view test and pass spies:

```tsx
const onPreviousProject = vi.fn()
const onNextProject = vi.fn()

render(
  <ProjectDetailView
    project={project}
    previousProject={previousProject}
    nextProject={nextProject}
    headingRef={createRef<HTMLHeadingElement>()}
    onPreviousProject={onPreviousProject}
    onNextProject={onNextProject}
  />,
)

await user.click(screen.getByRole('button', { name: '다음 · 다음 프로젝트' }))
expect(onNextProject).toHaveBeenCalledOnce()
expect(screen.queryByText('프로젝트 목록')).not.toBeInTheDocument()
```

Keep literal assertions for safe GitHub attributes, collection boundaries, exact contribution de-duplication, and omitted optional sections. Update the temporary direct-detail Router tests to require previous/next buttons and the absence of `프로젝트 목록`; remove assumptions that reusable project navigation exposes route hrefs.

- [ ] **Step 2: Run the detail test and verify RED**

Run:

```powershell
npm test -- src/components/project-detail/ProjectDetailView.test.tsx
```

Expected: FAIL because the callbacks do not exist, navigation is still links, and `프로젝트 목록` is still rendered.

- [ ] **Step 3: Implement route-neutral detail actions**

Use callback buttons:

```tsx
{previousProject && onPreviousProject ? (
  <button type="button" onClick={onPreviousProject}>
    이전 · {previousProject.title}
  </button>
) : <span />}
```

Apply the same rule to next. `ProjectActions` renders only the repository anchor. Adapt the temporary standalone `ProjectDetailPage` by using `useNavigate` in the page wrapper and passing route-navigation callbacks; this page is removed in Task 5.

Migrate `.project-detail__project-navigation a` styling to buttons and remove the obsolete second hero-action styling without changing the GitHub action appearance.

- [ ] **Step 4: Verify focused and full GREEN**

Run:

```powershell
npm test -- src/components/project-detail/ProjectDetailView.test.tsx src/router/AppRouter.test.tsx
npm test
npm run lint
```

Expected: all commands pass and reusable detail components contain no `Link` import.

- [ ] **Step 5: Commit the detail component scope**

Stage only Task 2 files, inspect the cached diff, and commit:

```text
refactor(projects): decouple detail content from routes
```

---

### Task 3: Add validated same-address modal history

**Files:**
- Create: `src/router/modalHistory.ts`
- Create: `src/router/modalHistory.test.ts`
- Create: `src/hooks/useProjectModalHistory.ts`
- Create: `src/hooks/useProjectModalHistory.test.tsx`

**Interfaces:**
- Produces: `HomeLocationState`, `ProjectLocationState`, and `PortfolioLocationState`, stored only at `location.state.portfolioModal` so unrelated Router user state survives.
- Produces: `createPageSessionToken()`, `createHomeLocationState()`, `createProjectLocationState()`, and `parsePortfolioLocationState()`.
- Produces: `useProjectModalHistory({ projects, sessionToken })` returning validated `modalState`, `activeProject`, `previousProject`, `nextProject`, `openProject`, `switchProject`, and `closeProject`.
- Consumes later: Task 4 home/modal integration and Task 5 bootstrap normalization.

- [ ] **Step 1: Write failing pure-state tests**

Use hand-written state objects and literal results:

```ts
expect(parsePortfolioLocationState({ portfolioModal: {
  view: 'project',
  sessionToken: 'current',
  projectId: 'pickle',
  openingCardId: 'project-card-pickle',
  homeScrollY: 640,
  depth: 2,
}}, 'current', ['pickle'])).toMatchObject({ projectId: 'pickle', depth: 2 })

expect(parsePortfolioLocationState({ portfolioModal: {
  view: 'project', sessionToken: 'old', projectId: 'pickle',
  openingCardId: 'project-card-pickle', homeScrollY: 640, depth: 1,
}}, 'current', ['pickle'])).toBeNull()
```

Add separate cases for unknown project id, blank opening id, negative scroll, zero/fractional depth, valid home state, unrelated user-state preservation, and distinct generated session tokens.

- [ ] **Step 2: Run pure-state tests and verify RED**

Run:

```powershell
npm test -- src/router/modalHistory.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the typed state helpers**

Use a discriminated union and an explicit restorable home state:

```ts
export interface HomeLocationState {
  view: 'home'
  sessionToken: string
  openingCardId: string | null
  homeScrollY: number | null
}

export interface ProjectLocationState {
  view: 'project'
  sessionToken: string
  projectId: string
  openingCardId: string
  homeScrollY: number
  depth: number
}

export function createHomeLocationState(
  sessionToken: string,
  restore?: { openingCardId: string; homeScrollY: number },
): HomeLocationState
```

Validate only the namespaced `location.state.portfolioModal` payload before using it. Depth must be a positive integer and scroll must be finite and non-negative. State from another page-session token returns `null`. When writing state, shallow-merge `portfolioModal` into the existing Router user state instead of deleting unrelated keys.

- [ ] **Step 4: Write failing Router-hook tests**

Render a harness under `createMemoryRouter` with every entry using `/`. Prove these literal transitions:

1. missing state is replaced by current-session home state;
2. opening `pickle` records `window.scrollY`, replaces the home entry with exact `openingCardId`/`homeScrollY`, then pushes `depth: 1`;
3. switching to `lg-home-ai` pushes `depth: 2`, preserves the original card/scroll in both modal states, and leaves the replaced home entry intact;
4. Back returns to `pickle`, then home;
5. explicit close from depth 2 lands directly on home;
6. stale, invalid-depth, and unknown-project state is replaced in place and never used as a negative navigation delta.

- [ ] **Step 5: Run hook tests and verify RED**

Run:

```powershell
npm test -- src/hooks/useProjectModalHistory.test.tsx
```

Expected: FAIL because the hook does not exist.

- [ ] **Step 6: Implement the minimal Router coordinator**

Use `useLocation`, `useNavigate`, and ordered project helpers. Sequence opening as an awaited Router `replace` of the current home entry followed by a Router PUSH to `/`. Both writes shallow-merge the namespaced `portfolioModal` payload into existing user state. Carry the same session token, opening id, and captured scroll through project switches; only a switch PUSH increments depth. Close only validated current-session project state with `navigate(-depth)`.

Interpret invalid state synchronously as closed, then replace it with fresh current-session home state in a layout effect. Do not write raw browser history in this hook.

- [ ] **Step 7: Verify Task 3 GREEN**

Run:

```powershell
npm test -- src/router/modalHistory.test.ts src/hooks/useProjectModalHistory.test.tsx
npm test
npm run lint
```

Expected: state, hook, full-suite, and lint checks pass.

- [ ] **Step 8: Commit the history foundation**

Stage only Task 3 files, inspect the cached diff, and commit:

```text
feat(projects): add same-url modal history
```

---

### Task 4: Render and integrate the floating project detail panel

**Files:**
- Create: `src/hooks/useBodyScrollLock.ts`
- Create: `src/hooks/useBodyScrollLock.test.tsx`
- Create: `src/components/ProjectDetailModal.tsx`
- Create: `src/components/ProjectDetailModal.test.tsx`
- Modify: `src/components/ProjectCard.tsx`
- Modify: `src/components/ProjectCard.test.tsx`
- Modify: `src/sections/ProjectsSection.tsx`
- Modify: `src/pages/PortfolioHomePage.tsx`
- Modify: `src/router/AppRouter.tsx`
- Modify: `src/router/AppRouter.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/test/setup.ts`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: `useProjectModalHistory` and route-neutral `ProjectDetailView`.
- Produces: `ProjectDetailModalProps` with `project`, `previousProject`, `nextProject`, `openingCardId`, `homeScrollY`, `onClose`, optional `onPreviousProject`, and optional `onNextProject`.
- Produces: `ProjectCard` prop `onOpenProject(projectId: string): void`.
- Produces: `createAppRoutes(pageSessionToken: string)` so the token is created once before Router construction and passed into the home page.

- [ ] **Step 1: Write failing body-lock and dialog tests**

For the lock hook, use `vi.spyOn(window, 'scrollY', 'get').mockReturnValue(640)` and define `document.documentElement.clientWidth` as `window.innerWidth - 16`. Render a harness and require deterministic scrollbar compensation, saved/restored body styles, and `window.scrollTo({ top: 640, behavior: 'auto' })` on cleanup.

For the modal, render the real detail view through the portal and assert:

```tsx
const dialog = screen.getByRole('dialog', { name: 'PICKLE 맛집 추천 챗봇' })
expect(dialog).toHaveAttribute('aria-modal', 'true')
expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'PICKLE 맛집 추천 챗봇' }))
expect(document.getElementById('portfolio-app-shell')).toHaveAttribute('inert')
```

Add real user-event cases for close button, Escape, backdrop-only click, no close for panel click, Tab/Shift+Tab cycling, project-change scroll reset, heading refocus, and unmount focus restoration. Capture the original dialog node, switch projects, and assert the same dialog remains open while only the keyed detail content changes.

- [ ] **Step 2: Run modal mechanics tests and verify RED**

Run:

```powershell
npm test -- src/hooks/useBodyScrollLock.test.tsx src/components/ProjectDetailModal.test.tsx
```

Expected: FAIL because the lock hook and modal do not exist.

- [ ] **Step 3: Implement scroll lock, inert shell, portal, and focus behavior**

Render the backdrop with `createPortal(..., document.body)`. Use `role="dialog"`, `aria-modal="true"`, and the active heading id. A sticky `닫기` button remains the first tabbable control. Accept the validated `openingCardId` and `homeScrollY` explicitly from modal history; do not recapture or rename them inside the modal.

The backdrop handler closes only for `event.target === event.currentTarget`. A document keydown handler closes on Escape and wraps Tab/Shift+Tab across enabled tabbables inside the panel. Opening and every active-project change reset the content scroller to `0` with immediate behavior and focus the heading using `{ preventScroll: true }`.

Set `inert` on `#portfolio-app-shell` only; the portal must be its sibling outside the shell. Lock body scroll and compensate the removed scrollbar. On cleanup, unlock, restore `homeScrollY`, then focus the exact element id in `openingCardId`, with the Projects heading as fallback.

- [ ] **Step 4: Write failing card and home-integration tests**

Require each card to expose exactly one button with `aria-haspopup="dialog"`, a stable trigger id, no internal route link, and the exact accessible name `${title} 프로젝트 상세 보기`.

In a memory Router built from `createAppRoutes('test-session')`, prove:

- clicking every card opens its matching dialog at pathname `/` with empty hash;
- previous/next keeps the dialog open and changes content;
- Router Back returns to the prior project and then closes;
- close from a multi-project history returns directly home;
- scroll and focus restore to the original card;
- the `프로젝트 목록` action is absent and the GitHub action remains safe.

- [ ] **Step 5: Run integration tests and verify RED**

Run:

```powershell
npm test -- src/components/ProjectCard.test.tsx src/App.test.tsx src/router/AppRouter.test.tsx
```

Expected: FAIL because cards still route and the home page does not render a modal.

- [ ] **Step 6: Integrate the modal into the home page**

Create one page-session token before `createBrowserRouter`, change routes to a `createAppRoutes(pageSessionToken)` factory, and pass the token to `PortfolioHomePage`. Keep the temporary legacy detail route until Task 5.

Wrap Header/Main/Footer in `#portfolio-app-shell`. Pass `openProject` through ProjectsSection into ProjectCard. Replace the card `Link` with this explicit valid structure while preserving the current image, heading, role, technologies, hover, pointer, and focus appearance:

```tsx
<article id={project.id} className="project-card …">
  <button
    id={`project-card-trigger-${project.id}`}
    className="project-card__trigger"
    type="button"
    aria-haspopup="dialog"
    aria-label={`${project.title} 프로젝트 상세 보기`}
    onClick={() => onOpenProject(project.id)}
  />
  <div className="project-card__visual">…existing image and flow content…</div>
</article>
```

Set the article to `position: relative`; set the trigger to `position: absolute; inset: 0; z-index: 1; background: transparent; border: 0; cursor: pointer`; keep all non-interactive visual content below it. Move the focus-visible boundary to `.project-card__trigger:focus-visible`. This guarantees a full-surface trigger and exactly one tab stop without placing headings or flow containers inside a button.

Render `ProjectDetailModal` only for validated `activeProject`; pass adjacency and controller callbacks. Remove `ScrollRestoration` now so same-address modal entries cannot reset home scroll.

- [ ] **Step 7: Add the approved responsive styling**

Add focused classes for:

```css
.project-detail-modal__backdrop { position: fixed; inset: 0; z-index: 1000; }
.project-detail-modal__panel { width: min(1120px, calc(100% - 2rem)); max-height: 88dvh; }
.project-detail-modal__content { overflow-y: auto; overscroll-behavior: contain; }
```

Key the inner `.project-detail-modal__detail` container by `project.id` and apply a restrained opacity fade using `--transition-fast`; the outer dialog remains mounted during project switches. Use existing surface, border, shadow, and focus tokens. At the mobile breakpoint use width `100%`, height/max-height `100dvh`, no radius/gap, and safe-area padding. Add reduced-motion rules that set the detail animation to `none` and remove transform/smooth transition while retaining immediate state changes, plus forced-colors boundaries.

- [ ] **Step 8: Verify Task 4 GREEN**

Run:

```powershell
npm test -- src/hooks/useBodyScrollLock.test.tsx src/components/ProjectDetailModal.test.tsx src/components/ProjectCard.test.tsx src/App.test.tsx src/router/AppRouter.test.tsx
npm test
npm run lint
npm run build
```

Expected: focused tests, full suite, lint, and production build pass.

- [ ] **Step 9: Commit modal mechanics and integration by logical scope**

Inspect all changed files, then create two commits if the staged diff cleanly separates mechanics from page integration:

```text
feat(projects): add accessible floating detail modal
feat(projects): open project details from home cards
```

If the files are inseparable without leaving a broken commit, create one scoped commit:

```text
feat(projects): open details in an accessible modal
```

---

### Task 5: Remove legacy addresses and generate only the root fallback

**Files:**
- Create: `build/rootFallback.ts`
- Create: `build/rootFallback.test.ts`
- Modify: `src/App.tsx`
- Modify: `src/router/AppRouter.tsx`
- Modify: `src/router/AppRouter.test.tsx`
- Modify: `src/lib/projects.ts`
- Modify: `src/lib/projects.test.ts`
- Modify: `src/lib/projectMetadata.ts`
- Modify: `src/lib/projectMetadata.test.ts`
- Modify: `vite.config.ts`
- Delete: `src/pages/ProjectDetailPage.tsx`
- Delete: `src/pages/NotFoundPage.tsx`
- Delete: `src/components/DetailHeader.tsx`
- Delete: `src/components/project-detail/ProjectDetailLayout.tsx`
- Delete: `build/projectRouteEntries.ts`
- Delete: `build/projectRouteEntries.test.ts`

**Interfaces:**
- Produces: `normalizeInitialBrowserEntry()` that runs before Router construction, preserves Router history envelope and unrelated user-state fields, removes only `usr.portfolioModal`, normalizes path/hash to `/`, and resets initial scroll to top.
- Produces: one home route and same-address location-state navigation only.
- Produces: `createRootFallbackPlugin()` copying emitted root `index.html` to `404.html` after Vite emits hashed assets.
- Removes: project path helpers, project/not-found metadata, detail/not-found routes, and nested static entries.

- [ ] **Step 1: Write failing bootstrap and root-router tests**

Test a controlled History state resembling React Router's envelope:

```ts
window.history.replaceState({
  idx: 7,
  key: 'router-key',
  usr: { portfolioModal: { view: 'project' }, unrelated: 'keep-me' },
}, '', '/projects/pickle/#journey')

normalizeInitialBrowserEntry(window)

expect(window.location.pathname).toBe('/')
expect(window.location.hash).toBe('')
expect(window.history.state).toEqual({
  idx: 7,
  key: 'router-key',
  usr: { unrelated: 'keep-me' },
})
expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' })
```

Update Router tests so `/` is the only declared app route. Verify initialization order by constructing the browser router only after normalization; direct legacy paths and hashes render the closed home view and keep home metadata.

- [ ] **Step 2: Run bootstrap/router tests and verify RED**

Run:

```powershell
npm test -- src/router/modalHistory.test.ts src/router/AppRouter.test.tsx
```

Expected: FAIL because bootstrap normalization and root-only routing are not implemented.

- [ ] **Step 3: Implement pre-Router normalization and root-only routes**

Add `normalizeInitialBrowserEntry` beside the other modal-history primitives. Preserve every existing enumerable History field and every unrelated Router user-state property; remove only the namespaced modal payload:

```ts
const current = window.history.state
const userState = isRecord(current?.usr) ? current.usr : null
const { portfolioModal: _removed, ...remainingUserState } = userState ?? {}
const next = isRecord(current)
  ? { ...current, usr: userState ? remainingUserState : current.usr }
  : current
window.history.replaceState(next, '', '/')
```

Call it in `App.tsx` before the statement that creates the browser Router. Then create a fresh page-session token and root-only route factory. Remove `ProjectDetailPage`, `NotFoundPage`, detail layout/header, route imports, and stale tests.

- [ ] **Step 4: Write failing build-output tests**

Run the real Vite plugin hook against an isolated temporary output directory containing an emitted `index.html`. Assert that closeBundle creates an identical `404.html`, preserves `index.html`, and creates no `projects` directory.

- [ ] **Step 5: Run the build test and verify RED**

Run:

```powershell
npm test -- build/rootFallback.test.ts
```

Expected: FAIL because the root fallback plugin does not exist.

- [ ] **Step 6: Replace nested route generation with root fallback generation**

Create `createRootFallbackPlugin()` using Vite's resolved `build.outDir`; after build, copy only emitted `index.html` to `404.html`. Update Vite config and delete the project-entry generator and its tests.

Remove `getProjectPath`, `getProjectMetadata`, and not-found metadata plus their route-only test cases. Keep `homeMetadata` and all project ordering/content helpers used by the modal.

- [ ] **Step 7: Verify complete automated behavior**

Run fresh commands:

```powershell
npm run lint
npm test
npm run build
```

Inspect `dist` and require:

- `dist/index.html` exists;
- `dist/404.html` exists and references production assets;
- no `dist/projects` directory exists;
- root title, description, and Open Graph URL remain the canonical home values.

- [ ] **Step 8: Perform browser acceptance**

Serve the production build and verify:

1. Header, Footer, growth controls, normal scroll, card opening, and project switching leave the address exactly `/`.
2. All five projects open the correct shared detail content.
3. Back/Forward state order, direct close, refresh reset, and legacy-path normalization match the design.
4. Desktop, tablet, and 360px layouts show centered/full-screen behavior with no horizontal overflow and long internal scrolling.
5. Pointer, keyboard, Escape, focus trap/restoration, backdrop guard, light/dark, reduced-motion, and forced-colors behavior remain usable.
6. No unrelated home section regresses.

- [ ] **Step 9: Commit cleanup and fallback scopes**

Inspect every changed/deleted file. Prefer two commits:

```text
refactor(routing): keep portfolio on the root route
build(pages): generate root fallback only
```

Stage exact paths for each scope and verify each cached diff before committing.

---

### Task 6: Whole-feature review, fix wave, and publication

**Files:**
- Modify only files required by concrete final-review findings.
- Write reports under this plan's `.superpowers/sdd/2026-08-08-single-url-floating-project-details/` workspace.

**Interfaces:**
- Consumes: all Tasks 1–5 and the approved design specification.
- Produces: reviewed, verified, committed, and pushed `main`.

- [ ] **Step 1: Run a whole-range code review**

Package the diff from the pre-plan implementation base through current HEAD. Dispatch the most capable reviewer against both the implementation plan and design. Require explicit Critical/Important/Minor findings and a merge verdict.

- [ ] **Step 2: Resolve findings with one TDD fix wave**

If the final review finds Critical or Important issues, send the complete list to one fresh implementer. Every bug fix starts with a failing regression test, records RED/GREEN evidence, and is committed separately. Run one scoped re-review of the fix range.

- [ ] **Step 3: Run final verification from a clean state**

Run:

```powershell
npm run lint
npm test
npm run build
git diff --check
git status --short --branch
```

Repeat production browser acceptance for the behaviors affected by any fix. Do not claim completion unless every fresh command exits successfully and all expected test counts are visible.

- [ ] **Step 4: Inspect commit boundaries and push main**

Use `commit-workflow` to inspect every remaining file and create any final scoped commit. Confirm no unrelated or uncommitted files remain, then push:

```powershell
git push origin main
```

Confirm local `main`, `origin/main`, and the pushed HEAD commit resolve to the same SHA. Report any deploy-time GitHub Pages check separately if publication has not completed yet.
