# Single-URL Floating Project Details Design

## Goal

Keep the portfolio as one continuous page at `https://minhyeok328.github.io/` while preserving the depth of the reusable project case studies. Selecting a project opens its detail content as a large floating panel over the home page instead of navigating to another page.

The panel must support substantially more content later without changing the home cards or duplicating project data.

## Superseded Decisions

This design replaces the route and hash behavior approved in these earlier specifications:

- `2026-08-08-project-detail-pages-design.md`: clean project routes, standalone detail layouts, route metadata, and explicit `프로젝트 목록` navigation are replaced by an in-page floating panel.
- `2026-08-08-navigation-contact-simplification-design.md`: automatic section-hash synchronization and the standalone Journey navigation target are removed.

The existing compact role-first project cards, shared case-study content model, optional-section rules, and single GitHub action remain valid.

## Approved Product Decisions

- The only public portfolio address is `https://minhyeok328.github.io/`.
- Header navigation, project-stage navigation, modal opening, and project switching never add a path or hash to the address.
- A project card opens a large floating detail panel over the home page.
- Desktop uses a centered panel over a dimmed backdrop. Mobile uses a full-screen panel.
- There is no standalone project detail page and no `프로젝트 목록` action.
- Refreshing starts at the top-level home view with no project panel open.
- Legacy project paths and legacy hashes return to the root home view.
- `Journey` is removed from the Header and from URL navigation. `Project Journey` remains a subsection inside Projects.
- Project detail data and rendering stay shared across all five projects.

## Single-URL Navigation

Home section ids remain available as DOM targets for observation and programmatic scrolling, but they are not written to the address bar.

Header items are the top-level sections only:

1. About
2. Projects
3. Skills
4. Experience, when data exists
5. Contact

Header controls scroll to their section with the existing smooth behavior and close the mobile menu. The brand control and Footer's `맨 위로` control scroll to the top. These controls use button behavior instead of hash links so their semantics and visible URL agree.

`useActiveSection` remains responsible for the Header's current-section styling, but it becomes read-only with respect to browser history. It observes the visible top-level section and never calls `pushState` or `replaceState` for scrolling.

The `Project Journey` heading and cards remain inside the Projects section, but the nested section no longer has the `journey` URL target. While any Journey content is active, the Header continues to mark Projects as the current location.

The project growth line keeps its stage-to-card navigation. Each stage control scrolls to the corresponding card without creating `#humour`, `#pickle`, or another project hash.

## Project Card Trigger

The visual card remains the same compact summary approved for the current site:

- image or accessible placeholder;
- stage and title;
- short description;
- `내 역할` summary;
- reduced technology list.

The card becomes a modal trigger rather than a route link. Its full visual surface remains clickable with one native button tab stop, `aria-haspopup="dialog"`, and a project-specific accessible name such as `HumouR 프로젝트 상세 보기`. It retains the pointer cursor, hover lift, border emphasis, and focus-visible boundary. It contains no repository action, visible detail CTA, or arrow.

Opening a card records the triggering control and the home scroll position before displaying the panel.

## Floating Detail Panel

### Desktop

- A viewport-covering backdrop sits above the sticky Header and dims the home page with a subtle blur.
- The centered panel uses the approved mockup's generous width and a maximum height of approximately 88% of the viewport.
- The home document is locked in place while the panel is open.
- Only the panel's content region scrolls, allowing future overview, technical-decision, and retrospective content to grow without increasing the outer viewport.
- A close control stays visible at the panel's top edge while the content scrolls.

### Mobile

- At the existing mobile breakpoint the panel fills the viewport using dynamic viewport height.
- The panel has no floating outer gap or desktop corner treatment.
- Safe-area padding protects the close control and bottom navigation.
- Detail grids stack to one column and must not create horizontal overflow.

### Close Behavior

The panel closes through any of these equivalent actions:

- the visible close control;
- `Escape`;
- a backdrop click whose target is the backdrop itself;
- browser Back after the modal history has returned through any project-to-project states.

Closing restores the exact home scroll position and returns keyboard focus to the card that opened the panel. If that trigger is no longer available, focus falls back to the programmatically focusable Projects heading (`tabIndex={-1}`).

The existing `프로젝트 목록` action is removed completely. The prominent `GitHub에서 코드 보기` external action remains and keeps its safe new-tab attributes.

## Project Switching

Previous and next controls remain ordered by the existing project `order` field. They become in-panel buttons rather than links.

Selecting another project:

1. keeps the panel open and the home background locked;
2. replaces the detail content from the same project data source;
3. resets the panel content scroll to the top;
4. moves focus to the new project heading;
5. leaves the visible address unchanged.

The same scroll reset and heading focus occur when browser Back or Forward changes the active project, not only when a previous or next button is pressed.

The first project omits its previous control and the last project omits its next control. The content transition is a brief, restrained fade rather than closing and reopening the entire panel.

## Same-Address Browser History

React Router remains the coordinator for browser history, but every router entry uses `/` as its visible URL. Runtime modal transitions use Router navigation and `location.state`, not raw `history.pushState`, so Router's internal history keys remain valid.

- Before the Router is created, initial bootstrap creates a new page-session token, normalizes the current path and hash to `/`, and clears only the app-owned modal payload. It preserves React Router's existing `history.state` envelope, index, and key so same-address POP calculations are not corrupted. Router construction must be moved after this normalization step.
- On the first root render, missing or previous-session modal state is interpreted synchronously as a closed home view. A layout effect then uses Router navigation with `replace` to install the current session's home state. This prevents a refreshed project panel from flashing while allowing Router to own its history payload.
- Immediately before opening, the current home entry is replaced with home state that records the captured scroll position and opening-card id.
- Opening a project then pushes a Router location state containing the current page-session token, stable project id, opening-card id, captured home scroll position, and `depth = 1`, using the same `/` URL.
- Previous or next project selection pushes another same-address modal state while preserving the original card and home scroll values and incrementing depth by exactly one. Only these in-panel PUSH transitions increase depth.
- Browser Back returns to the previously viewed project, then closes the panel when it reaches the home state.
- Close, backdrop, and Escape call Router navigation with the current valid `-depth` delta, returning directly to the opening home entry instead of forcing the user through every project they viewed.
- Browser Forward may restore a modal state during the same document session.
- A full refresh deliberately invalidates modal history state, closes the panel, normalizes the address to `/`, and starts at the home view because bootstrap creates a new page-session token. Older same-address entries may still exist deeper in browser history, but their previous token prevents Back or Forward from reopening a pre-refresh panel.

History state with a different page-session token, an unknown project id, or an invalid modal depth is never used for delta navigation. It is replaced in place with current home state rather than rendering an empty or broken panel.

## Shared Component Structure

The home page owns the selected project and modal-history coordination. The floating panel is rendered above the app shell, preferably through a document-level portal so Header and section stacking contexts cannot cover it.

```text
PortfolioHomePage
├── Header
├── Main portfolio sections
│   └── ProjectsSection
│       └── ProjectCard modal triggers
├── Footer
└── ProjectDetailModal
    ├── sticky close control
    └── ProjectDetailView
        ├── DetailHero and GitHub action
        ├── QuickSummary
        ├── optional detail sections
        └── previous / next project controls
```

`ProjectDetailView` remains data-driven and renders all five projects. The current `Project` object remains the single source of truth, including the approved optional detail fields. Empty optional sections remain absent rather than showing placeholders.

Standalone-page wrappers, detail-only Header and Footer composition, route parameter lookup, and route metadata are no longer part of the runtime structure. The existing Router remains only for same-address UI history. Its `ScrollRestoration` owner is removed so modal state transitions cannot reset the preserved home scroll position.

## Route and Build Cleanup

The implementation removes behavior that exists only to support multiple addresses:

- project `Link` targets and `/projects/:projectId/` routing;
- the standalone project detail page and nested-route layout;
- detail-only navigation back to `/#projects`;
- per-project document metadata and generated nested HTML entries;
- hash synchronization for home sections and project cards;
- the Journey Header item and `#journey` target;
- project route objects, the Not Found view, and `ScrollRestoration`; the root Router remains for same-address modal state.

The root document keeps one canonical home title, description, Open Graph URL, and application entry. Production output must not contain generated `projects/<id>/index.html` files.

GitHub Pages still needs a root-normalizing fallback. `404.html` boots the root application, whose pre-Router bootstrap replaces a removed project path or another unknown path with `/`. Loading the root document with a legacy hash follows the same bootstrap and starts at the root home view. Neither case preserves or reconstructs a project modal.

## Accessibility and Interaction Safety

- The floating surface exposes dialog semantics with `aria-modal="true"` and is labelled by the active project's heading.
- Opening and project switching move focus to the active project heading without adding it to the normal Tab order.
- Keyboard focus remains inside the open panel; the home page behind it is inert to keyboard and assistive technology interaction.
- Closing restores focus to the triggering card or the Projects heading fallback.
- The close control has an explicit Korean accessible name and remains reachable as content grows.
- Backdrop clicks close only when `event.target === event.currentTarget`; interactions and drags that begin inside the panel never cause an accidental close.
- Body locking preserves the captured scroll position and avoids a horizontal layout jump when the scrollbar disappears.
- Light theme, dark theme, keyboard focus styles, and high-contrast behavior continue to use the existing design tokens.
- Opening, closing, and project-switch animations are short and subtle. The reduced-motion media preference removes transform and animated scrolling while keeping state changes immediate.

## Verification

Implementation follows a red-green test cycle and covers:

1. Header and Footer navigation omits Journey, scrolls programmatically, and never changes the URL.
2. Active-section observation still marks Projects throughout its Journey subsection without writing history or hashes.
3. Growth-line controls scroll to all five cards without project hashes.
4. Each project card exposes exactly one native modal trigger, no route link, no repository link, and no visible CTA or arrow.
5. Every card opens the matching detail content while the visible address remains `/`.
6. The panel has dialog semantics, a labelled close control, focus containment, background inertness, and body scroll locking.
7. Close, backdrop, Escape, and Back restore the captured home scroll and triggering-card focus.
8. Previous and next controls follow project order, handle collection boundaries, reset panel scroll, focus the new heading, and keep the panel open.
9. Router location state returns through viewed projects before home, while an explicit close skips directly to home state without corrupting Router history keys.
10. Refresh, legacy paths, legacy hashes, and stale history state normalize before first render and produce a closed home view at `/`; traversing older entries after refresh cannot reopen a prior-session panel.
11. `프로젝트 목록` is absent and the single GitHub action retains `target="_blank"` and `rel="noreferrer"`.
12. Current content de-duplication and optional-section omission rules remain intact.
13. Desktop, tablet, and 360px mobile checks cover panel sizing, long-content scrolling, backdrop behavior, safe areas, and horizontal overflow.
14. Light, dark, reduced-motion, pointer, and keyboard interactions remain usable.
15. The production build contains the root entry and root-normalizing fallback, contains no nested project entries, and client-normalizes legacy paths to `/` after GitHub Pages serves the fallback response.
16. Full lint, unit tests, and production build pass without unrelated portfolio regressions.

## Out of Scope

- Writing additional project copy, metrics, screenshots, or retrospective content.
- Changing project order, titles, repository URLs, or the global GitHub profile link.
- Redesigning non-project home sections beyond the Header navigation adjustment.
- Preserving shareable, bookmarkable, or refresh-restorable state for an individual project.
- Publishing or deploying the implementation before the full implementation and acceptance workflow is complete.
