# 서민혁 포트폴리오

Vite와 React로 만든 개인 개발자 포트폴리오입니다.

## 로컬 실행 및 빌드

의존성을 설치한 뒤 개발 서버를 실행합니다.

```powershell
npm.cmd install
npm.cmd run dev
```

프로덕션 결과물은 아래 명령으로 생성합니다.

```powershell
npm.cmd run build
```

빌드된 정적 파일은 `dist/`에 생성됩니다. 검사와 테스트는 각각 `npm.cmd run lint`, `npm.cmd run test`로 실행할 수 있습니다.

## 콘텐츠 수정 위치

- `src/data/portfolio.ts` — 소개 문구, 프로젝트 링크, 선택적인 연락처 값을 수정합니다.
- `public/images/profile.webp` — 실제 프로필 사진을 추가할 때만 사용합니다.
- `public/images/projects/` — 검증된 프로젝트 스크린샷을 추가할 때만 사용합니다.
- `public/resume.pdf` — 이력서를 추가한 뒤에만 `resumeUrl` 값을 설정합니다.

사진, 스크린샷, 이력서 및 연락처 정보는 선택 사항입니다. 실제로 준비된 자료만 추가하고, 프로젝트 링크는 공개 가능한 주소인지 확인한 뒤 수정하세요.

## GitHub Pages 배포 설정

이 저장소에는 `main` 브랜치의 변경 사항을 빌드해 GitHub Pages에 올리는 워크플로가 포함되어 있습니다. 배포를 사용하려면 GitHub 저장소의 **Settings → Pages → Build and deployment**에서 **Source**를 **GitHub Actions**로 선택하세요. 이후 `main`에 변경 사항을 푸시하거나 Actions 화면에서 워크플로를 수동 실행하면 됩니다.

아직 GitHub Pages가 활성화되었거나 배포가 완료되었다는 뜻은 아닙니다. 저장소 설정을 마친 뒤 Actions 실행 결과와 배포 주소를 확인하세요.
