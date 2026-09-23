import { useEffect, useId, useRef, type MouseEvent } from "react";
import "./Header.css";

type HeaderProps = {
  active: string;
  progress: number;
  scrolled: boolean;
  menuOpen: boolean;
  onMenuChange: (open: boolean) => void;
  onNavigate: (id: string) => void;
};

const navigation = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "contact", label: "Contact" },
];

export function Header({
  active,
  progress,
  scrolled,
  menuOpen,
  onMenuChange,
  onNavigate,
}: HeaderProps) {
  const pageUrl = `${window.location.pathname}${window.location.search}`;
  const dialogId = useId();
  const dialogTitleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const desktopNavRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const pendingNavigationRef = useRef<string | null>(null);
  const navigationFrameRef = useRef<number | null>(null);
  const safeProgress = Number.isFinite(progress)
    ? Math.min(1, Math.max(0, progress))
    : 0;

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1081px)");
    const closeOnDesktop = () => {
      if (desktopQuery.matches) onMenuChange(false);
    };

    closeOnDesktop();
    desktopQuery.addEventListener("change", closeOnDesktop);
    return () => desktopQuery.removeEventListener("change", closeOnDesktop);
  }, [onMenuChange]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (menuOpen && window.matchMedia("(max-width: 1080px)").matches) {
      if (!dialog.open) {
        returnFocusRef.current =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [menuOpen]);

  useEffect(
    () => () => {
      if (navigationFrameRef.current !== null) {
        window.cancelAnimationFrame(navigationFrameRef.current);
      }
    },
    [],
  );

  const navigate = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    if (dialogRef.current?.open) {
      pendingNavigationRef.current = id;
      onMenuChange(false);
      return;
    }

    onMenuChange(false);
    onNavigate(id);
  };

  const handleDialogClose = () => {
    // An earlier close event must not dismiss a dialog that has already reopened.
    if (dialogRef.current?.open) return;
    if (menuOpen) onMenuChange(false);

    const pendingId = pendingNavigationRef.current;
    if (pendingId !== null) {
      pendingNavigationRef.current = null;
      returnFocusRef.current = null;
      // Let the parent release its scroll lock before focusing and scrolling the section.
      navigationFrameRef.current = window.requestAnimationFrame(() => {
        navigationFrameRef.current = null;
        onNavigate(pendingId);
      });
      return;
    }

    const previousTarget = returnFocusRef.current;
    const desktopTarget = desktopNavRef.current?.querySelector<HTMLElement>(
      '[aria-current="location"]',
    );
    const focusTarget = window.matchMedia("(min-width: 1081px)").matches
      ? (desktopTarget ?? logoRef.current)
      : previousTarget?.isConnected &&
          previousTarget.getClientRects().length > 0
        ? previousTarget
        : menuButtonRef.current;

    focusTarget?.focus({ preventScroll: true });
    returnFocusRef.current = null;
  };

  return (
    <>
      <header
        className={`mhdl-header${scrolled ? " mhdl-header--scrolled" : ""}`}
      >
        <div className="mhdl-header__inner">
          <div className="mhdl-header__identity">
            <a
              ref={logoRef}
              className="mhdl-header__logo"
              href={pageUrl}
              aria-label="MHDL, 처음으로"
              onClick={(event) => navigate(event, "home")}
            >
              MHDL<span aria-hidden="true">.</span>
            </a>
            <div className="mhdl-header__progress" aria-hidden="true">
              <span className="mhdl-header__progress-track">
                <span
                  className="mhdl-header__progress-fill"
                  style={{ transform: `scaleX(${safeProgress})` }}
                />
              </span>
              <span className="mhdl-header__progress-label">Dev Log</span>
            </div>
          </div>

          <nav
            ref={desktopNavRef}
            className="mhdl-header__nav"
            aria-label="주요 메뉴"
          >
            {navigation.map(({ id, label }) => (
              <a
                key={id}
                href={pageUrl}
                className="mhdl-header__link"
                aria-current={active === id ? "location" : undefined}
                onClick={(event) => navigate(event, id)}
              >
                {label}
              </a>
            ))}
          </nav>

          <button
            ref={menuButtonRef}
            className="mhdl-header__menu-button"
            type="button"
            aria-label="메뉴 열기"
            aria-controls={dialogId}
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            onClick={() => onMenuChange(true)}
          >
            <span className="mhdl-header__menu-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      </header>

      <dialog
        ref={dialogRef}
        id={dialogId}
        className="mhdl-menu"
        aria-labelledby={dialogTitleId}
        onCancel={(event) => {
          event.preventDefault();
          onMenuChange(false);
        }}
        onClose={handleDialogClose}
      >
        <h2 id={dialogTitleId} className="mhdl-header__sr-only">
          사이트 메뉴
        </h2>
        <div className="mhdl-menu__top">
          <a
            className="mhdl-header__logo"
            href={pageUrl}
            aria-label="MHDL, 처음으로"
            onClick={(event) => navigate(event, "home")}
          >
            MHDL<span aria-hidden="true">.</span>
          </a>
          <button
            className="mhdl-header__menu-button mhdl-header__menu-button--close"
            type="button"
            aria-label="메뉴 닫기"
            autoFocus
            onClick={() => onMenuChange(false)}
          >
            <span className="mhdl-header__menu-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>

        <div className="mhdl-menu__body" data-lenis-prevent>
          <nav className="mhdl-menu__nav" aria-label="모바일 주요 메뉴">
            {navigation.map(({ id, label }) => (
              <a
                key={id}
                href={pageUrl}
                className="mhdl-menu__link"
                aria-current={active === id ? "location" : undefined}
                onClick={(event) => navigate(event, id)}
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="mhdl-menu__footer">
            <span className="mhdl-menu__footer-label">Let’s connect</span>
            <a href="mailto:tjalsgur328@gmail.com">tjalsgur328@gmail.com</a>
            <a
              href="https://github.com/minhyeok328"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub <span aria-hidden="true">↗</span>
              <span className="mhdl-header__sr-only"> (새 탭)</span>
            </a>
          </div>
        </div>
      </dialog>
    </>
  );
}
