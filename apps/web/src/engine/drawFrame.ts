// THE drawing function (spec Section 14.1). Preview and export both call this, so they match.
// Rules: pure function of (plan, t); never fetches, never awaits, no big allocations per frame.
import type { EditPlan } from "../plan/types";
import { chunkAt, chunkCaptions, type CaptionChunk } from "./captions/chunk";
import { timeMapFor, type TimeMap } from "./timeMap";

type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export interface FrameSources {
  video: CanvasImageSource | null; // the source frame for this moment (already decoded)
  videoWidth: number;
  videoHeight: number;
  mask?: CanvasImageSource | null; // SAM speaker mask (later)
}

export interface AssetStore {
  captions?: { plan: EditPlan; chunks: CaptionChunk[] }; // cached per plan
  debug?: { srcTime: number; keepId: string; dropped: number } | null;
}

/** Captions are measured once per plan and cached in the asset store. */
export function prepareAssets(plan: EditPlan, assets: AssetStore = {}, map: TimeMap = timeMapFor(plan)): AssetStore {
  assets.captions = { plan, chunks: chunkCaptions(plan.words, map, plan.captions.maxWordsPerChunk) };
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
  // 1. Clear
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, outW, outH);

  // 2–3. Camera (identity for now) + room layer: the source frame, scaled to cover the output.
  if (frames.video && frames.videoWidth > 0) {
    const scale = Math.max(outW / frames.videoWidth, outH / frames.videoHeight);
    const w = frames.videoWidth * scale;
    const h = frames.videoHeight * scale;
    ctx.imageSmoothingQuality = quality === "export" ? "high" : "medium";
    ctx.drawImage(frames.video, (outW - w) / 2, (outH - h) / 2, w, h);
  }

  // 8. Captions
  if (plan.captions.enabled && assets.captions) {
    const chunk = chunkAt(assets.captions.chunks, t);
    if (chunk) drawMinimalCaption(ctx, chunk, outW, outH);
  }

  // 12. Debug overlay (dev only)
  if (assets.debug) {
    const d = assets.debug;
    const s = Math.round(outH / 40);
    ctx.font = `600 ${s}px ui-monospace, Consolas, monospace`;
    ctx.textBaseline = "top";
    const lines = [`out ${t.toFixed(3)}s`, `src ${d.srcTime.toFixed(3)}s`, `keep ${d.keepId}`, `dropped ${d.dropped}`];
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(s / 2, s / 2, s * 11, s * 1.3 * lines.length + s / 2);
    ctx.fillStyle = d.dropped > 0 ? "#ff6b5e" : "#ffd23f";
    lines.forEach((l, i) => ctx.fillText(l, s, s * 0.8 + i * s * 1.3));
  }
}

function drawMinimalCaption(ctx: Ctx, chunk: CaptionChunk, outW: number, outH: number) {
  const size = Math.round(outH * 0.045);
  ctx.font = `600 ${size}px "Segoe UI", system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.lineJoin = "round";
  const x = outW / 2;
  const y = outH * 0.92;
  // Outline first, then fill (spec Section 16), so it reads on any background.
  ctx.lineWidth = Math.max(2, size * 0.18);
  ctx.strokeStyle = "rgba(0,0,0,0.85)";
  ctx.strokeText(chunk.text, x, y);
  ctx.fillStyle = "#fff";
  ctx.fillText(chunk.text, x, y);
  ctx.textAlign = "start";
}
