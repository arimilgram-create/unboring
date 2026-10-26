# Decisions

One line per small decision (spec Section 1.3).

- 2026-10-26: Transcription runs locally with faster-whisper (`base.en`, CPU, int8) by default, so Day 1 works with no accounts. WhisperX on Modal is an option (`TRANSCRIBE_BACKEND=modal`), untested until Modal credits arrive.
- 2026-10-26: Whisper is nudged to keep fillers with an initial prompt ("Um, uh, ..."). Still need the CrisperWhisper comparison on real footage (spec 11.3).
- 2026-10-26: Progress = a `status.json` per project, streamed to the browser by polling it every 0.4 s over SSE. Simple, survives restarts, no extra services.
- 2026-10-26: Each stage writes to a temp file and renames when done, so a crash never leaves a half-written file that looks finished.
- 2026-10-26: Hash routing (`#/p/<id>`) instead of a router library.
- 2026-10-26: Day 1 editor shows the proxy in a plain `<video>`; the canvas engine (`drawFrame`) replaces it on Day 2.
- 2026-10-26: Windows launchers (`setup.bat`, `start.bat`) so the project runs without typing commands.
- 2026-10-26: Full spec moved to `docs/BUILD_SPEC.md`; `AGENTS.md` is a short summary because Muse Code truncates rules files over 64 KB.
