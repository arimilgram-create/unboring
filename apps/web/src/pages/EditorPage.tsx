import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { getWords } from "../api";
import { activeWordIndex, formatTime } from "../editor/activeWord";
import type { ProjectStatus, Word } from "../types";

// Day 1 editor: the preview copy plays, and the transcript follows along word by word.
// The real canvas engine (drawFrame) replaces the plain <video> on Day 2.
export default function EditorPage({ status }: { status: ProjectStatus }) {
  const video = useRef<HTMLVideoElement>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [active, setActive] = useState(-1);
  const [showTimes, setShowTimes] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getWords(status.id).then(setWords).catch((e) => setError(e.message));
  }, [status.id]);

  // Follow playback. requestVideoFrameCallback gives the exact time of each shown frame;
  // timeupdate is the fallback for browsers without it.
  useEffect(() => {
    const v = video.current;
    if (!v || words.length === 0) return;
    let handle = 0;
    const update = (t: number) => setActive(activeWordIndex(words, t));
    if ("requestVideoFrameCallback" in v) {
      const tick = (_now: number, meta: VideoFrameCallbackMetadata) => {
        update(meta.mediaTime);
        handle = v.requestVideoFrameCallback(tick);
      };
      handle = v.requestVideoFrameCallback(tick);
      const onSeek = () => update(v.currentTime);
      v.addEventListener("seeked", onSeek);
      return () => {
        v.cancelVideoFrameCallback(handle);
        v.removeEventListener("seeked", onSeek);
      };
    }
    const onTime = () => update((v as HTMLVideoElement).currentTime);
    (v as HTMLVideoElement).addEventListener("timeupdate", onTime);
    return () => (v as HTMLVideoElement).removeEventListener("timeupdate", onTime);
  }, [words]);

  // Keep the active word in view.
  useEffect(() => {
    if (active >= 0) document.getElementById(`word-${active}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [active]);

  const stats = useMemo(
    () => ({
      fillers: words.filter((w) => w.isFiller).length,
      longPauses: words.filter((w) => w.speechGapAfter > 0.5).length,
    }),
    [words],
  );

  function seek(w: Word) {
    const v = video.current;
    if (!v) return;
    v.currentTime = w.start + 0.001;
    v.play().catch(() => {});
  }

  const src = status.source!;
  return (
    <main className="editor">
      <section className="stage">
        <video ref={video} src={src.proxyUrl} controls playsInline />
        <div className="meta">
          <strong>{status.name}</strong>
          <span>
            {src.width}×{src.height} · {formatTime(src.duration)} · {src.fps} fps
          </span>
        </div>
      </section>
      <aside className="transcript">
        <div className="transcript-head">
          <div>
            <strong>{words.length} words</strong>
            <span className="muted">
              {" "}
              · {stats.fillers} fillers · {stats.longPauses} pauses &gt; 0.5 s
            </span>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={showTimes} onChange={(e) => setShowTimes(e.target.checked)} /> times
          </label>
        </div>
        {error && <p className="error">{error}</p>}
        <p className="words">
          {words.map((w, i) => (
            <Fragment key={w.id}>
            <span
              id={`word-${i}`}
              className={`word ${i === active ? "active" : ""} ${w.isFiller ? "filler" : ""} ${w.confidence < 0.5 ? "unsure" : ""}`}
              title={`${w.id} · ${formatTime(w.start)}–${formatTime(w.end)} · ${Math.round(w.confidence * 100)}%`}
              onClick={() => seek(w)}
            >
              {showTimes && <sup>{w.start.toFixed(2)}</sup>}
              {w.text}
              {w.speechGapAfter > 0.5 && <span className="gap">{w.speechGapAfter.toFixed(1)}s</span>}
            </span>{" "}
            </Fragment>
          ))}
        </p>
      </aside>
    </main>
  );
}
