# 서민혁 개발자 포트폴리오 사이트 설계

## 1. 목표

`minhyeok328.github.io`에 채용 담당자가 빠르게 읽을 수 있는 단일 페이지 개발자 포트폴리오를 만든다.

포지셔닝은 두 역량을 같은 비중으로 나열하지 않고 다음과 같이 계층화한다.

- 중심축: 프론트엔드 개발 역량
- 차별점: 데이터·머신러닝·LLM·백엔드 흐름을 연결하는 AI 풀스택 경험
- 핵심 인상: 사용자 화면부터 AI 서비스의 전체 흐름까지 이해하고 안정적으로 통합하는 개발자

사이트의 대표 문구는 다음 방향으로 사용한다.

> 프론트엔드 강점을 가진 AI 풀스택 개발자  
> 사용자 경험부터 데이터·API·LLM까지 연결해, 실제 업무 흐름에서 안정적으로 동작하는 AI 서비스를 만듭니다.

## 2. 승인된 디자인 방향

디자인은 사용자가 선택한 `Light Minimal White` 콘셉트를 유지한다.

- 따뜻한 오프화이트 페이지 배경
- 검정에 가까운 제목과 명도 대비가 충분한 회색 본문
- 넉넉한 여백과 짧은 문단
- 얇은 테두리와 약한 그림자만 사용하는 흰색 카드
- 왼쪽 소개, 오른쪽 프로필 사진의 2열 Hero
- 작은 텍스트 로고와 간결한 상단 내비게이션
- 과장된 장식 없이 프로젝트 이미지와 타이포그래피로 시각적 위계 구성
- 데스크톱, 태블릿, 모바일에서 자연스럽게 재배치되는 반응형 레이아웃

프로젝트는 다섯 개를 같은 크기로 나열하지 않는다. `HumouR`를 큰 대표 사례로 먼저 보여주고, 1~4차 프로젝트는 성장 여정으로 연결한다.

## 3. 정보 구조

페이지 순서는 다음과 같다.

1. Header
2. Hero
3. About
4. Projects
   - HumouR 대표 프로젝트
   - 1~4차 Project Journey
5. Skills
6. Experience / Education
7. Contact
8. Footer

`Experience / Education` 데이터가 비어 있으면 섹션과 해당 내비게이션을 함께 숨긴다. 확인되지 않은 경력이나 교육 정보는 만들지 않는다.

## 4. 섹션 설계

### Header

- 왼쪽에 `MH` 텍스트 로고를 배치한다.
- 오른쪽에 `About`, `Projects`, `Journey`, `Skills`, `Contact`와 테마 전환 버튼을 배치한다. 실제 Experience / Education 데이터가 있으면 `Experience`도 함께 표시한다.
- 스크롤 시 얇은 하단 테두리만 추가되는 sticky 헤더를 사용한다.
- 모바일에서는 로고, 테마 전환, 메뉴 버튼만 보이고 나머지는 접근 가능한 메뉴 패널로 제공한다.
- 메뉴 클릭 시 해시 링크를 이용해 해당 섹션으로 이동한다.
- 현재 보이는 섹션은 과하지 않은 밑줄과 글자색으로 표시한다.

### Hero

- 데스크톱은 소개 55%, 프로필 이미지 45%의 2열 구성을 사용한다.
- 모바일은 소개, 버튼, 소셜 링크, 프로필 이미지 순서의 1열로 바꾼다.
- 기본 텍스트는 다음과 같다.

  - 인사: `안녕하세요,`
  - 이름: `서민혁입니다.`
  - 역할: `프론트엔드 강점을 가진 AI 풀스택 개발자`
  - 설명: `사용자 경험부터 데이터·API·LLM까지 연결해, 실제 업무 흐름에서 안정적으로 동작하는 AI 서비스를 만듭니다.`

- `프로젝트 보기`를 기본 CTA로 사용한다.
- 이력서 파일이 있을 때만 `이력서 다운로드`를 표시한다.
- GitHub는 실제 주소를 연결하고, 이메일과 LinkedIn은 실제 값이 있을 때만 표시한다.
- 프로필 사진이 없거나 로딩에 실패하면 임의의 인물 사진 대신 `MH` 모노그램을 표시한다.

### About

긴 자기소개보다 세 가지 메시지를 2~3개의 짧은 문단으로 전달한다.

1. 프론트엔드 강점을 기반으로 사용자에게 닿는 AI 서비스를 구현한다.
2. 데이터 수집·모델·API·상태 관리·UI로 이어지는 전체 흐름을 경험했다.
3. 계약, 실패 상태, 테스트, 문서화를 통해 서비스 신뢰성을 높인다.

### Projects

#### Flagship: HumouR

HumouR는 한 화면 폭을 넓게 사용하는 대표 카드로 구성한다.

- 왼쪽: 실제 서비스 화면 또는 저장소 기반 프로젝트 대표 이미지
- 오른쪽: 문제, 서비스 설명, 직접 기여, 핵심 기술, GitHub 링크
- 직접 기여와 팀 시스템 연동 범위를 구분해 과장 없이 표현한다.

강조할 직접 기여는 다음과 같다.

- 프론트엔드 CODEOWNER로서 React·TypeScript 애플리케이션 구조와 통합 품질 주도
- Axios·CSRF, API Client, Zod 계약, Adapter, TanStack Query로 이어지는 데이터 흐름 설계
- 일반 계정과 제한 API Key 세션의 권한·캐시 경계 처리
- 인증 만료, 요청 취소, 오류 정제, 캐시 정리 등 요청 수명주기 안정화
- JD·지원서·분석 리포트·공유·문서 챗의 API 연동과 통합 검증
- 프론트엔드 테스트, QA, 문서 정합성 관리

팀 시스템 연동 기술은 Django, Celery, LangGraph, Pinecone, AWS로 별도 표시한다.

#### Project Journey

1~4차 프로젝트는 네 개의 간결한 카드와 하나의 성장선으로 보여준다.

| 단계 | 프로젝트 | 직접 기여의 중심 | 성장 메시지 |
| --- | --- | --- | --- |
| 01 · Data Integration | 차량 운영·관리 비용 계산 시스템 | 공공 연비 API 수집, JSON·CSV 로드와 파싱, 비용 모델 데이터 흐름 | 외부 데이터를 서비스 입력값으로 연결 |
| 02 · ML Experimentation | 신용카드 고객 이탈 분석 | 전처리 탐색, XGBoost 그룹 분류 실험, EDA, Streamlit 프로토타입 | 모델 실험을 사용자에게 전달할 분석으로 확장 |
| 03 · LLM & RAG | PICKLE 맛집 추천 챗봇 | LangGraph, strict JSON Schema 슬롯 추출, SQLite 임베딩 검색, Streamlit UI, 내부 평가 | LLM 응답을 실제 데이터와 근거에 연결 |
| 04 · Web Integration | LG Home AI 가전 상담 | Django·Tailwind 화면, 검색·필터·찜·채팅 API 연동, 오류·로딩·모바일 UX | LLM 기능을 웹 애플리케이션의 사용자 흐름에 통합 |

성장선은 `Data → Machine Learning → LLM & RAG → Web Integration → AI Full-Stack`을 텍스트와 점으로만 표시한다. 의미 없는 숙련도 그래프나 퍼센트는 사용하지 않는다.

### Skills

기술은 다음 기준으로 정리한다.

- `Primary`: 반복적으로 직접 구현하고 검증한 핵심 기술
- `Project experience`: 직접 사용했거나 인터페이스 경계에서 연동한 기술

그룹은 `Frontend`, `LLM Application`, `Backend & Data`, `Quality & Delivery` 네 가지로 제한한다. 브랜드 아이콘과 기술 개수를 과도하게 늘리지 않고, 작은 직사각형 칩과 짧은 설명으로 보여준다.

### Experience / Education

- 실제 기간, 기관, 역할, 설명을 데이터로 제공받은 경우에만 렌더링한다.
- 데스크톱은 기간과 내용의 2열, 모바일은 기간이 위에 오는 1열 구조를 사용한다.
- 장식적인 타임라인 대신 얇은 구분선과 텍스트 위계를 사용한다.

### Contact

- 작동하지 않는 문의 폼은 만들지 않는다.
- GitHub와 실제로 제공된 이메일·LinkedIn만 표시한다.
- 전체 배경보다 조금 진한 muted surface로 구분하되 강한 색상 반전은 사용하지 않는다.

## 5. 시각 시스템

### 색상

라이트 테마를 기본으로 한다.

- Page background: `#fafaf8`
- Surface: `#ffffff`
- Primary text: `#17181b`
- Secondary text: `#5f636b`
- Muted text: `#898d95`
- Border: `#e4e5e7`
- Muted surface: `#f4f4f2`
- Focus: `#4c6fff`

다크 테마는 같은 정보 위계를 유지하는 보조 기능으로 제공한다. 사용자가 직접 선택한 테마는 저장하고, 첫 방문은 운영체제 설정을 존중하되 설정이 없으면 라이트 테마를 사용한다.

### 타이포그래피

- 기본: Pretendard, Noto Sans KR, 시스템 산세리프
- Hero: 데스크톱 52~60px, 모바일 36~42px
- 섹션 제목: 데스크톱 30~36px, 모바일 26~30px
- 본문: 데스크톱 16~18px, 모바일 15~16px
- 본문 줄 길이: 최대 60~70ch
- 긴 문단을 피하고 한글 행간을 1.65~1.75로 유지한다.

### 이미지

- 프로필: 정사각형 또는 4:5, 둥근 모서리 16~20px, 얇은 테두리
- 대표 프로젝트: 16:10 또는 실제 화면 비율을 유지하고 왜곡하지 않는다.
- 프로젝트 Journey 카드는 이미지가 핵심 설명에 도움이 될 때만 사용한다.
- 실제 파일이 없으면 중립적인 CSS placeholder를 사용하고 외부 랜덤 이미지는 사용하지 않는다.

## 6. 반응형 동작

- 1024px 이상: Hero 2열, HumouR 2열, Journey 4열
- 768~1023px: Hero 2열 또는 작은 이미지 2열, HumouR 1~2열, Journey 2열
- 767px 이하: 모든 주요 섹션 1열, 모바일 메뉴, 버튼 줄바꿈
- 360px에서도 텍스트·버튼·카드가 화면 밖으로 나가지 않는다.
- 고정 높이를 강제하지 않고 콘텐츠가 늘어나도 잘리지 않게 한다.

## 7. 인터랙션과 접근성

- 해시 기반 부드러운 스크롤
- IntersectionObserver 기반 현재 섹션 표시
- CSS transition 중심의 짧은 등장 효과와 카드 hover
- `prefers-reduced-motion`에서는 스크롤·등장 효과 비활성화
- 모바일 메뉴는 항목 선택, 바깥 클릭, Escape, 데스크톱 전환 시 닫힘
- 모든 아이콘 버튼에 명확한 한국어 `aria-label`
- 키보드 포커스를 선명하게 표시
- 페이지에 `h1` 하나, 섹션은 `h2`, 카드 제목은 `h3`
- 색상만으로 선택이나 활성 상태를 표현하지 않음

## 8. 기술 구조

사이트는 정적 단일 페이지로 구현한다.

- React
- TypeScript
- Vite
- Tailwind CSS
- Lucide React
- GitHub Pages

Redux, Zustand, React Router, 백엔드 API, 데이터베이스, 문의 폼, 무거운 애니메이션 라이브러리는 사용하지 않는다.

데이터는 `src/data/portfolio.ts`에서 관리하고 타입은 `src/types/portfolio.ts`에 둔다. 컴포넌트는 역할이 분명한 수준으로만 나눈다.

```text
src/
├─ components/
│  ├─ Header.tsx
│  ├─ ProjectCard.tsx
│  ├─ ThemeToggle.tsx
│  └─ Footer.tsx
├─ sections/
│  ├─ HeroSection.tsx
│  ├─ AboutSection.tsx
│  ├─ ProjectsSection.tsx
│  ├─ SkillsSection.tsx
│  ├─ ExperienceSection.tsx
│  └─ ContactSection.tsx
├─ data/portfolio.ts
├─ types/portfolio.ts
├─ App.tsx
├─ main.tsx
└─ index.css
```

Hero, 프로젝트, 링크, 스킬, 경험 데이터는 컴포넌트에 반복해서 직접 작성하지 않는다. 빈 URL, 빈 경험, 누락된 자산은 데이터 계층에서 명확히 표현하고 UI에서 안전하게 숨기거나 대체한다.

## 9. 오류와 빈 상태

- 이미지 오류: 프로젝트 이니셜 또는 `MH` 모노그램으로 교체
- 빈 URL: 링크와 버튼을 렌더링하지 않음
- 빈 경험 데이터: 섹션과 내비게이션을 함께 숨김
- 테마 저장소 접근 실패: 라이트 테마로 정상 렌더링
- 초기 로딩 중에는 레이아웃이 크게 흔들리지 않는 최소 로딩 상태를 표시하고, JavaScript를 사용할 수 없는 환경에는 안내 문구를 제공함
- `href="#"`와 존재하지 않는 파일 경로는 사용하지 않음

## 10. 검증 기준

- TypeScript 빌드와 Vite 빌드 성공
- 사용하지 않는 import와 브라우저 콘솔 오류 없음
- 360, 390, 768, 1024, 1440px에서 수평 스크롤 없음
- 키보드만으로 메뉴, 테마, CTA, 외부 링크 사용 가능
- 모바일 메뉴 Escape와 바깥 클릭 닫기 동작 확인
- 라이트·다크 테마와 저장 동작 확인
- 누락된 이미지·이력서·링크가 깨진 UI를 만들지 않음
- GitHub Pages 사용자 사이트 경로 `base: "/"`에서 정상 동작
- GitHub Actions가 `dist`를 GitHub Pages에 배포할 수 있음

## 11. 콘텐츠와 자산 정책

초기 구현에는 공개 GitHub 저장소와 프로필 소개글에서 확인된 사실만 사용한다.

- 프로필: <https://github.com/minhyeok328/minhyeok328>
- 1차: <https://github.com/minhyeok328/1st_project>
- 2차: <https://github.com/minhyeok328/2nd_project>
- 3차: <https://github.com/minhyeok328/3rd_project>
- 4차: <https://github.com/minhyeok328/4th_project>
- Final: <https://github.com/minhyeok328/Final_project>

프로필 사진, 프로젝트 대표 이미지, 이력서 PDF, 이메일, LinkedIn, 실제 경력·교육 정보는 사용자가 제공한 것만 반영한다. 제공 전에는 모노그램 또는 안전한 빈 상태를 사용하며 가짜 개인정보와 임시 링크를 만들지 않는다.

## 12. 제외 범위

- 로그인, 관리자 화면, 데이터베이스
- 실제 전송 기능이 없는 문의 폼
- 블로그와 프로젝트 상세 라우트
- 자동 타이핑, 3D, parallax, 자동 재생 슬라이더
- 스킬 퍼센트와 의미 없는 활동 지표
- 확인되지 않은 배포 서비스 링크와 성과 수치
