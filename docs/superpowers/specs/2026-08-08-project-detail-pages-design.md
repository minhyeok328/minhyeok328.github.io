# Project Detail Pages Design

## Goal

Make the home page project cards fast to scan while giving every project a reusable case-study page that can grow into a technically detailed developer portfolio.

The initial release must work with the existing project copy. It must not require new metrics, screenshots, or retrospective content before the layout can ship.

## Approved Content Strategy

Use a hybrid of the reviewed options:

- The home page follows the role-first layout: concise project context, the developer's role, a small technology sample, and one clear internal navigation target.
- The detail page provides the technical depth: contributions, implementation decisions, technology boundaries, and reflection.
- No unverified outcomes or metrics are invented to make a card appear stronger.
- Optional detail sections are omitted when their data is empty instead of rendering placeholders on the published site.

## Home Project Cards

Each flagship and Journey card contains:

1. Project image or the existing accessible placeholder.
2. Stage.
3. Project title.
4. Short description.
5. A compact `내 역할` summary.
6. A reduced technology list.

The entire card is the single internal link to its project route. It contains no visible `상세 보기` label, arrow, or other CTA ornament. The existing hover lift and border emphasis remain the visual affordance, and the pointer changes to the link cursor over the full card.

The card link has an accessible name such as `HumouR 상세 페이지 보기`. Its keyboard `:focus-visible` treatment provides an equivalent clear boundary without adding an icon or changing the normal Tab order. Because repository actions have been removed from the card, the full-card link has no nested interactive descendants.

The role summary may be provided by a future optional card-summary field. Until that field is populated, the first existing contribution item is used and visually clamped so the current data remains publishable.

The flagship card may show up to four technologies. Journey cards show the first two technologies; the full technology list remains available on the detail page.

Repository links are deliberately removed from all home project cards. A visitor first enters the case study, then chooses `GitHub에서 코드 보기` with the project context available. The site's global profile GitHub link is unaffected.

## Project Routes

All five projects use clean, shareable paths derived from the existing project `id` values:

- `/projects/humour/`
- `/projects/vehicle-tco/`
- `/projects/bank-churners/`
- `/projects/pickle/`
- `/projects/lg-home-ai/`

Use React Router with browser-history URLs. Internal project links open in the same tab. Repository links open in a new tab with `rel="noreferrer"`.

Changing to a detail route scrolls to the top and moves programmatic focus to its `h1`. Returning through the explicit `프로젝트 목록` link targets `/#projects` and scrolls to the rendered Projects section. Browser Back restores the previous home-page scroll position instead of forcing the Projects anchor.

## Shared Detail Page

One data-driven `ProjectDetailPage` renders every project inside a shared detail layout. It is composed from reusable sections rather than five independent page files:

- `DetailHero`
- `QuickSummary`
- `ContributionSection`
- `TechnicalSection`
- `RetrospectiveSection`
- `ProjectActions`

### Detail Hero

The hero shows the stage, project title, image or placeholder, and two actions:

- `GitHub에서 코드 보기`: the single prominent repository action on the project page.
- `프로젝트 목록`: returns to the home project section.

The repository action is not repeated at the bottom of the page. Previous and next project navigation remains visually separate from the repository action.

### Quick Summary

The summary gives a recruiter a short orientation before the long-form sections:

- Project purpose, derived from the current description.
- Developer role, derived from the optional card summary or first contribution.
- Growth, derived from the current growth field.

The current description, first contribution, and growth statement each appear here once. They are not repeated as fallback copy in later sections.

### Detail Sections

The page renders sections in this order:

1. `프로젝트 개요`: optional long-form overview; hidden until populated.
2. `직접 기여`: the current contribution items not already used as the fallback role summary.
3. `기술 설계와 판단`: optional structured decisions; hidden until populated.
4. `기술 구성`: current direct technologies and, when present, team-system technologies in separate groups.
5. `성장과 회고`: optional long-form retrospective; hidden until populated.
6. Previous and next project navigation, ordered by the existing `order` field.

With only today's data, the visible body is therefore `직접 기여 → 기술 구성 → 프로젝트 이동`. The existing project purpose, role, and growth copy remains visible once in Quick Summary. Future overview, technical-decision, and retrospective content slots into the shared order without changing page components.

The initial technical signal comes from the concrete contribution list and the separation between directly used and team-system technologies. Structured decisions deepen that evidence later; an empty decisions list never produces a decorative or placeholder section.

## Data Model

The existing `Project` object remains the single source of truth. The initial layout consumes its current fields. Optional detail fields define the reusable case-study extension point while allowing every current project to remain valid:

```ts
interface ProjectDecision {
  title: string
  situation: string
  choice: string
  reason: string
  implementation: string
  result?: string
  reflection?: string
}

interface ProjectDetail {
  overview?: string[]
  decisions?: ProjectDecision[]
  retrospective?: string[]
}

interface Project {
  // existing fields remain unchanged
  cardRoleSummary?: string
  detail?: ProjectDetail
}
```

Rendering rules keep the initial page deterministic and avoid repeated copy:

- Card role: `cardRoleSummary` then `contribution[0]`.
- Quick Summary purpose: `description`.
- Quick Summary growth: `growth`.
- Contribution section: render the full contribution list when `cardRoleSummary` exists; otherwise render `contribution.slice(1)` because the first item is already visible as the role summary.
- Overview: render only when `detail.overview` has entries.
- Retrospective: render only when `detail.retrospective` has entries.
- Technical decisions: render only when `detail.decisions` has entries.
- Team-system technologies: render only when `teamTechnologies` has entries.

Optional paragraph arrays are normalized to an empty array before section rendering. Components do not accept both string and array shapes for the same prop.

No content field is duplicated into separate page-specific files.

## Application Structure

Routing separates the existing one-page portfolio from the new project views:

```text
AppRouter
├── PortfolioHomePage
│   ├── existing section-aware Header
│   ├── ProjectsSection
│   │   └── ProjectCard
│   └── Footer
├── ProjectDetailLayout
│   ├── DetailHeader
│   ├── ProjectDetailPage
│   │   ├── DetailHero
│   │   ├── QuickSummary
│   │   ├── ContributionSection
│   │   ├── TechnicalSection
│   │   ├── RetrospectiveSection
│   │   └── ProjectActions
│   └── Footer
└── NotFoundPage
```

A small project helper exposes the ordered project collection, lookup by `id`, and previous/next project resolution. The router, cards, detail page, and static route generation all consume the same ids.

The current home-page sections, section-hash navigation, header behavior, and project order remain unchanged apart from the project-card content reduction and new detail links.

The detail header does not reuse home-only `#about` or `#skills` hrefs. Its brand and Home actions target `/`, Projects targets `/#projects`, and the profile GitHub action retains its existing external URL. This prevents a detail route such as `/projects/humour/#skills` from pointing at a nonexistent section.

## GitHub Pages Direct Navigation

Client-side routing alone is insufficient for a refreshed clean URL on GitHub Pages. A small Vite `closeBundle` plugin in `vite.config.ts` therefore runs as part of the existing production build and creates a real entry file for every approved project route:

```text
dist/projects/<project-id>/index.html
```

The plugin imports the same project data used by the application, orders all projects, and derives route directories from their ids rather than maintaining a second hard-coded list. Each generated file starts from the Vite-built root HTML, whose root-based asset URLs remain valid from nested paths.

Before writing each project entry, the plugin substitutes route-specific `<title>`, description, Open Graph title, Open Graph description, and canonical Open Graph URL using the existing title and description fields. The React detail page renders the same metadata for client-side navigation, so a direct refresh and an in-app route change remain consistent. New copy and per-project Open Graph images are not required.

The build also emits `dist/404.html` from the same application entry so unknown GitHub Pages paths can render the application's `NotFoundPage`. The router still owns the visible not-found state.

## Responsive and Accessibility Behavior

- Cards remain one-column at the current mobile breakpoint and preserve the existing readable order.
- The detail hero and quick summary stack on narrow screens without horizontal scrolling.
- Every detail page has one `h1` and labelled semantic sections.
- A detail-route navigation scrolls to the top, then focuses an `h1` that is programmatically focusable without adding it to the normal Tab sequence.
- Loading `/#projects` waits until the home sections render before scrolling to Projects. Browser Back uses saved scroll restoration instead of the explicit hash behavior.
- The home card's link semantics, pointer cursor, hover treatment, and keyboard focus treatment communicate internal navigation without visible CTA copy. `GitHub에서 코드 보기` remains the explicit external action on the detail page.
- Empty optional sections are absent from both the visual layout and accessibility tree.

## Verification

Add regression coverage for the approved behavior:

1. The full surface of every home project card links to its clean detail route and has a project-specific accessible name.
2. Home project cards contain no repository link.
3. Home project cards contain no visible detail CTA text or arrow and expose no nested interactive control.
4. Each approved route resolves the matching project data.
5. Detail pages expose the external GitHub link with safe new-tab attributes.
6. Missing optional detail data hides the corresponding section.
7. Previous and next navigation follows project order and handles both ends of the collection.
8. An unknown route renders the not-found page.
9. Detail-header Home and Projects actions resolve correctly from every nested route.
10. The explicit Projects action lands on the home Projects section, while browser Back restores the previous scroll position.
11. The production build contains an `index.html` with matching metadata for every project route and a `404.html` fallback.
12. Current project purpose, first contribution, and growth copy are not duplicated in the initial detail view.
13. Existing tests, lint, and the production build remain green.
14. Browser checks cover desktop, tablet, and 360px mobile layouts, direct route refresh, keyboard navigation, and Back behavior.

## Out of Scope

- Writing new project case-study content, metrics, outcomes, or retrospective prose.
- Producing project screenshots or other image assets.
- Changing project order, titles, repository URLs, or global profile links.
- Redesigning non-project home sections.
- Creating new per-project Open Graph images.
- Publishing or deploying the implementation.
