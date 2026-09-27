import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { portfolioData as data } from "./data/portfolio";
import type { Project } from "./types/portfolio";
import { Header } from "./components/Header";
import { ProjectDialog } from "./components/ProjectDialog";
import {
  getActiveSection,
  getProgress,
} from "./lib/navigation";
import { useMotion } from "./useMotion";
import { useProjectSlider } from "./useProjectSlider";

const sectionIds = ["home", "about", "skills", "projects", "contact"];
const projects = [
  ...data.personalProjects,
  data.flagshipProject,
  ...[...data.journeyProjects].reverse(),
].map((project, index) => ({ ...project, order: index + 1 }));
const usage = [
  [
    "화면과 데이터를 연결합니다.",
    "React·TypeScript를 중심으로 API 응답 검증과 상태 관리를 연결합니다.",
  ],
  [
    "실패 상황까지 함께 다룹니다.",
    "인증 만료, 요청 취소, 오류와 캐시 정리를 사용자 흐름 안에서 처리합니다.",
  ],
  [
    "AI 흐름을 단계별로 구성합니다.",
    "질문 분류부터 조건 추출, 검색과 생성까지 LangGraph로 구조화합니다.",
  ],
  [
    "동작을 확인하고 기준을 공유합니다.",
    "테스트·QA와 인터페이스 문서로 구현 결과를 확인하고 팀의 기준을 맞춥니다.",
  ],
];

function Word({ className = "" }: { className?: string }) {
  return (
    <div className={`brand-word ${className}`} aria-hidden="true">
      {"MHDL".split("").map((letter, i) => (
        <span className={`letter letter-${i}`} key={letter}>
          <span className="letter-enter">
            <span className="glyph">{letter}</span>
          </span>
        </span>
      ))}
    </div>
  );
}
function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <span aria-hidden="true">{diagonal ? "↗" : "→"}</span>;
}
function AboutStory() {
  return (
    <details className="story">
      <summary>
        조금 더 알아보기 <span aria-hidden="true">+</span>
      </summary>
      <div>
        {data.about.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <h3>{data.learningApproach.title}</h3>
        {data.learningApproach.messages.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <h3>함께 일하는 방식</h3>
        {data.workPrinciples.map((principle) => (
          <div key={principle.title}>
            <h4>{principle.title}</h4>
            <p>{principle.description}</p>
          </div>
        ))}
      </div>
    </details>
  );
}

export default function App() {
  const root = useRef<HTMLDivElement>(null);
  const pageUrl = `${window.location.pathname}${window.location.search}`;
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [motionDisabled, setMotionDisabled] = useState(false);
  const motion = !reduced && !motionDisabled;
  const [opening, setOpening] = useState(
    () =>
      !window.location.hash &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState<Project | null>(null);
  const [scroll, setScroll] = useState({
    active: "home",
    progress: 0,
    scrolled: false,
  });
  const slider = useProjectSlider(projects.length, motion);
  const { lenis, refresh } = useMotion(
    root,
    !opening,
    motion,
  );
  const blocked = menuOpen || selected !== null || opening;

  useEffect(() => {
    const main = document.getElementById("main");
    let frame = 0;
    const onToggle = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(refresh);
    };
    main?.addEventListener("toggle", onToggle, true);
    return () => {
      cancelAnimationFrame(frame);
      main?.removeEventListener("toggle", onToggle, true);
    };
  }, [refresh]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReduced(mq.matches);
      if (mq.matches) setOpening(false);
    };
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!opening) return;
    const timer = window.setTimeout(() => setOpening(false), 2250);
    return () => clearTimeout(timer);
  }, [opening]);
  useEffect(() => {
    if (!blocked) {
      lenis.current?.start();
      return;
    }
    lenis.current?.stop();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
      lenis.current?.start();
    };
  }, [blocked, lenis]);

  const navigate = useCallback(
    (id: string, immediate = false) => {
      const element = document.getElementById(id);
      if (!element) return;
      const offset =
        id === "about"
          ? window.innerWidth <= 768
            ? 150
            : 235
          : window.innerWidth <= 768
            ? 75
            : 100;
      const target =
        id === "home"
          ? 0
          : element.getBoundingClientRect().top + window.scrollY - offset;
      if (lenis.current)
        lenis.current.scrollTo(target, {
          immediate: immediate || !motion,
          force: true,
        });
      else
        window.scrollTo({
          top: target,
          behavior: immediate || !motion ? "instant" : "smooth",
        });
      history.replaceState(
        history.state,
        "",
        pageUrl,
      );
      element.focus({ preventScroll: true });
    },
    [lenis, motion, pageUrl],
  );
  const navigateRef = useRef(navigate);
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      const sections = sectionIds.flatMap((id) => {
        const element = document.getElementById(id);
        return element
          ? [
              {
                id,
                top:
                  element.getBoundingClientRect().top -
                  (id === "about" ? 140 : 0),
              },
            ]
          : [];
      });
      setScroll({
        active: getActiveSection(
          sections,
          window.innerWidth <= 768 ? 100 : 170,
        ),
        progress: getProgress(
          window.scrollY,
          document.documentElement.scrollHeight,
          window.innerHeight,
        ),
        scrolled: window.scrollY > 15,
      });
      frame = 0;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);
  useEffect(() => {
    const visitHash = () => {
      const id = window.location.hash.slice(1);
      if (!window.location.hash) return;
      history.replaceState(history.state, "", pageUrl);
      if (sectionIds.includes(id)) navigateRef.current(id, true);
    };
    let alive = true;
    void document.fonts.ready.then(() => {
      if (alive) requestAnimationFrame(visitHash);
    });
    window.addEventListener("hashchange", visitHash);
    return () => {
      alive = false;
      window.removeEventListener("hashchange", visitHash);
    };
  }, [pageUrl]);

  return (
    <div ref={root} className={`site ${motion ? "" : "motion-off"}`}>
      <div inert={opening || undefined}>
        <a
          className="skip-link"
          href={pageUrl}
          onClick={(event) => {
            event.preventDefault();
            navigate("about");
          }}
        >
          소개로 바로 가기
        </a>
        <Header
          active={scroll.active}
          progress={scroll.progress}
          scrolled={scroll.scrolled}
          menuOpen={menuOpen}
          onMenuChange={setMenuOpen}
          onNavigate={navigate}
        />
        <main id="main">
          <section
            className="hero"
            id="home"
            tabIndex={-1}
            aria-label="Minhyeok’s Dev Log"
          >
            <h1 className="hero-title">
              <span className="hero-title-line">
                <span>MINHYEOK’S</span>
              </span>
              <span className="hero-title-line">
                <span>
                  DEV LOG<span className="title-period">.</span>
                </span>
              </span>
            </h1>
            <Word className="hero-word" />
            <a
              href={pageUrl}
              className="scroll-cue"
              aria-label="소개 섹션으로 이동"
              onClick={(event) => {
                event.preventDefault();
                navigate("about");
              }}
            >
              <span>SCROLL TO EXPLORE</span>
              <span className="scroll-cue__arrow" aria-hidden="true">
                <svg
                  width="24"
                  height="28"
                  viewBox="0 0 24 28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  focusable="false"
                >
                  <path d="M12 4v20m-6-6 6 6 6-6" />
                </svg>
              </span>
            </a>
          </section>

          <section
            className="about section-shell"
            id="about"
            tabIndex={-1}
            aria-labelledby="about-title"
          >
            <div className="about-panel">
              <div className="about-top">
                <p className="eyebrow">01 / A LITTLE ABOUT ME</p>
                <h2 id="about-title">
                  ABOUT<span className="title-period">.</span>
                </h2>
              </div>
              <div className="about-grid">
                <div className="about-heading">
                  <h3>
                    전체의 흐름을 이해하고,
                    <br />
                    <span>하나의 경험으로 연결합니다.</span>
                  </h3>
                </div>
                <div className="about-copy">
                  <p>{data.profile.description}</p>
                  <AboutStory />
                  <div className="about-links">
                    <a
                      className="pill"
                      href={data.profile.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      GitHub <Arrow diagonal />
                    </a>
                    <a
                      className="pill pill-outline"
                      href={data.profile.blogUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Dev Blog <Arrow diagonal />
                    </a>
                  </div>
                </div>
              </div>
              <div className="about-bottom">
                <div
                  className="phrase-window"
                  aria-label="Understand. Connect. Build."
                >
                  <div className="phrases" aria-hidden="true">
                    <span>Understand.</span>
                    <span>Connect.</span>
                    <span>Build.</span>
                  </div>
                </div>
              </div>
              <div className="principles">
                {data.workPrinciples.map((principle, index) => (
                  <div className="principle" key={principle.title}>
                    <span className="micro-number">0{index + 1}</span>
                    <p>{principle.title}</p>
                  </div>
                ))}
              </div>
            </div>
            <figure className="portrait-wrap">
              <img
                src={data.profile.profileImage}
                alt="파란 하늘 아래 앉아 있는 서민혁"
                width="1440"
                height="1440"
                fetchPriority="high"
              />
              <figcaption>Hi, I'm Minhyeok.</figcaption>
            </figure>
          </section>

          <section
            className="skills section-shell"
            id="skills"
            tabIndex={-1}
            aria-labelledby="skills-title"
          >
            <div className="section-side">
              <p className="eyebrow">02 / WHAT I USE</p>
              <h2 id="skills-title">
                SKILLS<span className="title-period">.</span>
              </h2>
              <p>
                기술을 이해하고,
                <br />
                필요한 곳에 연결합니다.
              </p>
            </div>
            <div className="skills-stack">
              <article className="skill-card skill-card--core">
                <div className="skill-card-heading">
                  <h3>Core stack</h3>
                </div>
                <div className="skill-groups">
                  {data.skillGroups.map((group) => (
                    <div className="skill-group" key={group.title}>
                      <h4>{group.title}</h4>
                      <ul className="skill-tags">
                        {group.primary.map((skill) => (
                          <li key={skill}>{skill}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <details className="experience">
                  <summary>
                    함께 사용하고 연동한 기술 <span aria-hidden="true">+</span>
                  </summary>
                  <dl>
                    {data.skillGroups.map((group) => (
                      <div key={group.title}>
                        <dt>{group.title}</dt>
                        <dd>{group.experience.join(" · ")}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
              </article>
              <article className="skill-card skill-card--practice">
                <div className="skill-card-heading">
                  <h3>In practice</h3>
                </div>
                <ol className="skill-usage">
                  {usage.map(([title, description], index) => (
                    <li key={title}>
                      <span className="micro-number">0{index + 1}</span>
                      <div>
                        <h4>{title}</h4>
                        <p>{description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <a
                  className="text-link"
                  href={pageUrl}
                  onClick={(event) => {
                    event.preventDefault();
                    navigate("projects");
                  }}
                >
                  프로젝트에서 살펴보기 <Arrow />
                </a>
              </article>
            </div>
          </section>

          <section
            className="projects"
            id="projects"
            tabIndex={-1}
            aria-labelledby="projects-title"
          >
            <div className="projects-panel">
              <div className="projects-heading section-shell">
                <div>
                  <p className="eyebrow">03 / THINGS I’VE BUILT</p>
                  <h2 id="projects-title">
                    PROJECTS<span className="title-period">.</span>
                  </h2>
                </div>
                <p>배우고, 만들고, 연결해 온 기록.</p>
              </div>
              <div
                className="project-window"
                {...slider.viewportProps}
                role="region"
                aria-label="프로젝트 목록"
                aria-roledescription={slider.active ? "슬라이드" : undefined}
                aria-describedby={slider.active ? "project-drag-hint" : undefined}
                tabIndex={slider.active ? 0 : undefined}
                data-lenis-prevent-horizontal
              >
                <div className="project-track">
                  {projects.map((project, index) => (
                    <article
                      className={`project-card project-${project.id}`}
                      key={project.id}
                      onFocusCapture={() => slider.reveal(index)}
                    >
                      <button
                        className="project-image"
                        type="button"
                        onClick={() => setSelected(project)}
                        aria-label={`${project.title} 상세 보기`}
                      >
                        <img
                          src={project.image}
                          alt={`${project.title} 실제 서비스 화면`}
                          width="1440"
                          height="900"
                          loading="lazy"
                          draggable={false}
                        />
                        <span className="image-overlay">
                          <span>
                            VIEW PROJECT <Arrow diagonal />
                          </span>
                        </span>
                      </button>
                      <div className="project-info">
                        <div className="project-meta">
                          <span>
                            {String(index + 1).padStart(2, "0")} /{" "}
                            {project.stage}
                          </span>
                          <span>{project.period}</span>
                        </div>
                        <h3>{project.title}</h3>
                        <p className="project-role">
                          {project.cardRoleSummary}
                        </p>
                        <ul className="project-tags">
                          {project.technologies.slice(0, 4).map((tech) => (
                            <li key={tech}>{tech}</li>
                          ))}
                        </ul>
                        <div className="project-actions">
                          <button
                            className="pill"
                            onClick={() => setSelected(project)}
                          >
                            Detail <Arrow diagonal />
                          </button>
                          <a
                            className="pill pill-outline"
                            href={project.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            GitHub <Arrow diagonal />
                          </a>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
              <div className="project-controls" aria-label="프로젝트 이동">
                <span className="project-count">
                  {String(slider.index + 1).padStart(2, "0")}
                  <span> / {String(projects.length).padStart(2, "0")}</span>
                </span>
                <div>
                  {projects.map((project, index) => (
                    <button
                      key={project.id}
                      className={index === slider.index ? "current" : ""}
                      aria-label={`${project.title}로 이동`}
                      aria-current={index === slider.index ? "true" : undefined}
                      onClick={() => slider.goTo(index)}
                    >
                      <span />
                    </button>
                  ))}
                </div>
                <span className="project-scroll-label" id="project-drag-hint">
                  좌우로 드래그 <span aria-hidden="true">↔</span>
                </span>
              </div>
            </div>
          </section>
        </main>

        <footer
          className="contact"
          id="contact"
          tabIndex={-1}
          aria-labelledby="contact-title"
        >
          <div className="contact-content section-shell">
            <p className="eyebrow">04 / SAY HELLO</p>
            <div className="contact-heading">
              <h2 id="contact-title">
                LET’S
                <br />
                CONNECT<span className="title-period">.</span>
              </h2>
              <div className="contact-details">
                <p>
                  함께 나누고 싶은 이야기가 있다면,
                  <br />
                  편하게 연락해 주세요.
                </p>
                <a className="email-link" href={`mailto:${data.profile.email}`}>
                  {data.profile.email} <Arrow diagonal />
                </a>
                <div className="social-links">
                  <a
                    href={data.profile.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub <Arrow diagonal />
                  </a>
                  <a
                    href={data.profile.blogUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Dev Blog <Arrow diagonal />
                  </a>
                </div>
              </div>
            </div>
          </div>
          <Word className="footer-word" />
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} SEO MINHYEOK</span>
            <span>MINHYEOK’S DEV LOG</span>
            <button
              onClick={() => setMotionDisabled((value) => !value)}
              aria-pressed={motionDisabled}
              disabled={reduced}
            >
              {reduced
                ? "모션 줄이기 적용 중"
                : motionDisabled
                  ? "모션 켜기"
                  : "모션 끄기"}{" "}
              <span aria-hidden="true">{motion ? "◉" : "○"}</span>
            </button>
            <button onClick={() => navigate("home")}>
              BACK TO TOP <span aria-hidden="true">↑</span>
            </button>
          </div>
        </footer>
      </div>
      {opening && (
        <div
          className="opening"
          role="dialog"
          aria-modal="true"
          aria-label="MHDL 오프닝"
        >
          <div className="opening-center">
            <div className="opening-word" aria-hidden="true">
              {"MHDL".split("").map((letter, i) => (
                <span key={letter} style={{ "--i": i } as CSSProperties}>
                  {letter}
                </span>
              ))}
            </div>
            <p>MINHYEOK’S DEV LOG</p>
          </div>
        </div>
      )}
      {selected && (
        <ProjectDialog project={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
