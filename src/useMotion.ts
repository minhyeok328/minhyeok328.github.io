import { useCallback, useLayoutEffect, useRef, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

export function useMotion(
  root: RefObject<HTMLDivElement | null>,
  ready: boolean,
  enabled: boolean,
) {
  const lenis = useRef<Lenis | null>(null);
  const refresh = useCallback(() => ScrollTrigger.refresh(), []);
  useLayoutEffect(() => {
    if (!ready || !root.current || !enabled) return;
    const mm = gsap.matchMedia();
    mm.add(
      "(prefers-reduced-motion: no-preference)",
      () => {
        gsap.from(".hero-title-line span", {
          yPercent: 110,
          duration: 0.85,
          stagger: 0.12,
          ease: "power3.out",
        });
        gsap.from(".hero .letter-enter", {
          y: 30,
          opacity: 0,
          duration: 0.7,
          stagger: 0.13,
          ease: "power2.out",
        });
        gsap.from(".portrait-wrap", {
          y: 130,
          opacity: 0,
          scrollTrigger: {
            trigger: ".portrait-wrap",
            start: "top 90%",
            end: "top 52%",
            scrub: 0.8,
          },
        });
        gsap.from(".about-links > *", {
          x: 60,
          opacity: 0,
          stagger: 0.12,
          scrollTrigger: {
            trigger: ".about-links",
            start: "top 95%",
            end: "top 78%",
            scrub: 0.5,
          },
        });
      },
      root,
    );
    mm.add(
      "(min-width: 1081px) and (min-height: 680px) and (prefers-reduced-motion: no-preference)",
      () => {
        const smooth = new Lenis({
          duration: 1.2,
          smoothWheel: true,
          anchors: false,
        });
        lenis.current = smooth;
        const tick = (time: number) => smooth.raf(time * 1000);
        smooth.on("scroll", ScrollTrigger.update);
        gsap.ticker.add(tick);

        const scatter = [
          { x: -110, y: 240, rotation: 18 },
          { x: -25, y: 160, rotation: -12 },
          { x: 75, y: 220, rotation: -25 },
          { x: 60, y: 380, rotation: 18 },
        ];
        gsap.utils
          .toArray<HTMLElement>(".hero .letter")
          .forEach((letter, index) => {
            gsap.to(letter, {
              ...scatter[index],
              ease: "none",
              scrollTrigger: {
                trigger: ".hero",
                start: "top top",
                end: "bottom top",
                scrub: 0.3,
              },
            });
          });
        gsap.fromTo(
          ".skill-card--core",
          { filter: "brightness(1)" },
          {
            scale: 0.9,
            rotateX: -10,
            filter: "brightness(.96)",
            transformOrigin: "50% 0%",
            ease: "none",
            scrollTrigger: {
              trigger: ".skill-card--practice",
              start: "top 85%",
              end: "top 150px",
              scrub: 1,
            },
          },
        );

        gsap.utils
          .toArray<HTMLElement>(".footer-word .letter")
          .forEach((letter, index) => {
            gsap.fromTo(
              letter,
              { y: 70 + index * 14, rotation: [10, -7, 8, -10][index] },
              {
                y: -20,
                rotation: [0, 4, -4, 2][index],
                ease: "none",
                scrollTrigger: {
                  trigger: ".contact",
                  start: "top 80%",
                  end: "bottom bottom",
                  scrub: 1,
                },
              },
            );
          });
        return () => {
          gsap.ticker.remove(tick);
          smooth.destroy();
          lenis.current = null;
        };
      },
      root,
    );
    let alive = true;
    void document.fonts.ready.then(() => {
      if (alive) ScrollTrigger.refresh();
    });
    return () => {
      alive = false;
      mm.revert();
    };
  }, [root, ready, enabled]);
  return { lenis, refresh };
}
