"""Builds the first edit plan (spec Section 9) from words + cuts. The browser draws everything from this."""
import time


def initial_plan(pid: str, source: dict, words: list[dict], keep: list[dict], style: str = "explainer") -> dict:
    return {
        "version": 1,
        "planId": pid,
        "revision": 1,
        "createdAt": time.time(),
        "source": {
            "id": pid,
            "originalUrl": source["originalUrl"],
            "proxyUrl": source["proxyUrl"],
            "maskUrl": None,          # SAM 3.1 speaker mask: needs Meta API or Modal (later)
            "cleanPlateUrl": None,
            "fps": source["fps"],
            "width": source["width"],
            "height": source["height"],
            "duration": source["duration"],
            "faceTrack": [],
        },
        "style": style,
        "words": words,
        "keep": keep,
        "chapters": [],
        "camera": [],
        "graphics": [],
        "captions": {"enabled": True, "style": "minimal", "maxWordsPerChunk": 6, "position": "bottom",
                     "highlightWords": [], "safeZone": "landscape"},
        "sounds": [],
        "music": None,
        "transitions": [],
        "color": {"exposure": 0, "contrast": 0, "saturation": 0, "temperature": 0, "look": "none", "vignette": 0},
        "checks": None,
    }


def kept_duration(plan: dict) -> float:
    """Length of the edited video in seconds (same math as the browser's timeMap)."""
    words = plan["words"]
    index = {w["id"]: i for i, w in enumerate(words)}
    total, prev_end = 0.0, 0.0
    dur = plan["source"]["duration"] or float("inf")
    for k in sorted(plan["keep"], key=lambda k: index.get(k["fromWord"], 0)):
        a, b = index.get(k["fromWord"]), index.get(k["toWord"])
        if a is None or b is None or b < a:
            continue
        start = max(prev_end, words[a]["start"] - k["padStart"], 0.0)
        end = min(dur, words[b]["end"] + k["padEnd"])
        if end > start:
            total += end - start
            prev_end = end
    return total


def validate(plan: dict, original: dict) -> str | None:
    """Reasons a plan sent by the browser can't be saved, or None if it's fine (spec Section 9 rules)."""
    if [w["id"] for w in plan.get("words", [])] != [w["id"] for w in original["words"]]:
        return "Words can't be changed, only cut or restored."
    index = {w["id"]: i for i, w in enumerate(plan["words"])}
    spans = []
    ids = set()
    for k in plan.get("keep", []):
        if k.get("id") in ids:
            return f"Duplicate keep id {k.get('id')}"
        ids.add(k.get("id"))
        a, b = index.get(k.get("fromWord")), index.get(k.get("toWord"))
        if a is None or b is None or b < a:
            return f"Keep range {k.get('id')} points at missing words"
        if not (0 <= k.get("padStart", -1) <= 2 and 0 <= k.get("padEnd", -1) <= 2):
            return f"Keep range {k.get('id')} has bad padding"
        spans.append((a, b))
    spans.sort()
    for (a1, b1), (a2, b2) in zip(spans, spans[1:]):
        if a2 <= b1:
            return "Keep ranges overlap"
    return None
