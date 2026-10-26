// Instant preview with jump cuts (spec Section 14.2).
//
// Problem: a 20-minute video can have 300+ cuts, and seeking one <video> at every cut stalls.
// Fix: two hidden <video> elements, A and B. A plays the current keep range while B waits,
// already seeked to the start of the NEXT range. At the cut we swap: B plays, A pre-seeks
// to the range after that. The visible output is always the canvas, drawn by drawFrame.
// requestVideoFrameCallback tells us the exact source time (mediaTime) of each shown frame.
import { drawFrame, prepareAssets, type AssetStore } from "../engine/drawFrame";
import { buildTimeMap, timeMapFor, type TimeMap } from "../engine/timeMap";
import type { EditPlan } from "../plan/types";

export interface PlayerState {
  playing: boolean;
  outTime: number; // seconds into the edited video
  srcTime: number; // seconds into the original
  duration: number; // edited length
  dropped: number; // frames skipped during playback (target: 0)
}

export class PreviewPlayer {
  private els: [HTMLVideoElement, HTMLVideoElement];
  private active = 0;
  private ctx: CanvasRenderingContext2D;
  private map!: TimeMap;
  private assets: AssetStore = {};
  private segIdx = 0;
  private playing = false;
  private outTime = 0;
  private srcTime = 0;
  private lastPresented = 0;
  private dropped = 0;
  private disposed = false;
  debug = false;

  constructor(
    private canvas: HTMLCanvasElement,
    private plan: EditPlan,
    private onState: (s: PlayerState) => void,
  ) {
    const make = () => {
      const v = document.createElement("video");
      v.src = plan.source.proxyUrl;
      v.preload = "auto";
      v.playsInline = true;
      v.addEventListener("ended", () => v === this.cur && this.playing && this.advance());
      return v;
    };
    this.els = [make(), make()];
    this.els[1].muted = true;
    this.ctx = canvas.getContext("2d")!;
    this.setPlan(plan, false, false);
  }

  private get cur() {
    return this.els[this.active];
  }
  private get standby() {
    return this.els[this.active ^ 1];
  }

  /** Resolves when both video copies can show a frame. */
  async ready(): Promise<void> {
    await Promise.all(
      this.els.map((v) => (v.readyState >= 2 ? Promise.resolve() : new Promise<void>((res, rej) => {
        v.addEventListener("loadeddata", () => res(), { once: true });
        v.addEventListener("error", () => rej(new Error("This browser can't play the preview video. Use Chrome or Edge.")), { once: true });
      }))),
    );
    this.canvas.width = this.cur.videoWidth || 1280;
    this.canvas.height = this.cur.videoHeight || 720;
    this.seek(0);
  }

  /** New plan (after an edit) or switch between the edit and the original. Keeps your place. */
  setPlan(plan: EditPlan, showOriginal: boolean, keepPosition = true) {
    const src = this.srcTime;
    this.plan = plan;
    this.map = showOriginal ? buildTimeMap(plan, { ignoreCuts: true }) : timeMapFor(plan);
    this.assets = prepareAssets(plan, this.assets, this.map);
    if (keepPosition) {
      // Same moment in the new timeline; if it was cut, the next kept moment.
      let t = this.map.srcToOut(src);
      if (t === null) {
        const next = this.map.segments.find((s) => s.srcStart >= src);
        t = next ? next.outStart : 0;
      }
      this.seek(t);
    }
  }

  get duration() {
    return this.map.duration;
  }

  play() {
    if (!this.map.segments.length) return;
    if (this.outTime >= this.map.duration - 0.05) this.seek(0);
    this.playing = true;
    this.lastPresented = 0;
    this.cur.muted = false;
    this.cur.play().catch(() => this.pause());
    this.preseekStandby();
    this.watch(this.cur);
    this.emit();
  }

  pause() {
    this.playing = false;
    this.els.forEach((v) => v.pause());
    this.emit();
  }

  toggle() {
    this.playing ? this.pause() : this.play();
  }

  seek(t: number) {
    const hit = this.map.outToSrc(Math.max(0, Math.min(t, this.map.duration)));
    if (!hit) return;
    this.segIdx = hit.index;
    this.outTime = hit.seg.outStart + (hit.src - hit.seg.srcStart);
    this.srcTime = hit.src;
    const v = this.cur;
    v.currentTime = hit.src;
    this.lastPresented = 0;
    this.preseekStandby();
    if (!this.playing) v.addEventListener("seeked", () => this.draw(), { once: true });
    this.emit();
  }

  dispose() {
    this.disposed = true;
    this.els.forEach((v) => {
      v.pause();
      v.removeAttribute("src");
      v.load();
    });
  }

  private preseekStandby() {
    const next = this.map.segments[this.segIdx + 1];
    if (next) {
      this.standby.pause();
      this.standby.muted = true;
      this.standby.currentTime = next.srcStart;
    }
  }

  private watch(v: HTMLVideoElement) {
    v.requestVideoFrameCallback((_now, meta) => this.onFrame(v, meta));
  }

  private onFrame(v: HTMLVideoElement, meta: VideoFrameCallbackMetadata) {
    if (this.disposed || v !== this.cur) return; // a stale callback from before a swap
    const seg = this.map.segments[this.segIdx];
    if (!seg) return;
    if (!v.seeking) {
      if (this.playing && this.lastPresented && meta.presentedFrames - this.lastPresented > 1) {
        this.dropped += meta.presentedFrames - this.lastPresented - 1;
      }
      this.lastPresented = meta.presentedFrames;
      const src = meta.mediaTime;
      // Reached the end of this keep range (within half a frame): jump to the next one.
      if (this.playing && src >= seg.srcEnd - 0.5 / this.plan.source.fps) {
        this.advance();
        return;
      }
      if (src >= seg.srcStart - 0.25) {
        this.srcTime = src;
        this.outTime = seg.outStart + Math.max(0, src - seg.srcStart);
        this.draw();
        this.emit();
      }
    }
    if (this.playing) this.watch(v);
  }

  private advance() {
    const next = this.segIdx + 1;
    const seg = this.map.segments[next];
    if (!seg) {
      this.outTime = this.map.duration;
      this.pause();
      return;
    }
    const b = this.standby;
    if (Math.abs(b.currentTime - seg.srcStart) > 0.05) b.currentTime = seg.srcStart; // safety net
    this.cur.pause();
    this.cur.muted = true;
    this.active ^= 1;
    this.segIdx = next;
    this.lastPresented = 0;
    b.muted = false;
    b.play().catch(() => this.pause());
    this.watch(b);
    this.preseekStandby();
  }

  private draw() {
    const v = this.cur;
    const seg = this.map.segments[this.segIdx];
    this.assets.debug = this.debug ? { srcTime: this.srcTime, keepId: seg?.keepId ?? "-", dropped: this.dropped } : null;
    drawFrame(this.ctx, this.plan, this.assets, { video: v, videoWidth: v.videoWidth, videoHeight: v.videoHeight },
      this.outTime, "preview", this.canvas.width, this.canvas.height);
  }

  redraw() {
    this.draw();
  }

  private emit() {
    this.onState({ playing: this.playing, outTime: this.outTime, srcTime: this.srcTime, duration: this.map.duration, dropped: this.dropped });
  }
}
