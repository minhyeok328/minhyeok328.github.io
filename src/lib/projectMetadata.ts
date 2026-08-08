import type { Profile, Project } from '../types/portfolio'
import { getProjectPath } from './projects'

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

export const notFoundMetadata: PageMetadata = {
  title: '페이지를 찾을 수 없습니다 | 서민혁 포트폴리오',
  description: '요청한 포트폴리오 페이지를 찾을 수 없습니다.',
  ogTitle: '페이지를 찾을 수 없습니다 | 서민혁 포트폴리오',
  ogDescription: '요청한 포트폴리오 페이지를 찾을 수 없습니다.',
  ogUrl: `${SITE_ORIGIN}/`,
}

export function getProjectMetadata(
  project: Pick<Project, 'id' | 'title' | 'description'>,
  profile: Pick<Profile, 'name'>,
): PageMetadata {
  const title = `${project.title} | ${profile.name} 포트폴리오`

  return {
    title,
    description: project.description,
    ogTitle: title,
    ogDescription: project.description,
    ogUrl: `${SITE_ORIGIN}${getProjectPath(project)}`,
  }
}
