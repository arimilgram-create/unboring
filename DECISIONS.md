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
- 2026-10-26: Template catalog lives in `packages/shared/templates.json` (names, descriptions, layers, min seconds, JSON Schema props). The server builds the AI prompt and validates from it; the browser draws from it. One source of truth.
- 2026-10-26: Icons are a curated set of 80 Lucide icons copied into `icons.ts` by `scripts/build-icons.cjs` (not all 2,000+); the AI may only pick from that list.
- 2026-10-26: AI planning is text-only for now (no video frames sent) to protect the $150 credits until video-input pricing is confirmed (spec 13, VISION_MODE).
- 2026-10-26: AI planning never fails a project: without a key, or on an error, the stage shows why and the cuts + captions edit still works. "Plan with AI" re-runs it.
- 2026-10-26: Per-video AI budget defaults to $1.50 (`AI_BUDGET_USD`); every call is logged to `apps/server/logs/ai_calls.jsonl` with tokens and cost.
- 2026-10-26: Overlapping graphics on the same layer: higher priority wins (titleCard > titleBehind/hookText > statCallout > keywordCard > iconPop). Punch-ins at least 8 s apart.
- 2026-10-26: `titleBehind` is only offered to the AI when a speaker mask exists.
- 2026-10-26: No face track yet, so camera moves assume a centered speaker and side graphics alternate left/right.
- 2026-10-26: Golden-frame (preview = export) test moves to Day 8, when the export path exists to compare against. The template gallery (#/templates) is the visual check until then.
