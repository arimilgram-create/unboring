import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { getCuts, getPlan } from "../api";
import { activeWordIndex, formatTime } from "../editor/activeWord";
import { timeMapFor } from "../engine/timeMap";
import type { CutSummary, EditPlan } from "../plan/types";
import { PreviewPlayer, type PlayerState } from "../player/PreviewPlayer";
import type { ProjectStatus } from "../types";

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

// Day 2 editor: the canvas plays the edited video instantly (jump cuts, captions), drawn by
// drawFrame. The transcript shows what was cut. Editing cuts by hand comes on Day 5.
export default function EditorPage({ status }: { status: ProjectStatus }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const player = useRef<PreviewPlayer | null>(null);
  const [plan, setPlan] = useState<EditPlan | null>(null);
  const [cuts, setCuts] = useState<CutSummary | null>(null);
  const [state, setState] = useState<PlayerState>({ playing: false, outTime: 0, srcTime: 0, duration: 0, dropped: 0 });
  const [original, setOriginal] = useState(false);
  const [debug, setDebug] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getPlan(status.id), getCuts(status.id)])
      .then(([p, c]) => {
        setPlan(p);
        setCuts(c);
      })
      .catch((e) => setError(e.message));
  }, [status.id]);

  // Create the player once the plan and canvas exist.
  useEffect(() => {
    if (!plan || !canvas.current) return;
    const p = new PreviewPlayer(canvas.current, plan, setState);
    player.current = p;
    p.ready().catch((e) => setError(e.message));
    return () => p.dispose();
  }, [plan]);

  useEffect(() => {
    if (plan && player.current) player.current.setPlan(plan, original);
  }, [original, plan]);

  useEffect(() => {
    if (!player.current) return;
    player.current.debug = debug;
    player.current.redraw();
  }, [debug]);

  // Space = play/pause
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        player.current?.toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const info = useMemo(() => {
    if (!plan) return null;
    const map = timeMapFor(plan);
    const fillers = new Set(cuts?.fillers ?? []);
    const index = new Map(plan.words.map((w, i) => [w.id, i]));
    const retake = new Set<string>();
    for (const [a, b] of cuts?.retakes ?? []) for (let i = index.get(a)!; i <= index.get(b)!; i++) retake.add(plan.words[i].id);
    return { map, fillers, retake, saved: plan.source.duration - map.duration };
  }, [plan, cuts]);

  const active = plan ? activeWordIndex(plan.words, state.srcTime) : -1;
  useEffect(() => {
    if (active >= 0) document.getElementById(`word-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function seekToWord(i: number) {
    if (!plan || !player.current || !info) return;
    const w = plan.words[i];
    const t = original ? w.start : (info.map.wordOutTime(w.id)?.start ?? info.map.segments.find((s) => s.srcStart >= w.start)?.outStart);
    if (t !== undefined) player.current.seek(t);
  }

  if (error) return <main className="center"><p className="error">{error}</p></main>;
  if (!plan || !info) return <main className="center"><p className="muted">Loading the edit…</p></main>;
  const pct = Math.round((info.saved / plan.source.duration) * 100);

  return (
    <main className="editor">
      <section className="stage">
        <canvas ref={canvas} className="preview" onClick={() => player.current?.toggle()} />
        <div className="controls">
          <button className="play" onClick={() => player.current?.toggle()} aria-label={state.playing ? "Pause" : "Play"}>
            {state.playing ? "❚❚" : "▶"}
          </button>
          <input
            className="scrub"
            type="range"
            min={0}
            max={state.duration || 1}
            step={0.01}
            value={state.outTime}
            onChange={(e) => player.current?.seek(Number(e.target.value))}
          />
          <span className="time">
            {formatTime(state.outTime)} / {formatTime(state.duration)}
          </span>
          <div className="seg">
            <button className={!original ? "on" : ""} onClick={() => setOriginal(false)}>UnBoring</button>
            <button className={original ? "on" : ""} onClick={() => setOriginal(true)}>Original</button>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={debug} onChange={(e) => setDebug(e.target.checked)} /> debug
          </label>
        </div>
        <div className="meta">
          <strong>{status.name}</strong>
          <span>
            Cut {formatTime(info.saved)} ({pct}%) · {plural(cuts?.pauses ?? 0, "pause")} · {plural(cuts?.fillers.length ?? 0, "filler")} ·{" "}
            {plural(cuts?.retakes.length ?? 0, "retake")}
          </span>
        </div>
      </section>
      <aside className="transcript">
        <div className="transcript-head">
          <strong>Transcript</strong>
          <span className="muted small">struck-through = cut · click a word to jump</span>
        </div>
        <p className="words">
          {plan.words.map((w, i) => {
            const kept = info.map.isKept(i);
            const why = kept ? "" : info.retake.has(w.id) ? "retake" : info.fillers.has(w.id) ? "filler" : "cut";
            return (
              <Fragment key={w.id}>
                <span
                  id={`word-${i}`}
                  className={`word ${i === active ? "active" : ""} ${kept ? "" : `cut ${why}`} ${w.isFiller ? "filler" : ""}`}
                  title={`${w.id} · ${formatTime(w.start)}${kept ? "" : ` · cut (${why})`}`}
                  onClick={() => seekToWord(i)}
                >
                  {w.text}
                </span>{" "}
              </Fragment>
            );
          })}
        </p>
      </aside>
    </main>
  );
}
