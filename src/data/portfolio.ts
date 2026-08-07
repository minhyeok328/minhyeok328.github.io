import type { PortfolioData } from '../types/portfolio'

export const portfolioData: PortfolioData = {
  profile: {
    name: '서민혁',
    greeting: '안녕하세요,',
    role: '프론트엔드 강점을 가진 AI 풀스택 개발자',
    description: '사용자 경험부터 데이터·API·LLM까지 연결해, 실제 업무 흐름에서 안정적으로 동작하는 AI 서비스를 만듭니다.',
    profileImage: '',
    resumeUrl: '',
    blogUrl: 'https://minhyeok328.tistory.com/',
    email: 'tjalsgur328@gmail.com',
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
      '프론트엔드 CODEOWNER로서 React·TypeScript 애플리케이션 구조와 통합 품질 주도',
      'Axios·CSRF, API Client, Zod 계약, Adapter, TanStack Query로 이어지는 데이터 흐름 설계',
      '일반 계정과 제한 API Key 세션의 권한·캐시 경계 처리',
      '인증 만료, 요청 취소, 오류 정제, 캐시 정리 등 요청 수명주기 안정화',
      'JD·지원서·분석 리포트·공유·문서 챗의 API 연동과 통합 검증',
      '프론트엔드 테스트, QA, 문서 정합성 관리',
    ],
    growth: '인증·상태·오류·검증을 다루는 AI 애플리케이션 구조로 확장',
    technologies: ['React 19', 'TypeScript', 'TanStack Query', 'Zod'],
    teamTechnologies: ['Django', 'Celery', 'LangGraph', 'Pinecone', 'AWS'],
    githubUrl: 'https://github.com/minhyeok328/Final_project', image: '',
  },
  journeyProjects: [
    { id: 'vehicle-tco', order: 1, stage: 'Data Integration', title: '차량 운영·관리 비용 계산 시스템', description: '차량별 운영 비용을 데이터 기반으로 비교하는 TCO 계산 시스템입니다.', contribution: ['공공 연비 API 수집과 JSON·CSV 로드·파싱', '비용 모델과 데이터 흐름 문서화'], growth: '외부 데이터를 서비스 입력값으로 연결', technologies: ['Python', 'Public API', 'CSV', 'Streamlit'], githubUrl: 'https://github.com/minhyeok328/1st_project', image: '' },
    { id: 'bank-churners', order: 2, stage: 'ML Experimentation', title: '신용카드 고객 이탈 분석', description: '고객 데이터를 탐색하고 이탈 가능성을 분석한 머신러닝 프로젝트입니다.', contribution: ['전처리 탐색과 EDA 시각화', 'Unknown 소득 보완을 위한 XGBoost 그룹 분류 실험'], growth: '모델 실험을 사용자에게 전달할 분석으로 확장', technologies: ['Python', 'pandas', 'scikit-learn', 'XGBoost'], githubUrl: 'https://github.com/minhyeok328/2nd_project', image: '' },
    { id: 'pickle', order: 3, stage: 'LLM & RAG', title: 'PICKLE 맛집 추천 챗봇', description: '사용자 조건을 구조화하고 실제 매장 데이터를 검색해 추천하는 챗봇입니다.', contribution: ['LangGraph 추천 파이프라인과 strict JSON Schema 슬롯 추출', 'SQLite 임베딩 검색 연동, Streamlit UI와 내부 평가'], growth: 'LLM 응답을 실제 데이터와 근거에 연결', technologies: ['LangGraph', 'OpenAI API', 'RAG', 'SQLite', 'Streamlit'], githubUrl: 'https://github.com/minhyeok328/3rd_project', image: '' },
    { id: 'lg-home-ai', order: 4, stage: 'Web Integration', title: 'LG Home AI 가전 상담', description: 'LLM 상담 기능을 계정과 대화방 중심의 웹 서비스로 통합한 프로젝트입니다.', contribution: ['Django·Tailwind 기반 주요 화면 구현', '검색·필터·찜·채팅 API 연동과 오류·로딩·모바일 UX 개선'], growth: 'LLM 기능을 웹 애플리케이션의 사용자 흐름에 통합', technologies: ['Django', 'Tailwind CSS', 'JavaScript', 'REST API'], githubUrl: 'https://github.com/minhyeok328/4th_project', image: '' },
  ],
  skillGroups: [
    { title: 'Frontend', primary: ['React', 'TypeScript', 'Axios', 'TanStack Query', 'Zod'], experience: ['JavaScript', 'Tailwind CSS', 'Ant Design', 'Django Templates', 'Streamlit'] },
    { title: 'LLM Application', primary: ['LangGraph', 'LangChain', 'RAG', 'OpenAI API', 'Structured Output'], experience: ['Pinecone integration'] },
    { title: 'Backend & Data', primary: ['Python', 'Django', 'pandas', 'scikit-learn', 'XGBoost'], experience: ['FastAPI consumption', 'MySQL/SQLite integration', 'Celery/MLflow boundary'] },
    { title: 'Quality & Delivery', primary: ['Vitest', 'Testing Library', 'MSW', 'Playwright', 'Git/GitHub'], experience: ['Docker', 'GitHub Actions', 'AWS deployment configuration'] },
  ],
  experiences: [],
}
