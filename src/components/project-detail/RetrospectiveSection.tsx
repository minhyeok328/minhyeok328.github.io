interface RetrospectiveSectionProps {
  paragraphs: readonly string[]
}

export function RetrospectiveSection({ paragraphs }: RetrospectiveSectionProps) {
  if (paragraphs.length === 0) {
    return null
  }

  return (
    <section className="project-detail__section" aria-labelledby="project-retrospective-heading">
      <h2 id="project-retrospective-heading">?깆옣怨??뚭퀬</h2>
      {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
    </section>
  )
}
