# UnBoring — The Build Prompt

> **Note to Ari (not part of the prompt):** This file is `AGENTS.md`; Muse Code reads it automatically every session. Before each work session, tell the agent which day of the build plan you're on (Section 28). Wherever this file says **CONFIRM AT KICKOFF**, check Meta's real docs and update this file.

---

## PROMPT STARTS HERE

You are the lead engineer on **UnBoring**, a browser-based AI video editor I'm building solo for the **Meta Global AI Developer Hackathon** (Indie developer track). I'm a high school student who edits videos with code. You'll write most of the code with me. This document is the complete spec. Read all of it before writing anything, and re-read the relevant section before each task.

---

## 1. How to work with me

1. **Build in small, working steps.** After each step the app must still run. Never leave the project broken at the end of a session.
2. **Follow the build plan in Section 28.** Each day has acceptance checks. Don't start a later day's features until the current day's checks pass, unless I say so.
3. **Ask before big decisions** that aren't covered here: new dependencies over ~50 KB, changing the data model, changing the tech stack, or anything that costs money. For small decisions, pick the simplest option, write one line about it in `DECISIONS.md`, and keep going.
4. **Never fake the demo.** No hardcoded results, no pre-rendered "AI output" passed off as live, no mocked API responses in the shipped app. Mocks are allowed only in tests, and must live in test folders. Judges punish demos that only work on preloaded inputs.
5. **Explain your work in plain language** when I ask. I need to understand every part well enough to explain it to judges. If you write something clever, add a short comment saying why it works.
6. **Write tests for the math.** Time mapping, caption chunking, cut detection, and easing functions must have unit tests (Section 27).
7. **Keep secrets out of the code.** All API keys go in `.env` files that are git-ignored. Provide `.env.example` with fake values.
8. **Commit often** with clear messages. One feature per commit.
9. **If this spec conflicts with official documentation** (Meta Model API, Mediabunny, WhisperX, browsers), the docs win. Tell me what conflicted and update this file.
10. **Prefer boring, reliable code** over clever code. This must work on demo day.
11. **My machine is a Windows laptop.** Give me PowerShell commands, not Bash. Use `py`/`python` and `npm` as they work on Windows. Heavy GPU work (WhisperX, SAM fallback) runs on Modal, not locally.
12. **Watch my credits.** You run on the same $150 Meta credits the app uses. Keep responses focused, don't re-read huge files needlessly, and tell me if a task will be expensive.

---

## 2. The project in one paragraph

UnBoring turns a raw sit-and-talk video into an entertaining, professionally edited video in one click, then lets you **watch the entire styled edit instantly in the browser, with no rendering**, fix anything by dragging or by editing the transcript, and export the final MP4 once at the end. AI (Meta's Muse Spark) plans the edit: cuts, captions, camera moves, motion graphics, sound effects. Meta's SAM 3.1 cuts the speaker out of the background so text and graphics can sit behind them. Muse Image draws visuals. A custom rendering engine draws everything live from a JSON "edit plan," so **what you preview is exactly what you export.** The demo hook: I read 20 minutes of the US Constitution on camera, the most boring video possible, and UnBoring makes it worth watching. **"If it can make the Constitution entertaining, it can make your video entertaining."**

---

## 3. Hackathon context

From the **official Participant Guide** (Oct 26, 2026):

- **Event:** Meta Global AI Developer Hackathon, run with Cerebral Valley. Remote. Kickoff Oct 26 at 12:00 PM ET; building period Oct 27 to Nov 4. **Submissions due Wed Nov 4 at 9:00 PM ET via the Cerebral Valley platform. Aim to submit by noon Nov 4.** Nov 3 is the last full day for submission questions and troubleshooting.
- **Track:** Indie developer (solo is allowed; teams up to 4).
- **Problem statement:** "Build for Your World": bring Meta's models into your domain, solve a problem you know firsthand. I make and edit videos; making talking videos entertaining takes hours, and code-based tools make you wait for renders to see changes.
- **Required:** the project must use Meta's models: the Muse Spark series, Muse Wonder, Muse Image, Muse Voice Transcribe, and SAM 3.1 through the Meta Model API, and/or the open-weights models Muse Glimmer and Muse Spark Open. Muse Code is the official coding agent.
- **Rules:**
  - **Repositories must be public.**
  - **New work only.** Everything presented must be built during the event, and judges must be able to clearly identify what was built during the Hackathon; failing to do so can mean disqualification. So: a brand-new repo created after kickoff, an honest commit history, and a README section titled "Built during the Hackathon" listing what was built.
  - **No code, data, or assets we don't have the rights to.** Every font, icon, sound, image, and document gets a license entry (Section 24).
  - The guide's "anti-projects" list includes generic ideas (basic RAG apps, simple image analyzers, simple "AI for Education" chatbots, sports analyzers) and "anything political or involving war." UnBoring is a creator tool, not any of these. The Constitution demo must stay **strictly neutral and non-partisan**: present the text, explain procedure (how a bill becomes a law, quorum, the census), and never add commentary on current politics, politicians, or parties.
- **Submission:** public repo link, an accessible video link, everyone who worked on it listed, and a **3-minute demo video** that highlights the specific features, code, and functionality built during the Hackathon. Judges use the video as one of the primary artifacts, along with the code and the live product.
- **Judging:**
  - Stage 1 (pass/fail): fits a problem statement and reasonably uses the Meta Model API and/or Meta's open-weights models.
  - Stage 2 (0 to 10 per category): **Impact 30%** (real-world potential, who benefits, could people actually use it), **Use of Meta AI Tooling 25%** (creative, beyond a basic integration, "capabilities that surprised even us"), **Technical Depth & Execution 20%** (sound, thoughtfully refined engineering), **Demo 25%** (working, impressive, holds up live, a video that's "genuinely cool to watch").
  - Stage 3: the top 5 per track go to a final round where judges watch the demo videos live and rank them with the same rubric. Closing ceremony Nov 9.
- **Indie prizes:** 1st $150K, 2nd $100K, 3rd $75K, 4th $50K, 5th $25K.
- **Bonus prizes we're eligible for:** Most Viral Project ($20K, highest engagement on the X post of the demo through Nov 8), Community Vote ($10K, public gallery votes, announced Nov 16), Best Creative Build ($5K, using Muse Image or Muse Wonder; we use both), Best Agentic Use-Case ($5K, multi-step agent workflows; our plan → detail → verify pipeline qualifies). There's also Best Build on Meta Open Weight Models ($10K, Muse Glimmer or Muse Spark Open), which we're not targeting.
- **Credits:** $150 in Meta Model API credits, claimed through a form, distributed in batches, and a credit card must be on the account (with a temporary pre-authorization hold). Claim deadline Nov 4, 9:00 PM ET. A spend-limit setting only sends a notification, so the app enforces its own budget (Section 13.6). Partner credits (Baseten, Modal, Fireworks) are not guaranteed.
- **Help:** Discord `#office-hours` daily 10–11 AM ET on weekdays (Meta team, text only); `#questions` for the organizers. Workshops: Tue Oct 27 "Agents 101: Build a Multimodal AI Agent"; **Wed Oct 28 "Agents 102: Best Practices for Verifiable Agents"** (directly relevant to the verifier pass); Fri Oct 30 Fireworks session on Muse open models. All at 12:00 PM ET.

What judges reward (from research on recent winners): a firsthand problem, a specific user, real-world proof with numbers, AI that checks its own work, a live link that works on the judges' own input, and a demo that never stalls. What loses: thin API wrappers, demos that only work on preloaded data, default AI-looking interfaces, AI voiceovers.

---

## 4. Product promise and non-negotiables

These rules override everything else in this document.

1. **No Remotion.** We are building our own engine. Do not add Remotion or any similar video framework.
2. **One drawing function.** The function `drawFrame(ctx, plan, assets, outputTime, quality)` paints the complete frame for any moment. Preview and export both call it. Never write separate drawing logic for export.
3. **Preview equals export.** A frame drawn in preview at time t must look the same as the exported frame at time t (allowing only for resolution). There is a test for this (Section 27).
4. **The AI never edits pixels.** The AI writes and edits the JSON edit plan. The engine draws the plan. The original video file is never modified.
5. **Everything is pinned to words, not times.** Graphics, camera moves, sounds, and captions reference word IDs. Only the `words` array holds real times. When a cut moves, everything moves with its word.
6. **Every item has a stable ID.** Every keep range, graphic, camera move, and sound has a unique, permanent ID. Edits reference IDs. Applying the same edit twice must not duplicate anything.
7. **Graphics are templates plus props.** The AI picks a template name and fills its props (validated against a schema). The AI never writes drawing code.
8. **Every effect has to fit.** Every graphic must relate to what's being said at that moment. A verifier pass removes effects that don't (Section 13.4).
9. **Never change what the speaker said.** UnBoring cuts and decorates. It never generates fake speech or rewrites words in the audio.
10. **Seizure safety.** No more than 3 flashes in any 1-second window, ever (WCAG 2.3.1). The engine enforces this as a hard limit, regardless of what the plan says (Section 24).
11. **Time is an input, never a counter.** Animations compute their state from the current time. Never accumulate state frame by frame. This makes scrubbing, seeking backward, and export all identical.

---

## 5. Users and the core flow

**Primary user:** a creator or editor with a talking-to-camera video (YouTube explainers, podcast clips, commentary, vlogs with talking segments). They want it to look professionally edited without spending hours.

**Core flow (the demo follows this exactly):**

1. Land on the homepage, see the Constitution before/after demo, click "Make your video unboring."
2. Upload a video (or click "Try the sample" which loads my Constitution clip).
3. Watch processing progress by stage. The first ~2 minutes of the video becomes playable as soon as its chunk finishes.
4. The editor opens with the best preset auto-selected. Press Space: the full styled edit plays instantly.
5. Switch styles in the style gallery. The preview changes instantly.
6. Fix things: drag a cut edge (snaps to words), delete words in the transcript, click a graphic to edit its text, undo anything.
7. Click Export. Watch export progress. Download the MP4 (and a caption file).

---

## 6. Architecture overview

```
 BROWSER (React + TypeScript)                       SERVER (Python FastAPI)            GPU (Modal)
 ┌─────────────────────────────────┐   upload     ┌──────────────────────────┐       ┌──────────────┐
 │ Upload page                     │ ───────────▶ │ /api/projects            │       │ WhisperX     │
 │                                 │              │  1 normalize (ffmpeg)    │──────▶│ word timing  │
 │ Editor                          │  SSE progress│  2 proxy + audio         │       │ Silero VAD   │
 │  ├ Transcript panel             │ ◀─────────── │  3 transcribe + VAD      │◀──────│ (SAM 3.1     │
 │  ├ Preview canvas ◀─ Engine     │              │  4 cut detection         │       │  fallback)   │
 │  ├ Timeline                     │  edit plan   │  5 SAM 3.1 speaker mask  │       └──────────────┘
 │  └ Style gallery / Inspector    │ ◀─────────── │  6 Muse Spark: structure │
 │                                 │              │  7 Muse Spark: details   │       META MODEL API
 │ Engine (shared by both):        │              │  8 Muse Wonder: verifier │──────▶ muse-spark-1.3
 │   drawFrame(ctx, plan, t)       │              │  9 Muse Image assets     │       SAM 3.1
 │                                 │              │ 10 save plan + assets    │       Muse Image
 │ Export Worker:                  │              └──────────────────────────┘       Muse Voice
 │   Mediabunny decode → drawFrame │
 │   → encode H.264 → mux MP4      │
 └─────────────────────────────────┘
```

All slow AI work happens once after upload. After that, every edit, style switch, and preview is instant because the engine only redraws from data it already has. The only other wait is export, which happens once.

---

## 7. Tech stack

**Decided:**

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | Vite + React 18 + TypeScript (strict mode) | Fast, simple, I know React |
| State | Zustand (or plain React context if simpler) | Small, easy undo with immutable plan versions |
| Styling | Plain CSS modules or Tailwind; a deliberate custom design, not a default template look | Judges notice generic AI-looking UIs |
| Rendering | Canvas 2D for v1 | Does everything v1 needs; WebGL later for LUT color grading |
| Playback clock | `<video>` elements + `requestVideoFrameCallback` | Fires once per real video frame with exact `mediaTime`; supported in Chrome 83+, Firefox 132+, Safari 15.4+ |
| Export | Mediabunny (decode, encode via WebCodecs, MP4 mux) in a Web Worker | Hardware-accelerated, frame-accurate, zero dependencies, MPL-2.0 |
| Audio mix | Web Audio API, `OfflineAudioContext` for export | Built into browsers |
| Animation | Our own tiny helpers: cubic-bezier solver + spring function | No library needed; must be time-based |
| Icons | Lucide (ISC license) | 1,500+ icons, commercial use allowed |
| Stickers | lottie-web (MIT), canvas renderer, `goToAndStop(frame, true)` | Frame-accurate, scrub-safe |
| Backend | Python 3.11 + FastAPI | WhisperX and SAM tooling are Python |
| Media tools | ffmpeg (server) | Normalizing, proxies, audio extraction |
| GPU jobs | Modal (hackathon partner credits) | WhisperX, Silero VAD, and the SAM 3.1 open-weights fallback |
| AI | Meta Model API: Muse Spark 1.3, Muse Wonder (verifier), SAM 3.1, Muse Image, Muse Voice | The point of the hackathon |
| Storage | Local disk in dev; one object-storage bucket in production | Simple |
| Database | JSON files per project in dev; SQLite in production if needed | A hackathon doesn't need Postgres |
| Tests | Vitest (frontend), pytest (backend), Playwright (golden frames) | Standard |

**Meta Model API facts** (updated at kickoff, Oct 26; confirm details in the official docs at dev.meta.ai). Models the guide lists for the hackathon: Muse Spark series, Muse Wonder, Muse Image, Muse Voice Transcribe, SAM 3.1 (API), and open-weights Muse Glimmer and Muse Spark Open (on Baseten use `meta-models/muse-spark-open-1026`). Credits only work once a card is on the account; the "Spend Limit" is a notification, not a cap.

- Base URL: `https://api.meta.ai/v1`, Bearer token auth. Keep the key in `META_API_KEY` in `.env` (some participant examples call it `MODEL_API_KEY`; use whatever the docs say).
- OpenAI-compatible (Chat Completions and the Responses API) and also Anthropic-Messages-compatible. Use the official OpenAI SDK with `base_url` set to Meta's.
- **Default model: `muse-spark-1.3`** (released Sep 2, 2026). Input: text, images, and video. 1M-token context. Supports structured outputs, parallel tool calls, prompt caching. Pricing (Standard): $1.25 per million input tokens, $4.25 per million output tokens. It tends to use many output tokens, so cap `max_output_tokens` per call.
- **Use Standard mode, never Contributor mode, for user uploads.** Contributor mode is much cheaper, but Meta may train on that traffic. Contributor mode is acceptable only for my own test calls on my own footage.
- **Muse Wonder** (Meta's newest frontier model, for agentic and reasoning-heavy tasks) is on the API at about $4 per million input and $20 per million output tokens. Use it only where quality matters most and volume is low: the **verifier pass** (Section 13.4) and optionally the **structure pass** (Section 13.1). Everything else uses Muse Spark 1.3. Make the model per pass a config value.
- Reported rate limits per minute: Muse Spark Standard 3,000 requests and 4M tokens; Muse Image 150 requests; SAM 3.1 3,000 requests.
- **Video-input pricing for Muse Spark: still confirm in the docs** (decides `VISION_MODE`).
- Muse Voice Transcribe: model `muse-voice-transcribe-1.0`. File endpoint `POST https://api.meta.ai/v1/asr/transcribe`, max 32 MB and 10 minutes of audio per request; realtime at `wss://api.meta.ai/v1/asr/realtime`. It gives **turn-level timestamps, not word-level**, so we use WhisperX for word timing.
- **SAM 3.1** is on the Meta Model API through the Responses API as model `sam-3.1`. Input: an image or video plus a short text prompt ("person"). Output: boxes, masks, and object identities across frames; when streamed, one record per video frame, then a completion event. An empty result means "no matches," not an error. Reported price: $0.20 per 1,000 video frames, so a 20-minute video at 30 fps (36,000 frames) costs about $7.20. **Read the mask encoding format and video size limits in the docs (dev.meta.ai/docs/sam) before writing `mask.py`.** Fallback: the open-weights SAM 3.1 checkpoint (Hugging Face `facebook/sam3.1`) on Modal.
- **Muse Image** is on the API (reported $0.01 per image, 150 requests per minute). The engine must still work without it, with image templates simply not offered.

---

## 8. Repository layout

```
unboring/
├─ AGENTS.md                 ← this file
├─ DECISIONS.md              ← one line per small decision
├─ README.md                 ← how to run, architecture, demo link
├─ .env.example
├─ apps/
│  ├─ web/                   ← Vite + React + TS
│  │  ├─ src/
│  │  │  ├─ app/             ← pages: Home, Upload, Editor
│  │  │  ├─ editor/          ← Transcript, Timeline, Inspector, StyleGallery, Toolbar
│  │  │  ├─ engine/
│  │  │  │  ├─ drawFrame.ts       ← THE function
│  │  │  │  ├─ timeMap.ts         ← output time ↔ source time
│  │  │  │  ├─ layers/            ← background, behind, speaker, over, captions, overlays
│  │  │  │  ├─ camera.ts
│  │  │  │  ├─ transitions.ts
│  │  │  │  ├─ captions/          ← chunking, layout, styles
│  │  │  │  ├─ templates/         ← one file per graphic template + registry
│  │  │  │  ├─ anim/              ← easing.ts, spring.ts, timing constants
│  │  │  │  ├─ color.ts
│  │  │  │  ├─ safety.ts          ← flash limiter
│  │  │  │  └─ assets.ts          ← image/icon/lottie/font loading + caches
│  │  │  ├─ player/          ← PreviewPlayer (A/B video double buffer), mask reader
│  │  │  ├─ audio/           ← preview audio, export mix, ducking, loudness
│  │  │  ├─ export/          ← export.worker.ts (Mediabunny pipeline)
│  │  │  ├─ plan/            ← types.ts, schema (zod), operations.ts (edits), history.ts
│  │  │  ├─ presets/         ← explainer.ts, podcastClip.ts, courtroomDrama.ts
│  │  │  └─ api/             ← server client + SSE
│  │  └─ public/sfx/         ← built-in CC0 sound library
│  └─ server/                ← FastAPI
│     ├─ main.py
│     ├─ pipeline/           ← normalize.py, proxy.py, transcribe.py, vad.py, cuts.py, retakes.py,
│     │                        mask.py, plan_structure.py, plan_detail.py, verify.py, images.py
│     ├─ meta/               ← meta_client.py (OpenAI SDK wrapper), sam.py, muse_image.py, muse_voice.py
│     ├─ prompts/            ← structure.md, detail.md, verify.md (prompt templates, versioned)
│     ├─ schemas/            ← JSON schemas for every AI output
│     └─ modal_app.py        ← GPU functions (WhisperX, VAD, SAM fallback)
├─ packages/shared/          ← edit plan types + JSON schema shared by web and server
└─ fixtures/                 ← short test videos + expected outputs (never shipped)
```

---

## 9. The edit plan (data model)

The edit plan is the single source of truth. Define it once in `packages/shared` as TypeScript types plus a JSON Schema (generate one from the other, e.g. zod → JSON Schema) so both the web app and the server validate against the same thing.

```ts
// packages/shared/plan.ts

export type ID = string;            // stable, e.g. "g_7f3a2c"; never reused
export type WordId = string;        // "w0", "w1", ... in source order

export interface EditPlan {
  version: 1;
  planId: ID;
  revision: number;                 // increments on every change
  source: SourceInfo;
  style: PresetName;                // "explainer" | "podcastClip" | "courtroomDrama"
  words: Word[];                    // ONLY place with real times (seconds, source time)
  keep: KeepRange[];                // what plays, in order
  chapters: Chapter[];
  camera: CameraMove[];
  graphics: GraphicItem[];
  captions: CaptionSettings;
  sounds: SoundItem[];
  music: MusicSettings | null;
  transitions: TransitionItem[];
  color: ColorSettings;
  checks: VerifierReport | null;    // result of the relevance/accuracy pass
}

export interface SourceInfo {
  id: ID;
  originalUrl: string;              // normalized full-res file (used for export)
  proxyUrl: string;                 // 720p proxy with frequent keyframes (used for preview)
  maskUrl: string | null;           // black/white speaker-mask video, same timing as proxy
  cleanPlateUrl: string | null;     // still image of the empty room, if provided
  fps: number;                      // constant frame rate after normalization (30)
  width: number; height: number;    // original resolution
  duration: number;                 // seconds
  faceTrack: FaceBox[];             // sampled face/upper-body boxes from the mask, ~4 per second
}

export interface Word {
  id: WordId;
  text: string;                     // as spoken, including fillers like "um"
  start: number; end: number;       // seconds, source time
  isFiller: boolean;
  confidence: number;
  speechGapAfter: number;           // silence until next word, seconds
}

export interface KeepRange {
  id: ID;
  fromWord: WordId; toWord: WordId; // inclusive
  padStart: number; padEnd: number; // seconds of handle around the words (default 0.10)
  reason?: "auto" | "user";
}

export interface Chapter { id: ID; title: string; atWord: WordId; }

export type Ease = "linear" | "easeOut" | "easeIn" | "easeInOut" | "playful" | { spring: SpringConfig };
export interface SpringConfig { stiffness: number; damping: number; mass: number; }

export interface CameraMove {
  id: ID;
  move: "punchIn" | "punchOut" | "crashZoom" | "slowPush" | "slowPull" | "reframe"
      | "kenBurns" | "impactShake" | "drift" | "dutchTilt";
  atWord: WordId; untilWord?: WordId;
  scale?: number;                   // target zoom, 1 = full frame
  anchor?: "face" | "center" | { x: number; y: number }; // normalized 0..1
  ease: Ease;
  duration?: number;                // seconds, for animated moves
}

export interface GraphicItem {
  id: ID;
  template: TemplateName;           // must exist in the template registry
  layer: "behind" | "over" | "fullscreen";
  atWord: WordId; untilWord: WordId;
  props: Record<string, unknown>;   // validated against the template's schema
  placement?: "auto" | "left" | "right" | "top" | "center";
  enterEase?: Ease; exitEase?: Ease;
  revealAtWords?: WordId[];         // for templates that build step by step (flow diagram, list)
  verified?: { relevant: boolean; accurate: boolean | null; note?: string };
}

export interface CaptionSettings {
  enabled: boolean;
  style: "boldPop" | "karaoke" | "phraseReveal" | "activeWordBox" | "typewriter" | "minimal";
  maxWordsPerChunk: number;         // 2–4 for social styles
  position: "lowerThird" | "center" | "bottom";
  highlightWords: WordId[];         // at most 1 per chunk
  safeZone: "landscape" | "vertical";
}

export interface SoundItem {
  id: ID;
  sfx: SfxName;                     // from the built-in library
  atWord: WordId;
  align: "start" | "end";           // align the sound's PEAK to this word's start or end
  gainDb: number;
}

export interface MusicSettings { track: string; gainDb: number; duckDb: number; fadeIn: number; fadeOut: number; }

export interface TransitionItem {
  id: ID;
  type: "crossDissolve" | "dipToBlack" | "dipToWhite" | "zoom" | "whip" | "push" | "cutToBlack";
  atKeep: ID;                       // happens at the START of this keep range
  duration: number;
}

export interface ColorSettings {
  exposure: number; contrast: number; saturation: number; temperature: number; // from auto-correction
  look: "cleanBright" | "mutedCool" | "highContrast" | "none";
  vignette: number;                 // 0..1
}

export interface VerifierReport {
  checkedCount: number;
  removedIrrelevant: ID[];
  corrected: { id: ID; field: string; before: string; after: string }[];
  ranAt: string;                    // ISO time
}
```

**Plan rules (validate on every load and every edit):**

- `words` are sorted by `start`, non-overlapping, IDs unique and stable forever (never renumber after transcription).
- `keep` ranges are sorted and non-overlapping in source time. Every `fromWord`/`toWord` exists.
- Every item's word references exist. If a referenced word is cut (outside every keep range), the item is **hidden**, not deleted, so it comes back if the cut is undone.
- Every `GraphicItem.props` passes its template's schema.
- `transitions` only reference existing keep ranges and never exceed half the length of either neighboring range.
- Validation failures from AI output are rejected and retried (Section 13). Validation failures from user edits are blocked in the UI with a clear message.

**Edits are operations.** Every change is an operation (`moveCutEdge`, `deleteWords`, `restoreWords`, `updateGraphicProps`, `repinGraphic`, `setStyle`, ...) applied with a pure function `apply(plan, op) → newPlan`. Keep a history of plan versions for undo/redo (store the last 100). Never mutate a plan in place.

---

## 10. Time mapping (the core math)

There are two clocks:

- **Source time:** seconds into the original recording.
- **Output time:** seconds into the edited video.

Each keep range covers source time `[start(fromWord) − padStart, end(toWord) + padEnd]`, clamped to the source duration and to its neighbors so ranges never overlap. Output time is those ranges laid end to end.

```ts
// engine/timeMap.ts
interface Segment { keepId: ID; srcStart: number; srcEnd: number; outStart: number; outEnd: number; }

buildSegments(plan): Segment[]          // recompute whenever keep/words change; memoize by plan.revision
outToSrc(t: number): { seg: Segment; src: number } | null   // binary search on outStart
srcToOut(s: number): number | null      // null if s is inside a cut
wordOutTime(wordId): { start: number; end: number } | null  // null if the word is cut
outputDuration(): number
```

- Use binary search (segments can number in the hundreds for a 20-minute video).
- All graphics/camera/sound timing comes from `wordOutTime(...)`.
- Snap output times to frame boundaries (`Math.round(t * fps) / fps`) only at the very end, when choosing which frame to draw or encode.
- **Unit test this heavily:** empty plans, a single range, adjacent ranges, padding that overlaps neighbors, words entirely inside a cut, the last frame, times beyond the end.

---

## 11. Ingest pipeline (server)

Runs once per upload, in this order, streaming progress to the browser over Server-Sent Events (`/api/projects/{id}/events`) with stage names and percentages. Process in **2-minute chunks** where the stage allows it, so the first chunk becomes playable early. Every stage writes its output to the project folder so a crash can resume from the last completed stage.

### 11.1 Normalize (ffmpeg)

Webcam recordings (including my Chromebook recordings) are often **variable frame rate** and may be WebM. Variable frame rate breaks exact timing. Normalize everything to a constant 30 fps H.264 MP4 first:

```bash
ffmpeg -i input -vf "fps=30" -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
       -c:a aac -b:a 192k -ar 48000 -movflags +faststart original.mp4
```

Record the real width/height. **If the source is 1080p or smaller, cap camera zooms** (Section 17).

### 11.2 Proxy and audio

```bash
# 720p preview proxy with a keyframe every 15 frames, so seeks are fast and cheap
ffmpeg -i original.mp4 -vf "scale=-2:720" -c:v libx264 -preset veryfast -crf 23 \
       -g 15 -keyint_min 15 -sc_threshold 0 -c:a aac -b:a 128k -movflags +faststart proxy.mp4

# mono 16 kHz audio for speech models
ffmpeg -i original.mp4 -ac 1 -ar 16000 audio16k.wav
```

### 11.3 Transcription with word timing (Modal GPU)

- Use **WhisperX** (`large-v3`, `float16` on GPU): transcribe, then run forced alignment to get word-level start/end times (accurate to under ~100 ms). Keep `return_char_alignments=False`.
- **Day 1 experiment:** also try **CrisperWhisper**, a Whisper variant built to keep filler words ("um", "uh"), stutters, and false starts with accurate timestamps. Plain Whisper tends to drop fillers, which breaks filler removal. Pick whichever transcribes my Constitution footage's fillers better and note it in `DECISIONS.md`.
- Output `words[]` with stable IDs `w0..wN`, `isFiller` set for a filler list (`um, uh, er, ah, like (as filler), you know` — be conservative: only mark "like"/"you know" when the model is confident it's a filler), and `confidence`.
- Language: English for v1.
- Optional: also run Muse Voice Transcribe for the transcript text, so every AI step can say it used Meta's stack. Word timing still comes from WhisperX.

### 11.4 Voice activity detection (Modal or CPU)

Use **Silero VAD** on `audio16k.wav` to get speech segments. This is more reliable than volume-based silence detection. Store `speech: [{start, end}]`.

### 11.5 Cut detection (Section 12 has the full algorithm)

Produces the initial `keep[]` from words + VAD + the preset's thresholds.

### 11.6 Speaker mask (SAM 3.1)

- Prompt SAM 3.1 with the text **"person"** on the proxy video. Take the track of the main (largest, most centered) person.
- Encode the mask as a **black-and-white video** (`mask.mp4`, same fps, same resolution as the proxy, same keyframe settings) so the browser can play it in sync, frame for frame.
- Also store `faceTrack`: the bounding box of the head/upper body ~4 times per second, used for punch-ins and placement.
- Edge cleanup before encoding: shrink the mask by 1 px and feather by 2–4 px (at 720p) to remove halos.
- If the SAM API is slow or unavailable, use the open-weights fallback on Modal. If both fail, continue without a mask: effects that need it (text behind speaker, background dim) are disabled, everything else works.

### 11.7 AI planning

Structure pass → detail pass per chunk → verifier pass → image generation. See Section 13.

### 11.8 Save

Write `plan.json` (validated), `assets/` (generated images), and mark the project ready. The browser fetches the plan and assets and never needs the server again until export finishes (export runs in the browser).

---

## 12. Cut detection algorithm

Goal: remove dead air, filler words, and retakes, **without clipping words**.

**Step 1: Silence cuts.** Walk the words. Between word i and word i+1, if the gap (using VAD to confirm there's no speech) is longer than the preset's `minSilence`, end the current keep range at word i and start a new one at word i+1.

**Step 2: Padding.** Each range gets `padStart`/`padEnd` (preset default, e.g. 0.10 s). Never cut on the first spike of a word; the handle prevents clipped consonants.

**Step 3: Merge.** If two ranges are separated by less than `mergeGap` (0.3 s), merge them so breaths don't cause choppy cuts. Drop any speech island shorter than `minSpeech` (0.25 s) that isn't a real word.

**Step 4: Filler removal.** Remove a filler word only if it can be cut cleanly: there must be at least ~0.08 s of quiet on both sides of the filler (check VAD and the neighbors' timings). Otherwise keep it (this is the "avoid harsh cuts" rule). Never remove fillers in the middle of a word cluster with no gap.

**Step 5: Retakes.** Find back-to-back repeated phrases (same or nearly the same words, within ~15 seconds of each other, at least 4 words long, similarity ≥ 0.8 on normalized text). Keep the **last** take, since speakers repeat until they're happy. Ask Muse Spark to confirm ambiguous cases in the detail pass. Only consecutive repeats count.

**Step 6: Snap.** Every range edge sits at a word boundary plus padding. This is also what makes drag-to-fix snap.

**Defaults per preset:**

| Preset | `minSilence` | `padStart`/`padEnd` | `mergeGap` | Remove fillers |
| --- | --- | --- | --- | --- |
| Podcast Clip | 0.35 s | 0.06 s | 0.25 s | Yes |
| Explainer | 0.50 s | 0.10 s | 0.30 s | Yes |
| Courtroom Drama | 0.50 s, but keep pauses Muse Spark marks as dramatic | 0.10 s | 0.30 s | Yes |

**Audio at every cut:** a short equal-power crossfade (start at ~10 ms, tune by ear) to prevent clicks. If background noise differs across a cut, lay room tone under it (from the clean-plate recording's audio or the quietest 2 s of the source).

Unit-test this on fixtures: a clip with a long pause, a clip with "um" next to a word with no gap (must NOT cut), and a clip with a retake (must keep the last one).

---

## 13. AI planning with Muse Spark

All AI calls go through `meta/meta_client.py` using the OpenAI Python SDK pointed at Meta's base URL. Every call:

- uses **structured outputs** with a JSON schema from `schemas/`,
- is validated on return; on failure, retry up to 2 times with the validation error appended to the prompt; after that, fall back gracefully (skip that chunk's graphics, keep cuts and captions),
- logs prompt version, token counts, latency, and cost estimate to `logs/ai_calls.jsonl`,
- uses prompt caching for the shared system prompt and transcript where supported.

**How to send the transcript:** compactly, with word IDs, grouped into lines by sentence:
`[w120]All [w121]legislative [w122]Powers [w123]herein [w124]granted [w125]shall ...`

**How to send video:** Muse Spark accepts video input, but **video-input cost is unknown until kickoff.** Build both options behind a flag:
- `VISION_MODE=video`: send the proxy chunk itself.
- `VISION_MODE=frames` (default until cost is confirmed): send sampled frames, 1 every 2 seconds, as images with their timestamps.

### 13.1 Pass 1: Structure (whole video, once per style)

Purpose: plan the shape of the whole video before details. Input: full transcript with word IDs, chapters if obvious, the chosen preset's description, total duration.

System prompt (`prompts/structure.md`):

```
You are the senior editor at a top YouTube channel. You are planning the STRUCTURE of an edit
for a talking-to-camera video. You do not draw anything; you choose where things go.

Rules:
- Pick ONE hook for the first 5 seconds (under 10 words of on-screen text). The hook must be true
  to the content. Hook types: contrast, provocative question, surprising true fact, promise,
  mini-story, cold open (show the best moment first).
- Split the video into chapters at natural topic changes. Every chapter >= 10 seconds.
- Plan a "big moment" (re-engagement beat) about every 3 minutes for videos longer than 5 minutes,
  with the strongest one inside the first minute. A big moment is one of: flow diagram build,
  phrase montage, stamp, dramatic freeze, chart reveal, text-behind-speaker title.
- Never promise something the video doesn't deliver.
- Keep the last 20 seconds visually clean (end-screen space).
- Every big moment must be ABOUT what is being said at that time.
Return JSON matching the schema exactly. Reference words ONLY by their IDs.
```

Output schema (abridged): `{ hook: {type, text, atWord}, chapters: [{title, atWord}], bigMoments: [{kind, atWord, untilWord, why}], tone: string }`.

### 13.2 Pass 2: Details (per ~2-minute chunk, per style)

Input: the chunk's words, the structure plan's slots that fall in this chunk, the preset's full rules (Section 23), the template catalog with each template's schema (Section 15), the list of allowed camera moves and sound effects, frames or video for the chunk, and the previous chunk's last 20 words for continuity.

System prompt (`prompts/detail.md`):

```
You are an expert video editor applying the "{preset}" style to one chunk of a talking video.
You output an edit for THIS chunk only, as JSON matching the schema.

Hard rules:
- Every graphic must explain or label what is being said at that moment. No decorative,
  off-topic, or random effects. If nothing fits, add nothing.
- Use ONLY templates from the catalog, with props matching each template's schema exactly.
- Visual change roughly every {visualChangeEvery} seconds, but never mid-clause: camera moves
  and graphics start at sentence or clause boundaries.
- Zooms are emphasis: at most one punch-in per {punchInEvery} seconds, on the key line.
- At most ONE highlighted word per caption chunk.
- Sounds only on visual events (graphic entrances, transitions, stamps). Never on every cut.
- Fill the reserved big-moment slots from the structure plan.
- Confirm or reject the suggested retake cuts given to you (keep the last good take).
- Mark dramatic pauses that must NOT be cut (Courtroom Drama only).
- Text you put on screen must quote or summarize the speaker accurately. When the source is a
  known document (e.g. the US Constitution), quotes must match it word for word.
Reference words ONLY by ID. Return JSON only.
```

Output schema (abridged): `{ camera: CameraMove[], graphics: GraphicItem[], sounds: SoundItem[], transitions: TransitionItem[], highlightWords: WordId[], keepDramaticPauses: WordId[], retakeDecisions: [{groupId, keepTakeStartWord}] }`. The server assigns stable IDs; the model never invents IDs for new items (it returns temporary keys, the server maps them).

### 13.3 Merge

Merge all chunks into one plan. Resolve overlaps (two graphics in the same place at the same time: keep the higher-priority one; priority: big moment > keyword card > icon). Enforce spacing rules from the preset. Validate.

### 13.4 Pass 3: Verifier (the "AI checks its own work" feature)

A separate call, with a fresh context, reviews every graphic. Use **Muse Wonder** here if the budget allows (it's the strongest reasoning model and this pass is low-volume); otherwise Muse Spark 1.3. It reviews every graphic and on-screen text item. For each item it receives: the item's template and props, the words spoken from 5 seconds before to 5 seconds after, and (if a reference document is provided, like the Constitution text) the relevant passage.

System prompt (`prompts/verify.md`):

```
You are a strict fact-checker and editor reviewing on-screen graphics for a video.
For EACH item decide:
1. relevant: does it directly relate to what is being said at that moment? (true/false)
2. accurate: does every fact, number, and quote match the speech and the reference text?
   (true / false / null if nothing to check)
3. If not accurate and fixable, give the corrected prop values.
Be strict. When unsure about relevance, mark false. Quotes must match the reference
document exactly. Return JSON only.
```

Apply the results: remove irrelevant items, apply corrections, record everything in `plan.checks`. **Show it in the UI** as a small panel: "Checked 52 graphics: 4 removed as off-topic, 2 corrected." (Use the real counts.) This is a key demo moment.

**Reference documents:** the project can have an optional reference text. For the demo, load the US Constitution transcript from the National Archives (public domain, no permission needed; credit the National Archives).

### 13.5 Images (Muse Image)

For `aiImage` graphics, generate images from the props' prompt with a consistent style suffix per preset (e.g. Documentary: "muted editorial illustration, paper texture"). Generate in parallel, cache by prompt hash, store in `assets/`. If Muse Image is unavailable, the detail pass is told no image template exists.

### 13.6 Cost controls

- Generate all 3 style plans in the background after upload so switching is instant, but generate the **selected style first**.
- Cap public uploads at 10 minutes.
- Track per-project cost in the log; show a warning in the dev console if a project exceeds a set budget.

---

## 14. The engine

### 14.1 `drawFrame`

```ts
// engine/drawFrame.ts
export function drawFrame(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  plan: EditPlan,
  assets: AssetStore,
  frames: FrameSources,       // the current source video frame, mask frame, clean plate (already decoded)
  t: number,                  // OUTPUT time in seconds
  quality: "preview" | "export",
  outW: number, outH: number,
): void
```

Layer order, bottom to top (every layer is a pure function of `(plan, t)`):

1. **Clear** to black.
2. **Camera transform** for this moment (Section 17). Applied to layers 3–5 as one group so the room, behind-graphics, and speaker move together.
3. **Room layer:** the source video frame (or the clean plate, if the effect needs a hole-free background). Room effects: blur, dim, grayscale (color pop).
4. **Behind layer:** graphics with `layer: "behind"`, including text behind the speaker.
5. **Speaker layer:** only if any behind-layer item or room effect is active: draw the video frame again through the mask so only the speaker's pixels show (draw mask to an offscreen canvas, then draw the frame with `globalCompositeOperation = "source-in"`, then composite onto the main canvas). If nothing needs it, skip this layer entirely (performance).
6. **Color pass:** exposure/contrast/saturation/look. v1: canvas `filter` (works in Chrome; it's not available in every browser, so v2 moves this to a WebGL LUT pass). Vignette as a radial gradient overlay.
7. **Over layer:** graphics with `layer: "over"` (cards, icons, arrows, charts), placed by the layout rules.
8. **Captions.**
9. **Fullscreen layer:** full-screen title cards, stamps, chapter cards.
10. **Transitions:** if `t` is inside a transition window, blend the frozen outgoing frame with the current composite (Section 18).
11. **Safety:** the flash limiter adjusts brightness flashes before they’re committed (Section 24).
12. **Debug overlay** (dev only): output time, source time, keep ID, dropped frames.

`drawFrame` must never fetch anything, never await, and never allocate large objects per frame. All images, fonts, Lottie data, and measured text are prepared ahead of time in `AssetStore`.

### 14.2 Preview player (instant playback with jump cuts)

The hard problem: a 20-minute video may have 300+ jump cuts. Seeking one `<video>` element at every cut causes stalls.

**Solution: A/B double-buffered video elements.**

- Two hidden `<video>` elements, A and B, both loaded with `proxy.mp4` (the proxy has a keyframe every 15 frames, so seeks are cheap).
- A plays the current keep range. While it plays, B is **pre-seeked** to the start of the next keep range and paused.
- At the cut boundary, swap: B starts playing, A becomes the standby and pre-seeks to the range after next.
- The visible output is always the `<canvas>`; the `<video>` elements are never shown directly.
- Use `requestVideoFrameCallback` on the active element. In each callback, read `metadata.mediaTime` (exact source time of the presented frame), convert to output time with `srcToOut`, and call `drawFrame` with that frame. Detect the cut boundary when `mediaTime >= seg.srcEnd − (1 / fps)` and swap.
- Audio comes from the active element. Apply a very short gain fade (~10 ms) around swaps using a Web Audio `MediaElementAudioSourceNode` + `GainNode` per element, to avoid clicks.
- Seeking (scrubbing, clicking a word): `outToSrc(t)` → set `currentTime` on the active element → draw when the seeked frame arrives (`seeked` event, then `requestVideoFrameCallback`).
- When paused, redraw immediately on any plan change (so edits appear instantly).
- Track dropped frames via `presentedFrames` deltas and show them in the debug overlay. Target: zero dropped frames on a normal laptop at 720p.

**Mask in sync:** two more hidden `<video>` elements (A-mask, B-mask) playing `mask.mp4`, mirrored exactly with A and B (same seeks, same play/pause). Read the mask frame for the same `mediaTime`. If drift is measured (mask `mediaTime` differs by more than one frame), fall back to the frame cache approach: decode mask frames for the next few seconds with Mediabunny into `ImageBitmap`s and look them up by time. Pick the approach that tests reliably on Day 2 and record it in `DECISIONS.md`.

**Preload:** load all images, icons, Lottie files, and fonts for the next 10 seconds of output time before they're needed. Wait for `document.fonts.ready` before the first draw.

### 14.3 Frame accuracy notes

- `requestVideoFrameCallback` is best-effort and can be one vsync off; `mediaTime` is the reliable frame identity. Never use `currentTime` inside the frame callback.
- The `<video>` element does **not** seek frame-accurately. That's fine for preview. Export never uses `<video>` (it decodes frames with Mediabunny).

---

## 15. Graphics: the template system

### 15.1 Template interface

```ts
// engine/templates/types.ts
export interface Template<P> {
  name: TemplateName;
  description: string;           // given to Muse Spark so it knows when to use it
  schema: z.ZodType<P>;          // props validation; also exported as JSON Schema for the AI
  minSeconds: number;            // never shown for less than this (readability)
  layers: ("behind" | "over" | "fullscreen")[];
  prepare(props: P, assets: AssetStore): Promise<Prepared<P>>;  // measure text, load images ONCE
  draw(ctx: Ctx2D, prepared: Prepared<P>, local: LocalTime, box: Rect, theme: Theme): void;
}

export interface LocalTime {
  t: number;              // seconds since the graphic appeared (can be negative before entrance)
  duration: number;       // total on-screen seconds
  revealTimes: number[];  // local times of revealAtWords, for step-by-step builds
}
```

`draw` must be a pure function of its inputs. It computes all animation progress from `local.t` using the easing helpers. It never stores state.

### 15.2 Animation helpers

```ts
// engine/anim/easing.ts
cubicBezier(x1, y1, x2, y2): (p: number) => number   // solve with Newton-Raphson + bisection fallback
export const EASE = {
  enter:  cubicBezier(0.16, 1, 0.3, 1),     // fast start, gentle landing (default for appearing)
  exit:   cubicBezier(0.7, 0, 0.84, 0),     // slow start, accelerates away
  move:   cubicBezier(0.65, 0, 0.35, 1),    // symmetric ease-in-out, for things moving on screen
  playful:cubicBezier(0.34, 1.56, 0.64, 1), // overshoots then settles
  linear: (p: number) => p,                 // loops only
};
// engine/anim/spring.ts — analytic damped spring, evaluated at time t (no stepping)
spring(t: number, { stiffness = 300, damping = 30, mass = 1 }): number  // 0 → 1
progress(localT, start, duration, ease): number  // clamp((localT − start) / duration) then ease
stagger(index, eachSeconds, totalCap = 0.7): number
```

**Timing constants** (`engine/anim/timing.ts`):

| Element | Duration |
| --- | --- |
| Pop-ups (icons, emoji, single words) | 0.10–0.20 s |
| Cards and panels | 0.20–0.40 s |
| Full-screen titles | 0.40–0.80 s |
| Regular movement | ~0.8 s |
| Camera moves | 0.8–2.0 s |
| Stagger between list items | 0.04–0.08 s, total reveal ≤ 0.7 s |
| Anticipation counter-move | 0.06–0.12 s (e.g. scale to 0.95 before popping) |
| Follow-through settle | 0.04–0.08 s after the main body lands |

Bigger moves need more time: add ~30–50% duration when distance roughly doubles.

### 15.3 Text rules (all templates)

- Minimum on-screen time = `max(1.5, characters / 20 * 2) + entranceDuration` (Netflix's 20 characters/second reading speed, read twice).
- If text doesn't contrast with the footage, draw a solid rounded box behind it.
- Never cover the mouth or face (use `faceTrack`), never hug the screen edge (stay inside a 5% margin), never overlap the caption zone.
- One design system per preset: fonts, colors, corner radius, shadows defined in a `Theme` object. No ad-hoc styling in templates.
- Fonts: load 2 families max (one bold display, one clean sans), self-hosted, with `font-display: block`.

### 15.4 Layout and placement

- Compute the speaker's bounding box at the graphic's entrance time from `faceTrack`.
- `placement: "auto"` puts the graphic in the larger open side (left or right of the speaker), vertically centered in the upper two-thirds, above the caption zone.
- If the open side is too narrow (< 30% of frame width), apply a **reframe** camera move to shift the speaker toward one third, making room, then place the graphic.
- Never place two "over" graphics in the same region at once; the later one waits or the earlier one exits.

### 15.5 v1 template library (build these)

| Template | Props (schema) | Animation spec | Presets |
| --- | --- | --- | --- |
| `hookText` | `text` (≤ 60 chars) | Word stagger slide-up, enter ease, 0.3 s total | All |
| `titleCard` | `title`, `subtitle?` | Fullscreen; title scale 0.92→1 with enter ease 0.5 s; subtitle fades 0.15 s later | All |
| `chapterCard` | `number?`, `title` | Half-screen panel slides in 0.35 s; holds; exits 0.25 s | All |
| `titleBehind` | `text` (1–3 words, ≤ 18 chars) | Behind layer; huge bold text, letter stagger 0.04 s; requires mask | Explainer, Courtroom |
| `keywordCard` | `term`, `definition` (≤ 80 chars) | Box enters with anticipation (0.95) then enter ease; term then definition 0.06 s apart | Explainer |
| `lowerThird` | `label`, `detail?` | Bar wipes in 0.3 s, text arrives 0.08 s after the bar | Explainer |
| `statCallout` | `value` (number), `prefix?`, `suffix?`, `label` | Number counts up with enter ease over 0.8 s; tabular-figure font so digits don't jitter | Explainer |
| `barChart` | `bars: {label, value}[]` (2–6), `unit?` | Bars grow with 0.06 s stagger, enter ease 0.6 s; labels fade after bars | Explainer |
| `unitChart` | `groups: {label, count, color?}[]` (≤ 2 groups, count ≤ 500) | Dots pop in by row, total reveal ≤ 1.2 s | Explainer |
| `flowDiagram` | `steps: {label}[]` (3–7), `edges: [from, to][]`, `revealAtWords` | Each box + arrow appears exactly at its reveal word; arrows draw on (Section 15.6) | Explainer (Constitution demo: how a bill becomes a law) |
| `listBuild` | `title?`, `items: string[]` (2–6), `revealAtWords` | Each item slides in at its word; check mark draws on | Explainer |
| `iconPop` | `icon` (Lucide name), `label?` | Scale 0→1 with playful ease 0.18 s; pop sound | Explainer, Podcast Clip |
| `calloutArrow` | `target: {x,y}` (normalized), `label` | Arrow draws on 0.35 s; label fades in at the end | Explainer |
| `circleDraw` | `targetWord` (caption word) | Hand-drawn circle draws on around a caption word 0.4 s | Explainer, Podcast Clip |
| `quoteCard` | `quote` (≤ 160 chars), `source?` | Fullscreen or over; typewriter or fade per preset | Courtroom, Explainer |
| `documentHighlight` | `pageImage` (asset id), `lines` (text), `highlightWords` | Shows the real document page (e.g. the Constitution scan from the National Archives); marker sweeps behind each phrase as it's spoken | Explainer, Courtroom |
| `phraseMontage` | `phrase`, `snippets: string[]` (8–15) | Each snippet ~8 frames with the phrase dead center, getting faster; camera click sound per cut | Explainer |
| `stamp` | `word` (≤ 16 chars) | Slams in: scale 1.6→1 in 0.12 s, impact shake 8 frames, hit sound; max 1 per 3 minutes | Courtroom Drama |
| `socialCard` | `text` (≤ 140 chars), `handle?` | Card styled like a post, slides up 0.3 s | Podcast Clip |
| `aiImage` | `prompt`, `asset` (filled after generation), `pan` | Ken Burns 1.0→1.15 over its duration; slide in with blur sharpening (Documentary look) | Explainer, Courtroom |
| `emoji` | `emoji` (from Noto Emoji, Apache-2.0) | Pop with playful ease; sparingly | Podcast Clip |
| `progressBar` | `chapters` (auto) | Thin bar at top edge with chapter ticks | Optional, all |

Each template gets: a file, a schema, a description written for the AI ("Use when the speaker defines a term"), and a visual test (Section 27).

### 15.6 Draw-on lines (arrows, circles, connectors)

Set the stroke dash pattern to one dash as long as the whole path (`ctx.setLineDash([L, L])`), then animate `ctx.lineDashOffset` from `L` down to `0`. The line appears to draw itself. Path length `L` is computed once in `prepare`.

---

## 16. Captions

**Chunking (once per plan revision, cached):**

1. Walk kept words in output order.
2. Start a new chunk at sentence punctuation, at a pause > 0.3 s, or when the style's word limit is reached (2–4 words for social styles, up to 2 lines of 42 characters for subtitle style).
3. Line breaking for two-line styles: break after punctuation and before conjunctions/prepositions. Never split an article from its noun, a first from a last name, or an auxiliary/negation from its verb. Prefer a bottom-heavy shape; never one lonely word on top.
4. Numbers: spell out zero to ten, numerals for 11+, except when quoting a document (keep the document's form).

**Drawing:** find the chunk active at time t (binary search), draw it with the style; the word being spoken right now is the "active word." Outline first, then fill. Measure each chunk once and cache layout.

**Styles (v1):**

| Style | Look | Preset |
| --- | --- | --- |
| `boldPop` | ALL CAPS, word by word, heavy outline, one highlighted word in the accent color per chunk, words pop in (scale 0.8→1, 0.1 s, playful ease) | Podcast Clip |
| `activeWordBox` | Sentence case, 2–4 words, a rounded colored box slides behind the active word | Explainer |
| `typewriter` | Letters appear in time with the word, monospace or serif | Courtroom Drama (when quoting the law) |
| `minimal` | Small, clean, one line, bottom | Fallback / "clean subtitles" option |

**Placement:** one consistent position per video. Landscape: lower third. Vertical exports: avoid the top ~220 px and bottom ~450 px of a 1080×1920 frame (platform buttons). Never over the mouth (`faceTrack`).

**Export a caption file** (`.srt` and `.vtt`) with the edit's output times, using subtitle rules (≤ 42 chars per line, ≤ 2 lines, ≤ 20 chars/second).

---

## 17. Camera moves

Every move is a crop box over the source frame: `{centerX, centerY, zoom}` changing over time with an easing curve. Compute the camera state at time t as a pure function of all active camera items.

| Move | Recipe | Default |
| --- | --- | --- |
| `punchIn` / `punchOut` | Zoom jumps exactly on a cut or sentence start, centered on the face | 1.15–1.30× (see zoom cap) |
| `crashZoom` | Animated zoom with ease-in + motion blur (draw 3 offset passes at low alpha) + whoosh | 1.0→1.6× over 0.2 s |
| `slowPush` / `slowPull` | Zoom drifts with `move` ease | ~8% over 5–10 s |
| `reframe` | Shift center so the speaker sits on a vertical third | 0.4 s, `move` ease |
| `kenBurns` | On still images: zoom 1.0→1.15 + slight pan across the image's time on screen | always on for stills |
| `impactShake` | Small pseudo-random offsets decaying to zero (seeded by item ID so it's identical every time) | 6–10 frames, ≤ 1% of width |
| `drift` | Very slow smooth wander (sum of two slow sines, seeded) | < 1% movement |
| `dutchTilt` | Rotation with a slight zoom to hide corners | 3–6° |

**Zoom cap (important for my footage):** quality degrades when you zoom past the source's extra resolution. `maxZoom = clamp(sourceHeight / outputHeight, 1.15, 2.0)`. With 4K source and 1080p output that's 2.0×. **With 720p webcam footage (my Chromebook) and 1080p output, cap punch-ins at about 1.15–1.2× and keep export at 1080p only if the softness is acceptable; otherwise export at 720p.** Show a warning in the inspector if a move exceeds the cap.

Face anchoring: `faceTrack` is sampled ~4× per second; interpolate smoothly and apply heavy smoothing so the crop never jitters. Only move when the face drifts past a margin.

---

## 18. Transitions (v1)

A transition needs two images: the frozen last frame of the outgoing range (capture it into an `ImageBitmap` cache just before the boundary in preview, decoded directly in export) and the live incoming frame.

| Type | Recipe | Duration |
| --- | --- | --- |
| `cutToBlack` | Black for N frames | 6–12 frames |
| `dipToBlack` / `dipToWhite` | Fade solid color in, switch, fade out | 0.4–0.8 s |
| `crossDissolve` | Outgoing frame under, incoming over with rising opacity | 0.5–1.0 s |
| `zoom` | Outgoing scales up with blur, incoming scales down from large; whoosh peaks on the cut | 0.3–0.4 s |
| `whip` | Both frames slide sideways with strong horizontal blur at the midpoint | 0.2–0.35 s |
| `push` | Incoming pushes outgoing off-screen, `move` ease | 0.3–0.5 s |

Transitions are rare: only at chapter changes or where the preset says. A transition must have a job.

---

## 19. Sound and music

**Built-in sound library** (`public/sfx/`, ~15 sounds, all CC0 from Kenney, Freesound CC0, Mixkit, or Pixabay; list each file's source and license in `public/sfx/LICENSES.md`): whoosh (short, medium), riser, reverse riser, hit, pop, click, camera shutter, projector clack, typewriter key, page turn, gavel, ding, record scratch, rewind. **For each file, store the time of its peak** (measure once with a script; save in `sfx/index.json`).

**Placement:** a `SoundItem` aligns the sound's **peak** to its word's start or end, so the engine schedules it at `wordTime − peakOffset`. A whoosh must be the same length as the move it covers and peak on the cut.

**Music:** optional bed per preset (CC0/royalty-free only). **Ducking:** lower music in every VAD speech region by `duckDb` (start at −12 dB) with smooth ramps (attack ~50 ms, release ≥ 100 ms so it doesn't bounce in breaths). Cut all music right before the biggest line in the video.

**Voice cleanup** (Web Audio, applied in preview and export identically): high-pass at 80–100 Hz → gentle EQ (−2 to −4 dB around 200–400 Hz, +1 to +2 dB around 3–5 kHz) → compressor (ratio 3:1–4:1, threshold −18 to −24 dB) → limiter at −1 dBTP. Heavy noise reduction, if needed, is done once on the server at upload (keep it light: ≤ 6–12 dB).

**Loudness:** export target **−14 LUFS integrated, −1 dBTP true peak**. YouTube turns loud videos down but never boosts quiet ones. Measure the final mix and apply gain, then the limiter.

**Preview audio:** voice from the active `<video>` element through the cleanup chain; sound effects and music via `AudioBufferSourceNode`s scheduled against the preview clock (reschedule on seek/pause).

---

## 20. Color

- **Auto-correction** at upload: sample ~20 frames, compute average brightness and gray balance, store exposure/contrast/temperature numbers in `plan.color`. Gentle: never more than ±0.3 stops.
- **Looks per preset:** `cleanBright` (Podcast Clip, Explainer), `highContrast` (Courtroom Drama). v1 implements looks with the canvas `filter` property (`brightness() contrast() saturate()`), which works in Chrome. It isn't supported in every browser, so feature-detect and fall back to no look. v2: a WebGL pass applying a 33×33×33 `.cube` LUT per preset.
- **Vignette:** radial gradient overlay (Courtroom Drama).
- Never color-shift skin tones heavily.

---

## 21. Export

Runs in a **Web Worker** with an `OffscreenCanvas`, so the editor never freezes. Uses **Mediabunny** for reading the original file, encoding via WebCodecs, and muxing MP4. (Check the current Mediabunny API at mediabunny.dev; use its input/sink classes to decode frames and its canvas-source/output classes to encode and write MP4.)

Steps:

1. Load `original.mp4` (full resolution) and `mask` (upscale mask frames to output size when used).
2. For each output frame `n` from 0 to `ceil(duration × 30)`: `t = n / 30` → `outToSrc(t)` → get that exact source frame from the decoder (decode sequentially within each keep range; seek with the decoder at range starts) → `drawFrame(ctx, plan, assets, frames, t, "export", W, H)` → hand the canvas to the encoder with timestamp `t`.
3. **Close every `VideoFrame` immediately after use.** Frames are not garbage-collected; holding ~2 seconds of 4K frames can crash the tab (a 4K frame is ~30 MB).
4. Video codec: H.264 for compatibility (codec strings must be exact, e.g. `avc1.640028` for High profile 1080p). Bitrate ~8 Mbps for 1080p30. Keyframe every 2 s.
5. Audio: render the full mix with `OfflineAudioContext` (voice ranges with crossfades, room tone, sound effects at peak-aligned times, ducked music, cleanup chain, loudness normalization, limiter), then encode AAC and mux.
6. Progress events to the UI (frames done / total, estimated time left). A Cancel button that stops work, releases everything, and never downloads a partial file.
7. Output: `unboring-<title>.mp4`, plus `.srt` and `.vtt` caption files, plus (optional) a YouTube chapter list text (first chapter at 0:00, ≥ 3 chapters, each ≥ 10 s).

Resolution options: 1080p (default), 720p, and vertical 1080×1920 (reframes around `faceTrack`; v2 if time is short).

---

## 22. Editor UI

**Design:** a deliberate, distinctive look (not a default component-library theme). Dark editing workspace, one accent color, generous spacing, smooth micro-animations using the same easing constants as the engine. Must work at laptop widths (1280px+); the homepage must also work on phones.

**Layout:**

| Area | Contents |
| --- | --- |
| Center | Preview canvas (16:9), play/pause, time display, fullscreen |
| Left | Transcript: words as clickable spans; cut words shown struck-through and dimmed; fillers underlined; chapter headings inline |
| Bottom | Timeline: waveform, keep ranges as blocks, cut edges as draggable handles, a row of graphic chips pinned to their words, sound markers, playhead |
| Right | Style gallery (3 presets with live 3-second preview thumbnails), Inspector (selected item's props), Verifier panel ("Checked N graphics...") |
| Top | Project title, undo/redo, Export button, processing status |

**Interactions:**

- **Click a word** → seek there. **Select words + Delete** → `deleteWords` (they're cut, shown struck-through). **Click a struck word** → restore.
- **Drag a cut edge** → ripple edit by default: everything after slides, no gaps. The edge **snaps to word boundaries + padding**. Hold Alt to drag freely (in 1-frame steps). While dragging, the preview shows the frame at the edge live.
- **Click a graphic** in the preview or timeline → select; edit text in the Inspector (validated against the template schema; live update). Drag its chip to a different word → `repinGraphic`. Delete key removes it.
- **Style switch** → swaps `plan.style` to that style's pre-generated plan, **keeping user edits** to cuts (user cuts are stored as operations and replayed on top of the new style's plan).
- **Keyboard:** Space play/pause, J/K/L back/pause/forward, ←/→ one frame, Delete remove selection, Cmd/Ctrl+Z undo, Cmd/Ctrl+Shift+Z redo.
- **Autosave** the plan (and operation log) every change.
- **Stretch goal: edit by asking.** A command box: "make the intro punchier." Muse Spark receives the current plan section and returns operations (not a whole new plan); the operations are validated and applied, and the preview updates instantly. Every AI edit is undoable.

**Homepage (also the pitch):**

- Headline: "Make boring watchable."
- A raw vs UnBoring toggle on the Constitution clip (the main hook).
- My story, in my words (I'll write it): I edit videos with code, hated waiting for renders, and making talking videos entertaining takes hours.
- "How it works" in 3 steps: upload, pick a style, watch and tweak.
- The time-test and skip-test numbers once I have them.
- "Built with Meta: Muse Spark, SAM 3.1, Muse Image."
- Buttons: "Try the sample" and "Make your video unboring."

---

## 23. Presets (the dials)

Each preset is one config object. The detail-pass prompt receives the whole object as rules.

| Dial | Explainer | Podcast Clip | Courtroom Drama |
| --- | --- | --- | --- |
| Use for | Long-form YouTube explainers | Short-form clips, punchy talk | The Constitution demo's big moments |
| Cut silences longer than | 0.50 s | 0.35 s | 0.50 s (keeps marked dramatic pauses) |
| Padding | 0.10 s | 0.06 s | 0.10 s |
| Visual change every | 10–15 s | 5–10 s | 10–20 s + big moments |
| Punch-ins | At topic changes, 1.15× | Key lines, 1.2–1.3×, max 1 per 8 s | Dramatic slow pushes, impact shakes on stamps |
| Captions | `activeWordBox` | `boldPop` | `typewriter` for quotes, `boldPop` otherwise |
| Main templates | keywordCard, flowDiagram, statCallout, barChart, unitChart, listBuild, documentHighlight, phraseMontage, calloutArrow, aiImage | iconPop, emoji, socialCard, circleDraw, hookText | stamp, quoteCard, titleBehind, documentHighlight, aiImage |
| Transitions | push, whip at chapters | zoom (rare) | dipToBlack, cutToBlack |
| Sounds | whoosh, click, page turn, pop | whoosh, pop, record scratch | gavel, riser, reverse riser, hit, ticking |
| Music | light, ducked −12 dB | upbeat, ducked −14 dB | tension, cut before big lines |
| Color | cleanBright | cleanBright | highContrast + vignette |
| Animation | ease-out entrances, medium speed, rare overshoot | springs, snappy, small overshoot | hard ease-out with hits, long holds |

Rules shared by all presets: one highlighted caption word per chunk max; zooms only at sentence or clause starts; the first 30 seconds get visual changes every 10–15 s, then spread to every 25–40 s for calm stretches; a big moment about every 3 minutes; the last 20 seconds stay clean.

---

## 24. Accessibility, safety, privacy

- **Flash limiter (hard rule):** in `engine/safety.ts`, track luminance changes of full-frame and large-area effects (dips to white, glitches, shakes with flashes, stamps). If more than 3 flashes would occur in any 1-second window, soften or skip the extra ones. Unit-test it. Applies in preview and export.
- **Calm mode** export option: disables shakes, crash zooms, and fast transitions.
- **Captions on by default**; caption file always exported.
- **No fake speech, ever.** No voice cloning, no generated dialogue.
- **Privacy:** tell users which parts of their video go to which AI service. Delete uploads after 7 days. Never use uploads for anything except their own edit.
- **Licenses:** every bundled asset (fonts, icons, sounds, music, Lottie files, the Constitution scan) is listed with its license in `LICENSES.md`. No copyrighted movie clips, TV, or memes.
- **Watermark:** Muse Image outputs carry Meta's invisible watermark; don't strip metadata.

---

## 25. Performance budgets

| Thing | Budget |
| --- | --- |
| `drawFrame` at 720p preview | < 12 ms average, < 25 ms worst (33 ms per frame at 30 fps) |
| Dropped frames during 20-min preview playback | 0 on a normal laptop |
| Time from upload to first playable chunk | < 3 minutes for a 20-minute video (target) |
| Style switch | < 100 ms (plans are pre-generated) |
| Edit (drag cut, delete words) to updated preview frame | < 50 ms |
| Memory during preview | < 1.5 GB |
| Export speed | ≥ 1× real time at 1080p on a normal laptop (target) |

Techniques: proxy for preview, skip the speaker layer when no effect needs it, cache measured text and paths in `prepare`, preload assets 10 s ahead, reuse offscreen canvases, never allocate per frame, decode in workers.

---

## 26. Error handling

- Every pipeline stage can fail independently. The UI shows which stage failed and offers "Retry stage." The project stays usable with whatever stages succeeded (e.g. no mask → no behind effects; no images → no image templates; AI plan failed → plain cut + captions edit still works).
- Upload limits: 10 minutes and 2 GB for public uploads. Clear messages for unsupported files.
- If the browser lacks `requestVideoFrameCallback` or WebCodecs, show a friendly "Use a recent Chrome or Edge" message.
- Never show raw stack traces to users. Log details to the console in dev.

---

## 27. Testing

**Unit tests (Vitest / pytest):**

- `timeMap`: every edge case listed in Section 10.
- Cut detection: long pause cut; "um" with no gap NOT cut; "um" with gaps cut; retake keeps the last take; padding never overlaps neighbors.
- Caption chunking and line breaking: the Netflix rules; numbers rule; never a lonely top word.
- Easing and spring functions: endpoints exactly 0 and 1; monotonic where expected; overshoot within bounds.
- Plan validation: rejects bad word references, overlapping keeps, invalid template props.
- Plan operations: each operation is pure; applying the same operation twice with the same ID is a no-op; undo restores the exact previous plan.
- Flash limiter: 5 flashes in one second → at most 3 remain.

**Visual tests (Playwright):**

- Each template rendered at local times 0, 25%, 50%, 100% to PNG snapshots; compare against approved images.
- **Golden-frame test (the "preview equals export" proof):** for a fixture video and plan, render frames at 20 chosen output times through the preview path and through the export path at the same resolution; pixel difference must be below a small threshold (allow for video decode differences). Run this in CI on every commit after Day 3.

**Fixtures** (`fixtures/`, never shipped): a 30-second talking clip with pauses, fillers, and one retake; a 2-minute Constitution excerpt; expected `words.json` and `keep.json` outputs.

**Manual demo checklist** (run on Nov 2 and Nov 3): full 20-minute Constitution preview with zero stalls; style switch; drag-fix a clipped word; delete a sentence in the transcript; verifier panel shows real numbers; export completes and plays in VLC and QuickTime; captions file opens; homepage works on a phone.

---

## 28. Build plan by day

Dates are Oct 26 – Nov 4, 2026. Each day ends with the app running and the acceptance checks passing.

**Before kickoff (Oct 23–25), by me, not code:** record the Constitution reading (Articles I and II, about 20 minutes) on a still camera, plain contrasting background, light in front of me, plus 5 seconds of the empty room right before; time myself editing a 5-minute chunk by hand (the time test); download the National Archives Constitution scans and transcript. (If the official rules say all project materials must be created during the event, re-record the footage on Oct 26 or 27; it only takes about 25 minutes.)

**Day 1 (Oct 26): Skeleton + ingest.**
After the 12:00 PM ET kickoff, start a brand-new public GitHub repo (only work done during the event counts). First commit: this file, `.env.example`, and the empty layout. Also today: claim the $150 Meta credits (form in the guide; a card is required), request Modal credits, and post in `#questions` about the Constitution demo (Section 31).
Repo per Section 8. FastAPI upload endpoint, ffmpeg normalize + proxy + audio, WhisperX on Modal producing `words.json`, CrisperWhisper comparison, SSE progress. Web: upload page and a bare editor page that loads the proxy.
✅ Upload the 30-second fixture → see words with timestamps in the browser.

**Day 2 (Oct 27): Engine core.**
`timeMap` with tests. Silero VAD + cut detection (Section 12) producing `keep[]`. Preview player with A/B double buffering playing the proxy **with jump cuts and no stalls**. `drawFrame` with room layer + `minimal` captions. Mask pipeline experiment (SAM 3.1 API or fallback) producing `mask.mp4`; decide the mask sync approach.
✅ The 2-minute Constitution excerpt plays with all pauses removed, captions in sync, zero dropped frames in the debug overlay.

**Day 3 (Oct 28): AI planning + templates.**
Watch "Agents 102: Best Practices for Verifiable Agents" (12:00 PM ET livestream) and write down anything that changes the verifier design (Section 13.4).
Meta client, structure pass, detail pass, merge, validation + retries. Template system + first 6 templates (`hookText`, `titleCard`, `keywordCard`, `iconPop`, `statCallout`, `titleBehind`). Speaker layer compositing. Camera moves (punchIn, slowPush, reframe). Explainer preset config. Golden-frame test harness.
✅ Upload → AI-planned Explainer edit plays end to end on the 2-minute excerpt with at least 5 AI-placed graphics.

**Day 4 (Oct 29): Full-length + the check.**
Chunked processing for the full 20-minute video. `flowDiagram`, `listBuild`, `documentHighlight`. `boldPop` and `activeWordBox` captions. Sound library with peak alignment.
✅ **Scope check:** the full 20-minute Constitution video plays end to end in Explainer style with no stalls. **If not, stop adding features. Cut Courtroom Drama, phrase montage, Muse Image, and edit-by-asking. Spend Day 5 making the core reliable.**

**Day 5 (Oct 30): Editing.**
Transcript editing (delete/restore words), timeline with draggable snapping cut edges (ripple), graphic selection + Inspector + re-pinning, undo/redo with plan versions, autosave.
✅ I can fix a clipped last word by dragging in under 5 seconds, and undo it.

**Day 6 (Oct 31): Second style + switching.**
Podcast Clip preset, background generation of all style plans, instant style switching that preserves my cut edits, style gallery with live thumbnails. Transitions (push, zoom, dipToBlack).
✅ Switch styles on the same moment in < 100 ms; my edits survive the switch.

**Day 7 (Nov 1): Verifier + images + audio.**
Verifier pass + Verifier panel with real counts, Constitution reference text loaded. Muse Image + `aiImage` (if API access confirmed). Voice cleanup chain, ducking, music. Color looks + vignette.
✅ Verifier panel shows real numbers on the full video; every quote on screen matches the Constitution text.

**Day 8 (Nov 2): Export + skip test.**
Export worker with Mediabunny (video + mixed audio, loudness normalization, captions files, chapters), progress + cancel. Courtroom Drama preset + `stamp` + `quoteCard` if Day 4 passed. Run the **skip test** with 10–20 people (coin flip raw vs UnBoring; seconds watched) and the time test with UnBoring.
✅ The 20-minute export finishes, plays in VLC/QuickTime, and matches the preview (golden-frame test passes).

**Day 9 (Nov 3): Polish + deploy.**
Homepage with the raw vs UnBoring toggle and real numbers. Deploy (Section 29). Public upload with limits. Error states. Calm mode. README. Record the demo video (Section 30) twice.
✅ A friend who has never seen it can open the live link, try the sample, upload their own video, and export.

**Day 10 (Nov 4): Ship.**
Fix only critical bugs. Final demo video (3:00 max). Check the repo is public, the video link opens in a private window, and the README has "Built during the Hackathon." Submit by noon ET (deadline 9:00 PM ET). Post the demo on X and add the post link to the submission.
✅ Submitted.

**Stretch goals, only after Day 8 passes:** edit-by-asking, vertical export, phrase montage, WebGL LUT color, Lottie stickers, clean-plate effects (dolly zoom, background blur without holes).

---

## 29. Deployment and cost

- Frontend: static deploy (Vercel, Netlify, or Cloudflare Pages). Must be served over HTTPS (WebCodecs and some APIs require a secure context).
- Backend: FastAPI on a small always-on host (Render, Fly.io, or Modal web endpoints); GPU functions on Modal.
- Storage: one bucket for uploads, proxies, masks, plans, assets; signed URLs; lifecycle rule deleting after 7 days.
- Environment variables: `META_API_KEY`, `MODAL_TOKEN_*`, `STORAGE_*`, `PUBLIC_UPLOAD_MAX_MINUTES=10`, `VISION_MODE=frames`.
- Pre-process the sample Constitution project once and serve it, so "Try the sample" is instant and never depends on live API calls during judging. (This is not faking: the same pipeline produced it, and judges can upload their own video to see it run live.)
- Rate-limit uploads per IP. Show "high demand, try again in a few minutes" instead of failing silently.

---

## 30. The demo (what all of this is for)

The demo video (~2:45; **the official limit is 3:00**) follows these beats. It is judged as one of the primary artifacts (Demo is 25% of the score, and the final round is judges watching it live), and it must show only work built during the Hackathon. The engine must make every beat work flawlessly:

1. **0:00** Raw clip of me reading Article I, flat and dull. Small timer "0:08 of 20:00."
2. **0:08** Smash cut to the same moment in UnBoring: "ARTICLE I" behind me, captions, a punch-in. "Same footage. Same words."
3. **0:15** Me on camera: "I edit videos with code, and I hated waiting on a render just to see one change. And making a talking video entertaining takes hours. So I built UnBoring."
4. **0:30** Upload the raw 20-minute file, click "Make it UnBoring."
5. **0:40** Style gallery: the same 10 seconds in Explainer, Podcast Clip, and Courtroom Drama, switched instantly.
6. **1:05** Explainer: the "how a bill becomes a law" flow diagram builds itself as I read Article I, Section 7.
7. **1:25** A clipped last word: drag the cut edge, it snaps, fixed. Delete a sentence in the transcript.
8. **1:40** Scrub to minute 18: it's all there. The Verifier panel: "Checked [N] graphics: [X] removed, [Y] corrected."
9. **1:50** Two numbers: hours by hand vs minutes with UnBoring; average seconds watched, raw vs UnBoring.
10. **2:05** The pipeline diagram: Muse Spark plans and checks the edit, SAM 3.1 cuts me out, Muse Image draws visuals, and my own engine means what you preview is exactly what you export.
11. **2:25** Export, then the payoff: a "VETOED"-style stamp. "If it can make the Constitution entertaining, it can make your video entertaining."
12. **2:40** Cut to black.

My face and my own voice throughout. No AI voiceover. Keep all on-screen text and narration about the Constitution neutral and procedural (Section 3): no opinions on current politics, politicians, or parties.

After submitting, post the demo on X and submit the post link through the hackathon platform (Most Viral Project bonus, engagement counted through Nov 8), and share the public gallery link with my audience once the community vote opens Nov 9.

---

## 31. Open questions to resolve at kickoff (Oct 26)

Answered by the official Participant Guide (see Section 3): submission requirements, the new-work rule, public repo, judging weights, prizes, and how to claim credits. Still open; update this file with the answers:

1. **Eligibility and age.** The Participant Guide has no age rule. A secondary source claimed 18+. Check the official terms linked from the registration page, or ask in Discord `#questions`, before relying on prize eligibility.
2. **Constitution demo vs. "anything political."** Ask in `#questions` whether a neutral reading of the US Constitution is fine. Until answered, keep the demo strictly procedural and non-partisan (Section 3).
3. SAM 3.1 mask encoding format and video size limits (dev.meta.ai docs).
4. Muse Spark video-input pricing (decides `VISION_MODE`).
5. Whether Modal credits arrive (needed for WhisperX); fallback is a CPU run or Muse Voice Transcribe plus forced alignment.
6. My footage: real resolution and container from the Chromebook (sets the zoom cap and export resolution).

---

## 32. Definition of done

UnBoring is done when:

- [ ] A stranger can open the live link, upload a 5-minute talking video, and within a few minutes watch a styled edit play instantly, with no rendering.
- [ ] The full 20-minute Constitution video previews end to end with zero stalls.
- [ ] Explainer and Podcast Clip work; style switching is instant and keeps user edits.
- [ ] Cut edges snap to words when dragged; transcript deletion works; undo works.
- [ ] The Verifier panel shows real numbers and every quote on screen matches the Constitution.
- [ ] Export produces an MP4 that matches the preview (golden-frame test passes), at −14 LUFS, plus caption files.
- [ ] No more than 3 flashes per second anywhere, enforced by code.
- [ ] README explains how to run it, the architecture, and the Meta models used, and has a "Built during the Hackathon" section.
- [ ] Repo is public and every commit is from Oct 26 or later.
- [ ] The demo video is recorded, 3:00 or less, in my own voice, showing only work built during the Hackathon.
- [ ] Submitted before noon ET on Nov 4.

Build it so it works on demo day. Simple and reliable beats impressive and broken.
