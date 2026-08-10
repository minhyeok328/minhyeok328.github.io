import type { Project } from '../../types/portfolio'
import { ImageWithFallback } from '../ImageWithFallback'

interface ProjectEvidenceSectionProps {
  project: Pick<Project, 'evidence' | 'id' | 'image' | 'title'>
}

export function ProjectEvidenceSection({ project }: ProjectEvidenceSectionProps) {
  if (!project.evidence) {
    return null
  }

  const { disclosure, screenshots, videoSrc } = project.evidence

  return (
    <>
      <section
        className="project-detail__section project-detail__demo"
        aria-labelledby={`project-demo-heading-${project.id}`}
      >
        <div className="project-detail__section-heading">
          <div>
            <p className="project-detail__section-kicker">DEMO VIDEO</p>
            <h2 id={`project-demo-heading-${project.id}`}>
              실제 화면으로 확인하는 서비스 흐름
            </h2>
          </div>
          <p>자동 재생 없이 재생 버튼을 눌렀을 때만 시작합니다.</p>
        </div>
        <video
          className="project-detail__video"
          src={videoSrc}
          poster={project.image}
          aria-label={`${project.title} 데모 영상`}
          controls
          preload="metadata"
          playsInline
          tabIndex={0}
        />
        <p className="project-detail__disclosure">{disclosure}</p>
      </section>

      <section
        className="project-detail__section project-detail__evidence"
        aria-labelledby={`project-evidence-heading-${project.id}`}
      >
        <div className="project-detail__section-heading">
          <div>
            <p className="project-detail__section-kicker">IMPLEMENTATION EVIDENCE</p>
            <h2 id={`project-evidence-heading-${project.id}`}>주요 화면과 구현 근거</h2>
          </div>
          <p>기능과 담당 범위, 화면에서 확인할 수 있는 결과를 함께 기록했습니다.</p>
        </div>
        <div className="project-detail__evidence-grid">
          {screenshots.map((screenshot, index) => {
            const captionId = `project-evidence-caption-${project.id}-${index}`

            return (
              <figure key={screenshot.src} aria-labelledby={captionId}>
                <ImageWithFallback
                  className="project-detail__evidence-image"
                  fallbackClassName="project-detail__evidence-image-placeholder"
                  src={screenshot.src}
                  alt={screenshot.alt}
                  fallback={screenshot.title}
                  loading="lazy"
                  decoding="async"
                />
                <figcaption id={captionId}>
                  <h3>{screenshot.title}</h3>
                  <p>{screenshot.caption}</p>
                </figcaption>
              </figure>
            )
          })}
        </div>
      </section>
    </>
  )
}
