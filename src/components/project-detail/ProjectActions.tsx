import { Link } from 'react-router'

interface ProjectActionsProps {
  githubUrl: string
}

export function ProjectActions({ githubUrl }: ProjectActionsProps) {
  return (
    <div className="project-detail__hero-actions">
      <a href={githubUrl} target="_blank" rel="noreferrer">
        GitHub?먯꽌 肄붾뱶 蹂닿린
      </a>
      <Link to="/#projects">?꾨줈?앺듃 紐⑸줉</Link>
    </div>
  )
}
