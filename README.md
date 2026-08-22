# 서민혁 포트폴리오

React와 TypeScript로 제작한 개인 개발자 포트폴리오입니다. 프로젝트 결과뿐 아니라 직접 맡은 역할, 기술적 판단, 협업 방식과 성장 과정을 함께 담았습니다.

[포트폴리오 바로가기](https://minhyeok328.github.io/)

## 기술 스택

- React 19, TypeScript, Vite
- Tailwind CSS, React Router
- Vitest, Testing Library
- GitHub Actions, GitHub Pages

## 주요 구성

- `src/data/portfolio.ts` — 소개, 기술, 경험 및 프로젝트 콘텐츠
- `src/sections/` — 포트폴리오의 주요 화면 섹션
- `src/components/` — 프로젝트 카드, 상세 모달 및 공통 UI
- `public/media/projects/` — 프로젝트별 화면과 데모 영상
- `.github/workflows/deploy.yml` — GitHub Pages 자동 배포

## 로컬 실행

```bash
npm ci
npm run dev
```

## 품질 검사와 빌드

```bash
npm run lint
npm run test
npm run build
```

프로덕션 결과물은 `dist/`에 생성됩니다. `main` 브랜치에 변경 사항을 푸시하면 GitHub Actions가 빌드 결과를 GitHub Pages에 배포합니다.
