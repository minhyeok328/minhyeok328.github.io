# Contact Links Design

## Goal

Add MinHyeok's verified Tistory blog and email address to the Contact section while keeping the Hero visually minimal.

## Approved Placement

- Hero keeps its existing GitHub link only.
- Contact displays links in this order: GitHub, Blog, Email.
- A future LinkedIn value remains optional and is displayed only when populated.
- Blog and email are not duplicated in the Hero.

## Data Model

Extend `Profile` with a `blogUrl` string and populate the verified values:

- Blog: `https://minhyeok328.tistory.com/`
- Email: `tjalsgur328@gmail.com`

Empty optional values continue to be omitted from the UI.

## Link Rules

Use separate pure helpers for each placement:

- Hero links: GitHub plus any explicitly approved Hero-only social values.
- Contact links: GitHub, Blog, Email, and optional LinkedIn.

The Contact labels are `GitHub 보기`, `블로그 보기`, and `Email 보내기`. HTTP links open in a new tab with `rel="noreferrer"`; email uses `mailto:` without opening a new tab.

## Components

- `HeroSection` consumes the Hero-specific link helper so the new contact details do not appear there.
- `ContactSection` consumes the Contact-specific helper and reuses the existing link-list styling.
- No new section, icon library, layout, or animation is added.

## Testing

Tests must verify:

- Hero still renders only the verified GitHub social link.
- Contact renders GitHub, Blog, and Email in the approved order.
- Blog and GitHub use safe external-link attributes.
- Email uses the exact `mailto:tjalsgur328@gmail.com` URL without external-link attributes.
- Empty LinkedIn remains hidden.

Implementation follows a red-green cycle: add the failing placement/link tests first, then make the smallest data/helper/component changes needed to pass them.
