// Caption chunking (spec Section 16), in OUTPUT time, for the kept words only.
// New chunk at sentence punctuation, at a pause > 0.3 s, or at the style's word/character limit.
import type { TimeMap } from "../timeMap";
import type { Word } from "../../types";

export interface CaptionWord {
  id: string;
  text: string;
  start: number; // output time
  end: number;
}
export interface CaptionChunk {
  start: number;
  end: number; // when it disappears
  words: CaptionWord[];
  text: string;
}

const ENDS_CLAUSE = /[.!?;:,]["')\]]?$/;

export function chunkCaptions(words: Word[], map: TimeMap, maxWords: number, maxChars = 42): CaptionChunk[] {
  const chunks: CaptionChunk[] = [];
  let cur: CaptionWord[] = [];
  const flush = () => {
    if (cur.length) chunks.push({ start: cur[0].start, end: cur[cur.length - 1].end, words: cur, text: cur.map((w) => w.text).join(" ") });
    cur = [];
  };
  for (let i = 0; i < words.length; i++) {
    if (!map.isKept(i)) continue;
    const t = map.wordOutTime(words[i].id);
    if (!t) continue;
    const w = { id: words[i].id, text: words[i].text.trim(), start: t.start, end: t.end };
    if (cur.length) {
      const prev = cur[cur.length - 1];
      const chars = cur.reduce((n, x) => n + x.text.length + 1, 0) + w.text.length;
      if (ENDS_CLAUSE.test(prev.text) || w.start - prev.end > 0.3 || cur.length >= maxWords || chars > maxChars) flush();
    }
    cur.push(w);
  }
  flush();
  // Hold each chunk a little after its last word (easier to read), but never past the next chunk.
  for (let i = 0; i < chunks.length; i++) {
    const next = chunks[i + 1]?.start ?? Infinity;
    chunks[i].end = Math.min(next, chunks[i].end + 0.5);
  }
  return chunks;
}

/** The chunk on screen at output time t (binary search), or null. */
export function chunkAt(chunks: CaptionChunk[], t: number): CaptionChunk | null {
  let lo = 0;
  let hi = chunks.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (t < chunks[mid].start) hi = mid - 1;
    else if (t >= chunks[mid].end) lo = mid + 1;
    else return chunks[mid];
  }
  return null;
}
