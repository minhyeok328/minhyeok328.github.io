# Project Modal Polish and Cleanup Design

## Goal

Finish the single-URL floating project detail experience by adding a restrained modal exit treatment, separating pointer hover from restored keyboard focus, and removing CSS that belonged only to deleted route-based pages.

## Confirmed scope

- Keep the public address fixed at `https://minhyeok328.github.io/` and preserve the existing Router state model.
- Add a subtle `4px` backdrop blur while the project modal is open.
- Animate modal dismissal for `160ms` with a fading backdrop and a small panel fade/translate/scale treatment.
- Preserve body locking, inert background behavior, focus trapping, scroll restoration, and exact opening-card focus restoration until the exit finishes.
- Remove the card's elevated visual state after modal dismissal while retaining a visible keyboard focus indicator.
- Delete only CSS used by the removed `DetailHeader`, `NotFoundPage`, `ProjectDetailPage`, and `ProjectDetailLayout` components.

## Non-goals

- Do not change project content, ordering, repository links, or modal layout.
- Do not add project URLs, hashes, new routes, dependencies, or a Router blocker.
- Do not remove focus restoration or weaken keyboard accessibility to hide the lingering card state.
- Do not delete current `project-detail__*` or `project-detail-modal__*` styles used by the floating detail view.

## Interaction design

### Card hover and focus

The card elevation, stronger border, and shadow apply only while a pointer is hovering the card. Restoring focus to the opening card after the modal closes does not translate or elevate the card.

The existing full-card trigger remains the only focusable card control. `:focus-visible` keeps its explicit outline, so keyboard users retain a clear focus location without receiving a persistent hover treatment.

### Opening and switching projects

Opening a project keeps the current behavior: the shared detail modal mounts, body scroll locks, the home shell becomes inert, the detail scroller resets, and focus enters the project heading.

Previous and next project transitions continue replacing only the keyed detail content. They do not enter the closing phase or recreate the outer dialog.

### Closing

The Router remains authoritative and navigates to the appropriate same-address home entry immediately. A small presentation controller retains the final validated modal snapshot while the UI exits.

The closing phase lasts `160ms`:

- the backdrop fades and reduces its blur to zero;
- the panel fades, moves down by no more than `6px`, and scales to approximately `0.995`;
- the background remains inert and body scroll remains locked;
- repeated close, Escape, backdrop, previous, and next actions do not create additional history transitions.

The backdrop's own `animationend` completes removal. A `220ms` fallback timer guarantees cleanup if the event is missed. Final unmount runs the existing cleanup that unlocks the body, restores the captured home scroll position, and focuses the opening card or Projects-heading fallback.

Browser Back uses the same closing presentation because it changes the Router state first. If browser Forward restores a valid project during the exit window, the controller cancels the exit and keeps the dialog open on that project.

### Motion and contrast preferences

When `prefers-reduced-motion: reduce` matches, modal removal is immediate rather than waiting for an animation event or timer. The existing non-animated scroll behavior remains unchanged.

Forced-colors mode disables backdrop blur and continues using system colors and focus outlines.

## Component boundaries

### Project modal presence controller

A focused hook owns only presentation lifetime:

- input: the current validated modal snapshot or `null`;
- output: the retained snapshot, `open | closing` phase, and exit-completion callback;
- responsibility: retain during exit, cancel on a renewed project state, finish on animation end, and provide the fallback timeout;
- dependency boundary: it never writes Router history and never recaptures scroll or focus provenance.

### ProjectDetailModal

The modal receives its phase and completion callback. It applies the phase modifier, reports only the backdrop's own animation completion, and guards modal navigation actions during closing. Existing pointer-origin protection remains intact.

### PortfolioHomePage

The page builds the current modal snapshot from validated Router state, passes it through the presence controller, and renders the retained result. The Router history hook remains unchanged.

## CSS cleanup

Remove these legacy-only selectors after verifying they have no current source references:

- `.detail-header__navigation`;
- `.detail-header__inner` and mobile DetailHeader descendants;
- `.not-found-page` and all descendants;
- `.project-detail-page`.

Retain all current modal classes, shared project-detail content classes, and `.project-detail__project-navigation`.

## Test strategy

Behavior-first tests must prove RED before implementation and then GREEN for:

- Router home state begins a closing phase while the dialog, inert shell, and body lock remain present;
- backdrop animation completion removes the dialog and restores scroll and exact card focus;
- the `220ms` fallback removes a stuck closing modal;
- browser Forward during closing cancels dismissal;
- reduced-motion closes immediately;
- repeated modal actions during closing do not add history transitions;
- project switching keeps the same outer dialog and never enters closing;
- the card stylesheet no longer couples elevation to `:focus-within` while preserving `:focus-visible` outline styling.

Static checks confirm all four legacy selector families are absent. Full lint, unit tests, production build, and focused production-browser checks cover the changed close, hover/focus, reduced-motion, and responsive behavior.

## Acceptance criteria

1. Opening, switching, Back, Forward, close button, Escape, and backdrop behavior keep the visible address at `/`.
2. Normal dismissal visibly exits for `160ms`; reduced-motion dismissal is immediate.
3. Body lock and inert background remain until visual dismissal completes.
4. Final cleanup restores the captured scroll position and exact opening-card focus.
5. A restored focused card is not elevated; pointer hover still elevates it; keyboard focus remains visibly outlined.
6. Backdrop blur is subtle in normal colors and disabled in forced-colors mode.
7. Deleted route/page CSS is absent while current modal/detail styling remains intact.
8. No new dependency or public route is introduced.
9. Lint, all tests, production build, and affected browser acceptance pass without warnings or regressions.
