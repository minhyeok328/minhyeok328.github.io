const SITE_ORIGIN = 'https://minhyeok328.github.io'

export interface PageMetadata {
  title: string
  description: string
  ogTitle: string
  ogDescription: string
  ogUrl: string
}

export const homeMetadata: PageMetadata = {
  title: '서민혁 | AI 기능을 사용자 경험으로 연결하는 프론트엔드 개발자',
  description: 'React·TypeScript를 중심으로 LLM·API·데이터 흐름을 사용자 경험으로 연결한 서민혁의 프론트엔드 포트폴리오입니다.',
  ogTitle: '서민혁 | AI 기능을 사용자 경험으로 연결하는 프론트엔드 개발자',
  ogDescription: 'AI 기능의 화면·상태·인증·오류·테스트까지 연결하는 프론트엔드 개발자 포트폴리오입니다.',
  ogUrl: `${SITE_ORIGIN}/`,
}
