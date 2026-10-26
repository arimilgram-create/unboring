// Output time <-> source time (spec Section 10).
// Source time = seconds into the original recording. Output time = seconds into the edited video.
// Each keep range covers [start(fromWord) - padStart, end(toWord) + padEnd] in source time;
// output time is those ranges laid end to end.
import type { EditPlan, ID } from "../plan/types";

export interface Segment {
  keepId: ID;
  srcStart: number;
  srcEnd: number;
  outStart: number;
  outEnd: number;
}

export interface TimeMap {
  segments: Segment[];
  duration: number; // output duration
  outToSrc(t: number): { seg: Segment; index: number; src: number } | null;
  srcToOut(s: number): number | null; // null = inside a cut
  wordOutTime(wordId: string): { start: number; end: number } | null; // null = word is cut
  isKept(wordIndex: number): boolean;
}

/** Find the last segment whose `key` start is <= t (binary search). */
function findSeg(segs: Segment[], t: number, key: "outStart" | "srcStart"): number {
  let lo = 0;
  let hi = segs.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (segs[mid][key] <= t) {
      ans = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return ans;
}

export function buildTimeMap(plan: Pick<EditPlan, "words" | "keep" | "source">, opts: { ignoreCuts?: boolean } = {}): TimeMap {
  const { words, source } = plan;
  const index = new Map(words.map((w, i) => [w.id, i]));
  const segments: Segment[] = [];
  const kept = new Uint8Array(words.length);

  if (opts.ignoreCuts) {
    segments.push({ keepId: "original", srcStart: 0, srcEnd: source.duration, outStart: 0, outEnd: source.duration });
    kept.fill(1);
  } else {
    const keep = [...plan.keep].sort((a, b) => (index.get(a.fromWord) ?? 0) - (index.get(b.fromWord) ?? 0));
    let out = 0;
    let prevEnd = 0;
    for (const k of keep) {
      const a = index.get(k.fromWord);
      const b = index.get(k.toWord);
      if (a === undefined || b === undefined || b < a) continue; // invalid range: skip, never crash
      const srcStart = Math.max(prevEnd, words[a].start - k.padStart, 0);
      const srcEnd = Math.min(source.duration || Infinity, words[b].end + k.padEnd);
      if (srcEnd <= srcStart) continue;
      segments.push({ keepId: k.id, srcStart, srcEnd, outStart: out, outEnd: out + (srcEnd - srcStart) });
      out += srcEnd - srcStart;
      prevEnd = srcEnd;
      for (let i = a; i <= b; i++) kept[i] = 1;
    }
  }
  const duration = segments.length ? segments[segments.length - 1].outEnd : 0;

  const outToSrc = (t: number) => {
    if (!segments.length || t < 0 || t > duration) return null;
    let i = findSeg(segments, t, "outStart");
    if (i < 0) i = 0;
    const seg = segments[i];
    return { seg, index: i, src: seg.srcStart + Math.min(t - seg.outStart, seg.srcEnd - seg.srcStart) };
  };
  const srcToOut = (s: number) => {
    const i = findSeg(segments, s, "srcStart");
    if (i < 0) return null;
    const seg = segments[i];
    if (s > seg.srcEnd) return null;
    return seg.outStart + (s - seg.srcStart);
  };
  const wordOutTime = (id: string) => {
    const i = index.get(id);
    if (i === undefined || !kept[i]) return null;
    const start = srcToOut(words[i].start);
    const end = srcToOut(words[i].end);
    return start === null || end === null ? null : { start, end };
  };
  return { segments, duration, outToSrc, srcToOut, wordOutTime, isKept: (i) => kept[i] === 1 };
}

// Memoize per plan object (plans are never mutated; every edit makes a new plan).
const cache = new WeakMap<object, TimeMap>();
export function timeMapFor(plan: EditPlan): TimeMap {
  let m = cache.get(plan);
  if (!m) cache.set(plan, (m = buildTimeMap(plan)));
  return m;
}
