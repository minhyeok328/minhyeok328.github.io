interface AboutSectionProps {
  messages: string[]
}

export function AboutSection({ messages }: AboutSectionProps) {
  return (
    <section id="about" className="site-container portfolio-section about-section" aria-labelledby="about-heading">
      <h2 id="about-heading">About</h2>
      <div className="about-section__messages">
        {messages.map((message) => <p key={message}>{message}</p>)}
      </div>
    </section>
  )
}
