const SITE_ORIGIN = 'https://minhyeok328.github.io'

export interface PageMetadata {
  title: string
  description: string
  ogTitle: string
  ogDescription: string
  ogUrl: string
}

export const homeMetadata: PageMetadata = {
  title: '서민혁 | 복잡한 AI 서비스의 흐름을 연결하는 풀스택 개발자',
  description: 'React·TypeScript를 중심으로 데이터·API·AI 파이프라인을 사용자 경험으로 연결하는 풀스택 개발자 서민혁의 포트폴리오입니다.',
  ogTitle: '서민혁 | 복잡한 AI 서비스의 흐름을 연결하는 풀스택 개발자',
  ogDescription: '팀과 기술 영역의 기준을 맞춰 복잡한 AI 서비스를 사용자가 이해하고 신뢰할 수 있는 경험으로 구현합니다.',
  ogUrl: `${SITE_ORIGIN}/`,
}
