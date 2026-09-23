import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type WheelEvent,
} from "react";
import gsap from "gsap";
import { getDragTargetIndex } from "./lib/navigation";

function isHorizontal(viewport: HTMLDivElement) {
  return viewport.scrollWidth > viewport.clientWidth + 1;
}

function nearestSlide(viewport: HTMLDivElement) {
  const center = viewport.getBoundingClientRect().left + viewport.clientWidth / 2;
  let nearest = 0;
  let distance = Infinity;
  Array.from(viewport.querySelectorAll<HTMLElement>(".project-card")).forEach(
    (card, index) => {
      const rect = card.getBoundingClientRect();
      const delta = Math.abs(rect.left + rect.width / 2 - center);
      if (delta < distance) {
        nearest = index;
        distance = delta;
      }
    },
  );
  return nearest;
}

export function useProjectSlider(count: number, motion: boolean) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [active, setActive] = useState(false);
  const currentIndex = useRef(0);
  const suppressClick = useRef(false);
  const settling = useRef<gsap.core.Tween | null>(null);
  const drag = useRef<{
    pointerId: number;
    x: number;
    y: number;
    left: number;
    index: number;
    moved: boolean;
  } | null>(null);

  const stopSettling = useCallback(() => {
    settling.current?.kill();
    settling.current = null;
  }, []);

  const goTo = useCallback((target: number, immediate = false) => {
    const viewport = viewportRef.current;
    stopSettling();
    if (!viewport) return;
    if (!isHorizontal(viewport)) {
      delete viewport.dataset.settling;
      return;
    }
    const cards = viewport.querySelectorAll<HTMLElement>(".project-card");
    const card = cards[Math.max(0, Math.min(cards.length - 1, target))];
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const left = Math.max(0, Math.min(
      viewport.scrollWidth - viewport.clientWidth,
      viewport.scrollLeft + rect.left - viewport.getBoundingClientRect().left
        - (viewport.clientWidth - rect.width) / 2,
    ));
    // Keep native snap out of the way until our single settling motion finishes.
    viewport.dataset.settling = "true";
    if (immediate || !motion || Math.abs(left - viewport.scrollLeft) < 1) {
      viewport.scrollLeft = left;
      delete viewport.dataset.settling;
      return;
    }
    settling.current = gsap.to(viewport, {
      scrollLeft: left,
      duration: 0.75,
      ease: "power2.out",
      onComplete: () => {
        settling.current = null;
        delete viewport.dataset.settling;
      },
    });
  }, [motion, stopSettling]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const resize = () => {
      const horizontal = isHorizontal(viewport);
      setActive(horizontal);
      goTo(currentIndex.current, true);
      delete viewport.dataset.dragging;
      drag.current = null;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(viewport);
    if (viewport.firstElementChild) observer.observe(viewport.firstElementChild);
    resize();
    return () => {
      observer.disconnect();
      stopSettling();
      delete viewport.dataset.settling;
      delete viewport.dataset.dragging;
      drag.current = null;
    };
  }, [goTo, stopSettling]);

  const onScroll = () => {
    const viewport = viewportRef.current;
    if (!viewport || !isHorizontal(viewport)) return;
    currentIndex.current = nearestSlide(viewport);
    setIndex(currentIndex.current);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    suppressClick.current = false;
    if (event.button !== 0 || !event.isPrimary ||
      !isHorizontal(event.currentTarget)) return;
    stopSettling();
    if (event.pointerType === "touch") {
      delete event.currentTarget.dataset.settling;
      return;
    }
    event.currentTarget.dataset.settling = "true";
    drag.current = {
      pointerId: event.pointerId, x: event.clientX, y: event.clientY,
      left: event.currentTarget.scrollLeft,
      index: nearestSlide(event.currentTarget), moved: false,
    };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start || start.pointerId !== event.pointerId) return;
    const dx = event.clientX - start.x;
    if (!start.moved) {
      if (Math.abs(dx) < 8) return;
      if (Math.abs(event.clientY - start.y) > Math.abs(dx)) {
        drag.current = null;
        delete event.currentTarget.dataset.settling;
        return;
      }
      start.moved = true;
      event.currentTarget.dataset.dragging = "true";
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    event.preventDefault();
    event.currentTarget.scrollLeft = start.left - dx;
  };

  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start || start.pointerId !== event.pointerId) return;
    const nearest = nearestSlide(event.currentTarget);
    drag.current = null;
    delete event.currentTarget.dataset.dragging;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (!start.moved) {
      delete event.currentTarget.dataset.settling;
      return;
    }
    suppressClick.current = true;
    goTo(event.type === "pointerup"
      ? getDragTargetIndex(start.index, nearest, start.x - event.clientX, count)
      : nearest);
  };

  const reveal = (target: number) => {
    if (drag.current) return;
    const viewport = viewportRef.current;
    const card = viewport?.querySelectorAll(".project-card")[target];
    if (!viewport || !card || !isHorizontal(viewport)) return;
    const bounds = viewport.getBoundingClientRect();
    const rect = card.getBoundingClientRect();
    if (rect.left < bounds.left || rect.right > bounds.right) goTo(target, true);
  };

  const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (!suppressClick.current || event.detail === 0) return;
    suppressClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isHorizontal(event.currentTarget) || event.altKey || event.ctrlKey || event.metaKey) return;
    const target = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: count - 1 }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    goTo(target);
  };

  const onWheelCapture = (event: WheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    stopSettling();
    delete event.currentTarget.dataset.settling;
  };

  return {
    index, active, goTo, reveal,
    viewportProps: {
      ref: viewportRef, onScroll, onPointerDown, onPointerMove,
      onPointerUp: finishDrag, onPointerCancel: finishDrag,
      onLostPointerCapture: finishDrag,
      onPointerLeave: (event: PointerEvent<HTMLDivElement>) => {
        if (drag.current && !drag.current.moved) {
          drag.current = null;
          delete event.currentTarget.dataset.settling;
        }
      },
      onClickCapture, onKeyDown, onWheelCapture,
      onDragStart: (event: MouseEvent<HTMLDivElement>) => {
        if (isHorizontal(event.currentTarget)) event.preventDefault();
      },
    },
  };
}
