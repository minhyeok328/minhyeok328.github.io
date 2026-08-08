# Navigation and Contact Simplification Design

## Goal

Simplify the one-page portfolio by assigning one clear role to each area:

- Header owns section navigation.
- Hero focuses on the introduction and profile visual.
- Contact owns external profile and email links.
- The URL hash follows the section reached by scrolling as well as by clicking navigation.

## Approved Direction

- Remove `프로젝트 보기` and the GitHub social link from Hero.
- Remove the now-empty Hero action and social-link UI; Hero contains introduction content and the profile visual only.
- Keep Header navigation and its native smooth anchor behavior.
- Render GitHub, Blog, and Email as icon-only links in Contact.
- Synchronize scrolling with canonical hashes for `top`, `about`, `projects`, `journey`, `skills`, and `contact`.

## Hash Synchronization

Reuse the existing `IntersectionObserver` selection in `useActiveSection` as the single source of the visible section.

When the selected section changes:

1. Continue updating the Header's active state.
2. Update the URL with `window.history.replaceState`, not `location.hash` or `pushState`.
3. Skip the write when the URL already represents the selected section.

`replaceState` avoids creating a browser-history entry for every section crossed during normal scrolling and does not trigger another scroll.

The observer includes `top`, so scrolling back to Hero produces `#top`; Header has no highlighted menu item while `top` is active.

Project growth links such as `#humour` and `#pickle` remain valid. If the current hash points to a project inside the selected canonical section, preserve that more precise hash. Once scrolling selects a different canonical section, replace it with that section's hash.

## Hero

Remove both duplicated destinations from Hero:

- the `#projects` CTA already represented by Header navigation;
- the GitHub link now owned by Contact.

The current empty resume field does not render an action. No new Hero button or replacement link is added.

Delete Hero-only link selection code and obsolete styles/tests when they no longer have a consumer.

## Contact Icons

Keep the existing data order and link behavior:

1. GitHub: external link, new tab, `rel="noreferrer"`;
2. Blog: external link, new tab, `rel="noreferrer"`;
3. Email: `mailto:` link in the current browsing context.

Use these visuals:

- GitHub: local GitHub mark SVG using `currentColor`;
- Blog: Lucide `BookOpen`;
- Email: Lucide `Mail`;
- Future unknown link types: Lucide `ExternalLink` fallback rather than an empty link.

The visible text is removed, but each anchor retains its current accessible name through `aria-label`: `GitHub 보기`, `블로그 보기`, and `Email 보내기`. SVGs are decorative with `aria-hidden="true"`.

## Visual Behavior

- Each icon has a 44×44px interaction target and an approximately 20px glyph.
- Resting state uses the existing secondary gray text color with no permanent button background or border.
- Hover and keyboard focus use the existing primary text/surface tokens and global focus outline.
- Dark theme and reduced-motion behavior continue to use existing tokens and media rules.
- Contact icons remain a compact horizontal row on small screens; remove the current mobile rule that stretches Contact links to full width.

## Testing

Follow a red-green cycle and verify:

- Hero exposes no project CTA or social-link navigation.
- Contact links remain in the approved order and retain exact accessible names and protocol-specific attributes.
- Every Contact link renders a decorative icon without visible label text.
- Scrolling to each observed canonical section updates both active state and URL hash with `replaceState`.
- No history write occurs when the current hash is already canonical for the selected section.
- A project-specific hash is preserved while its owning section is active.
- No intersecting section leaves the current hash unchanged.
- Full lint, unit tests, production build, and browser checks pass at desktop and mobile widths.

## Excluded Scope

- No router or new route is introduced.
- No new dependency is added.
- Project content, project links, Header labels, Footer behavior, theme behavior, and section layout remain unchanged.
