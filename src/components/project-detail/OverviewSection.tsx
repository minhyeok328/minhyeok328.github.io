interface OverviewSectionProps {
  paragraphs: readonly string[]
}

export function OverviewSection({ paragraphs }: OverviewSectionProps) {
  if (paragraphs.length === 0) {
    return null
  }

  return (
    <section className="project-detail__section" aria-labelledby="project-overview-heading">
      <h2 id="project-overview-heading">프로젝트 개요</h2>
      {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
    </section>
  )
}
