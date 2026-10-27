import { describe, expect, it } from "vitest";
import { EASE, cubicBezier, progress, spring, stagger } from "./easing";

describe("easing", () => {
  it("endpoints are exactly 0 and 1", () => {
    for (const e of Object.values(EASE)) {
      expect(e(0)).toBe(0);
      expect(e(1)).toBe(1);
    }
  });
  it("matches CSS ease-in-out-ish shape and is monotonic for non-overshooting curves", () => {
    const f = cubicBezier(0.65, 0, 0.35, 1);
    expect(f(0.5)).toBeCloseTo(0.5, 3);
    let prev = 0;
    for (let p = 0; p <= 1; p += 0.01) {
      expect(f(p)).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = f(p);
    }
  });
  it("playful overshoots but stays bounded", () => {
    const max = Math.max(...Array.from({ length: 101 }, (_, i) => EASE.playful(i / 100)));
    expect(max).toBeGreaterThan(1);
    expect(max).toBeLessThan(1.2);
  });
  it("progress clamps before and after", () => {
    expect(progress(-1, 0, 1)).toBe(0);
    expect(progress(5, 0, 1)).toBe(1);
  });
  it("spring settles to 1", () => {
    expect(spring(0)).toBe(0);
    expect(spring(3)).toBeCloseTo(1, 3);
  });
  it("stagger total never exceeds the cap", () => {
    expect(stagger(19, 20, 0.08, 0.7)).toBeCloseTo(0.7);
    expect(stagger(2, 3, 0.06)).toBeCloseTo(0.12);
  });
});
