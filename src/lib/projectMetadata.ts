const SITE_ORIGIN = 'https://minhyeok328.github.io'

export interface PageMetadata {
  title: string
  description: string
  ogTitle: string
  ogDescription: string
  ogUrl: string
}

export const homeMetadata: PageMetadata = {
  title: '서민혁 | 서비스의 전체 흐름을 연결하는 풀스택 개발자',
  description: '데이터와 비즈니스 로직, API와 화면을 연결해 사용자 경험까지 구현하는 풀스택 개발자 서민혁의 포트폴리오입니다.',
  ogTitle: '서민혁 | 서비스의 전체 흐름을 연결하는 풀스택 개발자',
  ogDescription: '서비스의 전체 구조와 연결 지점을 이해하고 사용자 경험까지 구현하는 풀스택 개발자 포트폴리오입니다.',
  ogUrl: `${SITE_ORIGIN}/`,
}
