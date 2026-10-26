import type { Word } from "../types";

/**
 * Index of the word being spoken at source time t, or -1 if t is in a gap.
 * Binary search, because a 20-minute video has ~3,000 words and this runs every frame.
 */
export function activeWordIndex(words: Word[], t: number): number {
  let lo = 0;
  let hi = words.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const w = words[mid];
    if (t < w.start) hi = mid - 1;
    else if (t >= w.end) lo = mid + 1;
    else return mid;
  }
  return -1;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  return `${m}:${s.toFixed(2).padStart(5, "0")}`;
}
