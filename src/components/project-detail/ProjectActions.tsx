import { Link } from 'react-router'

interface ProjectActionsProps {
  githubUrl: string
}

export function ProjectActions({ githubUrl }: ProjectActionsProps) {
  return (
    <div className="project-detail__hero-actions">
      <a href={githubUrl} target="_blank" rel="noreferrer">
        GitHub에서 코드 보기
      </a>
      <Link to="/#projects">프로젝트 목록</Link>
    </div>
  )
}
