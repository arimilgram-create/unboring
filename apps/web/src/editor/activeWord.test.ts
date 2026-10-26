import { describe, expect, it } from "vitest";
import { activeWordIndex, formatTime } from "./activeWord";
import type { Word } from "../types";

const w = (id: number, start: number, end: number): Word => ({
  id: `w${id}`, text: "x", start, end, isFiller: false, confidence: 1, speechGapAfter: 0,
});
const words = [w(0, 0.1, 0.4), w(1, 0.4, 0.9), w(2, 1.5, 2.0)];

describe("activeWordIndex", () => {
  it("finds the word at a time", () => {
    expect(activeWordIndex(words, 0.2)).toBe(0);
    expect(activeWordIndex(words, 0.4)).toBe(1); // a word's end belongs to the next word
    expect(activeWordIndex(words, 1.99)).toBe(2);
  });
  it("returns -1 in gaps, before the start and after the end", () => {
    expect(activeWordIndex(words, 0.0)).toBe(-1);
    expect(activeWordIndex(words, 1.0)).toBe(-1);
    expect(activeWordIndex(words, 5)).toBe(-1);
    expect(activeWordIndex([], 1)).toBe(-1);
  });
});

describe("formatTime", () => {
  it("formats minutes and seconds", () => {
    expect(formatTime(0)).toBe("0:00.00");
    expect(formatTime(75.5)).toBe("1:15.50");
  });
});
