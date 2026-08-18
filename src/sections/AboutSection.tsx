import type { LearningApproach } from '../types/portfolio'

interface AboutSectionProps {
  messages: string[]
  learningApproach: LearningApproach
}

export function AboutSection({ messages, learningApproach }: AboutSectionProps) {
  return (
    <section id="about" className="site-container portfolio-section about-section" aria-labelledby="about-heading">
      <h2 id="about-heading">About</h2>
      <div className="about-section__content">
        <div className="about-section__messages">
          {messages.map((message) => <p key={message}>{message}</p>)}
        </div>
        <section className="about-section__learning" aria-labelledby="how-i-learn-heading">
          <h3 id="how-i-learn-heading">{learningApproach.title}</h3>
          <div>
            {learningApproach.messages.map((message) => <p key={message}>{message}</p>)}
          </div>
        </section>
      </div>
    </section>
  )
}
