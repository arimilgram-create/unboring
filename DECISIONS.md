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
- 2026-10-26: VAD uses the Silero ONNX model bundled with faster-whisper (no torch, no extra download).
- 2026-10-26: Retake detection compares the earlier take with the same number of words from the start of the next one, so a cut-short first take ("We the people of— We the People of the United States") still matches.
- 2026-10-26: Keep range IDs are `k_<fromWord>`, so re-running cut detection gives identical IDs.
- 2026-10-26: Edit plan types live in `apps/web/src/plan/types.ts` and `apps/server/pipeline/plan.py` for now; move to `packages/shared` with a JSON Schema when the AI passes need validation (Day 3).
- 2026-10-26: SAM 3.1 speaker mask postponed: it needs the Meta API (card issue) or Modal. Behind-the-speaker effects wait for it; everything else works without it.
- 2026-10-26: No audio fade at A/B swaps yet (spec 14.2 asks for ~10 ms). Add if clicks are audible on real footage.
