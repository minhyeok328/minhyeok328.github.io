# MinHyeok Portfolio Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive, accessible React portfolio that presents MinHyeok as a frontend-focused AI full-stack developer, with HumouR as the flagship project and projects 1–4 as a visible growth journey.

**Architecture:** Use a static React + TypeScript + Vite single page. Keep verified portfolio content in one typed data module, render optional content only when values exist, and isolate theme/navigation behavior in focused hooks. Style with Tailwind CSS v4 integration plus project-scoped CSS tokens, then deploy the `dist` artifact to the root GitHub Pages user site.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS v4, Lucide React, Vitest, Testing Library, GitHub Actions, GitHub Pages

## Global Constraints

- Default page background is `#fafaf8`; the default visual direction is Light Minimal White.
- The primary positioning is `프론트엔드 강점을 가진 AI 풀스택 개발자`.
- The page is a single route with Header, Hero, About, Projects, Skills, optional Experience / Education, Contact, and Footer.
- HumouR is the only flagship card; projects 1–4 form `Data → Machine Learning → LLM & RAG → Web Integration → AI Full-Stack`.
- Do not invent email addresses, LinkedIn URLs, work history, education, project demos, metrics, images, or resume files.
- Empty URLs, empty experience data, and missing assets must not create broken controls or layout gaps.
- Do not add Redux, Zustand, React Router, a backend, a database, a contact form, or a heavy animation library.
- Vite `base` is `/` because this is the `minhyeok328.github.io` user site.
- Support keyboard navigation, `prefers-reduced-motion`, 360px–1440px layouts, and no horizontal scrolling.

---

## Planned File Map

```text
.github/workflows/deploy.yml        # Build and publish dist to GitHub Pages
.gitignore                          # Ignore dependencies, output, editor, and visual-companion files
README.md                           # Editing, local run, build, and deployment guidance
index.html                          # Korean metadata, social metadata, favicon, noscript notice
package.json                        # Application, build, lint, and test scripts
eslint.config.js                    # Flat ESLint configuration for TypeScript and React
vite.config.ts                      # React, Tailwind v4, Vitest, and root base configuration
src/
├─ App.tsx                          # Composes all visible sections
├─ App.test.tsx                     # Page-level semantic and visibility tests
├─ main.tsx                         # React root and stylesheet entry
├─ index.css                        # Tokens, typography, component styles, responsive rules
├─ vite-env.d.ts                    # Vite types
├─ components/
│  ├─ Header.tsx                    # Desktop/mobile navigation and active section state
│  ├─ Header.test.tsx               # Mobile menu keyboard and visibility behavior
│  ├─ ImageWithFallback.tsx         # Image loading failure fallback
│  ├─ ProjectCard.tsx               # Compact journey project card
│  ├─ ThemeToggle.tsx               # Accessible theme toggle button
│  └─ Footer.tsx                    # Copyright and back-to-top link
├─ hooks/
│  ├─ useActiveSection.ts           # IntersectionObserver-based active navigation id
│  ├─ useTheme.ts                   # Theme selection and persistence
│  └─ useTheme.test.tsx             # Theme precedence and persistence tests
├─ sections/
│  ├─ HeroSection.tsx               # Positioning, CTA, optional resume, social links, profile visual
│  ├─ AboutSection.tsx              # Three concise positioning messages
│  ├─ ProjectsSection.tsx           # HumouR flagship and four-step growth journey
│  ├─ SkillsSection.tsx             # Four grouped skill areas
│  ├─ ExperienceSection.tsx         # Optional real experience and education entries
│  └─ ContactSection.tsx            # Available contact links only
├─ data/portfolio.ts                # Verified copy, repositories, skills, and optional values
├─ lib/portfolio.ts                 # Pure visibility/navigation helpers
├─ lib/portfolio.test.ts            # Tests for optional content and ordering
├─ test/setup.ts                    # Testing Library matchers and browser API cleanup
└─ types/portfolio.ts               # Portfolio domain interfaces
public/favicon.svg                  # Minimal MH brand mark
```

---

### Task 1: Bootstrap the React, Tailwind, and Test Toolchain

**Files:**
- Create: `package.json`
- Create: `package-lock.json` through npm
- Create: `eslint.config.js`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/vite-env.d.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/App.test.tsx`
- Create: `src/index.css`
- Create: `src/test/setup.ts`

**Interfaces:**
- Produces: `App(): JSX.Element`, the Vite entry point, Tailwind v4 CSS processing, and `npm run test`, `npm run lint`, `npm run build` scripts.

- [ ] **Step 1: Create package metadata and install the exact dependency classes**

```powershell
npm init -y
npm install react react-dom lucide-react
npm install -D typescript vite @vitejs/plugin-react tailwindcss @tailwindcss/vite vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh globals @types/react @types/react-dom
```

Set the scripts to:

```json
{
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest",
    "preview": "vite preview"
  }
}
```

- [ ] **Step 2: Configure TypeScript, ESLint, Vite, Tailwind v4, and Vitest**

```ts
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```

```json
// tsconfig.json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

```json
// tsconfig.app.json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["src"]
}
```

```json
// tsconfig.node.json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true
  },
  "include": ["vite.config.ts"]
}
```

```js
// eslint.config.js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'coverage', '.superpowers'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
)
```

```css
/* src/index.css */
@import "tailwindcss";
```

```ts
// src/test/setup.ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
  localStorage.clear()
  delete document.documentElement.dataset.theme
})
```

- [ ] **Step 3: Write the failing page smoke test**

```tsx
// src/App.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the approved portfolio positioning', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: '서민혁입니다.' })).toBeInTheDocument()
    expect(screen.getByText('프론트엔드 강점을 가진 AI 풀스택 개발자')).toBeInTheDocument()
  })
})
```

- [ ] **Step 4: Run the smoke test and confirm the missing implementation failure**

Run: `npm run test -- src/App.test.tsx`

Expected: FAIL because `App` does not yet render the approved heading and role.

- [ ] **Step 5: Add the minimal application shell**

```tsx
// src/App.tsx
export default function App() {
  return (
    <main>
      <h1>서민혁입니다.</h1>
      <p>프론트엔드 강점을 가진 AI 풀스택 개발자</p>
    </main>
  )
}
```

```tsx
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 6: Verify the toolchain**

Run: `npm run test -- src/App.test.tsx && npm run build`

Expected: the smoke test passes and Vite creates `dist` with no TypeScript errors.

- [ ] **Step 7: Commit the bootstrap scope if explicitly authorized**

```powershell
git add package.json package-lock.json tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html src
git commit -m "chore(portfolio): bootstrap React application"
```

---

### Task 2: Define Verified Portfolio Data and Visibility Rules

**Files:**
- Create: `src/types/portfolio.ts`
- Create: `src/data/portfolio.ts`
- Create: `src/lib/portfolio.ts`
- Create: `src/lib/portfolio.test.ts`

**Interfaces:**
- Produces: `PortfolioData`, `Project`, `Profile`, `SkillGroup`, `ExperienceEntry`, `getVisibleSocialLinks(profile)`, `getNavigationItems(data)`, and `hasExperience(data)`.
- Consumes: only verified public GitHub profile and repository content from the approved design spec.

- [ ] **Step 1: Write failing tests for optional content and project order**

```ts
import { describe, expect, it } from 'vitest'
import { portfolioData } from '../data/portfolio'
import { getNavigationItems, getVisibleSocialLinks } from './portfolio'

describe('portfolio visibility rules', () => {
  it('omits empty contact values', () => {
    expect(getVisibleSocialLinks(portfolioData.profile).map((link) => link.label)).toEqual(['GitHub'])
  })

  it('omits Experience navigation when no verified entries exist', () => {
    expect(getNavigationItems(portfolioData).map((item) => item.id)).toEqual([
      'about', 'projects', 'journey', 'skills', 'contact',
    ])
  })

  it('keeps the four journey stages in chronological order', () => {
    expect(portfolioData.journeyProjects.map((project) => project.stage)).toEqual([
      'Data Integration', 'ML Experimentation', 'LLM & RAG', 'Web Integration',
    ])
  })
})
```

- [ ] **Step 2: Run the data tests and confirm missing module failures**

Run: `npm run test -- src/lib/portfolio.test.ts`

Expected: FAIL because the types, data, and helpers do not exist.

- [ ] **Step 3: Define the data contracts**

```ts
export interface Profile {
  name: string
  greeting: string
  role: string
  description: string
  profileImage: string
  resumeUrl: string
  email: string
  githubUrl: string
  linkedinUrl: string
}

export interface Project {
  id: string
  order: number
  stage: string
  title: string
  description: string
  contribution: string[]
  growth: string
  technologies: string[]
  githubUrl: string
  image: string
}

export interface SkillGroup {
  title: string
  primary: string[]
  experience: string[]
}

export interface ExperienceEntry {
  id: string
  period: string
  organization: string
  title: string
  description: string
}

export interface PortfolioData {
  profile: Profile
  about: string[]
  flagshipProject: Project
  journeyProjects: Project[]
  skillGroups: SkillGroup[]
  experiences: ExperienceEntry[]
}
```

- [ ] **Step 4: Add verified project data**

Use these exact repositories and stage labels:

```ts
export const portfolioData: PortfolioData = {
  profile: {
    name: '서민혁',
    greeting: '안녕하세요,',
    role: '프론트엔드 강점을 가진 AI 풀스택 개발자',
    description: '사용자 경험부터 데이터·API·LLM까지 연결해, 실제 업무 흐름에서 안정적으로 동작하는 AI 서비스를 만듭니다.',
    profileImage: '/images/profile.webp',
    resumeUrl: '',
    email: '',
    githubUrl: 'https://github.com/minhyeok328',
    linkedinUrl: '',
  },
  about: [
    '프론트엔드 강점을 기반으로 LLM 기능이 실제 사용자의 업무 흐름에 닿도록 구현합니다.',
    '데이터 수집·전처리, 모델 실험, 백엔드 API, 사용자 UI까지 이어지는 전체 흐름을 경험했습니다.',
    '계약, 실패 상태, 테스트와 문서화를 함께 설계해 팀이 신뢰할 수 있는 서비스를 만드는 것을 중요하게 생각합니다.',
  ],
  flagshipProject: {
    id: 'humour', order: 5, stage: 'AI Full-Stack', title: 'HumouR',
    description: '기업 정보, 채용 공고, 지원서 분석, 리포트, 면접 질문과 문서 챗을 하나의 흐름으로 연결한 AI 기반 채용 운영 서비스입니다.',
    contribution: [
      '프론트엔드 CODEOWNER로서 React·TypeScript 애플리케이션 구조와 통합 품질을 주도했습니다.',
      'API 계약, 인증·세션 경계, 비동기 상태, 오류 처리와 테스트·QA를 구조화했습니다.',
      'JD·지원서·분석 리포트·외부 공유·문서 챗의 API 연동과 상태 흐름을 검증했습니다.',
    ],
    growth: '인증·상태·오류·검증을 다루는 AI 애플리케이션 구조로 확장',
    technologies: ['React 19', 'TypeScript', 'TanStack Query', 'Zod', 'Django API', 'LangGraph'],
    githubUrl: 'https://github.com/minhyeok328/Final_project', image: '',
  },
  journeyProjects: [
    { id: 'vehicle-tco', order: 1, stage: 'Data Integration', title: '차량 운영·관리 비용 계산 시스템', description: '차량별 운영 비용을 데이터 기반으로 비교하는 TCO 계산 시스템입니다.', contribution: ['공공 연비 API 수집과 JSON·CSV 로드·파싱', '비용 모델과 데이터 흐름 문서화'], growth: '외부 데이터를 서비스 입력값으로 연결', technologies: ['Python', 'Public API', 'CSV', 'Streamlit'], githubUrl: 'https://github.com/minhyeok328/1st_project', image: '' },
    { id: 'bank-churners', order: 2, stage: 'ML Experimentation', title: '신용카드 고객 이탈 분석', description: '고객 데이터를 탐색하고 이탈 가능성을 분석한 머신러닝 프로젝트입니다.', contribution: ['전처리 탐색과 EDA 시각화', 'Unknown 소득 보완을 위한 XGBoost 그룹 분류 실험'], growth: '모델 실험을 사용자에게 전달할 분석으로 확장', technologies: ['Python', 'pandas', 'scikit-learn', 'XGBoost'], githubUrl: 'https://github.com/minhyeok328/2nd_project', image: '' },
    { id: 'pickle', order: 3, stage: 'LLM & RAG', title: 'PICKLE 맛집 추천 챗봇', description: '사용자 조건을 구조화하고 실제 매장 데이터를 검색해 추천하는 챗봇입니다.', contribution: ['LangGraph 추천 파이프라인과 strict JSON Schema 슬롯 추출', 'SQLite 임베딩 검색 연동, Streamlit UI와 내부 평가'], growth: 'LLM 응답을 실제 데이터와 근거에 연결', technologies: ['LangGraph', 'OpenAI API', 'RAG', 'SQLite', 'Streamlit'], githubUrl: 'https://github.com/minhyeok328/3rd_project', image: '' },
    { id: 'lg-home-ai', order: 4, stage: 'Web Integration', title: 'LG Home AI 가전 상담', description: 'LLM 상담 기능을 계정과 대화방 중심의 웹 서비스로 통합한 프로젝트입니다.', contribution: ['Django·Tailwind 기반 주요 화면 구현', '검색·필터·찜·채팅 API 연동과 오류·로딩·모바일 UX 개선'], growth: 'LLM 기능을 웹 애플리케이션의 사용자 흐름에 통합', technologies: ['Django', 'Tailwind CSS', 'JavaScript', 'REST API'], githubUrl: 'https://github.com/minhyeok328/4th_project', image: '' },
  ],
  skillGroups: [],
  experiences: [],
}
```

- [ ] **Step 5: Implement pure visibility helpers and pass the tests**

```ts
export function getVisibleSocialLinks(profile: Profile) {
  return [
    { label: 'GitHub', href: profile.githubUrl },
    { label: 'LinkedIn', href: profile.linkedinUrl },
    { label: 'Email', href: profile.email ? `mailto:${profile.email}` : '' },
  ].filter((link) => link.href.length > 0)
}

export function hasExperience(data: PortfolioData) {
  return data.experiences.length > 0
}

export function getNavigationItems(data: PortfolioData) {
  return [
    { id: 'about', label: 'About' },
    { id: 'projects', label: 'Projects' },
    { id: 'journey', label: 'Journey' },
    { id: 'skills', label: 'Skills' },
    ...(hasExperience(data) ? [{ id: 'experience', label: 'Experience' }] : []),
    { id: 'contact', label: 'Contact' },
  ]
}
```

Run: `npm run test -- src/lib/portfolio.test.ts`

Expected: all three data tests pass.

- [ ] **Step 6: Commit the data scope if explicitly authorized**

```powershell
git add src/types src/data src/lib
git commit -m "feat(portfolio): add verified portfolio content"
```

---

### Task 3: Implement Theme and Navigation Behavior with Tests

**Files:**
- Create: `src/hooks/useTheme.ts`
- Create: `src/hooks/useTheme.test.tsx`
- Create: `src/hooks/useActiveSection.ts`
- Create: `src/components/ThemeToggle.tsx`
- Create: `src/components/Header.tsx`
- Create: `src/components/Header.test.tsx`
- Modify: `src/test/setup.ts`

**Interfaces:**
- Produces: `useTheme(): { theme: 'light' | 'dark'; toggleTheme(): void }` and `useActiveSection(sectionIds: string[]): string`.
- Consumes: `getNavigationItems(portfolioData)`.

```ts
interface NavigationItem {
  id: string
  label: string
}

interface HeaderProps {
  items: NavigationItem[]
  activeSection: string
}
```

- [ ] **Step 1: Write failing theme precedence tests**

```tsx
it('uses a stored theme before the operating-system preference', () => {
  localStorage.setItem('portfolio-theme', 'light')
  mockMatchMedia(true)
  const { result } = renderHook(() => useTheme())
  expect(result.current.theme).toBe('light')
})

it('persists a user toggle and updates the html data attribute', () => {
  const { result } = renderHook(() => useTheme())
  act(() => result.current.toggleTheme())
  expect(localStorage.getItem('portfolio-theme')).toBe(result.current.theme)
  expect(document.documentElement.dataset.theme).toBe(result.current.theme)
})
```

- [ ] **Step 2: Run tests and confirm `useTheme` is missing**

Run: `npm run test -- src/hooks/useTheme.test.tsx`

Expected: FAIL because `useTheme` is not implemented.

- [ ] **Step 3: Implement theme precedence and safe persistence**

```ts
const STORAGE_KEY = 'portfolio-theme'
type Theme = 'light' | 'dark'

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    return 'light'
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
```

The hook must synchronize `document.documentElement.dataset.theme`, catch storage failures, and use a functional state update in `toggleTheme`.

- [ ] **Step 4: Write the failing mobile-menu keyboard test**

```tsx
it('opens from the menu button and closes on Escape', async () => {
  const user = userEvent.setup()
  render(<Header items={[{ id: 'about', label: 'About' }]} activeSection="about" />)
  const menuButton = screen.getByRole('button', { name: '메뉴 열기' })
  await user.click(menuButton)
  expect(menuButton).toHaveAttribute('aria-expanded', 'true')
  await user.keyboard('{Escape}')
  expect(menuButton).toHaveAttribute('aria-expanded', 'false')
})
```

Run: `npm run test -- src/components/Header.test.tsx`

Expected: FAIL because `Header` and its menu behavior do not exist.

- [ ] **Step 5: Add active-section observation and accessible mobile-menu behavior**

`Header` must:

- render only data-backed navigation items;
- expose `aria-current="page"` for the active section;
- use `aria-expanded` and `aria-controls` on the menu button;
- close on link selection, outside pointer down, Escape, and a desktop media-query change;
- lock no body scrolling and add no focus trap because the panel is a short inline navigation region.

- [ ] **Step 6: Run interaction tests**

Run: `npm run test -- src/hooks/useTheme.test.tsx src/components/Header.test.tsx src/App.test.tsx`

Expected: theme tests pass and existing smoke tests remain green.

- [ ] **Step 7: Commit the interaction scope if explicitly authorized**

```powershell
git add src/hooks src/components/Header.tsx src/components/ThemeToggle.tsx src/test/setup.ts
git commit -m "feat(navigation): add theme and section navigation"
```

---

### Task 4: Build the Semantic Profile Sections and Optional States

**Files:**
- Create: `src/components/ImageWithFallback.tsx`
- Create: `src/sections/HeroSection.tsx`
- Create: `src/sections/AboutSection.tsx`
- Create: `src/sections/ExperienceSection.tsx`
- Create: `src/sections/ContactSection.tsx`
- Create: `src/components/Footer.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Produces: semantic page sections with ids `about`, `experience`, and `contact` plus the Hero introduction.
- Consumes: `portfolioData.profile`, `portfolioData.about`, `portfolioData.experiences`, and `getVisibleSocialLinks`.

- [ ] **Step 1: Extend the page test with optional-state requirements**

```tsx
it('shows only verified profile actions and omits unavailable content', () => {
  render(<App />)
  expect(screen.getByRole('link', { name: 'GitHub 보기' })).toHaveAttribute('href', 'https://github.com/minhyeok328')
  expect(screen.queryByRole('link', { name: '이력서 다운로드' })).not.toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'LinkedIn 보기' })).not.toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Experience' })).not.toBeInTheDocument()
})

it('uses an MH fallback when the profile image fails', () => {
  render(<App />)
  fireEvent.error(screen.getByAltText('서민혁 프로필 사진'))
  expect(screen.getByText('MH')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run tests and confirm missing section failures**

Run: `npm run test -- src/App.test.tsx`

Expected: FAIL because the verified action and image fallback behavior are absent.

- [ ] **Step 3: Implement `ImageWithFallback`**

```tsx
import { useState } from 'react'

interface ImageWithFallbackProps {
  src: string
  alt: string
  fallback: string
  className?: string
}

export function ImageWithFallback({ src, alt, fallback, className }: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(src.length === 0)
  if (failed) return <div className={className} role="img" aria-label={`${alt} 대체 이미지`}>{fallback}</div>
  return <img className={className} src={src} alt={alt} onError={() => setFailed(true)} />
}
```

- [ ] **Step 4: Implement Hero, About, optional Experience, Contact, and Footer**

Use semantic `section` elements, one page `h1`, section `h2` headings, external-link safety attributes, and the current year from `new Date().getFullYear()`.

- [ ] **Step 5: Compose sections in `App` and pass page tests**

Run: `npm run test -- src/App.test.tsx`

Expected: profile semantics and optional-state tests pass.

- [ ] **Step 6: Commit the profile sections if explicitly authorized**

```powershell
git add src/App.tsx src/App.test.tsx src/components src/sections
git commit -m "feat(profile): add portfolio profile sections"
```

---

### Task 5: Build the HumouR Flagship and Four-Step Project Journey

**Files:**
- Create: `src/components/ProjectCard.tsx`
- Create: `src/sections/ProjectsSection.tsx`
- Create: `src/sections/SkillsSection.tsx`
- Modify: `src/data/portfolio.ts`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Produces: `ProjectsSection` with `projects` and nested `journey` anchors, one flagship article, four compact project articles, and a five-label growth line.
- Consumes: `portfolioData.flagshipProject`, `portfolioData.journeyProjects`, and four populated `skillGroups`.

- [ ] **Step 1: Write failing hierarchy tests**

```tsx
it('presents HumouR as the only flagship and all four earlier stages as a journey', () => {
  render(<App />)
  expect(screen.getByTestId('flagship-project')).toHaveTextContent('HumouR')
  expect(screen.getAllByTestId('journey-project')).toHaveLength(4)
  expect(screen.getByText('Data Integration')).toBeInTheDocument()
  expect(screen.getByText('ML Experimentation')).toBeInTheDocument()
  expect(screen.getAllByText('LLM & RAG').length).toBeGreaterThanOrEqual(1)
  expect(screen.getByText('Web Integration')).toBeInTheDocument()
  expect(screen.getByText('AI Full-Stack')).toBeInTheDocument()
})

it('links every project to its verified GitHub repository', () => {
  render(<App />)
  expect(screen.getAllByRole('link', { name: /GitHub에서 보기/ })).toHaveLength(5)
})
```

- [ ] **Step 2: Run tests and confirm project hierarchy failures**

Run: `npm run test -- src/App.test.tsx`

Expected: FAIL because Projects and Skills are not yet rendered.

- [ ] **Step 3: Populate the four skill groups**

```ts
skillGroups: [
  { title: 'Frontend', primary: ['React', 'TypeScript', 'Axios', 'TanStack Query', 'Zod'], experience: ['JavaScript', 'Tailwind CSS', 'Ant Design', 'Django Templates', 'Streamlit'] },
  { title: 'LLM Application', primary: ['LangGraph', 'LangChain', 'RAG', 'OpenAI API', 'Structured Output'], experience: ['Pinecone integration'] },
  { title: 'Backend & Data', primary: ['Python', 'Django', 'pandas', 'scikit-learn', 'XGBoost'], experience: ['FastAPI consumption', 'MySQL/SQLite integration', 'Celery/MLflow boundary'] },
  { title: 'Quality & Delivery', primary: ['Vitest', 'Testing Library', 'MSW', 'Playwright', 'Git/GitHub'], experience: ['Docker', 'GitHub Actions', 'AWS deployment configuration'] },
]
```

- [ ] **Step 4: Implement flagship and journey components**

The flagship article must separate `직접 기여` from the technology list. Compact cards must show stage, title, short description, contribution summary, growth sentence, technologies, and one verified GitHub link. Missing image values must render a neutral project-initial placeholder without creating an `<img src="">` request.

- [ ] **Step 5: Implement Skills and pass hierarchy tests**

Run: `npm run test -- src/App.test.tsx`

Expected: one flagship, four journey cards, five stage labels, five verified GitHub links, and four skill groups are rendered.

- [ ] **Step 6: Commit the project scope if explicitly authorized**

```powershell
git add src/components/ProjectCard.tsx src/sections/ProjectsSection.tsx src/sections/SkillsSection.tsx src/data/portfolio.ts src/App.tsx src/App.test.tsx
git commit -m "feat(projects): add flagship and project journey"
```

---

### Task 6: Apply the Approved Light Minimal Visual System

**Files:**
- Modify: `src/index.css`
- Modify: all section and component files only where class names are required

**Interfaces:**
- Produces: reusable layout classes and CSS variables for light/dark themes with no component-local color duplication.
- Consumes: the semantic markup completed in Tasks 3–5.

- [ ] **Step 1: Add exact theme tokens and global rules**

```css
:root {
  --color-background: #fafaf8;
  --color-surface: #ffffff;
  --color-surface-muted: #f4f4f2;
  --color-text-primary: #17181b;
  --color-text-secondary: #5f636b;
  --color-text-muted: #898d95;
  --color-border: #e4e5e7;
  --color-border-strong: #d4d6d9;
  --color-primary: #181a1f;
  --color-primary-hover: #30333a;
  --color-primary-text: #ffffff;
  --color-focus: #4c6fff;
}

[data-theme='dark'] {
  --color-background: #111318;
  --color-surface: #191c22;
  --color-surface-muted: #20242b;
  --color-text-primary: #f5f6f7;
  --color-text-secondary: #b4b8c0;
  --color-text-muted: #858b96;
  --color-border: #2d323b;
  --color-border-strong: #3b414c;
  --color-primary: #f3f4f6;
  --color-primary-hover: #ffffff;
  --color-primary-text: #17181b;
  --color-focus: #8097ff;
}
```

- [ ] **Step 2: Implement the approved desktop hierarchy**

```css
.site-container { width: min(100% - 64px, 1180px); margin-inline: auto; }
.hero { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(320px, .9fr); gap: clamp(48px, 7vw, 80px); align-items: center; }
.flagship-project { display: grid; grid-template-columns: minmax(0, 1.12fr) minmax(0, .88fr); gap: 32px; }
.journey-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; }
.skills-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
```

- [ ] **Step 3: Add responsive and reduced-motion behavior**

```css
@media (max-width: 1023px) { .journey-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 767px) {
  .site-container { width: min(100% - 40px, 1180px); }
  .hero, .flagship-project, .skills-grid { grid-template-columns: 1fr; }
  .journey-grid { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

- [ ] **Step 4: Verify the visual implementation without changing content**

Run: `npm run test && npm run build`

Expected: all behavioral tests and the production build pass; styling introduces no semantic test regressions.

- [ ] **Step 5: Commit the visual scope if explicitly authorized**

```powershell
git add src/index.css src/components src/sections
git commit -m "feat(ui): apply light minimal portfolio design"
```

---

### Task 7: Add Metadata, Documentation, and GitHub Pages Deployment

**Files:**
- Create: `.gitignore`
- Create: `.github/workflows/deploy.yml`
- Create: `public/favicon.svg`
- Create: `README.md`
- Modify: `index.html`

**Interfaces:**
- Produces: root-path production build, searchable Korean metadata, editing guidance, and a GitHub Pages workflow that uploads `dist`.

- [ ] **Step 1: Add repository ignores**

```gitignore
node_modules/
dist/
coverage/
.env
.env.*
!.env.example
.superpowers/
.DS_Store
Thumbs.db
.vscode/
```

- [ ] **Step 2: Set Korean SEO metadata**

```html
<html lang="ko">
<title>서민혁 | 프론트엔드 강점을 가진 AI 풀스택 개발자</title>
<meta name="description" content="프론트엔드 구현과 데이터·머신러닝·LLM 서비스 통합 경험을 소개하는 서민혁의 개발자 포트폴리오입니다.">
<meta property="og:title" content="서민혁 | 프론트엔드 강점을 가진 AI 풀스택 개발자">
<meta property="og:description" content="사용자 경험부터 데이터·API·LLM까지 연결하는 개발자 포트폴리오">
<meta property="og:type" content="website">
<meta name="theme-color" content="#fafaf8">
<noscript>이 포트폴리오를 보려면 브라우저에서 JavaScript를 사용하도록 설정해 주세요.</noscript>
```

Do not add `og:image` until a validated local image exists.

- [ ] **Step 3: Add the current official Vite GitHub Pages workflow shape**

```yaml
name: Deploy portfolio to Pages

on:
  push:
    branches: ['main']
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v6
      - name: Set up Node
        uses: actions/setup-node@v6
        with:
          node-version: lts/*
          cache: npm
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Configure Pages
        uses: actions/configure-pages@v6
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v5
        with:
          path: ./dist
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v5
```

- [ ] **Step 4: Document content replacement points**

README must name these exact locations:

```text
src/data/portfolio.ts        # Text, project links, optional contact values
public/images/profile.webp   # Optional real profile photo
public/images/projects/      # Optional verified project screenshots
public/resume.pdf            # Optional resume; set resumeUrl only after adding it
```

- [ ] **Step 5: Verify metadata and deployment inputs**

Run: `npm run lint && npm run test && npm run build`

Expected: all checks pass and `dist/index.html` contains the Korean title and root-relative bundled assets.

- [ ] **Step 6: Commit deployment and documentation if explicitly authorized**

```powershell
git add .gitignore .github README.md index.html public package.json package-lock.json vite.config.ts
git commit -m "chore(pages): configure portfolio deployment"
```

---

### Task 8: Final Verification and Handoff

**Files:**
- Modify only files implicated by verification failures.

**Interfaces:**
- Produces: a buildable GitHub Pages portfolio and a list of optional user assets still absent.

- [ ] **Step 1: Run the complete automated verification**

Run:

```powershell
npm run lint
npm run test
npm run build
```

Expected: all commands exit with code 0.

- [ ] **Step 2: Run the production preview**

Run: `npm run preview -- --host 127.0.0.1`

Expected: Vite reports a healthy local preview URL and serves `dist`.

- [ ] **Step 3: Check responsive and interaction acceptance points**

Verify at 360, 390, 768, 1024, and 1440px:

- no horizontal scrolling;
- one-column mobile sections and four-column desktop Journey;
- Hero copy remains left aligned and the profile fallback stays within its container;
- mobile menu closes from a link, Escape, outside click, and desktop resize;
- theme toggle updates the document, persists selection, and has a correct `aria-label`;
- keyboard focus is visible on every interactive element;
- no empty resume, email, LinkedIn, experience, or image controls appear.

- [ ] **Step 4: Re-run automated verification after any fixes**

Run: `npm run lint && npm run test && npm run build`

Expected: all commands exit with code 0 after the final change.

- [ ] **Step 5: Report the result and optional user inputs**

Report the implemented sections, interactions, test/build outcome, GitHub Pages activation step, and these optional inputs only: profile photo, project screenshots, resume PDF, email, LinkedIn, verified experience, and education.
