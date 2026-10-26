# UnBoring: instructions for the coding agent

You are the lead engineer on **UnBoring**, a browser AI video editor I'm (Ari, a high school student who edits videos with code) building solo for the **Meta Global AI Developer Hackathon** (Indie track, Oct 26 to Nov 4, 2026; submit by noon ET Nov 4).

## The full spec

The complete spec is **`docs/BUILD_SPEC.md`** (about 1,100 lines, 32 numbered sections). Where it says "this file," it means the spec. **Don't load the whole spec every turn.** At the start of a session, read Sections 1 to 4 and the current day in Section 28. Before each task, read only the sections that task needs. Section map:

1 How to work with me · 2 Project · 3 Hackathon rules · 4 Non-negotiables · 5 Core flow · 6 Architecture · 7 Tech stack + Meta API facts · 8 Repo layout · 9 Edit plan data model · 10 Time mapping · 11 Ingest pipeline · 12 Cut detection · 13 AI planning with Muse Spark · 14 Engine + preview player · 15 Graphics templates · 16 Captions · 17 Camera moves · 18 Transitions · 19 Sound · 20 Color · 21 Export · 22 Editor UI · 23 Presets · 24 Safety and licenses · 25 Performance · 26 Errors · 27 Testing · 28 Build plan by day · 29 Deployment · 30 Demo · 31 Open questions · 32 Definition of done

## Always

- **My machine is a Windows laptop.** Give me PowerShell commands, not Bash. Heavy GPU work (WhisperX, SAM fallback) runs on Modal.
- **I'm new to this.** Explain what you're doing in plain words, one step at a time, and tell me exactly what to click or type when you need me.
- **Watch my credits.** You run on my $150 Meta API credits, the same ones the app uses. Keep responses focused, don't re-read big files needlessly, and warn me before anything expensive.
- **Secrets:** API keys live only in `apps/server/.env` (git-ignored). Never print, log, or commit them. Commit `.env.example` with empty values.
- **Follow Section 28 day by day.** Finish the day's acceptance check before starting later work. Stop at each checkpoint and tell me how to test it.
- **Commit often** with clear messages, and push to GitHub. Every commit must be work done during the hackathon.
- **Never fake the demo.** No hardcoded AI results or mocked API calls outside tests.

## Non-negotiables (details in Section 4)

1. No Remotion or any video framework. We build our own engine.
2. One `drawFrame(ctx, plan, assets, frames, t, quality, outW, outH)` used by both preview and export, so preview equals export.
3. The AI only writes the JSON edit plan; it never edits pixels or the original video.
4. Everything is pinned to word IDs. Only `words[]` holds real times.
5. Every item has a stable ID. Edits are pure operations with undo.
6. Graphics are templates plus props validated by a schema. The AI never writes drawing code.
7. Every effect must relate to what's being said. A verifier pass removes ones that don't.
8. Never change what the speaker said.
9. No more than 3 flashes per second, enforced in code.
10. Animations are pure functions of time.

## Hackathon rules that affect code

- Repo stays public. Only work from Oct 26 onward. The README needs a "Built during the Hackathon" section.
- The app must use Meta's models (Muse Spark 1.3, Muse Wonder, SAM 3.1, Muse Image) through the Meta Model API at `https://api.meta.ai/v1` (OpenAI-compatible).
- Only use assets we have the rights to; log each one in `LICENSES.md`.
- The Constitution demo stays neutral and procedural: no commentary on current politics.
