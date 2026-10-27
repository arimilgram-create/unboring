import { ICONS } from "../icons";
import { EASE, clamp, progress, TIMING } from "../anim/easing";

export type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export interface Theme {
  font: string; // family
  card: string;
  text: string;
  muted: string;
  accent: string;
  accentInk: string;
  radius: number; // fraction of output height
}

export const THEMES: Record<string, Theme> = {
  explainer: {
    font: '"Segoe UI", system-ui, -apple-system, sans-serif',
    card: "rgba(14,15,17,0.9)",
    text: "#ffffff",
    muted: "#c9c9c4",
    accent: "#ffd23f",
    accentInk: "#1a1500",
    radius: 0.018,
  },
};

export interface LocalTime {
  t: number; // seconds since the graphic appeared
  duration: number; // total seconds on screen
}

/** Enter progress (0→1) and exit fade (1→0) for a graphic's lifetime. */
export function life(local: LocalTime, enter = TIMING.card, ease = EASE.enter) {
  const inP = progress(local.t, 0, enter, ease);
  const outP = 1 - progress(local.t, local.duration - TIMING.exit, TIMING.exit, EASE.exit);
  return { in: inP, out: clamp(outP), alpha: clamp(Math.min(progress(local.t, 0, enter * 0.6, EASE.linear), outP)) };
}

export function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

const wrapCache = new Map<string, string[]>();
/** Word-wrap text to a width. Cached, because templates draw every frame. */
export function wrap(ctx: Ctx, text: string, maxW: number): string[] {
  const key = `${ctx.font}|${Math.round(maxW)}|${text}`;
  const hit = wrapCache.get(key);
  if (hit) return hit;
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  if (wrapCache.size > 2000) wrapCache.clear();
  wrapCache.set(key, lines);
  return lines;
}

const iconCache = new Map<string, { kind: string; a: Record<string, number | string>; path?: Path2D }[]>();
/** Draws a Lucide icon (24×24 grid, 2px round strokes) centered at x,y with the given size. */
export function drawIcon(ctx: Ctx, name: string, x: number, y: number, size: number, color: string) {
  let parts = iconCache.get(name);
  if (!parts) {
    parts = (ICONS[name] ?? ICONS.Sparkles).map(([kind, a]) => ({ kind, a, path: kind === "path" ? new Path2D(String(a.d)) : undefined }));
    iconCache.set(name, parts);
  }
  ctx.save();
  ctx.translate(x - size / 2, y - size / 2);
  ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const p of parts) {
    const n = (k: string) => Number(p.a[k] ?? 0);
    if (p.path) ctx.stroke(p.path);
    else if (p.kind === "circle") {
      ctx.beginPath();
      ctx.arc(n("cx"), n("cy"), n("r"), 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.kind === "rect") {
      ctx.beginPath();
      ctx.roundRect(n("x"), n("y"), n("width"), n("height"), n("rx"));
      ctx.stroke();
    } else if (p.kind === "line") {
      ctx.beginPath();
      ctx.moveTo(n("x1"), n("y1"));
      ctx.lineTo(n("x2"), n("y2"));
      ctx.stroke();
    }
  }
  ctx.restore();
}
