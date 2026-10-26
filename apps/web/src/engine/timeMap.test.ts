import { describe, expect, it } from "vitest";
import { buildTimeMap } from "./timeMap";
import type { Word } from "../types";
import type { KeepRange } from "../plan/types";

const word = (i: number, start: number, end: number): Word => ({
  id: `w${i}`, text: `w${i}`, start, end, isFiller: false, confidence: 1, speechGapAfter: 0,
});
const words = [word(0, 1, 2), word(1, 2, 3), word(2, 5, 6), word(3, 8, 9)];
const k = (from: number, to: number, pad = 0.1): KeepRange => ({ id: `k_w${from}`, fromWord: `w${from}`, toWord: `w${to}`, padStart: pad, padEnd: pad });
const source = { duration: 10 } as never;
const map = (keep: KeepRange[]) => buildTimeMap({ words, keep, source });

describe("timeMap", () => {
  it("empty plan", () => {
    const m = map([]);
    expect(m.duration).toBe(0);
    expect(m.outToSrc(0)).toBeNull();
    expect(m.srcToOut(1)).toBeNull();
  });
  it("single range", () => {
    const m = map([k(0, 1)]);
    expect(m.segments[0]).toMatchObject({ srcStart: 0.9, srcEnd: 3.1, outStart: 0 });
    expect(m.duration).toBeCloseTo(2.2);
    expect(m.outToSrc(0.1)!.src).toBeCloseTo(1.0);
  });
  it("ranges laid end to end, and words in cuts map to null", () => {
    const m = map([k(0, 1), k(3, 3)]);
    expect(m.duration).toBeCloseTo(2.2 + 1.2);
    expect(m.outToSrc(2.3)!.src).toBeCloseTo(7.9 + 0.1);
    expect(m.srcToOut(5.5)).toBeNull(); // w2 is cut
    expect(m.wordOutTime("w2")).toBeNull();
    expect(m.wordOutTime("w3")!.start).toBeCloseTo(2.2 + 0.1);
    expect(m.isKept(2)).toBe(false);
    expect(m.isKept(3)).toBe(true);
  });
  it("padding that would overlap a neighbor is clamped", () => {
    const m = map([k(0, 0, 0.6), k(1, 1, 0.6)]);
    expect(m.segments[1].srcStart).toBeGreaterThanOrEqual(m.segments[0].srcEnd);
  });
  it("clamps to the video edges", () => {
    const m = buildTimeMap({ words: [word(0, 0.05, 9.95)], keep: [k(0, 0, 0.5)], source });
    expect(m.segments[0].srcStart).toBe(0);
    expect(m.segments[0].srcEnd).toBe(10);
  });
  it("last frame and times beyond the end", () => {
    const m = map([k(0, 1)]);
    expect(m.outToSrc(m.duration)!.src).toBeCloseTo(3.1);
    expect(m.outToSrc(m.duration + 1)).toBeNull();
    expect(m.outToSrc(-0.1)).toBeNull();
  });
  it("round-trips", () => {
    const m = map([k(0, 1), k(2, 2), k(3, 3)]);
    for (const t of [0.05, 1.5, 2.25, 3.0, 4.1]) expect(m.srcToOut(m.outToSrc(t)!.src)).toBeCloseTo(t);
  });
  it("ignores broken ranges instead of crashing", () => {
    const m = map([{ id: "bad", fromWord: "w9", toWord: "w1", padStart: 0, padEnd: 0 }, k(0, 0)]);
    expect(m.segments).toHaveLength(1);
  });
  it("original mode is one segment", () => {
    const m = buildTimeMap({ words, keep: [], source }, { ignoreCuts: true });
    expect(m.duration).toBe(10);
    expect(m.srcToOut(5.5)).toBe(5.5);
  });
});
