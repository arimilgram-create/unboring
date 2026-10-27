// The v1 graphic templates (spec Section 15.5). Each draw() is a pure function of its inputs:
// all motion comes from local.t through the easing helpers. Sizes are fractions of the frame,
// so preview (720p) and export (1080p) look identical.
import { EASE, TIMING, clamp, lerp, progress, stagger } from "../anim/easing";
import { drawIcon, life, roundRect, wrap, type Ctx, type LocalTime, type Theme } from "./helpers";

export interface Frame {
  W: number;
  H: number;
  side: "left" | "right"; // which side of the speaker to use for side graphics
}

export interface TemplateDraw {
  (ctx: Ctx, props: Record<string, unknown>, local: LocalTime, frame: Frame, theme: Theme): void;
}

const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);

/** Side panel region beside the (centered) speaker, above the caption zone. */
function sideBox(f: Frame) {
  const w = f.W * 0.3;
  const x = f.side === "left" ? f.W * 0.05 : f.W * 0.95 - w;
  return { x, y: f.H * 0.14, w };
}

const hookText: TemplateDraw = (ctx, props, local, f, th) => {
  const text = str(props.text);
  const words = text.split(/\s+/);
  const size = f.H * 0.075;
  ctx.font = `800 ${size}px ${th.font}`;
  const lines = wrap(ctx, text, f.W * 0.8);
  const L = life(local);
  let wi = 0;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  lines.forEach((line, li) => {
    const lineW = ctx.measureText(line).width;
    let x = (f.W - lineW) / 2;
    const y = f.H * 0.2 + li * size * 1.15;
    for (const word of line.split(" ")) {
      const d = stagger(wi++, words.length, TIMING.staggerEach, 0.3);
      const p = progress(local.t, d, TIMING.card, EASE.enter);
      const ww = ctx.measureText(word).width;
      ctx.globalAlpha = p * L.out;
      ctx.lineWidth = size * 0.16;
      ctx.strokeStyle = "rgba(0,0,0,0.75)";
      ctx.lineJoin = "round";
      ctx.strokeText(word, x, y + (1 - p) * size * 0.5);
      ctx.fillStyle = th.text;
      ctx.fillText(word, x, y + (1 - p) * size * 0.5);
      x += ww + ctx.measureText(" ").width;
    }
  });
  // Highlighter sweep under the last line once the words land.
  const sweep = progress(local.t, 0.25, 0.35, EASE.move) * L.out;
  if (sweep > 0) {
    const last = lines[lines.length - 1];
    const lw = ctx.measureText(last).width;
    const y = f.H * 0.2 + (lines.length - 1) * size * 1.15 + size * 0.18;
    ctx.globalAlpha = L.out;
    ctx.fillStyle = th.accent;
    ctx.fillRect((f.W - lw) / 2, y, lw * sweep, size * 0.12);
  }
  ctx.globalAlpha = 1;
};

const titleCard: TemplateDraw = (ctx, props, local, f, th) => {
  const L = life(local, TIMING.title * 0.5);
  ctx.globalAlpha = L.alpha;
  ctx.fillStyle = "#0e0f11";
  ctx.fillRect(0, 0, f.W, f.H);
  const s = lerp(0.92, 1, progress(local.t, 0, TIMING.title, EASE.enter));
  ctx.save();
  ctx.translate(f.W / 2, f.H / 2);
  ctx.scale(s, s);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const size = f.H * 0.11;
  ctx.font = `800 ${size}px ${th.font}`;
  ctx.fillStyle = th.text;
  ctx.fillText(str(props.title), 0, -size * 0.2);
  const bar = progress(local.t, 0.15, 0.4, EASE.move);
  const tw = ctx.measureText(str(props.title)).width;
  ctx.fillStyle = th.accent;
  ctx.fillRect(-tw / 2, size * 0.42, tw * bar, size * 0.08);
  if (props.subtitle) {
    ctx.globalAlpha = L.alpha * progress(local.t, 0.15, 0.3, EASE.enter);
    ctx.font = `500 ${size * 0.38}px ${th.font}`;
    ctx.fillStyle = th.muted;
    ctx.fillText(str(props.subtitle), 0, size * 0.95);
  }
  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.textAlign = "start";
};

const keywordCard: TemplateDraw = (ctx, props, local, f, th) => {
  const L = life(local);
  const box = sideBox(f);
  const pad = f.H * 0.03;
  const termSize = f.H * 0.05;
  const defSize = f.H * 0.032;
  ctx.font = `500 ${defSize}px ${th.font}`;
  const lines = wrap(ctx, str(props.definition), box.w - pad * 2);
  const h = pad * 2 + termSize * 1.2 + lines.length * defSize * 1.3 + pad * 0.3;
  // Anticipation: dip to 0.95 before popping to full size (spec timing table).
  const s = local.t < TIMING.anticipation ? lerp(1, 0.95, local.t / TIMING.anticipation) * 0.9 : lerp(0.9, 1, L.in);
  ctx.save();
  ctx.globalAlpha = L.alpha;
  ctx.translate(box.x + box.w / 2, box.y + h / 2 + (1 - L.out) * f.H * 0.02);
  ctx.scale(s, s);
  ctx.translate(-box.w / 2, -h / 2);
  ctx.fillStyle = th.card;
  roundRect(ctx, 0, 0, box.w, h, f.H * th.radius);
  ctx.fill();
  ctx.fillStyle = th.accent;
  ctx.fillRect(0, pad, f.H * 0.008, h - pad * 2);
  ctx.textBaseline = "top";
  ctx.font = `800 ${termSize}px ${th.font}`;
  ctx.fillStyle = th.accent;
  ctx.fillText(str(props.term), pad, pad);
  ctx.globalAlpha = L.alpha * progress(local.t, 0.06, TIMING.card, EASE.enter);
  ctx.font = `500 ${defSize}px ${th.font}`;
  ctx.fillStyle = th.text;
  lines.forEach((line, i) => ctx.fillText(line, pad, pad + termSize * 1.25 + i * defSize * 1.3));
  ctx.restore();
  ctx.globalAlpha = 1;
};

const iconPop: TemplateDraw = (ctx, props, local, f, th) => {
  const L = life(local, TIMING.pop, EASE.playful);
  const box = sideBox(f);
  const r = f.H * 0.075;
  const cx = box.x + box.w / 2;
  const cy = box.y + r * 1.3;
  const s = Math.max(0, L.in) * L.out;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.fillStyle = th.accent;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  drawIcon(ctx, str(props.icon, "Sparkles"), 0, 0, r * 1.1, th.accentInk);
  ctx.restore();
  if (props.label) {
    const size = f.H * 0.034;
    ctx.font = `700 ${size}px ${th.font}`;
    const tw = ctx.measureText(str(props.label)).width;
    const p = progress(local.t, 0.1, TIMING.card, EASE.enter) * L.out;
    ctx.globalAlpha = p;
    ctx.fillStyle = th.card;
    roundRect(ctx, cx - tw / 2 - size * 0.5, cy + r * 1.25, tw + size, size * 1.6, size * 0.5);
    ctx.fill();
    ctx.fillStyle = th.text;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(str(props.label), cx, cy + r * 1.25 + size * 0.8);
    ctx.textAlign = "start";
    ctx.globalAlpha = 1;
  }
};

const statCallout: TemplateDraw = (ctx, props, local, f, th) => {
  const L = life(local);
  const box = sideBox(f);
  const value = typeof props.value === "number" ? props.value : Number(props.value) || 0;
  const decimals = Math.min(2, (String(value).split(".")[1] ?? "").length);
  const shown = value * progress(local.t, 0, 0.8, EASE.enter);
  const text = `${str(props.prefix)}${shown.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${str(props.suffix)}`;
  const size = f.H * 0.12;
  ctx.globalAlpha = L.alpha;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `800 ${size}px ${th.font}`;
  const x = box.x + box.w / 2;
  const y = box.y + size + (1 - L.in) * f.H * 0.03;
  ctx.lineWidth = size * 0.1;
  ctx.strokeStyle = "rgba(0,0,0,0.7)";
  ctx.lineJoin = "round";
  ctx.strokeText(text, x, y);
  ctx.fillStyle = th.accent;
  ctx.fillText(text, x, y);
  ctx.font = `600 ${f.H * 0.036}px ${th.font}`;
  const lines = wrap(ctx, str(props.label), box.w);
  ctx.globalAlpha = L.alpha * progress(local.t, 0.15, TIMING.card, EASE.enter);
  lines.forEach((line, i) => {
    ctx.strokeStyle = "rgba(0,0,0,0.7)";
    ctx.lineWidth = f.H * 0.008;
    ctx.strokeText(line, x, y + f.H * 0.06 + i * f.H * 0.045);
    ctx.fillStyle = th.text;
    ctx.fillText(line, x, y + f.H * 0.06 + i * f.H * 0.045);
  });
  ctx.textAlign = "start";
  ctx.globalAlpha = 1;
};

const titleBehind: TemplateDraw = (ctx, props, local, f, th) => {
  const text = str(props.text).toUpperCase();
  const L = life(local);
  let size = f.H * 0.3;
  ctx.font = `900 ${size}px ${th.font}`;
  const full = ctx.measureText(text).width;
  if (full > f.W * 0.92) {
    size *= (f.W * 0.92) / full;
    ctx.font = `900 ${size}px ${th.font}`;
  }
  const total = ctx.measureText(text).width;
  let x = (f.W - total) / 2;
  ctx.textBaseline = "middle";
  ctx.fillStyle = th.accent;
  [...text].forEach((ch, i) => {
    const p = progress(local.t, stagger(i, text.length, 0.04, 0.5), TIMING.card, EASE.enter);
    ctx.globalAlpha = clamp(p) * L.out;
    ctx.fillText(ch, x, f.H * 0.42 + (1 - p) * size * 0.3);
    x += ctx.measureText(ch).width;
  });
  ctx.globalAlpha = 1;
};

export const TEMPLATES: Record<string, TemplateDraw> = { hookText, titleCard, keywordCard, iconPop, statCallout, titleBehind };
