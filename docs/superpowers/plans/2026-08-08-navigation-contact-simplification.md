# Navigation and Contact Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove duplicate Hero destinations, keep external links as accessible Contact icons, and synchronize the URL hash with the section selected by scrolling.

**Architecture:** Keep the existing Header anchors and `IntersectionObserver` hook. Extend the hook's observed IDs to include `top`, synchronize canonical hashes with `history.replaceState`, and preserve project-specific hashes while their owning section remains active. Move icon rendering into a focused component while Contact keeps link semantics and data ordering.

**Tech Stack:** React 19, TypeScript 6, Vitest, Testing Library, Lucide React, CSS

## Global Constraints

- Header is the only section-navigation control; Hero contains no action or social links.
- Contact owns GitHub, Blog, and Email links in that order.
- Use `history.replaceState`, never `pushState` or a new router, for automatic scroll synchronization.
- Canonical hashes are `#top`, `#about`, `#projects`, `#journey`, `#skills`, and `#contact`.
- Preserve a project-specific hash while that project's canonical parent section is active.
- Contact icons remain accessible by exact names: `GitHub 보기`, `블로그 보기`, and `Email 보내기`.
- Add no dependency and do not change verified URLs, section content, theme behavior, or project layout.
- Do not stage or commit files unless the user explicitly asks for a commit.

---

### Task 1: Remove duplicated Hero destinations

**Files:**
- Modify: `src/sections/HeroSection.test.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/lib/portfolio.test.ts`
- Modify: `src/sections/HeroSection.tsx`
- Modify: `src/lib/portfolio.ts`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: `Profile` from `src/types/portfolio.ts`.
- Produces: `HeroSection({ profile }: HeroSectionProps)` with introduction text and `ImageWithFallback`, but no links or navigation.

- [x] **Step 1: Write failing Hero and integration expectations**

Replace the Hero test's link-order assertions with explicit absence checks:

```tsx
render(<HeroSection profile={profile} />)

const hero = screen.getByRole('region', { name: '서민혁입니다.' })
const heroScope = within(hero)

expect(heroScope.queryByRole('link')).not.toBeInTheDocument()
expect(heroScope.queryByRole('navigation')).not.toBeInTheDocument()
expect(heroScope.getByRole('img', { name: '서민혁 프로필 사진 대체 이미지' })).toBeVisible()
```

Populate `resumeUrl`, Blog, Email, and LinkedIn in a second fixture and assert that none creates a Hero link. In `src/App.test.tsx`, replace the `always links to Projects from the hero` test and the two-GitHub expectation with:

```tsx
const hero = screen.getByRole('region', { name: '서민혁입니다.' })
const contact = screen.getByRole('region', { name: 'Contact' })

expect(within(hero).queryByRole('link')).not.toBeInTheDocument()
expect(within(hero).queryByRole('navigation')).not.toBeInTheDocument()
expect(screen.getAllByRole('link', { name: 'GitHub 보기' })).toHaveLength(1)
expect(within(contact).getByRole('link', { name: 'GitHub 보기' })).toBeVisible()
```

Remove `getVisibleHeroLinks` from the imports and delete its Hero-only helper test in `src/lib/portfolio.test.ts`.

- [x] **Step 2: Run focused tests and verify RED**

Run:

```powershell
npm.cmd run test -- src/sections/HeroSection.test.tsx src/App.test.tsx src/lib/portfolio.test.ts
```

Expected: FAIL because Hero still renders `프로젝트 보기` and `GitHub 보기`.

- [x] **Step 3: Remove Hero actions and obsolete helper code**

Reduce `HeroSection` to its text and profile visual:

```tsx
export function HeroSection({ profile }: HeroSectionProps) {
  return (
    <section id="top" className="site-container hero" aria-labelledby="hero-heading">
      <div className="hero__content">
        <p className="hero__greeting">{profile.greeting}</p>
        <h1 id="hero-heading">{profile.name}입니다.</h1>
        <p className="hero__role">{profile.role}</p>
        <p className="hero__description">{profile.description}</p>
      </div>
      <ImageWithFallback
        className="hero__profile-image"
        src={profile.profileImage}
        alt={`${profile.name} 프로필 사진`}
        fallback="MH"
      />
    </section>
  )
}
```

Delete `getVisibleHeroLinks` from `src/lib/portfolio.ts`. Remove the unused `.hero__actions`, `.hero__social-links`, `.hero__primary-link`, and `.hero__resume-link` rules from `src/index.css`. In the mobile-width selector group, remove only the obsolete Hero selectors and temporarily retain the Contact selectors for Task 2.

- [x] **Step 4: Run focused tests and verify GREEN**

Run the Step 2 command again.

Expected: all focused tests PASS and TypeScript reports no unused import.

- [x] **Step 5: Review Task 1 scope**

Run:

```powershell
git diff -- src/sections/HeroSection.tsx src/sections/HeroSection.test.tsx src/lib/portfolio.ts src/lib/portfolio.test.ts src/App.test.tsx src/index.css
```

Expected: only Hero link removal, associated expectations, and orphaned styles/helper code are changed.

---

### Task 2: Replace Contact buttons with accessible icons

**Files:**
- Create: `src/components/ContactIcon.tsx`
- Modify: `src/sections/ContactSection.test.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/sections/ContactSection.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: the existing link `label: string` from `getVisibleContactLinks(profile)`.
- Produces: `ContactIcon({ label }: { label: string })`, which renders one decorative SVG and falls back to Lucide `ExternalLink`.

- [x] **Step 1: Write failing icon and accessibility tests**

In `src/sections/ContactSection.test.tsx`, replace visible-text order checks with accessible-name checks while retaining all URL, target, and rel assertions:

```tsx
expect(links).toHaveLength(3)
expect(links[0]).toHaveAccessibleName('GitHub 보기')
expect(links[1]).toHaveAccessibleName('블로그 보기')
expect(links[2]).toHaveAccessibleName('Email 보내기')

links.forEach((link) => {
  expect(link).toHaveTextContent('')
  expect(link.querySelector('svg[aria-hidden="true"]')).not.toBeNull()
})
```

Add a fallback test with `linkedinUrl: 'https://www.linkedin.com/in/example'` and assert that `LinkedIn 보기` contains a decorative SVG. Update `src/App.test.tsx` Contact ordering assertions to use accessible names instead of `textContent`.

- [x] **Step 2: Run focused tests and verify RED**

Run:

```powershell
npm.cmd run test -- src/sections/ContactSection.test.tsx src/App.test.tsx
```

Expected: FAIL because Contact links still expose visible text and contain no SVG.

- [x] **Step 3: Add the focused icon renderer**

Create `src/components/ContactIcon.tsx` with Lucide `BookOpen`, `ExternalLink`, and `Mail`, plus a local GitHub mark:

```tsx
import { BookOpen, ExternalLink, Mail } from 'lucide-react'
import type { SVGProps } from 'react'

function GitHubIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.333-1.754-1.333-1.754-1.089-.745.084-.729.084-.729 1.205.084 1.838 1.237 1.838 1.237 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297 24 5.67 18.627.297 12 .297Z" />
    </svg>
  )
}

export function ContactIcon({ label }: { label: string }) {
  const iconProps = { 'aria-hidden': true, focusable: false } as const

  if (label === 'GitHub') return <GitHubIcon {...iconProps} />
  if (label === '블로그') return <BookOpen {...iconProps} />
  if (label === 'Email') return <Mail {...iconProps} />
  return <ExternalLink {...iconProps} />
}
```

- [x] **Step 4: Render icon-only Contact anchors**

Import `ContactIcon` and replace link text with:

```tsx
const actionLabel = getActionLabel(link.label)

<a
  href={link.href}
  target={isExternal ? '_blank' : undefined}
  rel={isExternal ? 'noreferrer' : undefined}
  aria-label={actionLabel}
  title={actionLabel}
>
  <ContactIcon label={link.label} />
</a>
```

Keep the existing `<ul>/<li>` structure and link ordering.

- [x] **Step 5: Restyle Contact links as bare icons**

Replace the current Contact anchor button styles with:

```css
.contact-section__links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.contact-section__links a {
  display: inline-flex;
  width: 2.75rem;
  height: 2.75rem;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: var(--color-text-secondary);
  background: transparent;
  border: 0;
  border-radius: 50%;
  text-decoration: none;
  transition: color var(--transition-fast), background-color var(--transition-fast), transform var(--transition-fast);
}

.contact-section__links a:is(:hover, :focus-visible) {
  color: var(--color-text-primary);
  background: var(--color-surface);
  transform: translateY(-1px);
}

.contact-section__links svg {
  width: 1.25rem;
  height: 1.25rem;
  flex: 0 0 auto;
}
```

At the `max-width: 479px` rule, remove the remaining `.contact-section__links`, list-item, and anchor width declarations so icons stay compact and horizontal. Delete that width declaration block if no selectors remain; preserve the separate `.site-footer` rule.

- [x] **Step 6: Run focused tests and verify GREEN**

Run the Step 2 command again.

Expected: both test files PASS; Contact links have exact accessible names, icons, and unchanged destinations.

- [x] **Step 7: Review Task 2 scope**

Run:

```powershell
git diff -- src/components/ContactIcon.tsx src/sections/ContactSection.tsx src/sections/ContactSection.test.tsx src/App.test.tsx src/index.css
```

Expected: only icon rendering, accessibility expectations, and Contact-specific visual rules changed.

---

### Task 3: Synchronize scroll position and URL hash

**Files:**
- Modify: `src/hooks/useActiveSection.test.tsx`
- Modify: `src/hooks/useActiveSection.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: ordered canonical section IDs passed to `useActiveSection(sectionIds: string[])`.
- Produces: the active canonical ID and a URL hash synchronized with the most visible observed section.

- [x] **Step 1: Expand the observer test harness and write failing URL tests**

Refactor the current test-local observer into a helper that exposes its callback:

```tsx
function installIntersectionObserver() {
  let callback: IntersectionObserverCallback | undefined

  class TestIntersectionObserver {
    constructor(observerCallback: IntersectionObserverCallback) {
      callback = observerCallback
    }

    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  }

  vi.stubGlobal('IntersectionObserver', TestIntersectionObserver)

  return (entries: IntersectionObserverEntry[]) => {
    act(() => callback?.(entries, {} as IntersectionObserver))
  }
}
```

Reset the URL before every test with:

```tsx
beforeEach(() => {
  window.history.replaceState(null, '', '/')
})
```

Add these cases:

```tsx
it('replaces the hash when scrolling selects another canonical section', () => {
  document.body.innerHTML = '<section id="top"></section><section id="projects"></section>'
  const emit = installIntersectionObserver()
  const replaceState = vi.spyOn(window.history, 'replaceState')
  const pushState = vi.spyOn(window.history, 'pushState')
  const projects = document.getElementById('projects')!
  const { result } = renderHook(() => useActiveSection(['top', 'projects']))

  emit([intersectionEntry(projects, true, 0.8)])

  expect(result.current).toBe('projects')
  expect(window.location.hash).toBe('#projects')
  expect(replaceState).toHaveBeenCalledOnce()
  expect(pushState).not.toHaveBeenCalled()
})

it('does not write history when no observed section intersects', () => {
  document.body.innerHTML = '<section id="top"></section><section id="about"></section>'
  window.history.replaceState(null, '', '#top')
  const emit = installIntersectionObserver()
  const replaceState = vi.spyOn(window.history, 'replaceState')
  const about = document.getElementById('about')!
  renderHook(() => useActiveSection(['top', 'about']))

  emit([intersectionEntry(about, false, 0)])

  expect(window.location.hash).toBe('#top')
  expect(replaceState).not.toHaveBeenCalled()
})

it('does not replace an already canonical hash', () => {
  document.body.innerHTML = '<section id="top"></section><section id="projects"></section>'
  window.history.replaceState(null, '', '#projects')
  const emit = installIntersectionObserver()
  const replaceState = vi.spyOn(window.history, 'replaceState')
  const projects = document.getElementById('projects')!
  renderHook(() => useActiveSection(['top', 'projects']))

  emit([intersectionEntry(projects, true, 0.8)])

  expect(window.location.hash).toBe('#projects')
  expect(replaceState).not.toHaveBeenCalled()
})

it('preserves a project hash while its deepest canonical owner is active', () => {
  document.body.innerHTML = `
    <section id="projects">
      <article id="humour"></article>
      <section id="journey"><article id="pickle"></article></section>
    </section>
  `
  window.history.replaceState(null, '', '#pickle')
  const emit = installIntersectionObserver()
  const replaceState = vi.spyOn(window.history, 'replaceState')
  const journey = document.getElementById('journey')!
  renderHook(() => useActiveSection(['projects', 'journey']))

  emit([intersectionEntry(journey, true, 0.9)])

  expect(window.location.hash).toBe('#pickle')
  expect(replaceState).not.toHaveBeenCalled()
})
```

Retain the existing partial observer callback regression test.

- [x] **Step 2: Run the hook test and verify RED**

Run:

```powershell
npm.cmd run test -- src/hooks/useActiveSection.test.tsx
```

Expected: new hash assertions FAIL because the hook only updates React state.

- [x] **Step 3: Implement canonical hash ownership and synchronization**

Add focused helpers inside `src/hooks/useActiveSection.ts`:

```ts
function getHashOwner(sectionIds: string[]) {
  const hashTarget = document.getElementById(window.location.hash.slice(1))

  if (!hashTarget) {
    return ''
  }

  return sectionIds.reduce((owner, sectionId) => {
    const section = document.getElementById(sectionId)
    return section?.contains(hashTarget) ? sectionId : owner
  }, '')
}

function syncHash(activeSection: string, sectionIds: string[]) {
  const nextHash = `#${activeSection}`

  if (window.location.hash === nextHash || getHashOwner(sectionIds) === activeSection) {
    return
  }

  window.history.replaceState(window.history.state, '', nextHash)
}
```

In the observer callback, after selecting a real visible entry:

```ts
const nextActiveSection = visibleEntry.target.id
setObservedActiveSection(nextActiveSection)
syncHash(nextActiveSection, observedSectionIds)
```

Use the same `observedSectionIds` order for observing elements and resolving the deepest owner.

- [x] **Step 4: Include Hero in the observed canonical IDs**

Change `src/App.tsx` to:

```tsx
const navigationItems = getNavigationItems(portfolioData)
const observedSectionIds = ['top', ...navigationItems.map((item) => item.id)]
const activeSection = useActiveSection(observedSectionIds)
```

Continue passing the unmodified `navigationItems` to Header. When `activeSection === 'top'`, none of its menu links receives `aria-current`.

- [x] **Step 5: Run the hook and Header/App tests and verify GREEN**

Run:

```powershell
npm.cmd run test -- src/hooks/useActiveSection.test.tsx src/components/Header.test.tsx src/App.test.tsx
```

Expected: all focused tests PASS, project hashes are preserved within their owning section, and no `pushState` call occurs.

- [x] **Step 6: Review Task 3 scope**

Run:

```powershell
git diff -- src/hooks/useActiveSection.ts src/hooks/useActiveSection.test.tsx src/App.tsx
```

Expected: only canonical observation, hash synchronization, and test coverage changed.

---

### Task 4: Complete verification and responsive browser check

**Files:**
- Verify: all files changed by Tasks 1–3
- Update checkboxes only: `docs/superpowers/plans/2026-08-08-navigation-contact-simplification.md`

**Interfaces:**
- Consumes: completed Hero, Contact, and hash behavior.
- Produces: verified production-ready one-page navigation behavior at desktop and mobile sizes.

- [x] **Step 1: Run the full automated gate**

Run:

```powershell
npm.cmd run lint
npm.cmd run test
npm.cmd run build
```

Expected: lint exits successfully, all Vitest tests pass, and Vite creates a production build.

- [x] **Step 2: Start the local site and inspect desktop behavior**

Run the Vite development server on `127.0.0.1:5173`, then verify at 1440px:

- Hero contains no buttons or social links.
- Contact shows three gray, icon-only links in one row.
- GitHub, Blog, and Email expose the exact accessible names.
- Clicking Header links still scrolls smoothly.
- Manual scrolling updates `#top`, `#about`, `#projects`, `#journey`, `#skills`, and `#contact` as each section becomes active.
- Automatic section changes replace the current history entry rather than adding entries.
- Clicking a project growth link keeps its project-specific hash while the owning section remains active.

- [x] **Step 3: Inspect mobile and theme behavior**

Verify at 390px and 360px in both themes:

- the three Contact icons remain compact and horizontal;
- icon targets measure at least 44×44px;
- no horizontal overflow appears;
- focus outlines are visible;
- dark-theme icon contrast remains clear;
- the mobile Header menu still closes after selecting a section.

- [x] **Step 4: Inspect the final diff and working tree**

Run:

```powershell
git diff --check
git diff --stat
git status --short
```

Expected: no whitespace errors, only the approved source/tests/docs are changed, and nothing is staged or committed.
