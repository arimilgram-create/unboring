// THE drawing function (spec Section 14.1). Preview and export both call this, so they match.
// Rules: pure function of (plan, t); never fetches, never awaits, no big allocations per frame.
// Everything time-dependent is prepared once per plan in prepareAssets().
import catalog from "../../../../packages/shared/templates.json";
import type { EditPlan } from "../plan/types";
import { cameraAt, timeCamera, type CameraItem, type TimedCamera } from "./camera";
import { chunkAt, chunkCaptions, type CaptionChunk } from "./captions/chunk";
import { TEMPLATES } from "./templates/library";
import { THEMES, type Ctx } from "./templates/helpers";
import { timeMapFor, type TimeMap } from "./timeMap";

export interface FrameSources {
  video: CanvasImageSource | null; // the source frame for this moment (already decoded)
  videoWidth: number;
  videoHeight: number;
  mask?: CanvasImageSource | null; // SAM speaker mask (when available)
}

export interface GraphicItem {
  id: string;
  template: string;
  layer: "behind" | "over" | "fullscreen";
  atWord: string;
  untilWord: string;
  props: Record<string, unknown>;
}

interface TimedGraphic {
  item: GraphicItem;
  start: number;
  end: number;
  side: "left" | "right";
}

export interface AssetStore {
  plan?: EditPlan;
  chunks?: CaptionChunk[];
  highlight?: Set<string>;
  graphics?: TimedGraphic[];
  camera?: TimedCamera[];
  debug?: { srcTime: number; keepId: string; dropped: number } | null;
}

const MIN_SECONDS = new Map(catalog.templates.map((t) => [t.name, t.minSeconds]));

/** Times every graphic, camera move and caption once per plan (cheap per-frame lookups after). */
export function prepareAssets(plan: EditPlan, assets: AssetStore = {}, map: TimeMap = timeMapFor(plan)): AssetStore {
  assets.plan = plan;
  assets.chunks = chunkCaptions(plan.words, map, plan.captions.maxWordsPerChunk);
  assets.highlight = new Set(plan.captions.highlightWords);
  let n = 0;
  assets.graphics = (plan.graphics as GraphicItem[])
    .map((g) => {
      const a = map.wordOutTime(g.atWord);
      if (!a || !TEMPLATES[g.template]) return null; // pinned word was cut: hidden, not deleted
      const u = map.wordOutTime(g.untilWord);
      const min = MIN_SECONDS.get(g.template) ?? 1.5;
      const end = Math.max(u ? u.start : a.end, a.start + min);
      // Alternate sides so consecutive side graphics don't stack in the same spot.
      return { item: g, start: a.start, end, side: (n++ % 2 === 0 ? "right" : "left") as "left" | "right" };
    })
    .filter((g): g is TimedGraphic => g !== null)
    .sort((x, y) => x.start - y.start);
  assets.camera = timeCamera(plan.camera as CameraItem[], map);
  return assets;
}

export function drawFrame(
  ctx: Ctx,
  plan: EditPlan,
  assets: AssetStore,
  frames: FrameSources,
  t: number, // OUTPUT time in seconds
  quality: "preview" | "export",
  outW: number,
  outH: number,
): void {
  const theme = THEMES[plan.style] ?? THEMES.explainer;
  const active = (assets.graphics ?? []).filter((g) => t >= g.start && t < g.end);
  const draw = (g: TimedGraphic) =>
    TEMPLATES[g.item.template](ctx, g.item.props, { t: t - g.start, duration: g.end - g.start }, { W: outW, H: outH, side: g.side }, theme);

  // 1. Clear
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, outW, outH);

  // 2. Camera transform, applied to the room, behind-graphics and speaker together.
  const cam = cameraAt(assets.camera ?? [], t, plan.source.height);
  ctx.save();
  ctx.translate(outW / 2, outH / 2);
  ctx.scale(cam.zoom, cam.zoom);
  ctx.translate(-cam.cx * outW, -cam.cy * outH);

  // 3. Room layer: the source frame, scaled to cover the output.
  if (frames.video && frames.videoWidth > 0) {
    const scale = Math.max(outW / frames.videoWidth, outH / frames.videoHeight);
    const w = frames.videoWidth * scale;
    const h = frames.videoHeight * scale;
    ctx.imageSmoothingQuality = quality === "export" ? "high" : "medium";
    ctx.drawImage(frames.video, (outW - w) / 2, (outH - h) / 2, w, h);
  }

  // 4. Behind layer (5. the speaker cut-out over it needs the SAM mask; until then behind = under nothing).
  for (const g of active) if (g.item.layer === "behind") draw(g);
  ctx.restore();

  // 7. Over layer
  for (const g of active) if (g.item.layer === "over") draw(g);

  // 8. Captions
  if (plan.captions.enabled && assets.chunks) {
    const chunk = chunkAt(assets.chunks, t);
    if (chunk) drawCaption(ctx, chunk, assets.highlight ?? new Set(), outW, outH, theme.accent, theme.font);
  }

  // 9. Fullscreen layer (title cards)
  for (const g of active) if (g.item.layer === "fullscreen") draw(g);

  // 12. Debug overlay (dev only)
  if (assets.debug) {
    const d = assets.debug;
    const s = Math.round(outH / 40);
    ctx.font = `600 ${s}px ui-monospace, Consolas, monospace`;
    ctx.textBaseline = "top";
    const lines = [`out ${t.toFixed(3)}s`, `src ${d.srcTime.toFixed(3)}s`, `keep ${d.keepId}`, `zoom ${cam.zoom.toFixed(2)}`,
      `gfx ${active.map((g) => g.item.template).join(",") || "-"}`, `dropped ${d.dropped}`];
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(s / 2, s / 2, s * 14, s * 1.3 * lines.length + s / 2);
    ctx.fillStyle = d.dropped > 0 ? "#ff6b5e" : "#ffd23f";
    lines.forEach((l, i) => ctx.fillText(l, s, s * 0.8 + i * s * 1.3));
  }
}

/** "minimal" caption style, with at most one highlighted word per chunk in the accent color. */
function drawCaption(ctx: Ctx, chunk: CaptionChunk, highlight: Set<string>, outW: number, outH: number, accent: string, font: string) {
  const size = Math.round(outH * 0.045);
  ctx.font = `600 ${size}px ${font}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(2, size * 0.18);
  ctx.strokeStyle = "rgba(0,0,0,0.85)";
  const space = ctx.measureText(" ").width;
  const widths = chunk.words.map((w) => ctx.measureText(w.text).width);
  const total = widths.reduce((a, b) => a + b, 0) + space * (chunk.words.length - 1);
  let x = (outW - total) / 2;
  const y = outH * 0.92;
  // Outline first, then fill (spec Section 16), so it reads on any background.
  chunk.words.forEach((w, i) => {
    ctx.strokeText(w.text, x, y);
    ctx.fillStyle = highlight.has(w.id) ? accent : "#fff";
    ctx.fillText(w.text, x, y);
    x += widths[i] + space;
  });
}
