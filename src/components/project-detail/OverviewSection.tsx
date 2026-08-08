interface OverviewSectionProps {
  paragraphs: readonly string[]
}

export function OverviewSection({ paragraphs }: OverviewSectionProps) {
  if (paragraphs.length === 0) {
    return null
  }

  return (
    <section className="project-detail__section" aria-labelledby="project-overview-heading">
      <h2 id="project-overview-heading">?꾨줈?앺듃 媛쒖슂</h2>
      {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
    </section>
  )
}
