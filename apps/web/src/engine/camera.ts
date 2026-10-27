// Camera moves (spec Section 17). The camera is a crop box over the source frame,
// {cx, cy, zoom}, computed as a pure function of output time from all camera items.
import { EASE, clamp, lerp, progress } from "./anim/easing";
import type { TimeMap } from "./timeMap";

export interface CameraItem {
  id: string;
  move: string;
  atWord: string;
  untilWord?: string;
  scale?: number;
  duration?: number;
}
export interface CameraState {
  zoom: number;
  cx: number; // crop center, 0..1 of the frame
  cy: number;
}

export const EXPORT_HEIGHT = 1080;
/** Zooming past the source's extra resolution looks soft. 720p webcam -> 1.15x max. */
export const maxZoom = (sourceHeight: number) => clamp(sourceHeight / EXPORT_HEIGHT, 1.15, 2.0);

export interface TimedCamera extends CameraItem {
  start: number;
  end: number | null;
}

export function timeCamera(items: CameraItem[], map: TimeMap): TimedCamera[] {
  return items
    .map((c) => {
      const s = map.wordOutTime(c.atWord);
      const u = c.untilWord ? map.wordOutTime(c.untilWord) : null;
      return s ? { ...c, start: s.start, end: u ? u.start : null } : null;
    })
    .filter((c): c is TimedCamera => c !== null)
    .sort((a, b) => a.start - b.start);
}

const FACE = { cx: 0.5, cy: 0.42 }; // no face track yet: assume a centered speaker, face in the upper half

export function cameraAt(items: TimedCamera[], t: number, sourceHeight: number): CameraState {
  const cap = maxZoom(sourceHeight);
  let st: CameraState = { zoom: 1, cx: 0.5, cy: 0.5 };
  for (const c of items) {
    if (c.start > t) break;
    const local = t - c.start;
    if (c.move === "punchIn") {
      st = { zoom: Math.min(c.scale ?? 1.2, cap), cx: FACE.cx, cy: FACE.cy };
      if (c.end !== null && t >= c.end) st = { zoom: 1, cx: 0.5, cy: 0.5 };
    } else if (c.move === "punchOut") {
      st = { zoom: 1, cx: 0.5, cy: 0.5 };
    } else if (c.move === "slowPush") {
      const dur = c.duration ?? (c.end !== null ? Math.max(1, c.end - c.start) : 5);
      const target = Math.min(st.zoom * 1.08, cap);
      st = { zoom: lerp(st.zoom, target, progress(local, 0, dur, EASE.move)), cx: lerp(st.cx, FACE.cx, 0.5), cy: lerp(st.cy, FACE.cy, 0.5) };
    } else if (c.move === "reframe") {
      // Slide the speaker toward the left third to make room on the right. Needs a little zoom to have room to move.
      const zoom = Math.max(st.zoom, Math.min(1.12, cap));
      const p = progress(local, 0, 0.4, EASE.move);
      st = { zoom: lerp(st.zoom, zoom, p), cx: lerp(st.cx, 0.62, p), cy: st.cy };
    }
  }
  // Keep the crop inside the frame.
  const half = 0.5 / st.zoom;
  return { zoom: st.zoom, cx: clamp(st.cx, half, 1 - half), cy: clamp(st.cy, half, 1 - half) };
}
