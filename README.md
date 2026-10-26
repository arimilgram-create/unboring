# UnBoring

**Make boring watchable.** UnBoring is a browser AI video editor for creators. Upload a talking-to-camera video, and Meta's AI plans a full edit (cuts, captions, camera moves, motion graphics). You watch the whole styled edit instantly, with no rendering, fix anything by dragging, and export once. A custom engine draws every frame from a JSON edit plan, so what you preview is exactly what you export.

Demo hook: 20 minutes of me reading the US Constitution, the most boring video possible, made worth watching.

Built for the **Meta Global AI Developer Hackathon** (Indie track, Oct 26 to Nov 4, 2026).

## Run it on Windows

1. Double-click **`setup.bat`** (once). It installs Python, Node and ffmpeg, then the project's packages.
2. Double-click **`start.bat`**. Two windows open (keep them open) and your browser goes to http://localhost:5173.
3. Drop in a video. You'll see each processing stage, then the video with its transcript, word by word.

Optional: `test.bat` runs all tests. `check_meta.bat` checks your Meta API key (put it in `apps/server/.env` first).

## How it works (so far)

```
browser (React + TypeScript, apps/web)          server (FastAPI, apps/server)
  upload ───────────────────────────────────▶   1 probe    read size, length, audio
  live progress (Server-Sent Events) ◀─────────  2 normalize constant 30 fps (webcams are variable)
  editor: preview video + transcript ◀─────────  3 proxy    720p, keyframe every 15 frames
                                                 4 audio    mono 16 kHz
                                                 5 transcribe  words with timestamps (faster-whisper)
```

The full design is in [`docs/BUILD_SPEC.md`](docs/BUILD_SPEC.md).

## Meta models

| Model | Used for | Status |
| --- | --- | --- |
| Muse Spark 1.3 | Plans the edit (structure + details) | Day 3 |
| Muse Wonder | Verifier: checks every graphic is relevant and accurate | Day 7 |
| SAM 3.1 | Cuts the speaker out so text can sit behind them | Day 2 |
| Muse Image | Generates visuals | Day 7 |

## Built during the Hackathon

Everything in this repo was built during the event (from Oct 26, 2026). Nothing here existed before kickoff; the commit history shows the work day by day.

- **Day 1 (Oct 26):** project skeleton; upload API; ffmpeg ingest (constant 30 fps normalize, 720p seek-friendly preview proxy, 16 kHz audio); word-level transcription with stable word IDs and filler detection; live progress over Server-Sent Events with resumable stages; upload page, processing page, and an editor that follows playback word by word (requestVideoFrameCallback) and seeks on click; Windows one-click setup; tests.

## Tests

- Server: `apps/server/tests` (pytest): word building, filler rules, full upload → words pipeline on a generated clip, video Range requests.
- Web: `apps/web/src/**/*.test.ts` (Vitest): active-word lookup.
