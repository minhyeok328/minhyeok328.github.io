import type { PortfolioData } from "../types/portfolio";
import { migamProject } from "./migam";

export const portfolioData: PortfolioData = {
  profile: {
    name: "서민혁",
    greeting: "안녕하세요,",
    role: "복잡한 AI 서비스의 흐름을 구조화하고 연결하는 풀스택 개발자",
    description:
      "React·TypeScript를 중심으로 데이터·API·AI 파이프라인의 책임과 연결 지점을 이해하고, 팀의 기준을 맞춰 사용자가 이해하고 신뢰할 수 있는 경험으로 구현합니다.",
    profileImage: "/images/profile.jpg",
    resumeUrl: "",
    blogUrl: "https://blog.naver.com/m______yuk",
    email: "tjalsgur328@gmail.com",
    githubUrl: "https://github.com/minhyeok328",
    linkedinUrl: "",
  },
  about: [
    "처음에는 사용자에게 보이지 않는 곳에서 데이터와 복잡한 로직을 처리하는 백엔드에 매력을 느꼈습니다. 이후 프론트엔드를 담당하며 기능은 정상적으로 동작하는 것만으로 충분하지 않고, 사용자가 상태와 결과를 이해할 수 있는 형태로 전달되어야 한다는 점을 배웠습니다.",
    "이 경험을 통해 서비스를 개별 기능의 모음이 아니라 데이터와 로직, API와 화면이 맞물려 동작하는 하나의 흐름으로 보게 되었습니다. 한 영역의 구현에 자신을 고정하기보다 각 연결 지점이 사용자가 이해하고 신뢰할 수 있는 경험으로 이어지도록, 서비스 전체를 이해하고 연결하는 개발자를 지향합니다.",
    "현재는 React·TypeScript 기반의 사용자 경험 구현을 중심축으로 삼고, 데이터 처리와 API, AI 파이프라인을 안정적으로 연결하는 역량을 넓혀가고 있습니다.",
  ],
  learningApproach: {
    title: "How I Learn",
    messages: [
      "과거에는 도움을 요청하는 일이 다른 사람에게 부담을 주는 일이라고 생각해 문제를 혼자 오래 붙들기도 했습니다. 지금은 질문과 업무 요청을 책임을 떠넘기는 일이 아니라 공동의 목표를 위해 정보와 책임을 나누는 과정으로 받아들이고 있습니다.",
      "낯선 문제는 작은 단계로 나누고 가설을 세워 직접 실행한 뒤 결과를 확인합니다. 혼자 해결되지 않을 때에는 문제의 맥락과 시도한 방법, 예상과 실제 결과, 막힌 지점을 정리해 공유하고, 해결 방법을 알게 된 뒤에는 처음부터 다시 구현하며 동작 원리를 검증합니다.",
    ],
  },
  workPrinciples: [
    {
      title: "전체를 이해한 뒤 역할을 나눕니다",
      description:
        "협업은 각자 맡은 기능을 완성해 합치는 것만으로 끝나지 않는다고 생각합니다. 팀원이 전체 사용자 흐름과 시스템 구조, 자신의 작업이 다른 파트와 만나는 지점을 함께 이해해야 이후 변경과 확장에도 안정적으로 대응할 수 있습니다. 그래서 개발 전에 사용자 흐름과 데이터 구조, 아키텍처를 문서로 정리해 공통 기준을 만듭니다.",
    },
    {
      title: "연결 지점과 책임을 먼저 합의합니다",
      description:
        "프론트엔드와 백엔드는 API 명세를 공유해야 하고, 데이터 마스킹처럼 여러 파트에 걸친 처리는 담당 위치와 책임을 정해야 합니다. 구현 전에 인터페이스와 책임 경계를 확인해 각 파트의 결과가 하나의 서비스로 자연스럽게 연결되도록 합니다.",
    },
    {
      title: "진행 상황과 완료 기준을 함께 맞춥니다",
      description:
        "GitHub Issue와 WBS로 진행 상황을 공유하되, 상태 표시만으로 충분하다고 보지 않습니다. 작업 전에 담당 범위·기한·산출물·완료 기준을 함께 합의하고, 변경된 기대 결과와 인터페이스는 관련 문서와 화면 구조에도 반영합니다.",
    },
  ],
  personalProjects: [migamProject],
  flagshipProject: {
    id: "humour",
    order: 5,
    stage: "Service Integration",
    period: "2026.05.22 – 07.15",
    title: "HumouR",
    description:
      "기업 정보, 채용 공고, 평가 기준, 지원서 분석, 리포트, 면접 질문과 외부 제한 공유를 하나의 업무 흐름으로 연결한 AI 채용 운영 보조 서비스입니다.",
    cardRoleSummary: "React·TypeScript 프론트엔드 구조와 서비스 통합 담당",
    contribution: [
      "Axios·CSRF 요청 계층부터 도메인 API Client, Zod 응답 검증, Adapter, TanStack Query로 이어지는 데이터 흐름 구성",
      "일반 로그인과 외부 API Key 기반 제한 화면의 공통 인증·세션·Query 캐시 경계 처리",
      "인증 만료, 요청 취소, 오래된 응답 차단, 오류 정제와 캐시 정리를 포함한 요청 수명주기 처리",
      "JD·지원서·분석 리포트·면접 질문·외부 공유·문서 챗의 화면과 API 흐름 통합",
      "주요 화면과 사용자 동선을 선행 설계하고 공통 UI 기준과 재사용 가능한 화면 구조 구성",
      "프론트엔드 테스트·QA·인터페이스 문서 체계 구축과 확장에 기여",
    ],
    growth: [
      "사무 업무 경험이 없어 사용자 입장에서 화면을 설계하기 어려웠고, 현업자인 강사님께 자주 의견을 구했습니다. 버튼에 기능을 설명하는 문구를 함께 표시하라는 조언을 받으며, 시각 효과보다 필요한 기능을 쉽게 찾고 사용할 수 있는지를 디자인의 기준으로 삼았습니다.",
      "로그인 사용자와 외부 공유로 접근하는 사용자의 화면 상태를 구분하고, 세션 만료·요청 취소·캐시 정리를 직접 다뤘습니다. 인증 방식과 권한에 맞게 화면 상태를 관리하고 검증하는 일도 프론트엔드의 역할이라는 것을 배웠습니다.",
      "최종 점검에서 문서에 정리된 작업 범위와 팀이 기대한 화면의 범위가 다르다는 것을 확인하고, 필요한 화면을 보완했습니다. 진행 상황뿐 아니라 맡은 작업과 완료 기준도 구체적으로 맞춰야 한다고 느꼈습니다.",
    ].join("\n\n"),
    technologies: ["React 19", "TypeScript", "TanStack Query", "Zod"],
    teamTechnologies: ["Django", "Celery", "LangGraph", "Pinecone", "AWS"],
    githubUrl: "https://github.com/SKN26-Final-1st/Final_project",
    image: "/media/projects/humour/poster.png",
    operatingEnvironment:
      "AWS 팀 배포 환경에서 프론트엔드·API 연동 및 동작 검증",
    evidence: {
      videoSrc: "/media/projects/humour/demo.webm",
      disclosure:
        "합성 계정과 샘플 데이터를 사용한 로컬 데모입니다. AWS 인프라 배포는 팀원이 담당했고, 저는 프론트엔드·API 연동과 동작 검증을 담당했습니다.",
      screenshots: [
        {
          src: "/media/projects/humour/analysis-report.png",
          alt: "지원서 원문과 AI 평가 요약을 함께 보여주는 HumouR 분석 리포트 화면",
          title: "분석 리포트",
          caption:
            "지원서 원문과 AI 평가 요약을 한 화면에서 확인하고 후속 검토로 이어지는 흐름입니다.",
        },
        {
          src: "/media/projects/humour/analysis-evidence.png",
          alt: "AI 분석 항목별 근거를 확인하는 HumouR 화면",
          title: "분석 근거 확인",
          caption:
            "평가 결과만 제시하지 않고 항목별 근거를 함께 확인할 수 있도록 구성했습니다.",
        },
        {
          src: "/media/projects/humour/interview-questions.png",
          alt: "분석 결과를 바탕으로 생성한 HumouR 면접 질문 화면",
          title: "면접 질문",
          caption:
            "지원서 분석 결과를 채용 담당자가 검토할 수 있는 후속 질문으로 연결했습니다.",
        },
        {
          src: "/media/projects/humour/external-sharing.png",
          alt: "외부 제한 공유 상태를 관리하는 HumouR 화면",
          title: "외부 제한 공유",
          caption:
            "로그인 사용자와 API Key 기반 제한 사용자의 접근 범위와 상태를 구분했습니다.",
        },
      ],
    },
    detail: {
      overview: [
        "HumouR는 채용 전담 인력이 부족한 조직이 회사 정보와 채용 공고, 평가 기준, 지원서와 분석 결과를 한곳에서 관리하도록 돕는 팀 프로젝트입니다. AI가 합격 여부를 대신 결정하는 것이 아니라, 채용 담당자가 원문 근거와 추가 질문을 바탕으로 판단하도록 지원하는 것을 목표로 했습니다.",
        "저는 Django API, Celery 비동기 처리 상태, LangGraph·Pinecone 분석 결과가 사용자 화면까지 안정적으로 전달되도록 React·TypeScript 프론트엔드의 데이터 흐름과 서비스 통합을 담당했습니다.",
      ],
      decisions: [
        {
          title: "API 응답을 화면에 도달하기 전에 검증",
          situation:
            "JD, 지원서, 분석 리포트 등 도메인마다 응답 구조와 상태가 달라 화면에서 직접 처리하면 변환과 오류 처리가 반복될 수 있었습니다.",
          choice:
            "Axios·CSRF, 도메인 API Client, Zod 런타임 검증, Adapter, TanStack Query 순서로 요청 경계를 나눴습니다.",
          reason:
            "TypeScript 타입만으로는 실제 서버 응답을 검증할 수 없고, 계약 불일치를 화면 가까이에서 발견하면 원인을 추적하기 어려웠기 때문입니다.",
          implementation:
            "공통 요청 설정과 오류 정제는 HTTP 계층에, 응답 검증과 변환은 도메인 계층에, 캐시와 서버 상태는 Query 계층에 배치했습니다.",
          result:
            "화면은 정규화된 데이터만 사용하고, 요청·검증·변환·캐시의 책임을 구분할 수 있었습니다.",
          reflection:
            "프론트엔드의 안정성은 컴포넌트 내부보다 외부 데이터가 들어오는 경계에서 먼저 결정된다는 것을 배웠습니다.",
        },
        {
          title: "일반 로그인과 외부 제한 화면의 프론트 상태 분리",
          situation:
            "팀이 구현한 API Key 기반 제한 모드와 공유 리포트는 로그인 화면과 일부 UI를 함께 사용하지만, 사용할 수 있는 기능과 데이터 범위는 달랐습니다.",
          choice:
            "공통 인증 상태에서 접근 방식을 구분하고, Query Key와 캐시가 사용자 흐름 사이에서 섞이지 않도록 세션 경계를 나눴습니다.",
          reason:
            "두 접근 방식이 같은 클라이언트 상태와 캐시를 공유하면 제한 화면에 불필요한 기능이 보이거나 이전 데이터가 남을 가능성이 있었기 때문입니다.",
          implementation:
            "제한 공유 흐름을 공통 인증·세션 모델과 연결하고, 인증 방식과 불투명 세션 식별자를 Query Key에 포함해 캐시 범위를 구분했습니다.",
          result:
            "로그인 사용자와 외부 제한 사용자의 프론트 상태와 캐시가 서로 섞이지 않도록 공통 경계를 정리했습니다.",
          reflection:
            "로그인 여부만 확인하는 것보다 접근 방식에 따라 프론트 상태의 범위를 나누는 것이 중요했습니다.",
        },
        {
          title: "요청 취소와 인증 만료를 하나의 수명주기로 처리",
          situation:
            "연속된 입력, 분석 상태 확인과 화면 전환 과정에서 늦게 도착한 응답이 최신 상태를 덮거나, 인증 만료 후 보호된 데이터가 화면과 캐시에 남을 수 있었습니다.",
          choice:
            "AbortController와 요청 식별자로 오래된 응답을 차단하고, 인증 만료 시 진행 중인 보호 요청과 Query 캐시를 함께 정리했습니다.",
          reason:
            "오류 메시지만 표시해서는 이미 시작된 요청과 남아 있는 서버 상태를 안전하게 처리할 수 없었기 때문입니다.",
          implementation:
            "요청 취소 신호 전달, stale response 차단, 처리 상태 폴링, 사용자용 오류 정제와 Error Boundary를 함께 적용했습니다.",
          result:
            "최신 요청만 화면에 반영하고, 세션이 만료된 시점에 보호된 요청과 상태도 함께 종료할 수 있었습니다.",
          reflection:
            "로딩·실패·취소·인증 만료는 예외 상황이 아니라 정상적인 사용자 흐름의 일부로 설계해야 한다는 것을 배웠습니다.",
        },
      ],
    },
  },
  journeyProjects: [
    {
      id: "vehicle-tco",
      order: 1,
      stage: "Data Integration",
      period: "2026.02.05 – 02.06",
      title: "차량 운영·관리 비용 계산 시스템",
      description:
        "공공 연비와 차량 데이터, 현재 유가와 비용 가정을 결합해 월·연간 운영비 기준선을 비교하는 시스템입니다.",
      cardRoleSummary: "공공 연비 API 수집·응답 정규화와 CSV 데이터 가공",
      contribution: [
        "공공 연비 API의 JSON 응답에서 서비스에 필요한 차량·연비 필드 추출",
        "API 데이터를 CSV와 팀 데이터 흐름에서 사용할 수 있는 형태로 가공",
        "운영비 계산 범위와 데이터 흐름을 README에 구조화해 문서화",
      ],
      growth: [
        "첫 팀 프로젝트에서 연비 API와 CSV 파일을 읽고 가공하는 작업을 맡았습니다. SQL 문법은 알고 있었지만, 제가 가공한 데이터가 데이터베이스와 Streamlit 화면에서 어떻게 쓰이는지 이해하는 데 시간이 걸렸습니다.",
        "API 응답 형태가 달라도 다음 단계에서 같은 방식으로 처리할 수 있도록 데이터를 정리하면서, 데이터를 받는 쪽의 처리 방식까지 이해해야 한다는 것을 배웠습니다. 데이터를 전달하는 형식과 담당 범위를 맞추는 일도 필요하다고 느꼈습니다. 이후에는 새로운 기술의 사용법과 함께 시스템 안에서 어떤 역할을 하는지 살펴보려고 했습니다.",
      ].join("\n\n"),
      technologies: ["Python", "Public API", "JSON", "CSV"],
      teamTechnologies: ["MySQL", "Streamlit"],
      githubUrl: "https://github.com/joy-riders/joy-riders",
      image: "/media/projects/vehicle-tco/poster.png",
      evidence: {
        videoSrc: "/media/projects/vehicle-tco/demo.webm",
        disclosure:
          "로컬 MariaDB의 실제 적재 데이터를 사용한 데모입니다. 유가 API Key가 없는 상태에서 1,650원/L 고정 대체값을 사용했으며 외부 유가·공공데이터 호출은 실행하지 않았습니다.",
        screenshots: [
          {
            src: "/media/projects/vehicle-tco/search-result.png",
            alt: "아반떼 차량 19개 검색 결과를 보여주는 TCO Insight 화면",
            title: "실제 차량 검색",
            caption:
              "DB에 적재한 차량·연비 데이터에서 아반떼 19개 모델을 조회한 결과입니다.",
          },
          {
            src: "/media/projects/vehicle-tco/cost-result.png",
            alt: "월간 및 연간 차량 운영비 계산 결과 화면",
            title: "월간·연간 운영비",
            caption:
              "동일한 조건에서 월 316,410원, 연 3,796,928원의 비용 구성 결과를 확인할 수 있습니다.",
          },
        ],
      },
      detail: {
        overview: [
          "정적 차량·연비 데이터를 데이터베이스에 적재하고, 결과 조회 시 현재 유가와 자동차세·정비비 가정을 결합해 차량별 월·연간 운영비를 비교한 첫 팀 프로젝트입니다. 구매가·감가·보험·금융비용은 제외했기 때문에 실제 총소유비용이 아니라 동일한 조건에서 차량을 비교하기 위한 운영비 기준선에 가깝습니다.",
          "저는 공공 연비 API와 CSV 로드·파싱을 맡아 외부 데이터를 팀이 사용할 수 있는 형태로 연결하고, 비용 모델과 전체 데이터 흐름을 문서로 정리했습니다.",
        ],
        decisions: [
          {
            title: "외부 API 응답을 재사용 가능한 데이터 형태로 정규화",
            situation:
              "공공 연비 API는 검색 결과 수에 따라 단일 객체와 목록 형태가 달라질 수 있고, 필요한 차량 정보도 여러 필드에 흩어져 있었습니다.",
            choice:
              "응답이 단일 객체일 때도 목록으로 정규화하고, 서비스에 필요한 차량명·제조사·연료·연비·연식 필드만 추출했습니다.",
            reason:
              "뒤 단계의 CSV·DB 처리에서 응답 형태마다 별도 분기를 만들지 않고 같은 데이터 구조를 사용하기 위해서였습니다.",
            implementation:
              "JSON 응답 구조를 확인한 뒤 단일 항목을 목록으로 변환하고, 필요한 필드를 일정한 순서의 행 데이터로 가공했습니다.",
            result:
              "외부 API 결과를 CSV와 팀의 데이터 적재 흐름에서 사용할 수 있는 형태로 전달할 수 있었습니다.",
            reflection:
              "외부 데이터를 가져오는 일은 호출 자체보다 다음 단계가 신뢰할 수 있는 형태로 바꾸는 과정이 중요하다는 것을 배웠습니다.",
          },
        ],
      },
    },
    {
      id: "bank-churners",
      order: 2,
      stage: "ML Experimentation",
      period: "2026.03.16 – 03.17",
      title: "신용카드 고객 이탈 분석",
      description:
        "고객 행동 데이터를 탐색하고 이탈 가능성과 소득 정보의 불확실성을 분석한 머신러닝 프로젝트입니다.",
      cardRoleSummary: "XGBoost 소득 구간 분류 실험과 EDA·전처리 탐색",
      contribution: [
        "식별자와 범주형 특성을 정리하는 전처리 탐색 노트북 구성",
        "Unknown 소득 정보를 보완하기 위한 다중·이진 XGBoost 분류 실험",
        "특성 분포와 상관관계를 설명하는 EDA 시각화 및 Streamlit 초기 화면 제작",
      ],
      growth: [
        "Unknown으로 표시된 소득 정보를 예측으로 보완하려고 XGBoost 분류를 실험했지만, 모델과 파라미터를 바꿔도 여러 소득 구간을 구분하는 성능은 기대에 미치지 못했습니다. 특성 분포와 클래스 구조를 시각화하고 소득 구간을 Low와 High 두 범주로 묶어 실험하면서, 같은 데이터도 문제 정의에 따라 분류 난도와 결과가 달라질 수 있음을 확인했습니다.",
        "실제 Unknown 값 보완과 파이프라인 반영은 후속 과제로 남았습니다. 튜닝을 반복하기 전에 현재 특성으로 소득 구간을 구분할 수 있는지부터 확인해야 한다는 것을 배웠습니다. 이후에는 모델을 고르기 전에 가설과 평가 기준을 정하고 데이터 구조를 살펴보려고 했습니다.",
      ].join("\n\n"),
      technologies: ["Python", "pandas", "scikit-learn", "XGBoost"],
      teamTechnologies: ["MySQL", "FastAPI", "MLflow", "Streamlit"],
      githubUrl: "https://github.com/SKN26-2nd-1st/2nd_project",
      image: "/media/projects/bank-churners/poster.png",
      evidence: {
        videoSrc: "/media/projects/bank-churners/demo.webm",
        disclosure:
          "충돌 없이 확인 가능한 커밋의 모델 지표와 EDA 산출물을 바탕으로 재구성한 사전 계산 증거입니다. 캡처 과정에서 고객 이탈 예측이나 새 모델 추론은 실행하지 않았습니다.",
        screenshots: [
          {
            src: "/media/projects/bank-churners/strategy-report.png",
            alt: "HistGradientBoosting 사전 계산 성능을 바탕으로 정리한 CRM 전략 가이드 화면",
            title: "사전 계산 전략 근거",
            caption:
              "커밋에서 확인한 HistGradientBoosting 성능 지표를 정적 CRM 전략 가이드와 연결해 표시했습니다. 이 화면에서 실시간 추론은 실행하지 않습니다.",
          },
          {
            src: "/media/projects/bank-churners/model-evidence.png",
            alt: "신용카드 고객 특성 관계를 보여주는 EDA 시각화 화면",
            title: "EDA 근거",
            caption:
              "모델 튜닝에 앞서 범주 구조와 특성 관계를 실제 시각화로 검토했습니다.",
          },
        ],
      },
      detail: {
        overview: [
          "Kaggle BankChurners 데이터를 바탕으로 고객 행동 특성과 이탈 가능성을 분석하고, 여러 모델을 비교한 팀 프로젝트입니다. 저는 소득 정보의 Unknown 값을 단순 삭제하지 않고 예측으로 보완할 수 있는지 실험했습니다.",
          "이 실험은 실제 Unknown 값을 모두 대체해 운영 파이프라인에 반영하는 단계까지 완성되지는 않았습니다. 대신 기대보다 낮은 다중 분류 결과를 통해 모델보다 데이터 구조와 문제 정의를 먼저 확인해야 한다는 교훈을 얻었습니다.",
        ],
        decisions: [
          {
            title: "튜닝을 반복하기보다 소득 분류 문제를 다시 정의",
            situation:
              "알려진 소득 구간을 사용한 다중 분류에서 클래스 경계가 충분히 나뉘지 않아 기대한 성능을 얻지 못했습니다.",
            choice:
              "특성 분포를 시각화해 클래스 구조를 확인하고, 소득 구간을 Low와 High로 묶은 이진 분류도 별도로 실험했습니다.",
            reason:
              "파라미터를 계속 조정하기 전에 현재 특성으로 세부 소득 구간을 구분할 수 있는지부터 확인할 필요가 있었기 때문입니다.",
            implementation:
              "Unknown 행을 제외한 알려진 구간으로 학습·검증 데이터를 나누고, XGBoost 다중 분류와 그룹 재정의 실험을 진행했습니다.",
            result:
              "문제를 단순화했을 때 결과가 어떻게 달라지는지 확인했지만, 실제 Unknown 보완과 파이프라인 반영은 후속 과제로 남았습니다.",
            reflection:
              "낮은 성능을 알고리즘의 문제로만 보지 않고 가설과 레이블 구조를 다시 살펴보는 태도가 중요하다는 것을 배웠습니다.",
          },
        ],
      },
    },
    {
      id: "pickle",
      order: 3,
      stage: "LLM & RAG",
      period: "2026.04.24 – 04.27",
      title: "PICKLE 맛집 추천 챗봇",
      description:
        "사용자 조건을 구조화하고 신대방삼거리 식당 100곳의 실제 데이터를 검색해 한 곳을 추천하는 RAG 챗봇입니다.",
      cardRoleSummary:
        "LangGraph RAG 파이프라인·구조화 출력·Streamlit 통합과 내부 평가",
      contribution: [
        "LangChain 기반 흐름을 라우팅·슬롯 추출·검색·생성 단계의 LangGraph 상태 그래프로 구조화",
        "OpenAI strict JSON Schema로 검색 조건 슬롯의 형식과 필수 필드 고정",
        "SQLite 임베딩·관계 테이블 검색을 추천 파이프라인에 연결",
        "Streamlit 스트리밍 답변과 지도·매장 상세 화면 통합",
        "동일한 50개 케이스로 반복 비교하는 내부 평가·실패 리포트 체계 구축",
      ],
      growth: [
        "질문 유형에 따라 검색 경로가 달라지면서, LangChain 기반의 단일 체인으로 각 단계의 입력과 출력을 추적하기 어려워졌습니다. LangGraph 상태 그래프로 단계를 나눴지만, 초기에 각 단계가 주고받는 데이터 형식과 연결 방식을 충분히 맞추지 않아 기능을 추가할 때 기존 코드를 다시 수정하고 연결하는 데 시간이 들었습니다. 이후에는 구현 전에 데이터가 오가는 순서와 각 단계의 역할을 구체화하고, 팀원들과 진행 상황과 변경 사항을 공유하려고 했습니다.",
        "답변이 자연스러워 보여도 검색 조건이나 후보 식당이 잘못될 수 있었습니다. 내부 평가에서 실패를 단계별로 나눠 보면서, 답변에 문제가 있을 때 프롬프트뿐 아니라 질문에서 검색 조건을 추출하는 단계와 검색된 식당 후보, 데이터 구조까지 함께 확인해야 한다는 것을 배웠습니다.",
      ].join("\n\n"),
      technologies: ["LangGraph", "OpenAI API", "RAG", "SQLite", "Streamlit"],
      teamTechnologies: ["Kakao Map API"],
      githubUrl: "https://github.com/SKN26-3rd-3rd/3rd_project",
      image: "/media/projects/pickle/poster.png",
      evidence: {
        videoSrc: "/media/projects/pickle/demo.webm",
        disclosure:
          "실제 구축한 100개 식당 SQLite DB 기반 검색 화면입니다. 평가는 미리 계산된 50개 내부 평가 결과이며, 이 데모에서 LLM이나 임베딩 API를 다시 호출하지 않았습니다.",
        screenshots: [
          {
            src: "/media/projects/pickle/search-map.png",
            alt: "PICKLE 식당 검색 결과와 Kakao 지도를 함께 보여주는 화면",
            title: "검색과 지도",
            caption:
              "실제 식당 검색 결과와 지도 마커를 연결해 후보의 위치와 정보를 함께 확인할 수 있습니다.",
          },
          {
            src: "/media/projects/pickle/restaurant-detail.png",
            alt: "PICKLE 식당 메뉴와 리뷰 상세 화면",
            title: "식당 상세",
            caption:
              "추천 후보의 메뉴와 리뷰를 검색 결과의 근거로 연결했습니다.",
          },
          {
            src: "/media/projects/pickle/evaluation.png",
            alt: "PICKLE 50개 질의 내부 평가 결과 화면",
            title: "내부 평가 결과",
            caption:
              "동일 DB·50개 케이스 기준 all-check 82%, 후보 내 목표 식당 포함률 96%를 기록했습니다.",
          },
        ],
      },
      detail: {
        overview: [
          "PICKLE은 신대방삼거리 식당 100곳의 메뉴·리뷰·태그 데이터를 바탕으로 사용자의 조건에 맞는 한 곳을 추천하는 팀 프로젝트입니다. 사용자 질문을 분류하고 검색 조건을 구조화한 뒤, SQLite의 실제 식당 후보와 근거를 답변과 지도·상세 카드로 연결했습니다.",
          "저는 LLM 시스템 설계와 Streamlit 프론트엔드를 함께 다루며 사용자 질의부터 데이터 검색, 응답 생성과 결과 표시까지 이어지는 흐름을 하나의 서비스 형태로 통합했습니다.",
        ],
        decisions: [
          {
            title: "단일 체인을 상태 기반 LangGraph 파이프라인으로 전환",
            situation:
              "질문 유형에 따라 고정 조건 검색과 의미 기반 검색이 갈리고, 슬롯 추출·검색·생성 단계가 늘어나면서 단일 체인만으로 흐름을 추적하기 어려워졌습니다.",
            choice:
              "라우터, 슬롯 추출, 데이터 커넥터와 생성기를 명시적인 상태와 조건 분기로 연결한 LangGraph 구조로 전환했습니다.",
            reason:
              "각 단계의 입력과 출력을 분리하고, 질문 유형별 흐름을 코드에서 확인할 수 있게 하기 위해서였습니다.",
            implementation:
              "typed state에 질의·라우트·검색 조건·후보를 담고, 라우팅 결과에 따라 서로 다른 슬롯 추출과 검색 경로를 거쳐 생성 단계로 합류하도록 구성했습니다.",
            result:
              "사용자 질의부터 검색·생성까지의 흐름을 단계별로 구분하고 실제 SQLite 데이터와 Streamlit UI에 연결했습니다.",
            reflection:
              "구현을 시작하기 전에 상태와 인터페이스를 충분히 정하지 않아 후속 수정이 많았고, 초기 아키텍처 합의의 중요성을 배웠습니다.",
          },
          {
            title: "내부 평가로 실패 지점을 단계별로 분류",
            situation:
              "답변이 자연스러워 보여도 검색 조건이나 후보 식당이 잘못되면 추천 품질을 판단하기 어려웠습니다.",
            choice:
              "고정 질의 20개와 임베딩 질의 30개로 구성한 내부 평가에서 route·payload·target·answer·retrieval을 각각 검사했습니다.",
            reason:
              "프롬프트 수정뿐 아니라 슬롯 추출과 검색 단계 중 어디에서 실패하는지 구분하기 위해서였습니다.",
            implementation:
              "동일한 50개 케이스와 평가 기준을 세 차례 유지하고, 실패 유형과 단계별 비율을 JSON·HTML 리포트로 남겼습니다.",
            result:
              "팀의 검색·프롬프트 변경을 거치며 내부 all-check 통과율은 46%에서 82%, 후보 내 목표 식당 포함률은 52%에서 96%로 변했습니다. 이는 프로덕션 정확도가 아닌 동일 DB에서 자동 생성한 내부 평가 결과입니다.",
            reflection:
              "LLM 품질은 답변 문장만 보는 것이 아니라 입력 구조화와 검색 근거를 함께 측정해야 한다는 것을 배웠습니다.",
          },
        ],
      },
    },
    {
      id: "lg-home-ai",
      order: 4,
      stage: "Web Integration",
      period: "2026.05.20 – 05.21",
      title: "LG Home AI 가전 상담",
      description:
        "계정·검색·상품 상세·찜·챗봇을 연결한 Django 기반 LG 가전 검색·상담 웹 애플리케이션입니다.",
      cardRoleSummary:
        "Django Templates·Tailwind·JavaScript 기반 프론트엔드와 서버 연동",
      contribution: [
        "Figma로 메인·검색·상품 상세·챗봇의 사용자 동선과 화면 구조 설계",
        "GET·SSR 기반 필터 검색과 쿼리스트링 상태 복원·페이지네이션 구현",
        "찜·채팅 JSON 통신에 CSRF·오류·로딩·중복 요청 방지 처리 적용",
        "AI 응답 HTML 정제와 서버 대화 이력의 안전한 DOM 렌더링",
        "모바일 입력·사이드바 UX와 static·template 구조 및 Git 통합 정리",
      ],
      growth: [
        "Figma에서 설계한 사용자 동선을 Django 화면과 서버 통신으로 구현했습니다. 찜·채팅 요청에 로딩·오류 표시와 중복 요청 방지를 적용하면서, 버튼을 누른 뒤 사용자가 보게 될 상태까지 설계해야 한다는 것을 배웠습니다. Tailwind와 Django를 연결할 때 발생한 패키지 충돌, Node 실행과 경로 설정 문제를 확인하며 빌드 도구와 서버 환경도 함께 살펴봤습니다.",
        "역할과 작업 범위가 겹쳤을 때는 팀이 이미 만든 구조에 맞춰 구현해 중복 작업을 줄였습니다. 작업을 시작하기 전에 각자 맡을 범위를 구체적으로 확인해야 한다고 느꼈습니다.",
        "이 프로젝트는 로컬 데모 단계에서 개발을 마쳤으며, 실제 배포까지 진행하지는 않았습니다.",
      ].join("\n\n"),
      technologies: [
        "Django Templates",
        "Tailwind CSS",
        "JavaScript",
        "Fetch API",
      ],
      teamTechnologies: ["Django ORM", "LangGraph", "Pinecone", "SQLite"],
      githubUrl: "https://github.com/SKN26-4th-1st/4th_project",
      image: "/media/projects/lg-home-ai/poster.png",
      evidence: {
        videoSrc: "/media/projects/lg-home-ai/demo.webm",
        disclosure:
          "합성 계정과 로컬 데이터로 촬영한 데모입니다. 검색·상세·찜·챗봇 화면을 검증했으며 녹화 과정에서 AI·RAG 외부 호출은 실행하지 않았습니다.",
        screenshots: [
          {
            src: "/media/projects/lg-home-ai/search-filter.png",
            alt: "LG Home AI 냉장고 검색과 필터 결과 화면",
            title: "검색과 필터",
            caption:
              "Django GET·ORM·Paginator와 쿼리스트링으로 검색 조건과 페이지 상태를 유지했습니다.",
          },
          {
            src: "/media/projects/lg-home-ai/product-detail.png",
            alt: "LG Home AI 상품 상세와 찜 완료 화면",
            title: "상품 상세와 찜",
            caption:
              "847개 실제 상품 데이터의 상세 정보와 찜 JSON 통신 상태를 하나의 흐름으로 연결했습니다.",
          },
          {
            src: "/media/projects/lg-home-ai/chat.png",
            alt: "LG Home AI 제품 상담 챗봇 화면",
            title: "AI 상담 화면",
            caption:
              "로딩·오류 표시와 중복 요청 방지를 고려한 채팅 인터페이스를 구현했습니다.",
          },
        ],
      },
      detail: {
        overview: [
          "3차 프로젝트에서 Streamlit 기반 AI 프로토타입을 구현한 뒤, 4차에서는 계정·검색·상품 상세·찜·챗봇이 연결된 Django 웹 애플리케이션의 프론트엔드를 경험했습니다. 사용자는 847개 가전 데이터를 조건으로 검색하고, 제품 상담과 사용설명서 RAG 기능을 이용할 수 있습니다.",
          "저는 AI 모델링 자체보다 사용자 동선과 정보 구조, Django 템플릿과 클라이언트 동작, 찜·채팅 서버 통신을 연결하는 프론트엔드 범위를 담당했습니다.",
        ],
        decisions: [
          {
            title: "검색 조건을 URL에 보존하는 SSR 흐름",
            situation:
              "제품군마다 필터 항목이 다르고, 조건을 변경하거나 페이지를 이동한 뒤에도 현재 검색 상태가 유지되어야 했습니다.",
            choice:
              "검색을 별도 REST API로 만들지 않고 Django GET·ORM·Paginator 기반 SSR로 처리하며 쿼리스트링을 상태로 사용했습니다.",
            reason:
              "새로고침과 링크 공유에도 검색 조건을 유지하고, 서버의 검색 결과와 브라우저 상태를 한 기준으로 맞추기 위해서였습니다.",
            implementation:
              "필터 적용·삭제·초기화와 페이지 이동 시 기존 쿼리스트링을 보존하고, 브라우저가 URL을 기준으로 선택 상태를 복원하도록 구성했습니다.",
            result:
              "SPA 상태 관리 없이도 검색 조건과 페이지 이동을 일관되게 유지하는 흐름을 만들었습니다.",
            reflection:
              "화면 상태를 무조건 JavaScript 메모리에 두기보다 서버 렌더링과 URL 특성에 맞는 기준을 선택하는 것이 중요했습니다.",
          },
          {
            title: "찜·채팅 요청의 공통 오류와 중복 실행 처리",
            situation:
              "사용자가 버튼을 반복해서 누르거나 서버가 HTML·JSON 오류를 다르게 반환하면 중복 요청과 불명확한 피드백이 발생할 수 있었습니다.",
            choice:
              "공통 요청·응답 정규화 계층을 두고 기능별 in-flight 상태, CSRF, 오류·로딩 표시와 AI 응답 정제를 적용했습니다.",
            reason:
              "성공 경로뿐 아니라 네트워크 실패와 반복 입력에서도 사용자가 현재 상태를 이해할 수 있게 하기 위해서였습니다.",
            implementation:
              "HTTP·JSON 파싱 결과를 같은 형태로 변환하고, 찜·채팅 실행 중 재요청을 막았습니다. AI 마크다운은 이스케이프와 허용 목록 기반 정제를 거쳐 DOM에 표시했습니다.",
            result:
              "찜과 채팅의 중복 실행을 줄이고 오류·로딩 상태를 일관되게 표시하도록 구현했으며, 정적 QA로 코드 경계를 점검했습니다.",
            reflection:
              "사용자에게 보이는 동작은 정상 응답뿐 아니라 실패와 입력 반복까지 포함해 설계해야 한다는 것을 배웠습니다.",
          },
        ],
      },
    },
  ],
  skillGroups: [
    {
      title: "Frontend",
      primary: ["React", "TypeScript", "Axios", "TanStack Query", "Zod"],
      experience: [
        "JavaScript",
        "Tailwind CSS",
        "Ant Design",
        "Django Templates",
        "Streamlit",
      ],
    },
    {
      title: "LLM Application",
      primary: [
        "LangGraph",
        "LangChain",
        "RAG",
        "OpenAI API",
        "Structured Output",
      ],
      experience: ["Pinecone integration"],
    },
    {
      title: "Backend & Data",
      primary: ["Python", "Django", "pandas", "scikit-learn", "XGBoost"],
      experience: [
        "FastAPI consumption",
        "MySQL/SQLite integration",
        "Celery/MLflow boundary",
      ],
    },
    {
      title: "Quality & Delivery",
      primary: ["Vitest", "Testing Library", "MSW", "Playwright", "Git/GitHub"],
      experience: [
        "Docker",
        "GitHub Actions",
        "AWS deployment integration & verification",
      ],
    },
  ],
  experiences: [],
};
