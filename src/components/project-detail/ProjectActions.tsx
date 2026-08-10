interface ProjectActionsProps {
  githubUrl: string
}

export function ProjectActions({ githubUrl }: ProjectActionsProps) {
  return (
    <div className="project-detail__hero-actions">
      <a href={githubUrl} target="_blank" rel="noreferrer">
        공식 팀 GitHub에서 코드 보기
      </a>
    </div>
  )
}
