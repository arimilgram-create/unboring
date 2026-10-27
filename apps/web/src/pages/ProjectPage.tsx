import { useEffect, useState } from "react";
import { getProject, retryProject, watchProject } from "../api";
import type { ProjectStatus } from "../types";
import EditorPage from "./EditorPage";

export default function ProjectPage({ id }: { id: string }) {
  const [status, setStatus] = useState<ProjectStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stop = () => {};
    getProject(id)
      .then((s) => {
        setStatus(s);
        if (s.state === "processing") stop = watchProject(id, setStatus);
      })
      .catch((e) => setError(e.message));
    return () => stop();
  }, [id]);

  if (error) return <main className="center"><p className="error">{error}</p><a href="#/">Upload another video</a></main>;
  if (!status) return <main className="center"><p className="muted">Loading…</p></main>;
  if (status.state === "ready") return <EditorPage status={status} />;

  return (
    <main className="center processing">
      <h2>{status.name}</h2>
      <ol className="stages">
        {status.stages.map((s) => (
          <li key={s.key} className={s.state}>
            <span className="dot" />
            <span className="label">{s.label}</span>
            <span className="pct">
              {s.state === "running" && s.progress > 0 ? `${Math.round(s.progress * 100)}%` : ""}
              {s.state === "done" ? "✓" : ""}
              {s.state === "failed" ? "failed" : ""}
              {s.state === "skipped" ? "needs key" : ""}
            </span>
          </li>
        ))}
      </ol>
      {status.state === "processing" && status.stages.some((s) => s.key === "transcribe" && s.state === "running") && (
        <p className="muted small">The first time, transcription downloads the speech model (about 150 MB).</p>
      )}
      {status.state === "failed" && (
        <>
          <p className="error">{status.error}</p>
          <button
            onClick={() =>
              retryProject(id).then(() => {
                setStatus({ ...status, state: "processing", error: null });
                watchProject(id, setStatus);
              })
            }
          >
            Retry
          </button>
        </>
      )}
    </main>
  );
}
