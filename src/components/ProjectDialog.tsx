import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import type { Project, ProjectDecision } from "../types/portfolio";
import { wrapIndex } from "../lib/navigation";
import "./ProjectDialog.css";

const decisionFields: {
  key: keyof Omit<ProjectDecision, "title">;
  label: string;
}[] = [
  { key: "situation", label: "상황" },
  { key: "choice", label: "선택" },
  { key: "reason", label: "이유" },
  { key: "implementation", label: "구현" },
  { key: "result", label: "결과" },
  { key: "reflection", label: "배운 점" },
];

export function ProjectDialog({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const galleryBackRef = useRef<HTMLButtonElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const galleryTriggerRef = useRef<HTMLButtonElement | null>(null);
  const detailScrollRef = useRef(0);
  const backdropPressRef = useRef(false);
  const previousGalleryStateRef = useRef(false);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const titleId = useId();
  const screenshots = project.evidence?.screenshots ?? [];
  const currentImage =
    galleryIndex === null ? undefined : screenshots[galleryIndex];
  const isGalleryOpen = currentImage !== undefined;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    if (!dialog.open) dialog.showModal();
    closeButtonRef.current?.focus({ preventScroll: true });

    return () => {
      if (dialog.open) dialog.close();
      if (previousFocus?.isConnected)
        previousFocus.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    if (isGalleryOpen) {
      galleryBackRef.current?.focus({ preventScroll: true });
    } else if (previousGalleryStateRef.current) {
      if (detailRef.current)
        detailRef.current.scrollTop = detailScrollRef.current;
      galleryTriggerRef.current?.focus({ preventScroll: true });
    }
    previousGalleryStateRef.current = isGalleryOpen;
  }, [isGalleryOpen]);

  const openGallery = (index: number, trigger: HTMLButtonElement) => {
    galleryTriggerRef.current = trigger;
    detailScrollRef.current = detailRef.current?.scrollTop ?? 0;
    setGalleryIndex(index);
  };

  const closeGallery = () => setGalleryIndex(null);

  const moveGallery = (direction: number) => {
    setGalleryIndex((current) =>
      current === null
        ? null
        : wrapIndex(current + direction, screenshots.length),
    );
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (
      !isGalleryOpen ||
      (event.key !== "ArrowLeft" && event.key !== "ArrowRight")
    )
      return;
    event.preventDefault();
    moveGallery(event.key === "ArrowLeft" ? -1 : 1);
  };

  const isBackdrop = (
    event: MouseEvent<HTMLDialogElement> | PointerEvent<HTMLDialogElement>,
  ) => {
    if (event.target !== event.currentTarget) return false;
    const bounds = event.currentTarget.getBoundingClientRect();
    return (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    );
  };

  return (
    <dialog
      ref={dialogRef}
      className="project-dialog"
      aria-labelledby={titleId}
      data-lenis-prevent
      onKeyDown={handleKeyDown}
      onCancel={(event) => {
        event.preventDefault();
        if (isGalleryOpen) closeGallery();
        else onClose();
      }}
      onPointerDown={(event) => {
        backdropPressRef.current = isBackdrop(event);
      }}
      onClick={(event) => {
        if (backdropPressRef.current && isBackdrop(event)) onClose();
        backdropPressRef.current = false;
      }}
    >
      <header className="project-dialog__header">
        <div className="project-dialog__heading">
          <p className="project-dialog__eyebrow">
            PROJECT {String(project.order).padStart(2, "0")} · {project.stage}
          </p>
          <h2 id={titleId}>{project.title}</h2>
        </div>
        <button
          ref={closeButtonRef}
          type="button"
          className="project-dialog__close"
          onClick={onClose}
          aria-label={`${project.title} 상세 닫기`}
        >
          <span aria-hidden="true">×</span>
          <span>닫기</span>
        </button>
      </header>

      <div
        ref={detailRef}
        className="project-dialog__body"
        hidden={isGalleryOpen}
        data-lenis-prevent
      >
        <section className="project-dialog__intro" aria-label="프로젝트 요약">
          <p className="project-dialog__period">{project.period}</p>
          <p className="project-dialog__description">{project.description}</p>
          {project.cardRoleSummary && (
            <p className="project-dialog__role">{project.cardRoleSummary}</p>
          )}
          <a
            className="project-dialog__link"
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub에서 코드 보기 <span aria-hidden="true">↗</span>
            <span className="project-dialog__sr-only"> (새 탭)</span>
          </a>
        </section>

        {!!project.detail?.overview?.length && (
          <section className="project-dialog__section">
            <h3>프로젝트 소개</h3>
            <div className="project-dialog__prose">
              {project.detail.overview.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </section>
        )}

        <section className="project-dialog__section">
          <h3>제가 맡은 일</h3>
          <ul className="project-dialog__contributions">
            {project.contribution.map((contribution, index) => (
              <li key={index}>{contribution}</li>
            ))}
          </ul>
          <div className="project-dialog__technology-grid">
            <div>
              <h4>직접 사용 기술</h4>
              <ul className="project-dialog__tags">
                {project.technologies.map((technology) => (
                  <li key={technology}>{technology}</li>
                ))}
              </ul>
            </div>
            {!!project.teamTechnologies?.length && (
              <div>
                <h4>팀 시스템·연동 기술</h4>
                <ul className="project-dialog__tags project-dialog__tags--team">
                  {project.teamTechnologies.map((technology) => (
                    <li key={technology}>{technology}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {project.operatingEnvironment && (
            <p className="project-dialog__environment">
              {project.operatingEnvironment}
            </p>
          )}
        </section>

        {project.evidence && (
          <section className="project-dialog__section">
            <h3>화면과 동작</h3>
            {project.evidence.videoSrc && (
              <video
                className="project-dialog__video"
                controls
                playsInline
                preload="none"
                poster={project.image}
                src={project.evidence.videoSrc}
                aria-label={`${project.title} 동작 시연 영상`}
              >
                <a href={project.evidence.videoSrc}>시연 영상 열기</a>
              </video>
            )}
            <p className="project-dialog__disclosure">
              {project.evidence.disclosure}
            </p>
            {screenshots.length > 0 && (
              <div className="project-dialog__screenshots">
                {screenshots.map((screenshot, index) => (
                  <button
                    className="project-dialog__screenshot"
                    type="button"
                    key={screenshot.src}
                    onClick={(event) => openGallery(index, event.currentTarget)}
                    aria-label={`${screenshot.title} 이미지 크게 보기`}
                  >
                    <img
                      src={screenshot.src}
                      alt={screenshot.alt}
                      loading="lazy"
                    />
                    <span>
                      {screenshot.title}
                      <span aria-hidden="true">↗</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {!!project.detail?.decisions?.length && (
          <section className="project-dialog__section">
            <h3>선택과 구현</h3>
            <div className="project-dialog__decisions">
              {project.detail.decisions.map((decision) => (
                <details
                  className="project-dialog__disclosure-block"
                  key={decision.title}
                >
                  <summary>
                    <span>{decision.title}</span>
                    <span className="project-dialog__expand" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <dl className="project-dialog__decision-content">
                    {decisionFields.map(
                      ({ key, label }) =>
                        decision[key] && (
                          <div key={key}>
                            <dt>{label}</dt>
                            <dd>{decision[key]}</dd>
                          </div>
                        ),
                    )}
                  </dl>
                </details>
              ))}
            </div>
          </section>
        )}

        {!!project.detail?.retrospective?.length && (
          <details className="project-dialog__disclosure-block project-dialog__retrospective">
            <summary>
              <span>프로젝트를 돌아보며</span>
              <span className="project-dialog__expand" aria-hidden="true">
                +
              </span>
            </summary>
            <div className="project-dialog__prose">
              {project.detail.retrospective.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </details>
        )}

        <aside className="project-dialog__growth">
          <p>이 경험에서 넓어진 시야</p>
          <strong>{project.growth}</strong>
        </aside>
      </div>

      {currentImage && (
        <section
          className="project-dialog__gallery"
          aria-label="프로젝트 화면 갤러리"
          data-lenis-prevent
        >
          <div className="project-dialog__gallery-toolbar">
            <button
              ref={galleryBackRef}
              type="button"
              className="project-dialog__back"
              onClick={closeGallery}
            >
              ← 상세로
            </button>
            <span aria-live="polite" aria-atomic="true">
              {(galleryIndex ?? 0) + 1} / {screenshots.length}
            </span>
          </div>
          <figure className="project-dialog__gallery-figure">
            <div className="project-dialog__gallery-image">
              <img src={currentImage.src} alt={currentImage.alt} />
            </div>
            <figcaption aria-live="polite" aria-atomic="true">
              <h3>{currentImage.title}</h3>
              <p>{currentImage.caption}</p>
            </figcaption>
          </figure>
          <nav
            className="project-dialog__gallery-navigation"
            aria-label="이미지 이동"
          >
            <button
              type="button"
              onClick={() => moveGallery(-1)}
              disabled={screenshots.length < 2}
              aria-label="이전 이미지"
            >
              ← 이전
            </button>
            <span className="project-dialog__gallery-hint">
              방향키로도 넘길 수 있어요
            </span>
            <button
              type="button"
              onClick={() => moveGallery(1)}
              disabled={screenshots.length < 2}
              aria-label="다음 이미지"
            >
              다음 →
            </button>
          </nav>
        </section>
      )}
    </dialog>
  );
}
