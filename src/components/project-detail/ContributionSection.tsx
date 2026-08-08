interface ContributionSectionProps {
  items: readonly string[]
}

export function ContributionSection({ items }: ContributionSectionProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="project-detail__section" aria-labelledby="project-contribution-heading">
      <h2 id="project-contribution-heading">吏곸젒 湲곗뿬</h2>
      <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
    </section>
  )
}
