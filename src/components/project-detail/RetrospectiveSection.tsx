interface RetrospectiveSectionProps {
  paragraphs: readonly string[]
  growth: string
}

export function RetrospectiveSection({ paragraphs, growth }: RetrospectiveSectionProps) {
  if (paragraphs.length === 0) {
    return null
  }

  return (
    <section className="project-detail__section" aria-labelledby="project-retrospective-heading">
      <h2 id="project-retrospective-heading">성장과 회고</h2>
      <p className="project-detail__growth-summary">{growth}</p>
      {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
    </section>
  )
}
