import { describe, expect, it } from "vitest";
import {
  getProgress,
  getActiveSection,
  getDragTargetIndex,
  wrapIndex,
} from "./navigation";

describe("document navigation", () => {
  it("keeps the progress gauge finite on short pages and clamps elastic scrolling", () => {
    expect(getProgress(0, 600, 900)).toBe(0);
    expect(getProgress(-20, 2000, 1000)).toBe(0);
    expect(getProgress(500, 2000, 1000)).toBe(0.5);
    expect(getProgress(1100, 2000, 1000)).toBe(1);
  });
  it("keeps projects active until the contact section reaches the header", () => {
    const sections = [
      { id: "home", top: -6000 },
      { id: "projects", top: -4000 },
      { id: "contact", top: 500 },
    ];
    expect(getActiveSection(sections, 170)).toBe("projects");
    expect(
      getActiveSection(
        [
          { id: "home", top: 0 },
          { id: "about", top: 700 },
        ],
        170,
      ),
    ).toBe("home");
    expect(
      getActiveSection([...sections, { id: "contact", top: 160 }], 170),
    ).toBe("contact");
  });
  it("advances a deliberate short drag but ignores small pointer movement", () => {
    expect(getDragTargetIndex(2, 2, 90, 6)).toBe(3);
    expect(getDragTargetIndex(2, 2, -90, 6)).toBe(1);
    expect(getDragTargetIndex(2, 2, 12, 6)).toBe(2);
  });
  it("keeps long drags at the nearest slide and stops at either end", () => {
    expect(getDragTargetIndex(0, 3, 2500, 6)).toBe(3);
    expect(getDragTargetIndex(5, 2, -2500, 6)).toBe(2);
    expect(getDragTargetIndex(0, 0, -100, 6)).toBe(0);
    expect(getDragTargetIndex(5, 5, 100, 6)).toBe(5);
    expect(getDragTargetIndex(0, 0, 100, 1)).toBe(0);
  });
  it("wraps gallery navigation in either direction, including a single image", () => {
    expect(wrapIndex(-1, 4)).toBe(3);
    expect(wrapIndex(4, 4)).toBe(0);
    expect(wrapIndex(5, 1)).toBe(0);
    expect(wrapIndex(0, 0)).toBe(0);
  });
});
