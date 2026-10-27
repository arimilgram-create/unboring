"""AI planning with Muse Spark (spec Section 13): structure pass -> detail pass per chunk -> merge.

The AI only returns JSON referencing word IDs and template names; this file checks every item
(words exist and aren't cut, template exists, props match its schema, camera move allowed),
then merges chunks, removes overlaps and over-frequent zooms, and gives items stable IDs.
"""
import hashlib
import json
import os
import string
import time
from pathlib import Path

import config
from meta import catalog
from meta.meta_client import MetaClient

PROMPTS = config.SERVER_DIR / "prompts"
CHUNK_SECONDS = 120

PRESET_RULES = {
    "explainer": {"description": "Long-form YouTube explainer: clean, clear, confident. Keyword cards, stats, "
                                 "icons for concrete things, gentle punch-ins at topic changes.",
                  "visualChangeEvery": "10-15", "punchInEvery": 15, "minPunchGap": 8.0},
}


def _model(pass_name: str) -> str:
    return os.getenv(f"MODEL_{pass_name.upper()}", "muse-spark-1.3")


def kept_words(plan: dict) -> list[dict]:
    """Kept words in order, each with its OUTPUT start time ("t")."""
    words = plan["words"]
    index = {w["id"]: i for i, w in enumerate(words)}
    out, prev_end, clock = [], 0.0, 0.0
    for k in sorted(plan["keep"], key=lambda k: index.get(k["fromWord"], 0)):
        a, b = index.get(k["fromWord"]), index.get(k["toWord"])
        if a is None or b is None or b < a:
            continue
        start = max(prev_end, words[a]["start"] - k["padStart"], 0.0)
        end = words[b]["end"] + k["padEnd"]
        for i in range(a, b + 1):
            out.append({**words[i], "t": round(clock + words[i]["start"] - start, 2)})
        clock += end - start
        prev_end = end
    return out


def transcript(words: list[dict]) -> str:
    """Compact transcript with word IDs, one sentence per line: [w120]All [w121]legislative ..."""
    lines, cur = [], []
    for w in words:
        cur.append(f"[{w['id']}]{w['text'].strip()}")
        if w["text"].rstrip().endswith((".", "?", "!")):
            lines.append(" ".join(cur))
            cur = []
    if cur:
        lines.append(" ".join(cur))
    return "\n".join(lines)


def chunks(words: list[dict]) -> list[list[dict]]:
    """~2-minute groups, split at sentence ends when possible."""
    out, cur = [], []
    for w in words:
        cur.append(w)
        long_enough = cur[-1]["t"] - cur[0]["t"] >= CHUNK_SECONDS
        if long_enough and w["text"].rstrip().endswith((".", "?", "!")) or cur[-1]["t"] - cur[0]["t"] >= CHUNK_SECONDS * 1.3:
            out.append(cur)
            cur = []
    if cur:
        out.append(cur)
    return out


STRUCTURE_SCHEMA = {
    "type": "object", "additionalProperties": False, "required": ["hook", "chapters", "bigMoments", "tone"],
    "properties": {
        "hook": {"type": "object", "additionalProperties": False, "required": ["type", "text", "atWord"],
                 "properties": {"type": {"type": "string"}, "text": {"type": "string", "maxLength": 60},
                                "atWord": {"type": "string"}}},
        "chapters": {"type": "array", "items": {"type": "object", "additionalProperties": False,
                                                 "required": ["title", "atWord"],
                                                 "properties": {"title": {"type": "string", "maxLength": 40},
                                                                "atWord": {"type": "string"}}}},
        "bigMoments": {"type": "array", "items": {"type": "object", "additionalProperties": False,
                                                   "required": ["kind", "atWord", "untilWord", "why"],
                                                   "properties": {"kind": {"type": "string"}, "atWord": {"type": "string"},
                                                                  "untilWord": {"type": "string"}, "why": {"type": "string"}}}},
        "tone": {"type": "string"},
    },
}


def detail_schema(templates: list[dict]) -> dict:
    return {
        "type": "object", "additionalProperties": False, "required": ["graphics", "camera", "highlightWords"],
        "properties": {
            "graphics": {"type": "array", "items": {
                "type": "object", "additionalProperties": False, "required": ["template", "atWord", "untilWord", "props", "why"],
                "properties": {"template": {"type": "string", "enum": [t["name"] for t in templates]},
                               "atWord": {"type": "string"}, "untilWord": {"type": "string"},
                               "props": {"type": "object"}, "why": {"type": "string"}}}},
            "camera": {"type": "array", "items": {
                "type": "object", "additionalProperties": False, "required": ["move", "atWord"],
                "properties": {"move": {"type": "string", "enum": [m["move"] for m in catalog.camera_moves()]},
                               "atWord": {"type": "string"}, "untilWord": {"type": "string"}}}},
            "highlightWords": {"type": "array", "items": {"type": "string"}},
        },
    }


def _check_words(items: list[tuple[str, str | None]], allowed: dict[str, int]) -> list[str]:
    errs = []
    for label, (a, b) in items:
        if a not in allowed:
            errs.append(f"{label}: atWord {a} is not a word in this chunk")
        elif b is not None and b not in allowed:
            errs.append(f"{label}: untilWord {b} is not a word in this chunk")
        elif b is not None and allowed[b] < allowed[a]:
            errs.append(f"{label}: untilWord {b} comes before atWord {a}")
    return errs


def _stable_id(prefix: str, *parts) -> str:
    return prefix + hashlib.sha1(json.dumps(parts, sort_keys=True).encode()).hexdigest()[:8]


def plan_with_ai(plan: dict, project_dir: Path, client: MetaClient | None = None, on_progress=lambda p: None) -> dict:
    preset = plan.get("style", "explainer")
    rules = PRESET_RULES.get(preset, PRESET_RULES["explainer"])
    has_mask = bool(plan["source"].get("maskUrl"))
    templates = catalog.templates_for(preset, has_mask)
    client = client or MetaClient(project_dir)
    words = kept_words(plan)
    if not words:
        raise ValueError("Nothing to plan: every word is cut.")
    pos = {w["id"]: i for i, w in enumerate(words)}

    # Pass 1: structure (whole video)
    structure = client.structured(
        name="structure", model=_model("structure"), schema=STRUCTURE_SCHEMA, max_output_tokens=3000,
        system=(PROMPTS / "structure.md").read_text(encoding="utf-8"),
        user=f"Style: {preset}: {rules['description']}\nVideo length after cuts: {words[-1]['t']:.0f} s.\n"
             f"Big-moment kinds allowed: {', '.join(t['name'] for t in templates)}.\n\nTranscript:\n{transcript(words)}",
        check=lambda d: _check_words(
            [("hook", (d["hook"]["atWord"], None))]
            + [(f"chapter {c['title']}", (c["atWord"], None)) for c in d["chapters"]]
            + [(f"bigMoment {m['kind']}", (m["atWord"], m["untilWord"])) for m in d["bigMoments"]], pos))
    on_progress(0.2)

    # Pass 2: details, one ~2-minute chunk at a time
    catalog_text = json.dumps([{k: t[k] for k in ("name", "description", "layer", "minSeconds", "props")} for t in templates])
    camera_text = json.dumps(catalog.camera_moves())
    system = string.Template((PROMPTS / "detail.md").read_text(encoding="utf-8")).safe_substitute(
        preset=preset, visualChangeEvery=rules["visualChangeEvery"], punchInEvery=rules["punchInEvery"])
    parts = chunks(words)
    graphics, camera, highlights = [], [], []
    for n, chunk in enumerate(parts):
        ids = {w["id"]: i for i, w in enumerate(chunk)}
        slots = [s for s in ([{"kind": "hookText", "atWord": structure["hook"]["atWord"], "text": structure["hook"]["text"]}]
                             + structure["bigMoments"]) if s["atWord"] in ids]
        chapters_here = [c for c in structure["chapters"] if c["atWord"] in ids]
        before = parts[n - 1][-20:] if n else []

        def check(d, ids=ids):
            errs = _check_words([(f"graphic {g['template']}", (g["atWord"], g["untilWord"])) for g in d["graphics"]]
                                + [(f"camera {c['move']}", (c["atWord"], c.get("untilWord"))) for c in d["camera"]], ids)
            for g in d["graphics"]:
                errs += catalog.props_errors(g["template"], g["props"])
            errs += [f"highlightWords: {h} is not in this chunk" for h in d["highlightWords"] if h not in ids]
            return errs

        result = client.structured(
            name="detail", model=_model("detail"), schema=detail_schema(templates), check=check, max_output_tokens=4000,
            system=system,
            user=f"Template catalog:\n{catalog_text}\n\nCamera moves:\n{camera_text}\n\n"
                 f"Reserved big-moment slots in this chunk: {json.dumps(slots)}\n"
                 f"Chapters starting in this chunk: {json.dumps(chapters_here)}\n"
                 f"Previous words (context only, don't use their IDs): {' '.join(w['text'] for w in before)}\n\n"
                 f"This chunk ({chunk[0]['t']:.0f}s to {chunk[-1]['t']:.0f}s):\n{transcript(chunk)}")
        graphics += result["graphics"]
        camera += result["camera"]
        highlights += result["highlightWords"]
        on_progress(0.2 + 0.8 * (n + 1) / len(parts))

    return merge(plan, structure, graphics, camera, highlights, words, rules)


def merge(plan, structure, graphics, camera, highlights, words, rules) -> dict:
    t_of = {w["id"]: w["t"] for w in words}

    # Graphics: higher priority wins where two on the same layer overlap in time.
    def span(g):
        tpl = catalog.template(g["template"])
        start = t_of[g["atWord"]]
        return start, max(t_of[g["untilWord"]], start + tpl["minSeconds"])

    kept_graphics = []
    for g in sorted(graphics, key=lambda g: -catalog.PRIORITY.get(g["template"], 0)):
        a, b = span(g)
        layer = catalog.template(g["template"])["layer"]
        clash = any(catalog.template(k["template"])["layer"] in (layer, "fullscreen") or layer == "fullscreen"
                    for k in kept_graphics if not (b <= span(k)[0] or a >= span(k)[1]))
        if not clash:
            kept_graphics.append(g)
    kept_graphics.sort(key=lambda g: t_of[g["atWord"]])

    # Camera: enforce the punch-in gap, drop moves that land inside a fullscreen card.
    kept_camera, last_punch = [], -1e9
    for c in sorted(camera, key=lambda c: t_of[c["atWord"]]):
        t = t_of[c["atWord"]]
        if c["move"] == "punchIn":
            if t - last_punch < rules["minPunchGap"]:
                continue
            last_punch = t
        kept_camera.append(c)

    new = dict(plan)
    new["graphics"] = [{
        "id": _stable_id("g_", g["template"], g["atWord"], g["props"]),
        "template": g["template"], "layer": catalog.template(g["template"])["layer"],
        "atWord": g["atWord"], "untilWord": g["untilWord"], "props": g["props"], "placement": "auto",
        "why": g["why"],
    } for g in kept_graphics]
    new["camera"] = [{
        "id": _stable_id("c_", c["move"], c["atWord"]), "move": c["move"], "atWord": c["atWord"],
        **({"untilWord": c["untilWord"]} if c.get("untilWord") else {}),
        "ease": "easeInOut",
    } for c in kept_camera]
    new["chapters"] = [{"id": _stable_id("ch_", c["atWord"]), "title": c["title"], "atWord": c["atWord"]}
                       for c in structure["chapters"]]
    new["captions"] = {**plan["captions"], "highlightWords": list(dict.fromkeys(highlights))}
    new["revision"] = plan.get("revision", 1) + 1
    new["ai"] = {"ranAt": time.time(), "hook": structure["hook"], "tone": structure["tone"],
                 "bigMoments": structure["bigMoments"]}
    return new
