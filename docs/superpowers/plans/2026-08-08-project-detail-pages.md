# Project Detail Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dense home project cards with compact full-card links and add one reusable, clean-URL case-study page for each of the five projects.

**Architecture:** Keep `portfolioData` as the single project source, derive ordered lookup, copy-deduplication, navigation, and metadata helpers from it, and render every detail route through one `ProjectDetailView`. Use React Router's data router for internal links, not-found behavior, and Back scroll restoration. During `vite build`, a small `closeBundle` plugin copies the finished app entry into real GitHub Pages route files and substitutes route-specific metadata.

**Tech Stack:** React 19.2.8, TypeScript 6, `react-router` 8.3, Vite 8, Node 24 types, CSS Grid, Vitest, Testing Library, GitHub Pages

## Global Constraints

- Install `react-router@^8.3.0`; do not install `react-router-dom` or `@types/react-router`.
- Install `@types/node@^24.13.3` as a development dependency because the build plugin uses Node 24 file-system and path APIs.
- Import routing APIs from `react-router` and `RouterProvider` from `react-router/dom`.
- Keep these exact public paths: `/projects/humour/`, `/projects/vehicle-tco/`, `/projects/bank-churners/`, `/projects/pickle/`, and `/projects/lg-home-ai/`.
- A home project card is one full-surface internal link with a pointer cursor, the existing hover lift/border treatment, and an equivalent keyboard focus treatment.
- Home cards contain no visible detail CTA text, no arrow, no project repository link, and no nested interactive control.
- The only project-repository action is `GitHub에서 코드 보기` in the detail hero; the global profile GitHub links remain unchanged.
- Initial detail pages reuse current data without repeating `description`, `growth`, or the contribution used as the role summary.
- Empty `overview`, `decisions`, `retrospective`, and `teamTechnologies` sections are absent from both the DOM and accessibility tree.
- Preserve project order, current home section navigation, global copy, repository URLs, and every non-project section.
- Direct detail navigation and refresh must return a real page, not depend on a client-only 404 redirect.
- Generate a real nested `index.html` and matching metadata for every project route, plus `dist/404.html`, during the existing `npm run build` command.
- Keep `.github/workflows/deploy.yml` unchanged; its existing `npm ci` → `npm run build` → `dist` upload already publishes generated entries.
- Do not invent case-study copy, metrics, screenshots, Open Graph images, or deploy the site.
- Commit commands below are workflow checkpoints only; do not run them without explicit user authorization to create commits.

## Dependency Decision

Proceed with `react-router@^8.3.0` and `@types/node@^24.13.3`.

- The repository uses Node 24.15.0, React 19.2.8, and Vite 8.2.1, satisfying React Router 8's Node 22.22+, React 19.2.7+, and Vite 7+ floors.
- React Router 8 uses the primary `react-router` package; the old compatibility package `react-router-dom` is not needed.
- The router provides route matching, accessible `Link` behavior, not-found handling, navigation type detection, and scroll restoration without maintaining a custom history implementation.
- `@types/node` follows the installed Node 24 runtime line and is build-time only.

References:

- https://reactrouter.com/start/data/installation
- https://reactrouter.com/start/start/changelog
- https://www.npmjs.com/package/react-router
- https://www.npmjs.com/package/%40types/node

## File Map

### New files

- `src/lib/projects.ts` — ordered collection, lookup, route, adjacency, role, and contribution helpers.
- `src/lib/projects.test.ts` — project-domain behavior.
- `src/lib/projectMetadata.ts` — shared home, detail, and not-found metadata values.
- `src/lib/projectMetadata.test.ts` — metadata value behavior.
- `src/components/DocumentMetadata.tsx` — client-side document metadata synchronization.
- `src/components/DocumentMetadata.test.tsx` — metadata application and cleanup.
- `src/components/ProjectImage.tsx` — shared project image and accessible fallback.
- `src/components/DetailHeader.tsx` — nested-route-safe Home, Projects, GitHub, and theme navigation.
- `src/components/project-detail/DetailHero.tsx` — stage, title, image, and hero actions.
- `src/components/project-detail/ProjectActions.tsx` — repository and project-list actions.
- `src/components/project-detail/QuickSummary.tsx` — purpose, role, and growth orientation.
- `src/components/project-detail/OverviewSection.tsx` — optional long-form overview.
- `src/components/project-detail/ContributionSection.tsx` — deduplicated direct contributions.
- `src/components/project-detail/TechnicalSection.tsx` — optional decisions and technology boundaries.
- `src/components/project-detail/RetrospectiveSection.tsx` — optional long-form reflection.
- `src/components/project-detail/ProjectDetailView.tsx` — reusable case-study section composition.
- `src/components/project-detail/ProjectDetailView.test.tsx` — detail copy, fallback, optional-section, action, and navigation tests.
- `src/components/project-detail/ProjectDetailLayout.tsx` — shared detail header, main container, and footer shell.
- `src/pages/PortfolioHomePage.tsx` — current one-page portfolio content moved out of the router provider.
- `src/pages/ProjectDetailPage.tsx` — route parameter adapter, focus, and detail metadata.
- `src/pages/NotFoundPage.tsx` — invalid route state.
- `src/router/AppRouter.tsx` — browser and testable route definitions.
- `src/router/AppRouter.test.tsx` — clean routes, nested-safe header, metadata, focus, hash, and not-found behavior.
- `build/projectRouteEntries.ts` — Vite `closeBundle` plugin for nested entries and metadata substitution.
- `build/projectRouteEntries.test.ts` — deterministic HTML substitution and escaping.

### Modified files

- `package.json`, `package-lock.json` — router and Node type dependencies.
- `src/types/portfolio.ts` — optional case-study data contracts.
- `src/components/ProjectCard.tsx`, `src/components/ProjectCard.test.tsx` — compact full-card link.
- `src/hooks/useActiveSection.ts`, `src/hooks/useActiveSection.test.tsx` — protect initial canonical hash intent.
- `src/App.tsx` — browser router provider.
- `src/App.test.tsx` — compact home-card integration assertions.
- `src/test/setup.ts` — deterministic router scroll mocks and session cleanup.
- `src/index.css` — card link, detail page, detail header, not-found, and responsive styles.
- `index.html` — stable metadata element IDs used by runtime and build output.
- `vite.config.ts` — project route entry plugin.
- `tsconfig.node.json` — Node types and build-plugin type checking.

---

### Task 1: Add Dependencies and the Project Domain Model

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/types/portfolio.ts`
- Create: `src/lib/projects.ts`
- Create: `src/lib/projects.test.ts`

**Interfaces:**
- Produces: `getOrderedProjects(data): Project[]`
- Produces: `findProjectById(projects, id): Project | undefined`
- Produces: `getAdjacentProjects(projects, id): { previous: Project | null; next: Project | null }`
- Produces: `getProjectPath(project): string`
- Produces: `getProjectRoleSummary(project): string`
- Produces: `getProjectContributionItems(project): string[]`
- Produces: optional `Project.cardRoleSummary` and `Project.detail` contracts.

- [ ] **Step 1: Install the approved runtime and build-time dependencies**

Run:

```powershell
npm.cmd install react-router@^8.3.0
npm.cmd install --save-dev @types/node@^24.13.3
```

Expected: `package.json` and `package-lock.json` add `react-router` under dependencies and `@types/node` under dev dependencies. Neither file adds `react-router-dom` or a separate router type package.

- [ ] **Step 2: Write the failing project-domain tests**

Create `src/lib/projects.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { portfolioData } from '../data/portfolio'
import type { Project } from '../types/portfolio'
import {
  findProjectById,
  getAdjacentProjects,
  getOrderedProjects,
  getProjectContributionItems,
  getProjectPath,
  getProjectRoleSummary,
} from './projects'

describe('project helpers', () => {
  const projects = getOrderedProjects(portfolioData)

  it('orders every project by the existing growth order', () => {
    expect(projects.map((project) => project.id)).toEqual([
      'vehicle-tco',
      'bank-churners',
      'pickle',
      'lg-home-ai',
      'humour',
    ])
  })

  it('builds the canonical trailing-slash route from a project id', () => {
    expect(getProjectPath(portfolioData.flagshipProject)).toBe('/projects/humour/')
  })

  it('finds a known project and rejects an unknown id', () => {
    expect(findProjectById(projects, 'pickle')?.title).toBe('PICKLE 맛집 추천 챗봇')
    expect(findProjectById(projects, 'missing')).toBeUndefined()
    expect(findProjectById(projects, undefined)).toBeUndefined()
  })

  it('resolves previous and next projects at the middle and both boundaries', () => {
    expect(getAdjacentProjects(projects, 'pickle')).toMatchObject({
      previous: { id: 'bank-churners' },
      next: { id: 'lg-home-ai' },
    })
    expect(getAdjacentProjects(projects, 'vehicle-tco')).toMatchObject({
      previous: null,
      next: { id: 'bank-churners' },
    })
    expect(getAdjacentProjects(projects, 'humour')).toMatchObject({
      previous: { id: 'lg-home-ai' },
      next: null,
    })
  })

  it('uses the first contribution as role copy without repeating it in detail', () => {
    const project = {
      contribution: ['역할 요약', '구현 A', '구현 B'],
    } as Project

    expect(getProjectRoleSummary(project)).toBe('역할 요약')
    expect(getProjectContributionItems(project)).toEqual(['구현 A', '구현 B'])
  })

  it('keeps every contribution when explicit card role copy exists', () => {
    const project = {
      cardRoleSummary: '명시적 역할 요약',
      contribution: ['구현 A', '구현 B'],
    } as Project

    expect(getProjectRoleSummary(project)).toBe('명시적 역할 요약')
    expect(getProjectContributionItems(project)).toEqual(['구현 A', '구현 B'])
  })

  it('treats a blank card role as absent in both fallback helpers', () => {
    const project = {
      cardRoleSummary: '   ',
      contribution: ['역할 요약', '구현 A'],
    } as Project

    expect(getProjectRoleSummary(project)).toBe('역할 요약')
    expect(getProjectContributionItems(project)).toEqual(['구현 A'])
  })
})
```

- [ ] **Step 3: Run the helper test and verify the red state**

Run:

```powershell
npm.cmd run test -- src/lib/projects.test.ts
```

Expected: FAIL because `src/lib/projects.ts` and the optional project fields do not exist.

- [ ] **Step 4: Add the optional detail contracts**

Insert these interfaces above `Project` in `src/types/portfolio.ts`:

```ts
export interface ProjectDecision {
  title: string
  situation: string
  choice: string
  reason: string
  implementation: string
  result?: string
  reflection?: string
}

export interface ProjectDetail {
  overview?: string[]
  decisions?: ProjectDecision[]
  retrospective?: string[]
}
```

Add these fields after `image: string` in `Project`:

```ts
  cardRoleSummary?: string
  detail?: ProjectDetail
```

- [ ] **Step 5: Implement the project helpers**

Create `src/lib/projects.ts`:

```ts
import type { PortfolioData, Project } from '../types/portfolio'

export interface AdjacentProjects {
  previous: Project | null
  next: Project | null
}

export function getOrderedProjects(
  data: Pick<PortfolioData, 'flagshipProject' | 'journeyProjects'>,
) {
  return [...data.journeyProjects, data.flagshipProject]
    .sort((left, right) => left.order - right.order)
}

export function findProjectById(projects: readonly Project[], id: string | undefined) {
  return id ? projects.find((project) => project.id === id) : undefined
}

export function getAdjacentProjects(
  projects: readonly Project[],
  id: string,
): AdjacentProjects {
  const index = projects.findIndex((project) => project.id === id)

  if (index < 0) {
    return { previous: null, next: null }
  }

  return {
    previous: projects[index - 1] ?? null,
    next: projects[index + 1] ?? null,
  }
}

export function getProjectPath(project: Pick<Project, 'id'>) {
  return `/projects/${project.id}/`
}

export function getProjectRoleSummary(
  project: Pick<Project, 'cardRoleSummary' | 'contribution'>,
) {
  return project.cardRoleSummary?.trim() || project.contribution[0] || ''
}

export function getProjectContributionItems(
  project: Pick<Project, 'cardRoleSummary' | 'contribution'>,
) {
  return project.cardRoleSummary?.trim()
    ? project.contribution
    : project.contribution.slice(1)
}
```

- [ ] **Step 6: Run the project-domain and existing data tests**

Run:

```powershell
npm.cmd run test -- src/lib/projects.test.ts src/lib/portfolio.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit the dependency and domain checkpoint, only if authorized**

```powershell
git add package.json package-lock.json src/types/portfolio.ts src/lib/projects.ts src/lib/projects.test.ts
git commit -m "feat(projects): add project detail domain"
```

---

### Task 2: Build the Shared Project Detail View

**Files:**
- Create: `src/components/ProjectImage.tsx`
- Create: `src/components/project-detail/DetailHero.tsx`
- Create: `src/components/project-detail/ProjectActions.tsx`
- Create: `src/components/project-detail/QuickSummary.tsx`
- Create: `src/components/project-detail/OverviewSection.tsx`
- Create: `src/components/project-detail/ContributionSection.tsx`
- Create: `src/components/project-detail/TechnicalSection.tsx`
- Create: `src/components/project-detail/RetrospectiveSection.tsx`
- Create: `src/components/project-detail/ProjectDetailView.tsx`
- Create: `src/components/project-detail/ProjectDetailView.test.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: `Project`, the role/contribution helpers, `getProjectPath`, and `ProjectImage`.
- Produces: `ProjectImage({ project, className, fallbackClassName })`.
- Produces: named reusable detail sections assembled by `ProjectDetailView({ project, previousProject, nextProject, headingRef })`.
- Guarantees: purpose, role, and growth each render once; optional sections render only with entries.

- [ ] **Step 1: Write the failing detail-view tests**

Create `src/components/project-detail/ProjectDetailView.test.tsx`:

```tsx
import { createRef } from 'react'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { Project } from '../../types/portfolio'
import { ProjectDetailView } from './ProjectDetailView'

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'test-project',
    order: 2,
    stage: 'Test Stage',
    title: '테스트 프로젝트',
    description: '테스트 프로젝트 설명',
    contribution: ['테스트 역할 요약', '구현 A', '구현 B'],
    growth: '테스트 성장',
    technologies: ['TypeScript', 'React', 'Vitest'],
    teamTechnologies: ['Django', 'AWS'],
    githubUrl: 'https://github.com/example/test-project',
    image: '',
    ...overrides,
  }
}

function renderDetail(project: Project = makeProject()) {
  const previousProject = makeProject({ id: 'previous', title: '이전 프로젝트' })
  const nextProject = makeProject({ id: 'next', title: '다음 프로젝트' })

  return render(
    <MemoryRouter>
      <ProjectDetailView
        project={project}
        previousProject={previousProject}
        nextProject={nextProject}
        headingRef={createRef<HTMLHeadingElement>()}
      />
    </MemoryRouter>,
  )
}

describe('ProjectDetailView', () => {
  it('renders current project data once and keeps optional sections absent', () => {
    const project = makeProject()
    renderDetail(project)

    expect(screen.getByRole('heading', { level: 1, name: project.title })).toBeInTheDocument()
    expect(screen.getAllByText(project.description)).toHaveLength(1)
    expect(screen.getAllByText(project.contribution[0])).toHaveLength(1)
    expect(screen.getAllByText(project.growth)).toHaveLength(1)

    const contribution = screen.getByRole('region', { name: '직접 기여' })
    expect(within(contribution).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      project.contribution[1],
      project.contribution[2],
    ])

    expect(screen.queryByRole('region', { name: '프로젝트 개요' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '기술 설계와 판단' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '성장과 회고' })).not.toBeInTheDocument()

    const codeLink = screen.getByRole('link', { name: 'GitHub에서 코드 보기' })
    expect(codeLink).toHaveAttribute('href', project.githubUrl)
    expect(codeLink).toHaveAttribute('target', '_blank')
    expect(codeLink).toHaveAttribute('rel', 'noreferrer')
    expect(screen.getByRole('link', { name: '프로젝트 목록' })).toHaveAttribute('href', '/#projects')
    expect(screen.getByRole('link', { name: '이전 · 이전 프로젝트' })).toHaveAttribute(
      'href',
      '/projects/previous/',
    )
    expect(screen.getByRole('link', { name: '다음 · 다음 프로젝트' })).toHaveAttribute(
      'href',
      '/projects/next/',
    )
  })

  it('uses explicit detail copy without removing any contributions', () => {
    const project = makeProject({
      cardRoleSummary: '명시적 역할 요약',
      detail: {
        overview: ['상세 프로젝트 개요'],
        decisions: [{
          title: '상태 관리 결정',
          situation: '여러 화면이 같은 서버 상태를 사용했습니다.',
          choice: '서버 상태를 별도로 관리했습니다.',
          reason: '중복 요청과 불일치를 줄이기 위해서입니다.',
          implementation: '공통 Query Key를 적용했습니다.',
          result: '데이터 흐름이 단순해졌습니다.',
          reflection: '경계 정의를 더 일찍 했어야 합니다.',
        }],
        retrospective: ['명시적 회고'],
      },
    })
    renderDetail(project)

    expect(screen.getByText('명시적 역할 요약')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: '프로젝트 개요' })).toHaveTextContent(
      '상세 프로젝트 개요',
    )
    expect(screen.getByRole('region', { name: '기술 설계와 판단' })).toHaveTextContent(
      '상태 관리 결정',
    )
    expect(screen.getByRole('region', { name: '성장과 회고' })).toHaveTextContent('명시적 회고')

    const contribution = screen.getByRole('region', { name: '직접 기여' })
    expect(within(contribution).getAllByRole('listitem').map((item) => item.textContent)).toEqual(
      project.contribution,
    )
  })

  it('omits explicitly empty optional sections and team technologies', () => {
    renderDetail(makeProject({
      teamTechnologies: [],
      detail: { overview: [], decisions: [], retrospective: [] },
    }))

    expect(screen.getByRole('region', { name: '직접 사용 기술' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '팀 시스템 연동' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '프로젝트 개요' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '기술 설계와 판단' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '성장과 회고' })).not.toBeInTheDocument()
  })

  it('shows only next at the first boundary and only previous at the last boundary', () => {
    const previousProject = makeProject({ id: 'previous', title: '이전 프로젝트' })
    const nextProject = makeProject({ id: 'next', title: '다음 프로젝트' })
    const first = render(
      <MemoryRouter>
        <ProjectDetailView
          project={makeProject()}
          previousProject={null}
          nextProject={nextProject}
          headingRef={createRef<HTMLHeadingElement>()}
        />
      </MemoryRouter>,
    )

    expect(screen.queryByRole('link', { name: /이전/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '다음 · 다음 프로젝트' })).toBeInTheDocument()
    first.unmount()

    render(
      <MemoryRouter>
        <ProjectDetailView
          project={makeProject()}
          previousProject={previousProject}
          nextProject={null}
          headingRef={createRef<HTMLHeadingElement>()}
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: '이전 · 이전 프로젝트' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /다음/ })).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the detail-view test and verify the red state**

Run:

```powershell
npm.cmd run test -- src/components/project-detail/ProjectDetailView.test.tsx
```

Expected: FAIL because the shared image and detail view do not exist.

- [ ] **Step 3: Extract the shared project image**

Create `src/components/ProjectImage.tsx`:

```tsx
import type { Project } from '../types/portfolio'
import { ImageWithFallback } from './ImageWithFallback'

interface ProjectImageProps {
  project: Pick<Project, 'image' | 'title'>
  className: string
  fallbackClassName: string
}

export function ProjectImage({ project, className, fallbackClassName }: ProjectImageProps) {
  return (
    <ImageWithFallback
      className={className}
      fallbackClassName={fallbackClassName}
      src={project.image}
      alt={`${project.title} 프로젝트 이미지`}
      fallback={project.title.slice(0, 2)}
    />
  )
}
```

- [ ] **Step 4: Implement a green reusable-view baseline**

Create `src/components/project-detail/ProjectDetailView.tsx`:

```tsx
import type { RefObject } from 'react'
import { Link } from 'react-router'
import {
  getProjectContributionItems,
  getProjectPath,
  getProjectRoleSummary,
} from '../../lib/projects'
import type { Project } from '../../types/portfolio'
import { ProjectImage } from '../ProjectImage'

interface ProjectDetailViewProps {
  project: Project
  previousProject: Project | null
  nextProject: Project | null
  headingRef: RefObject<HTMLHeadingElement | null>
}

export function ProjectDetailView({
  project,
  previousProject,
  nextProject,
  headingRef,
}: ProjectDetailViewProps) {
  const roleSummary = getProjectRoleSummary(project)
  const contributionItems = getProjectContributionItems(project)
  const overview = project.detail?.overview ?? []
  const decisions = project.detail?.decisions ?? []
  const retrospective = project.detail?.retrospective ?? []

  return (
    <article className="project-detail">
      <section className="project-detail__hero" aria-labelledby="project-detail-heading">
        <div className="project-detail__hero-copy">
          <p className="project-detail__stage">{project.stage}</p>
          <h1 id="project-detail-heading" ref={headingRef} tabIndex={-1}>{project.title}</h1>
          <div className="project-detail__hero-actions">
            <a href={project.githubUrl} target="_blank" rel="noreferrer">
              GitHub에서 코드 보기
            </a>
            <Link to="/#projects">프로젝트 목록</Link>
          </div>
        </div>
        <ProjectImage
          project={project}
          className="project-detail__image"
          fallbackClassName="project-detail__image-placeholder"
        />
      </section>

      <dl className="project-detail__summary" aria-label="프로젝트 빠른 요약">
        <div><dt>프로젝트</dt><dd>{project.description}</dd></div>
        <div><dt>내 역할</dt><dd>{roleSummary}</dd></div>
        <div><dt>성장</dt><dd>{project.growth}</dd></div>
      </dl>

      {overview.length > 0 ? (
        <section className="project-detail__section" aria-labelledby="project-overview-heading">
          <h2 id="project-overview-heading">프로젝트 개요</h2>
          {overview.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </section>
      ) : null}

      {contributionItems.length > 0 ? (
        <section className="project-detail__section" aria-labelledby="project-contribution-heading">
          <h2 id="project-contribution-heading">직접 기여</h2>
          <ul>{contributionItems.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
      ) : null}

      {decisions.length > 0 ? (
        <section className="project-detail__section" aria-labelledby="project-decisions-heading">
          <h2 id="project-decisions-heading">기술 설계와 판단</h2>
          <div className="project-detail__decisions">
            {decisions.map((decision) => (
              <article key={decision.title}>
                <h3>{decision.title}</h3>
                <dl>
                  <div><dt>상황</dt><dd>{decision.situation}</dd></div>
                  <div><dt>선택</dt><dd>{decision.choice}</dd></div>
                  <div><dt>이유</dt><dd>{decision.reason}</dd></div>
                  <div><dt>구현</dt><dd>{decision.implementation}</dd></div>
                  {decision.result ? <div><dt>결과</dt><dd>{decision.result}</dd></div> : null}
                  {decision.reflection ? <div><dt>회고</dt><dd>{decision.reflection}</dd></div> : null}
                </dl>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="project-detail__section" aria-labelledby="project-technologies-heading">
        <h2 id="project-technologies-heading">기술 구성</h2>
        <div className="project-detail__technology-groups">
          <section aria-labelledby="project-direct-technologies-heading">
            <h3 id="project-direct-technologies-heading">직접 사용 기술</h3>
            <ul>{project.technologies.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          {project.teamTechnologies?.length ? (
            <section aria-labelledby="project-team-technologies-heading">
              <h3 id="project-team-technologies-heading">팀 시스템 연동</h3>
              <ul>{project.teamTechnologies.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
          ) : null}
        </div>
      </section>

      {retrospective.length > 0 ? (
        <section className="project-detail__section" aria-labelledby="project-retrospective-heading">
          <h2 id="project-retrospective-heading">성장과 회고</h2>
          {retrospective.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </section>
      ) : null}

      <nav className="project-detail__project-navigation" aria-label="다른 프로젝트">
        {previousProject ? (
          <Link to={getProjectPath(previousProject)}>이전 · {previousProject.title}</Link>
        ) : <span />}
        {nextProject ? (
          <Link to={getProjectPath(nextProject)}>다음 · {nextProject.title}</Link>
        ) : <span />}
      </nav>
    </article>
  )
}
```

- [ ] **Step 5: Refactor the green baseline into named reusable sections**

Create `src/components/project-detail/ProjectActions.tsx`:

```tsx
import { Link } from 'react-router'

interface ProjectActionsProps {
  githubUrl: string
}

export function ProjectActions({ githubUrl }: ProjectActionsProps) {
  return (
    <div className="project-detail__hero-actions">
      <a href={githubUrl} target="_blank" rel="noreferrer">
        GitHub에서 코드 보기
      </a>
      <Link to="/#projects">프로젝트 목록</Link>
    </div>
  )
}
```

Create `src/components/project-detail/DetailHero.tsx`:

```tsx
import type { RefObject } from 'react'
import type { Project } from '../../types/portfolio'
import { ProjectImage } from '../ProjectImage'
import { ProjectActions } from './ProjectActions'

interface DetailHeroProps {
  project: Project
  headingRef: RefObject<HTMLHeadingElement | null>
}

export function DetailHero({ project, headingRef }: DetailHeroProps) {
  return (
    <section className="project-detail__hero" aria-labelledby="project-detail-heading">
      <div className="project-detail__hero-copy">
        <p className="project-detail__stage">{project.stage}</p>
        <h1 id="project-detail-heading" ref={headingRef} tabIndex={-1}>{project.title}</h1>
        <ProjectActions githubUrl={project.githubUrl} />
      </div>
      <ProjectImage
        project={project}
        className="project-detail__image"
        fallbackClassName="project-detail__image-placeholder"
      />
    </section>
  )
}
```

Create `src/components/project-detail/QuickSummary.tsx`:

```tsx
import type { Project } from '../../types/portfolio'

interface QuickSummaryProps {
  project: Pick<Project, 'description' | 'growth'>
  roleSummary: string
}

export function QuickSummary({ project, roleSummary }: QuickSummaryProps) {
  return (
    <dl className="project-detail__summary" aria-label="프로젝트 빠른 요약">
      <div><dt>프로젝트</dt><dd>{project.description}</dd></div>
      <div><dt>내 역할</dt><dd>{roleSummary}</dd></div>
      <div><dt>성장</dt><dd>{project.growth}</dd></div>
    </dl>
  )
}
```

Create `src/components/project-detail/OverviewSection.tsx`:

```tsx
interface OverviewSectionProps {
  paragraphs: readonly string[]
}

export function OverviewSection({ paragraphs }: OverviewSectionProps) {
  if (paragraphs.length === 0) {
    return null
  }

  return (
    <section className="project-detail__section" aria-labelledby="project-overview-heading">
      <h2 id="project-overview-heading">프로젝트 개요</h2>
      {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
    </section>
  )
}
```

Create `src/components/project-detail/ContributionSection.tsx`:

```tsx
interface ContributionSectionProps {
  items: readonly string[]
}

export function ContributionSection({ items }: ContributionSectionProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="project-detail__section" aria-labelledby="project-contribution-heading">
      <h2 id="project-contribution-heading">직접 기여</h2>
      <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
    </section>
  )
}
```

Create `src/components/project-detail/TechnicalSection.tsx`:

```tsx
import type { Project } from '../../types/portfolio'

interface TechnicalSectionProps {
  project: Project
}

export function TechnicalSection({ project }: TechnicalSectionProps) {
  const decisions = project.detail?.decisions ?? []

  return (
    <>
      {decisions.length > 0 ? (
        <section className="project-detail__section" aria-labelledby="project-decisions-heading">
          <h2 id="project-decisions-heading">기술 설계와 판단</h2>
          <div className="project-detail__decisions">
            {decisions.map((decision) => (
              <article key={decision.title}>
                <h3>{decision.title}</h3>
                <dl>
                  <div><dt>상황</dt><dd>{decision.situation}</dd></div>
                  <div><dt>선택</dt><dd>{decision.choice}</dd></div>
                  <div><dt>이유</dt><dd>{decision.reason}</dd></div>
                  <div><dt>구현</dt><dd>{decision.implementation}</dd></div>
                  {decision.result ? <div><dt>결과</dt><dd>{decision.result}</dd></div> : null}
                  {decision.reflection ? <div><dt>회고</dt><dd>{decision.reflection}</dd></div> : null}
                </dl>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="project-detail__section" aria-labelledby="project-technologies-heading">
        <h2 id="project-technologies-heading">기술 구성</h2>
        <div className="project-detail__technology-groups">
          <section aria-labelledby="project-direct-technologies-heading">
            <h3 id="project-direct-technologies-heading">직접 사용 기술</h3>
            <ul>{project.technologies.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          {project.teamTechnologies?.length ? (
            <section aria-labelledby="project-team-technologies-heading">
              <h3 id="project-team-technologies-heading">팀 시스템 연동</h3>
              <ul>{project.teamTechnologies.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
          ) : null}
        </div>
      </section>
    </>
  )
}
```

Create `src/components/project-detail/RetrospectiveSection.tsx`:

```tsx
interface RetrospectiveSectionProps {
  paragraphs: readonly string[]
}

export function RetrospectiveSection({ paragraphs }: RetrospectiveSectionProps) {
  if (paragraphs.length === 0) {
    return null
  }

  return (
    <section className="project-detail__section" aria-labelledby="project-retrospective-heading">
      <h2 id="project-retrospective-heading">성장과 회고</h2>
      {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
    </section>
  )
}
```

Finally replace `src/components/project-detail/ProjectDetailView.tsx` with the composition-only version:

```tsx
import type { RefObject } from 'react'
import { Link } from 'react-router'
import {
  getProjectContributionItems,
  getProjectPath,
  getProjectRoleSummary,
} from '../../lib/projects'
import type { Project } from '../../types/portfolio'
import { ContributionSection } from './ContributionSection'
import { DetailHero } from './DetailHero'
import { OverviewSection } from './OverviewSection'
import { QuickSummary } from './QuickSummary'
import { RetrospectiveSection } from './RetrospectiveSection'
import { TechnicalSection } from './TechnicalSection'

interface ProjectDetailViewProps {
  project: Project
  previousProject: Project | null
  nextProject: Project | null
  headingRef: RefObject<HTMLHeadingElement | null>
}

export function ProjectDetailView({
  project,
  previousProject,
  nextProject,
  headingRef,
}: ProjectDetailViewProps) {
  const roleSummary = getProjectRoleSummary(project)
  const contributionItems = getProjectContributionItems(project)

  return (
    <article className="project-detail">
      <DetailHero project={project} headingRef={headingRef} />
      <QuickSummary project={project} roleSummary={roleSummary} />
      <OverviewSection paragraphs={project.detail?.overview ?? []} />
      <ContributionSection items={contributionItems} />
      <TechnicalSection project={project} />
      <RetrospectiveSection paragraphs={project.detail?.retrospective ?? []} />

      <nav className="project-detail__project-navigation" aria-label="다른 프로젝트">
        {previousProject ? (
          <Link to={getProjectPath(previousProject)}>이전 · {previousProject.title}</Link>
        ) : <span />}
        {nextProject ? (
          <Link to={getProjectPath(nextProject)}>다음 · {nextProject.title}</Link>
        ) : <span />}
      </nav>
    </article>
  )
}
```

Run the same detail test immediately after the refactor. Expected: it remains PASS, proving the extraction did not change behavior.

- [ ] **Step 6: Add the exact shared detail styles**

Insert this block immediately before `.site-footer` in `src/index.css`:

```css
.project-detail-page {
  padding-block: clamp(3rem, 7vw, 5.5rem);
}

.project-detail {
  min-width: 0;
}

.project-detail__hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 0.8fr);
  gap: clamp(2rem, 5vw, 4rem);
  align-items: center;
  padding: clamp(1.5rem, 4vw, 2.5rem);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-large);
}

.project-detail__hero-copy {
  min-width: 0;
}

.project-detail__stage {
  color: var(--color-text-small);
  font-size: 0.75rem;
  font-weight: 750;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.project-detail__hero h1 {
  margin-top: 0.75rem;
  font-size: clamp(2.25rem, 6vw, 4.25rem);
  font-weight: 850;
  line-height: 1.05;
  letter-spacing: -0.055em;
  overflow-wrap: anywhere;
}

#project-detail-heading:focus:not(:focus-visible) {
  outline: none;
}

#project-detail-heading:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 5px;
}

.project-detail__hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 2rem;
}

.project-detail__hero-actions a {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-small);
  font-size: 0.8125rem;
  font-weight: 700;
  text-decoration: none;
  transition: background-color var(--transition-fast), border-color var(--transition-fast), transform var(--transition-fast);
}

.project-detail__hero-actions a:first-child {
  color: var(--color-primary-text);
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.project-detail__hero-actions a:hover {
  transform: translateY(-1px);
}

.project-detail__hero-actions a:first-child:hover {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

.project-detail__hero-actions a:last-child:hover {
  background: var(--color-surface-muted);
}

.project-detail__image,
.project-detail__image-placeholder {
  width: 100%;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-medium);
  object-fit: cover;
}

.project-detail__image-placeholder {
  display: grid;
  place-items: center;
  color: var(--color-text-muted);
  font-size: clamp(2.5rem, 7vw, 4.5rem);
  font-weight: 850;
  letter-spacing: -0.06em;
}

.project-detail__summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: clamp(2rem, 5vw, 3.5rem) 0 0;
  padding: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-medium);
}

.project-detail__summary > div {
  min-width: 0;
  padding: clamp(1.125rem, 3vw, 1.5rem);
}

.project-detail__summary > div + div {
  border-left: 1px solid var(--color-border);
}

.project-detail__summary dt,
.project-detail__decisions dt {
  color: var(--color-text-small);
  font-size: 0.6875rem;
  font-weight: 750;
  letter-spacing: 0.08em;
}

.project-detail__summary dd,
.project-detail__decisions dd {
  margin: 0.5rem 0 0;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  line-height: 1.7;
  word-break: keep-all;
}

.project-detail__section {
  padding-block: clamp(3rem, 7vw, 5rem);
  border-top: 1px solid var(--color-border);
}

.project-detail__summary + .project-detail__section {
  margin-top: clamp(3rem, 7vw, 5rem);
}

.project-detail__section h2 {
  margin-bottom: 1.5rem;
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 820;
  line-height: 1.2;
  letter-spacing: -0.04em;
}

.project-detail__section > p,
.project-detail__section > ul {
  max-width: 780px;
}

.project-detail__section > p,
.project-detail__section li {
  color: var(--color-text-secondary);
  line-height: 1.8;
  word-break: keep-all;
}

.project-detail__section > p + p {
  margin-top: 1rem;
}

.project-detail__section > ul {
  display: grid;
  gap: 0.75rem;
  margin: 0;
  padding-left: 1.25rem;
}

.project-detail__decisions {
  display: grid;
  gap: 1rem;
}

.project-detail__decisions > article {
  padding: clamp(1.25rem, 3vw, 1.75rem);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-medium);
}

.project-detail__decisions h3 {
  margin-bottom: 1.25rem;
  font-size: 1.125rem;
  letter-spacing: -0.025em;
}

.project-detail__decisions dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.25rem;
  margin: 0;
}

.project-detail__technology-groups {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.project-detail__technology-groups > section {
  padding: clamp(1.25rem, 3vw, 1.75rem);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-medium);
}

.project-detail__technology-groups h3 {
  margin-bottom: 1rem;
  font-size: 0.8125rem;
  font-weight: 750;
  letter-spacing: 0.05em;
}

.project-detail__technology-groups ul {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.project-detail__technology-groups li {
  padding: 0.35rem 0.55rem;
  background: var(--color-surface-muted);
  border-radius: 5px;
  font-size: 0.75rem;
  font-weight: 650;
}

.project-detail__project-navigation {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  padding-block: clamp(2rem, 5vw, 3rem);
  border-top: 1px solid var(--color-border);
}

.project-detail__project-navigation a {
  min-width: 0;
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.project-detail__project-navigation a:last-child {
  text-align: right;
}
```

Add these declarations inside the existing `@media (max-width: 767px)` block:

```css
  .project-detail__hero,
  .project-detail__summary,
  .project-detail__decisions dl,
  .project-detail__technology-groups,
  .project-detail__project-navigation {
    grid-template-columns: 1fr;
  }

  .project-detail__summary > div + div {
    border-top: 1px solid var(--color-border);
    border-left: 0;
  }

  .project-detail__project-navigation a:last-child {
    text-align: left;
  }
```

Add these declarations inside the existing `@media (max-width: 479px)` block:

```css
  .project-detail__hero {
    padding: 1.25rem;
  }

  .project-detail__hero-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .project-detail__hero-actions a {
    width: 100%;
  }
```

- [ ] **Step 7: Run the detail-view tests and type check**

Run:

```powershell
npm.cmd run test -- src/components/project-detail/ProjectDetailView.test.tsx
npm.cmd exec -- tsc -b
```

Expected: PASS for current-data fallback, populated optional data, external action safety, previous/next links, and empty team technology behavior.

- [ ] **Step 8: Commit the reusable detail checkpoint, only if authorized**

```powershell
git add src/components/ProjectImage.tsx src/components/project-detail/DetailHero.tsx src/components/project-detail/ProjectActions.tsx src/components/project-detail/QuickSummary.tsx src/components/project-detail/OverviewSection.tsx src/components/project-detail/ContributionSection.tsx src/components/project-detail/TechnicalSection.tsx src/components/project-detail/RetrospectiveSection.tsx src/components/project-detail/ProjectDetailView.tsx src/components/project-detail/ProjectDetailView.test.tsx src/index.css
git commit -m "feat(projects): add reusable detail view"
```

---

### Task 3: Add the Router Shell, Metadata, Header, and Scroll Behavior

**Files:**
- Create: `src/lib/projectMetadata.ts`
- Create: `src/lib/projectMetadata.test.ts`
- Create: `src/components/DocumentMetadata.tsx`
- Create: `src/components/DocumentMetadata.test.tsx`
- Create: `src/components/DetailHeader.tsx`
- Create: `src/components/project-detail/ProjectDetailLayout.tsx`
- Create: `src/pages/PortfolioHomePage.tsx`
- Create: `src/pages/ProjectDetailPage.tsx`
- Create: `src/pages/NotFoundPage.tsx`
- Create: `src/router/AppRouter.tsx`
- Create: `src/router/AppRouter.test.tsx`
- Modify: `src/hooks/useActiveSection.ts`
- Modify: `src/hooks/useActiveSection.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/index.css`
- Modify: `src/test/setup.ts`
- Modify: `index.html`

**Interfaces:**
- Produces: `homeMetadata`, `notFoundMetadata`, and `getProjectMetadata(project, profile)`.
- Produces: `DocumentMetadata({ metadata })` with cleanup-safe head synchronization.
- Produces: Home `/`, detail `/projects/:projectId/`, and `*` not-found routes.
- Guarantees: React Router exclusively owns top, hash, and POP scroll behavior; detail pages only move focus to `h1`; `/#projects` reaches Projects; browser Back uses saved restoration.

- [ ] **Step 1: Write failing metadata tests**

Create `src/lib/projectMetadata.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { portfolioData } from '../data/portfolio'
import { getProjectMetadata, homeMetadata, notFoundMetadata } from './projectMetadata'

describe('project metadata', () => {
  it('builds canonical HumouR metadata', () => {
    expect(getProjectMetadata(portfolioData.flagshipProject, portfolioData.profile)).toEqual({
      title: 'HumouR | 서민혁 포트폴리오',
      description: portfolioData.flagshipProject.description,
      ogTitle: 'HumouR | 서민혁 포트폴리오',
      ogDescription: portfolioData.flagshipProject.description,
      ogUrl: 'https://minhyeok328.github.io/projects/humour/',
    })
  })

  it('keeps stable home and not-found metadata', () => {
    expect(homeMetadata.ogUrl).toBe('https://minhyeok328.github.io/')
    expect(notFoundMetadata.title).toBe('페이지를 찾을 수 없습니다 | 서민혁 포트폴리오')
  })
})
```

Create `src/components/DocumentMetadata.test.tsx`:

```tsx
import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { PageMetadata } from '../lib/projectMetadata'
import { DocumentMetadata } from './DocumentMetadata'

const metadata: PageMetadata = {
  title: '상세 제목',
  description: '상세 설명',
  ogTitle: '상세 OG 제목',
  ogDescription: '상세 OG 설명',
  ogUrl: 'https://minhyeok328.github.io/projects/test/',
}

describe('DocumentMetadata', () => {
  beforeEach(() => {
    document.head.innerHTML = `
      <title id="page-title">홈 제목</title>
      <meta id="page-description" name="description" content="홈 설명" />
      <meta id="page-og-title" property="og:title" content="홈 OG 제목" />
      <meta id="page-og-description" property="og:description" content="홈 OG 설명" />
      <meta id="page-og-url" property="og:url" content="https://minhyeok328.github.io/" />
    `
  })

  afterEach(() => {
    document.head.innerHTML = ''
  })

  it('applies route metadata and restores the previous values on unmount', () => {
    const view = render(<DocumentMetadata metadata={metadata} />)

    expect(document.title).toBe('상세 제목')
    expect(document.getElementById('page-description')).toHaveAttribute('content', '상세 설명')
    expect(document.getElementById('page-og-title')).toHaveAttribute('content', '상세 OG 제목')
    expect(document.getElementById('page-og-description')).toHaveAttribute('content', '상세 OG 설명')
    expect(document.getElementById('page-og-url')).toHaveAttribute('content', metadata.ogUrl)

    view.unmount()

    expect(document.title).toBe('홈 제목')
    expect(document.getElementById('page-description')).toHaveAttribute('content', '홈 설명')
  })
})
```

- [ ] **Step 2: Write failing route and canonical-hash regression tests**

Update `src/test/setup.ts` so router scroll behavior is deterministic and isolated:

```ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
})

afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
  delete document.documentElement.dataset.theme
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
```

Create `src/router/AppRouter.test.tsx`:

```tsx
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { portfolioData } from '../data/portfolio'
import { appRoutes } from './AppRouter'

function renderRoute(path: string) {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] })
  return { router, ...render(<RouterProvider router={router} />) }
}

describe('AppRouter', () => {
  let scrollIntoView: ReturnType<typeof vi.fn>

  beforeEach(() => {
    window.history.replaceState(null, '', '/')
    scrollIntoView = vi.fn()
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    })
  })

  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView')
  })

  it.each([
    ['/projects/humour/', 'HumouR', 'https://github.com/minhyeok328/Final_project'],
    ['/projects/vehicle-tco/', '차량 운영·관리 비용 계산 시스템', 'https://github.com/minhyeok328/1st_project'],
    ['/projects/bank-churners/', '신용카드 고객 이탈 분석', 'https://github.com/minhyeok328/2nd_project'],
    ['/projects/pickle/', 'PICKLE 맛집 추천 챗봇', 'https://github.com/minhyeok328/3rd_project'],
    ['/projects/lg-home-ai/', 'LG Home AI 가전 상담', 'https://github.com/minhyeok328/4th_project'],
  ])('renders %s with its matching project and repository', (path, title, repository) => {
    renderRoute(path)

    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument()
    const codeLink = screen.getByRole('link', { name: 'GitHub에서 코드 보기' })
    expect(codeLink).toHaveAttribute('href', repository)
    expect(codeLink).toHaveAttribute('target', '_blank')
    expect(codeLink).toHaveAttribute('rel', 'noreferrer')
  })

  it('uses nested-safe detail header destinations and the one repository action', () => {
    renderRoute('/projects/humour/')

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/#projects')
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/minhyeok328',
    )
    expect(screen.getByRole('link', { name: 'GitHub에서 코드 보기' })).toHaveAttribute(
      'href',
      'https://github.com/minhyeok328/Final_project',
    )
  })

  it('applies project metadata on direct detail entry', () => {
    renderRoute('/projects/humour/')

    expect(document.title).toBe('HumouR | 서민혁 포트폴리오')
    expect(document.getElementById('page-description')).toHaveAttribute(
      'content',
      '기업 정보, 채용 공고, 지원서 분석, 리포트, 면접 질문과 문서 챗을 하나의 흐름으로 연결한 AI 기반 채용 운영 서비스입니다.',
    )
    expect(document.getElementById('page-og-url')).toHaveAttribute(
      'content',
      'https://minhyeok328.github.io/projects/humour/',
    )
  })

  it('replaces metadata across detail-to-detail and detail-to-home navigation', async () => {
    const { router } = renderRoute('/projects/humour/')

    await act(async () => {
      await router.navigate('/projects/pickle/')
    })
    expect(document.title).toBe('PICKLE 맛집 추천 챗봇 | 서민혁 포트폴리오')
    expect(document.getElementById('page-description')).toHaveAttribute(
      'content',
      portfolioData.journeyProjects[2].description,
    )
    expect(document.getElementById('page-og-url')).toHaveAttribute(
      'content',
      'https://minhyeok328.github.io/projects/pickle/',
    )

    await act(async () => {
      await router.navigate('/')
    })
    expect(document.title).toBe('서민혁 | 프론트엔드 강점을 가진 AI 풀스택 개발자')
    expect(document.getElementById('page-og-url')).toHaveAttribute(
      'content',
      'https://minhyeok328.github.io/',
    )
  })

  it('moves HumouR contribution and team-system depth from the card to its detail page', () => {
    renderRoute('/projects/humour/')

    const contribution = screen.getByRole('region', { name: '직접 기여' })
    const teamTechnologies = screen.getByRole('region', { name: '팀 시스템 연동' })

    expect(screen.getAllByText(portfolioData.flagshipProject.contribution[0])).toHaveLength(1)
    expect(within(contribution).getAllByRole('listitem').map((item) => item.textContent)).toEqual(
      portfolioData.flagshipProject.contribution.slice(1),
    )
    expect(within(teamTechnologies).getAllByRole('listitem').map((item) => item.textContent)).toEqual(
      portfolioData.flagshipProject.teamTechnologies,
    )
  })

  it('focuses the project heading without adding it to the Tab order', () => {
    renderRoute('/projects/pickle/')

    const heading = screen.getByRole('heading', { level: 1, name: 'PICKLE 맛집 추천 챗봇' })
    expect(document.activeElement).toBe(heading)
    expect(heading).toHaveAttribute('tabindex', '-1')
  })

  it('scrolls an initial home hash after the Projects section exists', () => {
    renderRoute('/#projects')

    expect(scrollIntoView).toHaveBeenCalled()
  })

  it('handles the explicit project-list PUSH through ScrollRestoration', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/projects/humour/')
    scrollIntoView.mockClear()

    await user.click(screen.getByRole('link', { name: '프로젝트 목록' }))

    expect(router.state.location.pathname).toBe('/')
    expect(router.state.location.hash).toBe('#projects')
    expect(scrollIntoView).toHaveBeenCalled()
  })

  it('restores a saved home position on POP without forcing the hash target', async () => {
    let currentScrollY = 640
    vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => currentScrollY)
    const { router } = renderRoute('/#projects')
    const scrollTo = vi.mocked(window.scrollTo)
    scrollIntoView.mockClear()

    await act(async () => {
      await router.navigate('/projects/humour/')
    })
    currentScrollY = 120
    scrollIntoView.mockClear()
    scrollTo.mockClear()

    await act(async () => {
      await router.navigate(-1)
    })

    expect(router.state.location.pathname).toBe('/')
    expect(router.state.location.hash).toBe('#projects')
    expect(scrollIntoView).not.toHaveBeenCalled()
    expect(scrollTo).toHaveBeenCalledWith(0, 640)
  })

  it('renders not found for an unknown project id and an unknown path', () => {
    const first = renderRoute('/projects/missing/')
    expect(screen.getByRole('heading', { name: '페이지를 찾을 수 없습니다.' })).toBeInTheDocument()
    first.unmount()

    renderRoute('/missing/')
    expect(screen.getByRole('heading', { name: '페이지를 찾을 수 없습니다.' })).toBeInTheDocument()
  })
})
```

Add this test to `src/hooks/useActiveSection.test.tsx`:

```tsx
  it('preserves an initial canonical hash until that section becomes active', () => {
    document.body.innerHTML = '<section id="top"></section><section id="projects"></section>'
    window.history.replaceState(null, '', '/#projects')
    const emit = installIntersectionObserver()
    const replaceState = vi.spyOn(window.history, 'replaceState')
    const top = document.getElementById('top')!
    const projects = document.getElementById('projects')!
    const { result } = renderHook(() => useActiveSection(['top', 'projects']))

    emit([intersectionEntry(top, true, 1)])

    expect(result.current).toBe('top')
    expect(window.location.hash).toBe('#projects')
    expect(replaceState).not.toHaveBeenCalled()

    emit([intersectionEntry(projects, true, 1)])

    expect(result.current).toBe('projects')
    expect(window.location.hash).toBe('#projects')
    expect(replaceState).not.toHaveBeenCalled()
  })
```

- [ ] **Step 3: Run the new tests and verify the red state**

Run:

```powershell
npm.cmd run test -- src/lib/projectMetadata.test.ts src/components/DocumentMetadata.test.tsx src/router/AppRouter.test.tsx src/hooks/useActiveSection.test.tsx
```

Expected: FAIL because metadata, router, route pages, and canonical-hash protection are not implemented.

- [ ] **Step 4: Add stable metadata IDs and implement shared metadata values**

In `index.html`, replace the title and four route-varying meta tags with:

```html
    <title id="page-title">서민혁 | 프론트엔드 강점을 가진 AI 풀스택 개발자</title>
    <meta
      id="page-description"
      name="description"
      content="프론트엔드 구현과 데이터·API·LLM 서비스 통합 경험을 소개하는 서민혁의 개발자 포트폴리오입니다."
    />
    <meta
      id="page-og-title"
      property="og:title"
      content="서민혁 | 프론트엔드 강점을 가진 AI 풀스택 개발자"
    />
    <meta
      id="page-og-description"
      property="og:description"
      content="사용자 경험부터 데이터·API·LLM까지 연결하는 개발자 포트폴리오입니다."
    />
    <meta property="og:type" content="website" />
    <meta
      id="page-og-url"
      property="og:url"
      content="https://minhyeok328.github.io/"
    />
```

Then create `src/lib/projectMetadata.ts`:

```ts
import type { Profile, Project } from '../types/portfolio'
import { getProjectPath } from './projects'

const SITE_ORIGIN = 'https://minhyeok328.github.io'

export interface PageMetadata {
  title: string
  description: string
  ogTitle: string
  ogDescription: string
  ogUrl: string
}

export const homeMetadata: PageMetadata = {
  title: '서민혁 | 프론트엔드 강점을 가진 AI 풀스택 개발자',
  description: '프론트엔드 구현과 데이터·API·LLM 서비스 통합 경험을 소개하는 서민혁의 개발자 포트폴리오입니다.',
  ogTitle: '서민혁 | 프론트엔드 강점을 가진 AI 풀스택 개발자',
  ogDescription: '사용자 경험부터 데이터·API·LLM까지 연결하는 개발자 포트폴리오입니다.',
  ogUrl: `${SITE_ORIGIN}/`,
}

export const notFoundMetadata: PageMetadata = {
  title: '페이지를 찾을 수 없습니다 | 서민혁 포트폴리오',
  description: '요청한 포트폴리오 페이지를 찾을 수 없습니다.',
  ogTitle: '페이지를 찾을 수 없습니다 | 서민혁 포트폴리오',
  ogDescription: '요청한 포트폴리오 페이지를 찾을 수 없습니다.',
  ogUrl: `${SITE_ORIGIN}/`,
}

export function getProjectMetadata(
  project: Pick<Project, 'id' | 'title' | 'description'>,
  profile: Pick<Profile, 'name'>,
): PageMetadata {
  const title = `${project.title} | ${profile.name} 포트폴리오`

  return {
    title,
    description: project.description,
    ogTitle: title,
    ogDescription: project.description,
    ogUrl: `${SITE_ORIGIN}${getProjectPath(project)}`,
  }
}
```

- [ ] **Step 5: Implement cleanup-safe document metadata synchronization**

Create `src/components/DocumentMetadata.tsx`:

```tsx
import { useEffect } from 'react'
import type { PageMetadata } from '../lib/projectMetadata'

interface DocumentMetadataProps {
  metadata: PageMetadata
}

function getOrCreateTitle() {
  const existing = document.getElementById('page-title')

  if (existing instanceof HTMLTitleElement) {
    return { element: existing, created: false }
  }

  if (existing) {
    throw new Error('page-title must be a title element')
  }

  const element = document.createElement('title')
  element.id = 'page-title'
  document.head.append(element)
  return { element, created: true }
}

function getOrCreateMeta(id: string, attribute: 'name' | 'property', value: string) {
  const existing = document.getElementById(id)

  if (existing instanceof HTMLMetaElement) {
    return { element: existing, created: false }
  }

  if (existing) {
    throw new Error(`${id} must be a meta element`)
  }

  const element = document.createElement('meta')
  element.id = id
  element.setAttribute(attribute, value)
  document.head.append(element)
  return { element, created: true }
}

function applyDocumentMetadata(metadata: PageMetadata) {
  const title = getOrCreateTitle()
  const metaEntries = [
    [getOrCreateMeta('page-description', 'name', 'description'), metadata.description],
    [getOrCreateMeta('page-og-title', 'property', 'og:title'), metadata.ogTitle],
    [getOrCreateMeta('page-og-description', 'property', 'og:description'), metadata.ogDescription],
    [getOrCreateMeta('page-og-url', 'property', 'og:url'), metadata.ogUrl],
  ] as const
  const previousTitle = title.element.textContent ?? ''
  const previousContents = metaEntries.map(([entry]) => entry.element.content)

  title.element.textContent = metadata.title
  metaEntries.forEach(([entry, content]) => {
    entry.element.content = content
  })

  return () => {
    if (title.created) {
      title.element.remove()
    } else {
      title.element.textContent = previousTitle
    }

    metaEntries.forEach(([entry], index) => {
      if (entry.created) {
        entry.element.remove()
      } else {
        entry.element.content = previousContents[index]
      }
    })
  }
}

export function DocumentMetadata({ metadata }: DocumentMetadataProps) {
  const { title, description, ogTitle, ogDescription, ogUrl } = metadata

  useEffect(() => applyDocumentMetadata({
    title,
    description,
    ogTitle,
    ogDescription,
    ogUrl,
  }), [description, ogDescription, ogTitle, ogUrl, title])

  return null
}
```

- [ ] **Step 6: Run the metadata slice green while route tests remain intentionally red**

Run:

```powershell
npm.cmd run test -- src/lib/projectMetadata.test.ts src/components/DocumentMetadata.test.tsx
```

Expected: PASS. The still-unimplemented router tests are not included in this focused checkpoint.

- [ ] **Step 7: Implement the nested-safe detail header and shared detail layout**

Create `src/components/DetailHeader.tsx`:

```tsx
import { Link } from 'react-router'
import { ThemeToggle } from './ThemeToggle'

interface DetailHeaderProps {
  githubUrl: string
}

export function DetailHeader({ githubUrl }: DetailHeaderProps) {
  return (
    <header className="site-header detail-header">
      <div className="site-container site-header__inner detail-header__inner">
        <Link className="header__brand" to="/">MH</Link>

        <nav className="detail-header__navigation" aria-label="상세 페이지 탐색">
          <ul className="header__navigation-list">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/#projects">Projects</Link></li>
            <li><a href={githubUrl} target="_blank" rel="noreferrer">GitHub</a></li>
          </ul>
        </nav>

        <div className="header__actions"><ThemeToggle /></div>
      </div>
    </header>
  )
}
```

Create `src/components/project-detail/ProjectDetailLayout.tsx`:

```tsx
import type { ReactNode } from 'react'
import { DetailHeader } from '../DetailHeader'
import { Footer } from '../Footer'

interface ProjectDetailLayoutProps {
  children: ReactNode
  githubUrl: string
  name: string
}

export function ProjectDetailLayout({
  children,
  githubUrl,
  name,
}: ProjectDetailLayoutProps) {
  return (
    <>
      <DetailHeader githubUrl={githubUrl} />
      <main id="top" className="site-container project-detail-page">{children}</main>
      <Footer name={name} />
    </>
  )
}
```

- [ ] **Step 8: Move the existing home into a route page and reset home metadata**

Create `src/pages/PortfolioHomePage.tsx`:

```tsx
import { DocumentMetadata } from '../components/DocumentMetadata'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { portfolioData } from '../data/portfolio'
import { useActiveSection } from '../hooks/useActiveSection'
import { getNavigationItems } from '../lib/portfolio'
import { homeMetadata } from '../lib/projectMetadata'
import { AboutSection } from '../sections/AboutSection'
import { ContactSection } from '../sections/ContactSection'
import { ExperienceSection } from '../sections/ExperienceSection'
import { HeroSection } from '../sections/HeroSection'
import { ProjectsSection } from '../sections/ProjectsSection'
import { SkillsSection } from '../sections/SkillsSection'

export function PortfolioHomePage() {
  const navigationItems = getNavigationItems(portfolioData)
  const observedSectionIds = ['top', ...navigationItems.map((item) => item.id)]
  const activeSection = useActiveSection(observedSectionIds)

  return (
    <>
      <DocumentMetadata metadata={homeMetadata} />
      <Header items={navigationItems} activeSection={activeSection} />
      <main>
        <HeroSection profile={portfolioData.profile} />
        <AboutSection messages={portfolioData.about} />
        <ProjectsSection
          flagshipProject={portfolioData.flagshipProject}
          journeyProjects={portfolioData.journeyProjects}
        />
        <SkillsSection skillGroups={portfolioData.skillGroups} />
        <ExperienceSection experiences={portfolioData.experiences} />
        <ContactSection profile={portfolioData.profile} />
      </main>
      <Footer name={portfolioData.profile.name} />
    </>
  )
}
```

- [ ] **Step 9: Implement resolved detail and not-found pages**

Create `src/pages/ProjectDetailPage.tsx`:

```tsx
import { useEffect, useRef } from 'react'
import { useParams } from 'react-router'
import { DocumentMetadata } from '../components/DocumentMetadata'
import { ProjectDetailLayout } from '../components/project-detail/ProjectDetailLayout'
import { ProjectDetailView } from '../components/project-detail/ProjectDetailView'
import { portfolioData } from '../data/portfolio'
import { getProjectMetadata } from '../lib/projectMetadata'
import { findProjectById, getAdjacentProjects, getOrderedProjects } from '../lib/projects'
import type { Project } from '../types/portfolio'
import { NotFoundPage } from './NotFoundPage'

const projects = getOrderedProjects(portfolioData)

function ResolvedProjectDetailPage({ project }: { project: Project }) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const metadata = getProjectMetadata(project, portfolioData.profile)
  const { previous, next } = getAdjacentProjects(projects, project.id)

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [project.id])

  return (
    <>
      <DocumentMetadata metadata={metadata} />
      <ProjectDetailLayout
        githubUrl={portfolioData.profile.githubUrl}
        name={portfolioData.profile.name}
      >
        <ProjectDetailView
          project={project}
          previousProject={previous}
          nextProject={next}
          headingRef={headingRef}
        />
      </ProjectDetailLayout>
    </>
  )
}

export function ProjectDetailPage() {
  const { projectId } = useParams()
  const project = findProjectById(projects, projectId)

  return project ? <ResolvedProjectDetailPage project={project} /> : <NotFoundPage />
}
```

Create `src/pages/NotFoundPage.tsx`:

```tsx
import { Link } from 'react-router'
import { DetailHeader } from '../components/DetailHeader'
import { DocumentMetadata } from '../components/DocumentMetadata'
import { Footer } from '../components/Footer'
import { portfolioData } from '../data/portfolio'
import { notFoundMetadata } from '../lib/projectMetadata'

export function NotFoundPage() {
  return (
    <>
      <DocumentMetadata metadata={notFoundMetadata} />
      <DetailHeader githubUrl={portfolioData.profile.githubUrl} />
      <main id="top" className="site-container not-found-page">
        <p>404</p>
        <h1>페이지를 찾을 수 없습니다.</h1>
        <p>주소가 바뀌었거나 존재하지 않는 페이지입니다.</p>
        <Link to="/">홈으로 돌아가기</Link>
      </main>
      <Footer name={portfolioData.profile.name} />
    </>
  )
}
```

- [ ] **Step 10: Protect hash intent while keeping one scroll owner**

Do not add a custom route scroll effect. The single root `ScrollRestoration` in Step 11 owns new-location top reset, rendered hash targets, and saved POP positions. Detail pages only focus their heading with `preventScroll: true`.

In `src/hooks/useActiveSection.ts`, replace `getPendingHashOwner` with:

```ts
    const getPendingHashOwner = () => {
      const hashTargetId = window.location.hash.slice(1)
      const hashOwner = getHashOwner(observedSectionIds)

      return (
        hashTargetId
        && hashOwner
        && hashOwner !== selectedSectionId
      ) ? hashOwner : ''
    }
```

This protects both canonical `#projects` and deeper hashes while `ScrollRestoration` finishes. Keep `window.history.replaceState(window.history.state, ...)` unchanged so React Router's history key survives section-hash synchronization.

- [ ] **Step 11: Define routes and connect the app**

Create `src/router/AppRouter.tsx`:

```tsx
import { Outlet, ScrollRestoration, type RouteObject } from 'react-router'
import { NotFoundPage } from '../pages/NotFoundPage'
import { PortfolioHomePage } from '../pages/PortfolioHomePage'
import { ProjectDetailPage } from '../pages/ProjectDetailPage'

function AppRouteLayout() {
  return (
    <>
      <Outlet />
      <ScrollRestoration />
    </>
  )
}

export const appRoutes: RouteObject[] = [
  {
    element: <AppRouteLayout />,
    children: [
      { index: true, element: <PortfolioHomePage /> },
      { path: 'projects/:projectId/', element: <ProjectDetailPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]

```

Replace `src/App.tsx` with:

```tsx
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { appRoutes } from './router/AppRouter'

const appRouter = createBrowserRouter(appRoutes)

export default function App() {
  return <RouterProvider router={appRouter} />
}
```

- [ ] **Step 12: Run the route, hash, focus, metadata-navigation, and restoration slice green**

Run:

```powershell
npm.cmd run test -- src/router/AppRouter.test.tsx src/hooks/useActiveSection.test.tsx
```

Expected: PASS before visual styling. Initial and pushed hashes use `ScrollRestoration`, POP uses the saved location-key position, and the section hook does not overwrite the target hash.

- [ ] **Step 13: Add exact detail-header and not-found styles**

Insert after the current header rules in `src/index.css`:

```css
.detail-header__navigation {
  min-width: 0;
  margin-left: auto;
}

.not-found-page {
  display: grid;
  min-height: calc(100svh - var(--header-height) - 6rem);
  align-content: center;
  justify-items: start;
  gap: 1rem;
  padding-block: clamp(4rem, 10vw, 7rem);
}

.not-found-page > p:first-child {
  color: var(--color-text-small);
  font-size: 0.75rem;
  font-weight: 750;
  letter-spacing: 0.12em;
}

.not-found-page h1 {
  font-size: clamp(2rem, 6vw, 3.5rem);
  line-height: 1.1;
  letter-spacing: -0.05em;
}

.not-found-page h1 + p {
  color: var(--color-text-secondary);
}

.not-found-page a {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  margin-top: 0.5rem;
  padding: 0.625rem 1rem;
  color: var(--color-primary-text);
  background: var(--color-primary);
  border-radius: var(--radius-small);
  font-size: 0.8125rem;
  font-weight: 700;
  text-decoration: none;
}
```

Add inside the existing `@media (max-width: 767px)` block:

```css
  .detail-header__inner {
    flex-wrap: wrap;
    gap: 0.25rem 1rem;
    padding-block: 0.5rem;
  }

  .detail-header__navigation {
    order: 3;
    width: 100%;
    margin-left: 0;
    border-top: 1px solid var(--color-border);
  }

  .detail-header__navigation .header__navigation-list {
    width: 100%;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .detail-header__navigation .header__navigation-list a {
    min-height: 2.75rem;
  }
```

- [ ] **Step 14: Run focused routing, metadata, header, hash, home regressions, and type checking**

Run:

```powershell
npm.cmd run test -- src/lib/projectMetadata.test.ts src/components/DocumentMetadata.test.tsx src/router/AppRouter.test.tsx src/hooks/useActiveSection.test.tsx src/components/Header.test.tsx src/App.test.tsx
npm.cmd exec -- tsc -b
```

Expected: PASS. Existing home behavior still works inside the router; nested detail links are root-safe; initial `/#projects` is not rewritten to `#top`.

- [ ] **Step 15: Commit the routing checkpoint, only if authorized**

```powershell
git add index.html src/lib/projectMetadata.ts src/lib/projectMetadata.test.ts src/components/DocumentMetadata.tsx src/components/DocumentMetadata.test.tsx src/components/DetailHeader.tsx src/components/project-detail/ProjectDetailLayout.tsx src/pages/PortfolioHomePage.tsx src/pages/ProjectDetailPage.tsx src/pages/NotFoundPage.tsx src/router/AppRouter.tsx src/router/AppRouter.test.tsx src/hooks/useActiveSection.ts src/hooks/useActiveSection.test.tsx src/test/setup.ts src/App.tsx src/index.css
git commit -m "feat(routing): add project detail routes"
```

---

### Task 4: Make Home Project Cards Compact Full-Surface Links

**Files:**
- Modify: `src/components/ProjectCard.tsx`
- Modify: `src/components/ProjectCard.test.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: `getProjectPath`, `getProjectRoleSummary`, and `ProjectImage`.
- Produces: one accessible full-card `Link` per project.
- Guarantees: no repository action, CTA text, arrow, growth block, contribution list, team technology list, or nested control remains on a home card.

- [ ] **Step 1: Replace the card test with failing full-surface-link assertions**

Replace `src/components/ProjectCard.test.tsx` with:

```tsx
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { Project } from '../types/portfolio'
import { ProjectCard } from './ProjectCard'

const project: Project = {
  id: 'test-project',
  order: 1,
  stage: 'Test Stage',
  title: '테스트 프로젝트',
  description: '테스트 설명',
  contribution: ['첫 번째 테스트 기여', '두 번째 테스트 기여'],
  growth: '테스트 성장',
  technologies: ['TypeScript', 'React', 'Vitest'],
  githubUrl: 'https://github.com/example/project',
  image: '/images/missing-project.webp',
}

function renderProjectCard(variant: 'flagship' | 'journey' = 'journey') {
  return render(
    <MemoryRouter>
      <ProjectCard project={project} variant={variant} />
    </MemoryRouter>,
  )
}

describe('ProjectCard', () => {
  it('uses the full compact card as the only internal project action', () => {
    renderProjectCard('journey')

    const card = screen.getByTestId('journey-project')
    const link = within(card).getByRole('link', {
      name: '테스트 프로젝트 상세 페이지 보기',
    })

    expect(link).toHaveAttribute('href', '/projects/test-project/')
    expect(link).toHaveTextContent('테스트 설명')
    expect(link).toHaveTextContent('첫 번째 테스트 기여')
    expect(within(link).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'TypeScript',
      'React',
    ])
    expect(within(card).queryByText('상세 보기')).not.toBeInTheDocument()
    expect(within(card).queryByRole('link', { name: /GitHub/ })).not.toBeInTheDocument()
    expect(link.querySelectorAll('a, button, input, select, textarea')).toHaveLength(0)
    expect(link).not.toHaveTextContent(/[→←]/)
  })

  it('uses explicit card role copy when provided', () => {
    render(
      <MemoryRouter>
        <ProjectCard
          project={{ ...project, cardRoleSummary: '명시적 카드 역할' }}
          variant="flagship"
        />
      </MemoryRouter>,
    )

    expect(screen.getByText('명시적 카드 역할')).toBeInTheDocument()
    expect(screen.queryByText('첫 번째 테스트 기여')).not.toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('replaces a failed image with an accessible project-initial fallback', () => {
    renderProjectCard()

    fireEvent.error(screen.getByAltText('테스트 프로젝트 프로젝트 이미지'))

    const fallback = screen.getByRole('img', {
      name: '테스트 프로젝트 프로젝트 이미지 대체 이미지',
    })
    expect(fallback).toHaveTextContent('테스')
  })
})
```

- [ ] **Step 2: Replace home integration assertions before implementation**

In `src/App.test.tsx`, remove these obsolete tests:

- `links every project to its verified GitHub repository`
- `keeps the flagship and journey GitHub links in verified display order`
- `shows contribution, growth, and technologies for every journey project`
- `keeps the flagship contribution, growth, and technology content distinct`
- `renders all six approved HumouR direct contributions`
- `separates HumouR core technologies from the exact team-system list`

Add these exact tests while retaining all unrelated home, contact, growth-line, skills, and accessibility tests:

```tsx
  it('links every project card to its clean detail route without a visible CTA', () => {
    render(<App />)

    const projectCards = [
      screen.getByTestId('flagship-project'),
      ...screen.getAllByTestId('journey-project'),
    ]

    expect(projectCards.map((card) => (
      within(card).getByRole('link').getAttribute('href')
    ))).toEqual([
      '/projects/humour/',
      '/projects/vehicle-tco/',
      '/projects/bank-churners/',
      '/projects/pickle/',
      '/projects/lg-home-ai/',
    ])
    expect(projectCards.map((card) => (
      within(card).getByRole('link').getAttribute('aria-label')
    ))).toEqual([
      'HumouR 상세 페이지 보기',
      '차량 운영·관리 비용 계산 시스템 상세 페이지 보기',
      '신용카드 고객 이탈 분석 상세 페이지 보기',
      'PICKLE 맛집 추천 챗봇 상세 페이지 보기',
      'LG Home AI 가전 상담 상세 페이지 보기',
    ])

    projectCards.forEach((card) => {
      expect(within(card).getAllByRole('link')).toHaveLength(1)
      expect(within(card).queryByText('상세 보기')).not.toBeInTheDocument()
      expect(within(card).queryByRole('link', { name: /GitHub/ })).not.toBeInTheDocument()
      expect(card).not.toHaveTextContent(/[→←]/)
    })
  })

  it('keeps Journey cards to one role summary and two technology tags', () => {
    render(<App />)

    screen.getAllByTestId('journey-project').forEach((card) => {
      const cardScope = within(card)

      expect(cardScope.getByText('내 역할')).toBeInTheDocument()
      expect(cardScope.getByRole('list', { name: /주요 기술/ })).toBeInTheDocument()
      expect(cardScope.getAllByRole('listitem')).toHaveLength(2)
      expect(cardScope.queryByRole('heading', { name: '직접 기여' })).not.toBeInTheDocument()
      expect(cardScope.queryByText('성장')).not.toBeInTheDocument()
      expect(cardScope.queryByText('팀 시스템 연동')).not.toBeInTheDocument()
    })
  })
```

Update the existing placeholder assertion from `/프로젝트 이미지 대체$/` to `/프로젝트 이미지 대체 이미지$/`, matching the shared `ImageWithFallback` contract.

- [ ] **Step 3: Run card and home tests and verify the red state**

Run:

```powershell
npm.cmd run test -- src/components/ProjectCard.test.tsx src/App.test.tsx
```

Expected: FAIL because cards still contain dense sections and an external GitHub link.

- [ ] **Step 4: Replace `ProjectCard` with one compact internal link**

Replace `src/components/ProjectCard.tsx` with:

```tsx
import { Link } from 'react-router'
import { getProjectPath, getProjectRoleSummary } from '../lib/projects'
import type { Project } from '../types/portfolio'
import { ProjectImage } from './ProjectImage'

interface ProjectCardProps {
  project: Project
  variant: 'flagship' | 'journey'
}

export function ProjectCard({ project, variant }: ProjectCardProps) {
  const roleSummary = getProjectRoleSummary(project)
  const technologyLimit = variant === 'flagship' ? 4 : 2
  const visibleTechnologies = project.technologies.slice(0, technologyLimit)

  return (
    <article
      id={project.id}
      className={`project-card project-card--${variant}${variant === 'flagship' ? ' flagship-project' : ''}`}
      data-testid={variant === 'flagship' ? 'flagship-project' : 'journey-project'}
    >
      <Link
        className="project-card__link"
        to={getProjectPath(project)}
        aria-label={`${project.title} 상세 페이지 보기`}
      >
        <ProjectImage
          project={project}
          className="project-card__image"
          fallbackClassName="project-card__image-placeholder"
        />

        <div className="project-card__content">
          <p className="project-card__stage">{project.stage}</p>
          <h3>{project.title}</h3>
          <p>{project.description}</p>
          <p className="project-card__role">
            <strong>내 역할</strong>
            <span>{roleSummary}</span>
          </p>
          <ul
            className="project-card__technology-list"
            aria-label={`${project.title} 주요 기술`}
          >
            {visibleTechnologies.map((technology) => (
              <li key={technology}>{technology}</li>
            ))}
          </ul>
        </div>
      </Link>
    </article>
  )
}
```

- [ ] **Step 5: Replace the dense card CSS with exact full-link rules**

In `src/index.css`, replace the block from `.project-card {` through the last `.project-card--journey .project-card__content > a` rule, leaving the preceding growth-line rules and following `/* Skills */` block intact, with:

```css
.project-card {
  min-width: 0;
  padding: 0;
  cursor: pointer;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-medium);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast);
}

.project-card__link {
  height: 100%;
  color: inherit;
  border-radius: inherit;
  cursor: pointer;
  text-decoration: none;
}

.project-card:is(:hover, :focus-within) {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-card);
  transform: translateY(-3px);
}

.project-card__link:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}

.flagship-project .project-card__link {
  display: grid;
  grid-template-columns: minmax(0, 1.12fr) minmax(0, 0.88fr);
  gap: 32px;
  padding: clamp(1.125rem, 2.5vw, 1.5rem);
}

.project-card__image,
.project-card__image-placeholder {
  width: 100%;
  overflow: hidden;
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  border-radius: calc(var(--radius-medium) - 3px);
  object-fit: cover;
}

.project-card__image-placeholder {
  display: grid;
  place-items: center;
  color: var(--color-text-muted);
  font-weight: 850;
  letter-spacing: -0.06em;
}

.project-card--flagship .project-card__image,
.project-card--flagship .project-card__image-placeholder {
  aspect-ratio: 16 / 10;
  align-self: stretch;
  font-size: clamp(2.75rem, 7vw, 5rem);
}

.project-card__content {
  min-width: 0;
}

.project-card--flagship .project-card__content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0.5rem 0.5rem 0.5rem 0;
}

.project-card__stage {
  color: var(--color-text-small);
  font-size: 0.6875rem;
  font-weight: 750;
  letter-spacing: 0.11em;
  line-height: 1.4;
  text-transform: uppercase;
}

.project-card h3 {
  margin-top: 0.625rem;
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 850;
  line-height: 1.15;
  letter-spacing: -0.05em;
  overflow-wrap: anywhere;
}

.project-card h3 + p {
  margin-top: 0.875rem;
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  line-height: 1.7;
  word-break: keep-all;
}

.project-card__role {
  margin-top: 1.25rem;
  padding-top: 1rem;
  color: var(--color-text-secondary);
  border-top: 1px solid var(--color-border);
  font-size: 0.8125rem;
  line-height: 1.6;
}

.project-card__role strong {
  display: block;
  margin-bottom: 0.4rem;
  color: var(--color-text-primary);
  font-size: 0.6875rem;
  letter-spacing: 0.06em;
}

.project-card__role span {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.project-card__technology-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin: 1.25rem 0 0;
  padding: 0;
  list-style: none;
}

.project-card__technology-list li {
  padding: 0.25rem 0.45rem;
  color: var(--color-text-secondary);
  background: var(--color-surface-muted);
  border-radius: 5px;
  font-size: 0.6875rem;
  font-weight: 600;
  line-height: 1.4;
}

.projects-section__journey {
  margin-top: clamp(4.5rem, 8vw, 7rem);
  scroll-margin-top: calc(var(--header-height) + 1.5rem);
}

.projects-section__journey > h3 {
  margin-bottom: 1.75rem;
  font-size: clamp(1.5rem, 3vw, 1.875rem);
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.04em;
}

.journey-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
}

.project-card--journey {
  display: grid;
  min-width: 0;
  grid-row: span 6;
  grid-template-rows: subgrid;
  row-gap: 0;
}

.project-card--journey .project-card__link {
  display: grid;
  grid-row: span 6;
  grid-template-rows: subgrid;
  row-gap: 0;
  padding: 0.875rem;
}

.project-card--journey .project-card__image,
.project-card--journey .project-card__image-placeholder {
  height: 6rem;
  flex: 0 0 auto;
  font-size: 1.5rem;
}

.project-card--journey .project-card__content {
  display: grid;
  min-width: 0;
  grid-row: span 5;
  grid-template-rows: subgrid;
  row-gap: 0;
  padding: 1.125rem 0.25rem 0.25rem;
}

.project-card--journey h3 {
  font-size: 1.0625rem;
  line-height: 1.4;
  letter-spacing: -0.035em;
}

.project-card--journey h3 + p,
.project-card--journey .project-card__role {
  font-size: 0.75rem;
}
```

Inside `@media (max-width: 1023px)`, replace the direct-child image selectors with:

```css
  .project-card--journey .project-card__image,
  .project-card--journey .project-card__image-placeholder {
    height: 7.5rem;
  }
```

Inside `@media (max-width: 767px)`:

1. Replace `.flagship-project` in the shared single-column selector with `.flagship-project .project-card__link`.
2. Replace the old `.flagship-project` gap/padding rule with:

```css
  .flagship-project .project-card__link {
    gap: 1.75rem;
    padding: 1rem;
  }
```

3. Remove the obsolete `.project-card__content > a` rule.
4. Replace the Journey padding and direct-child image rules with:

```css
  .project-card--journey .project-card__link {
    padding: 1rem;
  }

  .project-card--journey .project-card__image,
  .project-card--journey .project-card__image-placeholder {
    height: auto;
    aspect-ratio: 16 / 6;
  }
```

5. Remove the obsolete `.project-card--journey .project-card__content > a` rule.

- [ ] **Step 6: Run focused tests, home integration, and type checking**

Run:

```powershell
npm.cmd run test -- src/components/ProjectCard.test.tsx src/components/project-detail/ProjectDetailView.test.tsx src/App.test.tsx
npm.cmd exec -- tsc -b
```

Expected: PASS. Each card has exactly one internal link; the global Contact GitHub link and detail repository link remain.

- [ ] **Step 7: Commit the compact-card checkpoint, only if authorized**

```powershell
git add src/components/ProjectCard.tsx src/components/ProjectCard.test.tsx src/App.test.tsx src/index.css
git commit -m "feat(projects): link compact cards to details"
```

---

### Task 5: Generate GitHub Pages Route Entries and Static Metadata

**Files:**
- Create: `build/projectRouteEntries.ts`
- Create: `build/projectRouteEntries.test.ts`
- Modify: `vite.config.ts`
- Modify: `tsconfig.node.json`

**Interfaces:**
- Consumes: ordered projects and `getProjectMetadata`.
- Produces: `renderProjectEntryHtml(rootHtml, project, profile): string`.
- Produces: `createProjectRouteEntriesPlugin(projects, profile): Plugin`.
- Emits in `closeBundle`: `dist/projects/<id>/index.html` and `dist/404.html`.

- [ ] **Step 1: Confirm the stable metadata IDs from Task 3**

Before writing the build helper, verify `index.html` contains exactly one each of `page-title`, `page-description`, `page-og-title`, `page-og-description`, and `page-og-url`. These are the build helper's fail-fast contract and must not be duplicated.

- [ ] **Step 2: Write the failing deterministic substitution tests**

Create `build/projectRouteEntries.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { portfolioData } from '../src/data/portfolio'
import { renderProjectEntryHtml } from './projectRouteEntries'

const rootHtml = `<!doctype html>
<html lang="ko">
  <head>
    <title id="page-title">홈 제목</title>
    <meta id="page-description" name="description" content="홈 설명" />
    <meta id="page-og-title" property="og:title" content="홈 OG 제목" />
    <meta id="page-og-description" property="og:description" content="홈 OG 설명" />
    <meta id="page-og-url" property="og:url" content="https://minhyeok328.github.io/" />
  </head>
  <body><div id="root"></div></body>
</html>`

describe('renderProjectEntryHtml', () => {
  it('replaces every route metadata value without changing the app root', () => {
    const result = renderProjectEntryHtml(
      rootHtml,
      portfolioData.flagshipProject,
      portfolioData.profile,
    )

    expect(result).toContain('<title id="page-title">HumouR | 서민혁 포트폴리오</title>')
    expect(result).toContain(`content="${portfolioData.flagshipProject.description}"`)
    expect(result).toContain('content="https://minhyeok328.github.io/projects/humour/"')
    expect(result).toContain('<div id="root"></div>')
    expect(result).not.toContain('홈 제목')
    expect(result).not.toContain('홈 설명')
  })

  it('escapes project metadata before placing it in HTML', () => {
    const result = renderProjectEntryHtml(
      rootHtml,
      {
        ...portfolioData.flagshipProject,
        title: 'A&B $& <테스트>',
        description: '"인용" $& <설명>',
      },
      portfolioData.profile,
    )

    expect(result).toContain('A&amp;B $&amp; &lt;테스트&gt; | 서민혁 포트폴리오')
    expect(result).toContain('content="&quot;인용&quot; $&amp; &lt;설명&gt;"')
  })

  it('throws when a required metadata element is missing', () => {
    expect(() => renderProjectEntryHtml(
      rootHtml.replace('id="page-og-url"', 'id="missing-og-url"'),
      portfolioData.flagshipProject,
      portfolioData.profile,
    )).toThrow('page-og-url')
  })
})
```

- [ ] **Step 3: Run the build-helper test and verify the red state**

Run:

```powershell
npm.cmd run test -- build/projectRouteEntries.test.ts
```

Expected: FAIL because `build/projectRouteEntries.ts` does not exist.

- [ ] **Step 4: Implement HTML substitution and the build-only `closeBundle` plugin**

Create `build/projectRouteEntries.ts`:

```ts
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import type { Plugin } from 'vite'
import { getProjectMetadata } from '../src/lib/projectMetadata'
import type { Profile, Project } from '../src/types/portfolio'

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character])
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function replaceTitle(html: string, id: string, content: string) {
  const pattern = new RegExp(
    `(<title\\b(?=[^>]*\\bid=["']${escapeRegExp(id)}["'])[^>]*>)[\\s\\S]*?(</title>)`,
    'i',
  )

  if (!pattern.test(html)) {
    throw new Error(`Missing required title element: ${id}`)
  }

  return html.replace(
    pattern,
    (_match, openingTag: string, closingTag: string) => (
      `${openingTag}${escapeHtml(content)}${closingTag}`
    ),
  )
}

function replaceMetaContent(html: string, id: string, content: string) {
  const pattern = new RegExp(
    `<meta\\b(?=[^>]*\\bid=["']${escapeRegExp(id)}["'])[^>]*>`,
    'i',
  )
  const match = html.match(pattern)

  if (!match) {
    throw new Error(`Missing required meta element: ${id}`)
  }

  const tag = match[0]
  const contentPattern = /\bcontent=(["'])([\s\S]*?)\1/i

  if (!contentPattern.test(tag)) {
    throw new Error(`Missing content attribute on meta element: ${id}`)
  }

  const updatedTag = tag.replace(
    contentPattern,
    (_attribute, quote: string) => `content=${quote}${escapeHtml(content)}${quote}`,
  )

  return html.replace(tag, () => updatedTag)
}

export function renderProjectEntryHtml(
  rootHtml: string,
  project: Project,
  profile: Pick<Profile, 'name'>,
) {
  const metadata = getProjectMetadata(project, profile)
  let html = replaceTitle(rootHtml, 'page-title', metadata.title)
  html = replaceMetaContent(html, 'page-description', metadata.description)
  html = replaceMetaContent(html, 'page-og-title', metadata.ogTitle)
  html = replaceMetaContent(html, 'page-og-description', metadata.ogDescription)
  html = replaceMetaContent(html, 'page-og-url', metadata.ogUrl)
  return html
}

export function createProjectRouteEntriesPlugin(
  projects: readonly Project[],
  profile: Pick<Profile, 'name'>,
): Plugin {
  let outputDirectory = ''

  return {
    name: 'project-route-entries',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      outputDirectory = resolve(config.root, config.build.outDir)
    },
    async closeBundle() {
      if (!outputDirectory) {
        throw new Error('project-route-entries could not resolve the Vite output directory')
      }

      const indexPath = join(outputDirectory, 'index.html')
      const rootHtml = await readFile(indexPath, 'utf8')

      await Promise.all(projects.map(async (project) => {
        const routePath = join(outputDirectory, 'projects', project.id, 'index.html')
        await mkdir(dirname(routePath), { recursive: true })
        await writeFile(
          routePath,
          renderProjectEntryHtml(rootHtml, project, profile),
          'utf8',
        )
      }))

      await copyFile(indexPath, join(outputDirectory, '404.html'))
    },
  }
}
```

- [ ] **Step 5: Attach the plugin to the current Vite build**

Replace `vite.config.ts` with:

```ts
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { createProjectRouteEntriesPlugin } from './build/projectRouteEntries'
import { portfolioData } from './src/data/portfolio'
import { getOrderedProjects } from './src/lib/projects'

const projects = getOrderedProjects(portfolioData)

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    createProjectRouteEntriesPlugin(projects, portfolioData.profile),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```

Replace `tsconfig.node.json` with:

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "types": ["node"],
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true
  },
  "include": ["vite.config.ts", "build/**/*.ts"]
}
```

- [ ] **Step 6: Run the build helper and production build**

Run:

```powershell
npm.cmd run test -- build/projectRouteEntries.test.ts
npm.cmd run build
```

Expected: both commands pass; the existing deployment workflow needs no change.

- [ ] **Step 7: Verify every emitted route and its metadata**

Run:

```powershell
$expectations = [ordered]@{
  'humour' = @{
    Title = 'HumouR | 서민혁 포트폴리오'
    Description = '기업 정보, 채용 공고, 지원서 분석, 리포트, 면접 질문과 문서 챗을 하나의 흐름으로 연결한 AI 기반 채용 운영 서비스입니다.'
    Url = 'https://minhyeok328.github.io/projects/humour/'
  }
  'vehicle-tco' = @{
    Title = '차량 운영·관리 비용 계산 시스템 | 서민혁 포트폴리오'
    Description = '차량별 운영 비용을 데이터 기반으로 비교하는 TCO 계산 시스템입니다.'
    Url = 'https://minhyeok328.github.io/projects/vehicle-tco/'
  }
  'bank-churners' = @{
    Title = '신용카드 고객 이탈 분석 | 서민혁 포트폴리오'
    Description = '고객 데이터를 탐색하고 이탈 가능성을 분석한 머신러닝 프로젝트입니다.'
    Url = 'https://minhyeok328.github.io/projects/bank-churners/'
  }
  'pickle' = @{
    Title = 'PICKLE 맛집 추천 챗봇 | 서민혁 포트폴리오'
    Description = '사용자 조건을 구조화하고 실제 매장 데이터를 검색해 추천하는 챗봇입니다.'
    Url = 'https://minhyeok328.github.io/projects/pickle/'
  }
  'lg-home-ai' = @{
    Title = 'LG Home AI 가전 상담 | 서민혁 포트폴리오'
    Description = 'LLM 상담 기능을 계정과 대화방 중심의 웹 서비스로 통합한 프로젝트입니다.'
    Url = 'https://minhyeok328.github.io/projects/lg-home-ai/'
  }
}

foreach ($entry in $expectations.GetEnumerator()) {
  $file = "dist\projects\$($entry.Key)\index.html"
  if (-not (Test-Path -LiteralPath $file)) {
    throw "Missing generated route: $file"
  }

  $html = Get-Content -Raw -Encoding utf8 -LiteralPath $file
  if (-not $html.Contains("<title id=`"page-title`">$($entry.Value.Title)</title>")) {
    throw "Wrong title: $file"
  }
  if (([regex]::Matches($html, [regex]::Escape($entry.Value.Title))).Count -lt 2) {
    throw "Missing matching Open Graph title: $file"
  }
  if (([regex]::Matches($html, [regex]::Escape($entry.Value.Description))).Count -lt 2) {
    throw "Missing description or Open Graph description: $file"
  }
  if (-not $html.Contains($entry.Value.Url)) {
    throw "Wrong Open Graph URL: $file"
  }
  foreach ($metadataId in 'page-description','page-og-title','page-og-description','page-og-url') {
    if (-not $html.Contains("id=`"$metadataId`"")) {
      throw "Missing metadata element ${metadataId}: $file"
    }
  }
  if (-not $html.Contains('src="/assets/')) {
    throw "Assets are not root-relative: $file"
  }
}

if (-not (Test-Path -LiteralPath 'dist\404.html')) {
  throw 'Missing dist\404.html'
}
$notFoundHtml = Get-Content -Raw -Encoding utf8 -LiteralPath 'dist\404.html'
if (-not $notFoundHtml.Contains('<div id="root"></div>')) {
  throw 'dist\404.html is not the app entry'
}
if (-not $notFoundHtml.Contains('src="/assets/')) {
  throw 'dist\404.html assets are not root-relative'
}
```

Expected: all five nested entries and `404.html` exist; every project has matching title, description, Open Graph values, and root-relative assets.

- [ ] **Step 8: Commit the static-route checkpoint, only if authorized**

```powershell
git add build/projectRouteEntries.ts build/projectRouteEntries.test.ts vite.config.ts tsconfig.node.json
git commit -m "build(pages): generate project route entries"
```

---

### Task 6: Run Full Regression and Real-Browser Acceptance

**Files:**
- Verify only. If a regression appears, modify the smallest owning file and its focused test, then rerun this task from Step 1.

**Interfaces:**
- Consumes: all previous tasks.
- Produces: evidence at unit, integration, build, direct-navigation, history, keyboard, and responsive-layout levels.

- [ ] **Step 1: Run all automated checks**

Run:

```powershell
npm.cmd run lint
npm.cmd run test
npm.cmd run build
```

Expected: every command exits `0` with no lint errors, test failures, type errors, or build errors.

- [ ] **Step 2: Serve the production build and verify real route responses**

Start preview:

```powershell
npm.cmd run preview -- --host 127.0.0.1 --port 4173
```

Request these paths in a separate terminal or browser:

```text
/
/projects/humour/
/projects/vehicle-tco/
/projects/bank-churners/
/projects/pickle/
/projects/lg-home-ai/
/404.html
```

Expected: the five nested routes return `200` with their route-specific raw HTML, and `/404.html` returns the generated application entry. Vite preview's SPA fallback is not used as evidence that an arbitrary unknown URL was served from `404.html`.

- [ ] **Step 3: Verify home-card interaction and history behavior in a real browser**

1. Open `/` and scroll until a Journey card is partly down the viewport.
2. Hover flagship and Journey cards: both lift by 3px and strengthen their border; the pointer cursor covers the whole card.
3. Click card whitespace, image, title, and role in separate checks: each opens the same internal detail route.
4. Confirm no card shows `상세 보기`, an arrow, or a GitHub action.
5. Press Back from a detail route: the home scroll position is restored instead of jumping to the top.
6. Activate the explicit `Projects` or `프로젝트 목록` link: the home page lands at `/#projects` and the hash is not rewritten to `#top` during settling.

- [ ] **Step 4: Verify detail behavior and content boundaries**

For all five detail routes:

1. Refresh the clean URL and confirm the matching `h1` is focused at the top.
2. Confirm `description`, role summary, and growth each appear once.
3. Confirm the role-summary contribution is not repeated in `직접 기여` unless a future `cardRoleSummary` exists.
4. Confirm empty `프로젝트 개요`, `기술 설계와 판단`, and `성장과 회고` sections are absent.
5. Confirm `GitHub에서 코드 보기` opens the correct repository in a new tab.
6. Confirm previous/next links follow growth order and disappear at the first/last boundary.
7. Open an unknown path only as a client-router NotFound smoke check. Treat the wildcard route test plus the inspected `dist/404.html` artifact as the local evidence; confirm GitHub Pages' actual custom-404 serving after the next normal publish, outside this non-deployment task.

- [ ] **Step 5: Verify keyboard and responsive behavior**

1. Tab through the home cards; each card gets one visible focus ring and one tab stop.
2. Activate a focused card with Enter and confirm internal navigation.
3. Tab through the detail header, code action, project list, and previous/next links; every target has a visible focus state.
4. Check desktop, tablet, and 360px widths in light and dark themes.
5. At 360px, confirm no horizontal overflow, detail actions stack, summary/technology groups become one column, and header links remain reachable.
6. Enable reduced motion and confirm navigation remains usable without depending on animation.

- [ ] **Step 6: Inspect the final change set**

Run:

```powershell
git diff --check
git status --short
git diff --stat
```

Expected: no whitespace errors, no accidental deployment or unrelated file changes, and only the planned source, test, configuration, lockfile, design, and plan files appear.

- [ ] **Step 7: Create a final verification commit only if authorized**

First inspect the complete unstaged patch with `git diff` and confirm every changed file belongs to this plan. If the authorized checkpoint commits already contain every implementation change, skip this step. Otherwise, only when Step 1 through Step 6 pass and the user has explicitly authorized commits, stage the exact planned paths:

```powershell
git add -- package.json package-lock.json index.html vite.config.ts tsconfig.node.json build/projectRouteEntries.ts build/projectRouteEntries.test.ts src/App.tsx src/App.test.tsx src/index.css src/types/portfolio.ts src/lib/projects.ts src/lib/projects.test.ts src/lib/projectMetadata.ts src/lib/projectMetadata.test.ts src/components/DocumentMetadata.tsx src/components/DocumentMetadata.test.tsx src/components/DetailHeader.tsx src/components/ProjectImage.tsx src/components/ProjectCard.tsx src/components/ProjectCard.test.tsx src/components/project-detail/DetailHero.tsx src/components/project-detail/ProjectActions.tsx src/components/project-detail/QuickSummary.tsx src/components/project-detail/OverviewSection.tsx src/components/project-detail/ContributionSection.tsx src/components/project-detail/TechnicalSection.tsx src/components/project-detail/RetrospectiveSection.tsx src/components/project-detail/ProjectDetailLayout.tsx src/components/project-detail/ProjectDetailView.tsx src/components/project-detail/ProjectDetailView.test.tsx src/pages/PortfolioHomePage.tsx src/pages/ProjectDetailPage.tsx src/pages/NotFoundPage.tsx src/router/AppRouter.tsx src/router/AppRouter.test.tsx src/hooks/useActiveSection.ts src/hooks/useActiveSection.test.tsx src/test/setup.ts docs/superpowers/specs/2026-08-08-project-detail-pages-design.md docs/superpowers/plans/2026-08-08-project-detail-pages.md
git diff --cached
git commit -m "test(projects): verify detail page flow"
```
