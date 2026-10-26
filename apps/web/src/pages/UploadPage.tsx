import { useRef, useState } from "react";
import { uploadVideo } from "../api";

export default function UploadPage() {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(file: File | undefined) {
    if (!file) return;
    setError(null);
    setProgress(0);
    try {
      const { id } = await uploadVideo(file, setProgress);
      window.location.hash = `#/p/${id}`;
    } catch (e) {
      setError((e as Error).message);
      setProgress(null);
    }
  }

  return (
    <main className="upload">
      <h1>
        Make boring <em>watchable.</em>
      </h1>
      <p className="sub">Drop in a talking video. UnBoring finds every word, then edits it into something people finish.</p>
      <div
        className={`drop ${dragging ? "drag" : ""}`}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          send(e.dataTransfer.files[0]);
        }}
      >
        {progress === null ? (
          <>
            <strong>Drop a video here</strong>
            <span>or click to choose · MP4, MOV, WebM</span>
          </>
        ) : (
          <>
            <strong>Uploading… {Math.round(progress * 100)}%</strong>
            <div className="bar">
              <i style={{ width: `${progress * 100}%` }} />
            </div>
          </>
        )}
        <input ref={input} type="file" accept="video/*" hidden onChange={(e) => send(e.target.files?.[0])} />
      </div>
      {error && <p className="error">{error}</p>}
    </main>
  );
}
