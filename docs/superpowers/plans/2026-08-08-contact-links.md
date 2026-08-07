# Contact Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the verified Tistory blog and email to Contact in the approved order while keeping Hero GitHub-only.

**Architecture:** Extend the profile data with `blogUrl`, then replace the shared social-link selector with placement-specific pure helpers. `HeroSection` consumes only Hero links, while `ContactSection` consumes Contact links and keeps the existing safe external-link behavior.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library

## Global Constraints

- Hero keeps its existing GitHub link only.
- Contact displays links in this order: GitHub, Blog, Email.
- Blog is exactly `https://minhyeok328.tistory.com/`.
- Email is exactly `tjalsgur328@gmail.com` and links to `mailto:tjalsgur328@gmail.com`.
- GitHub and Blog open in a new tab with `rel="noreferrer"`; Email does not.
- Empty optional LinkedIn remains hidden.
- Add no dependency, icon library, section, animation, or layout change.
- Do not commit implementation files unless the user explicitly authorizes an implementation commit.

---

### Task 1: Add placement-specific profile links

**Files:**
- Modify: `src/types/portfolio.ts`
- Modify: `src/data/portfolio.ts`
- Modify: `src/lib/portfolio.ts`
- Modify: `src/lib/portfolio.test.ts`
- Modify: `src/sections/HeroSection.tsx`
- Modify: `src/sections/HeroSection.test.tsx`
- Modify: `src/sections/ContactSection.tsx`
- Create: `src/sections/ContactSection.test.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Consumes: `Profile` from `src/types/portfolio.ts` and the existing profile object from `src/data/portfolio.ts`.
- Produces: `getVisibleHeroLinks(profile: Profile)` and `getVisibleContactLinks(profile: Profile)`, each returning filtered `{ label: string; href: string }[]` values.

- [x] **Step 1: Write failing helper and component tests**

Update `src/lib/portfolio.test.ts` to import both placement-specific selectors and assert the approved data:

```ts
expect(getVisibleHeroLinks(portfolioData.profile)).toEqual([
  { label: 'GitHub', href: 'https://github.com/minhyeok328' },
])
expect(getVisibleContactLinks(portfolioData.profile)).toEqual([
  { label: 'GitHub', href: 'https://github.com/minhyeok328' },
  { label: '블로그', href: 'https://minhyeok328.tistory.com/' },
  { label: 'Email', href: 'mailto:tjalsgur328@gmail.com' },
])
```

Update `src/sections/HeroSection.test.tsx` so its populated fixture includes `blogUrl`, `email`, and `linkedinUrl`, then assert Hero still exposes only `GitHub 보기`.

Create `src/sections/ContactSection.test.tsx` and verify link order and attributes:

```tsx
render(<ContactSection profile={portfolioData.profile} />)
const contact = screen.getByRole('region', { name: 'Contact' })
const links = within(contact).getAllByRole('link')

expect(links.map((link) => link.textContent)).toEqual([
  'GitHub 보기',
  '블로그 보기',
  'Email 보내기',
])
expect(links[0]).toHaveAttribute('target', '_blank')
expect(links[0]).toHaveAttribute('rel', 'noreferrer')
expect(links[1]).toHaveAttribute('href', 'https://minhyeok328.tistory.com/')
expect(links[1]).toHaveAttribute('target', '_blank')
expect(links[1]).toHaveAttribute('rel', 'noreferrer')
expect(links[2]).toHaveAttribute('href', 'mailto:tjalsgur328@gmail.com')
expect(links[2]).not.toHaveAttribute('target')
expect(links[2]).not.toHaveAttribute('rel')
```

Update `src/App.test.tsx` to assert two GitHub links, one Contact-only blog link, one Contact-only email link, and no LinkedIn link.

- [x] **Step 2: Run focused tests and verify the RED state**

Run:

```powershell
npm.cmd run test -- src/lib/portfolio.test.ts src/sections/HeroSection.test.tsx src/sections/ContactSection.test.tsx src/App.test.tsx
```

Expected: FAIL because `blogUrl`, `getVisibleHeroLinks`, and `getVisibleContactLinks` do not yet exist and the Contact links are absent.

- [x] **Step 3: Add the minimal data model and selectors**

Add `blogUrl: string` to `Profile`, populate the exact Blog and Email values, and replace the shared selector with:

```ts
export function getVisibleHeroLinks(profile: Profile) {
  return [
    { label: 'GitHub', href: profile.githubUrl },
  ].filter((link) => link.href.length > 0)
}

export function getVisibleContactLinks(profile: Profile) {
  return [
    { label: 'GitHub', href: profile.githubUrl },
    { label: '블로그', href: profile.blogUrl },
    { label: 'Email', href: profile.email ? `mailto:${profile.email}` : '' },
    { label: 'LinkedIn', href: profile.linkedinUrl },
  ].filter((link) => link.href.length > 0)
}
```

Change `HeroSection` to call `getVisibleHeroLinks(profile)` and `ContactSection` to call `getVisibleContactLinks(profile)`. Keep the existing label formatting so `블로그` becomes `블로그 보기` and Email remains `Email 보내기`.

- [x] **Step 4: Run focused tests and verify the GREEN state**

Run:

```powershell
npm.cmd run test -- src/lib/portfolio.test.ts src/sections/HeroSection.test.tsx src/sections/ContactSection.test.tsx src/App.test.tsx
```

Expected: all focused tests PASS.

- [x] **Step 5: Run the complete verification gate**

Run:

```powershell
npm.cmd run lint
npm.cmd run test
npm.cmd run build
```

Expected: lint exits successfully, every test passes, and Vite produces a successful production build.

- [x] **Step 6: Review the final diff and leave implementation uncommitted**

Inspect only the listed implementation and test files, confirm no unrelated files changed, and report the verified behavior. Do not stage or commit the implementation without a new explicit request from the user.
