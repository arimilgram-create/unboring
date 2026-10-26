import { describe, expect, it } from "vitest";
import { chunkAt, chunkCaptions } from "./chunk";
import { buildTimeMap } from "../timeMap";
import type { Word } from "../../types";

const mk = (texts: string[], gapAt = -1): Word[] => {
  let t = 0;
  return texts.map((text, i) => {
    if (i === gapAt) t += 0.6;
    const w = { id: `w${i}`, text, start: t, end: t + 0.2, isFiller: false, confidence: 1, speechGapAfter: 0 };
    t += 0.25;
    return w;
  });
};
const all = (words: Word[]) =>
  buildTimeMap({ words, keep: [{ id: "k", fromWord: "w0", toWord: `w${words.length - 1}`, padStart: 0, padEnd: 0 }], source: { duration: 100 } as never });

describe("chunkCaptions", () => {
  it("breaks at punctuation, pauses and the word limit", () => {
    const words = mk(["We", "the", "People,", "in", "Order", "to", "form", "a", "more"], 7);
    const chunks = chunkCaptions(words, all(words), 3);
    expect(chunks.map((c) => c.text)).toEqual(["We the People,", "in Order to", "form", "a more"]);
  });
  it("respects the character limit", () => {
    const words = mk(["extraordinarily", "unconstitutional", "representatives", "x"]);
    expect(chunkCaptions(words, all(words), 10, 42).every((c) => c.text.length <= 42)).toBe(true);
  });
  it("skips cut words and finds the chunk on screen", () => {
    const words = mk(["a", "b", "c", "d"]);
    const map = buildTimeMap({ words, keep: [{ id: "k", fromWord: "w2", toWord: "w3", padStart: 0, padEnd: 0 }], source: { duration: 9 } as never });
    const chunks = chunkCaptions(words, map, 4);
    expect(chunks.map((c) => c.text)).toEqual(["c d"]);
    expect(chunks[0].start).toBeCloseTo(0);
    expect(chunkAt(chunks, 0.1)?.text).toBe("c d");
    expect(chunkAt(chunks, 5)).toBeNull();
  });
});
