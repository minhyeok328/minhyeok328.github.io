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
