import { describe, expect, it } from "vitest";
import { cameraAt, maxZoom, type TimedCamera } from "./camera";

const c = (move: string, start: number, end: number | null = null, scale?: number): TimedCamera =>
  ({ id: move + start, move, atWord: "w0", start, end, scale });

describe("camera", () => {
  it("caps zoom for low-resolution sources", () => {
    expect(maxZoom(720)).toBe(1.15);
    expect(maxZoom(2160)).toBe(2);
    expect(cameraAt([c("punchIn", 1, null, 1.3)], 2, 720).zoom).toBe(1.15);
  });
  it("punch in is instant and punch out returns to full frame", () => {
    const items = [c("punchIn", 1), c("punchOut", 3)];
    expect(cameraAt(items, 0.5, 2160).zoom).toBe(1);
    expect(cameraAt(items, 1, 2160).zoom).toBe(1.2);
    expect(cameraAt(items, 3.1, 2160).zoom).toBe(1);
  });
  it("punch in ends at its untilWord", () => {
    expect(cameraAt([c("punchIn", 1, 2)], 2.5, 2160).zoom).toBe(1);
  });
  it("slow push eases in and the crop stays inside the frame", () => {
    const items = [c("slowPush", 0, 5)];
    const mid = cameraAt(items, 2.5, 2160);
    expect(mid.zoom).toBeGreaterThan(1);
    expect(mid.zoom).toBeLessThan(1.08);
    const s = cameraAt([c("reframe", 0)], 1, 2160);
    expect(s.cx + 0.5 / s.zoom).toBeLessThanOrEqual(1 + 1e-9);
  });
});
