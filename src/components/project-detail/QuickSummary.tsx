import type { Project } from '../../types/portfolio'

interface QuickSummaryProps {
  project: Pick<Project, 'description' | 'growth'>
  roleSummary: string
}

export function QuickSummary({ project, roleSummary }: QuickSummaryProps) {
  return (
    <dl className="project-detail__summary" aria-label="?꾨줈?앺듃 鍮좊Ⅸ ?붿빟">
      <div><dt>?꾨줈?앺듃</dt><dd>{project.description}</dd></div>
      <div><dt>????븷</dt><dd>{roleSummary}</dd></div>
      <div><dt>?깆옣</dt><dd>{project.growth}</dd></div>
    </dl>
  )
}
