"""Turn raw speech-model output into the edit plan's `words[]` (spec Section 9, Word).

Word IDs are w0..wN in source order and never change after this step, because every
graphic, camera move and sound in the edit plan points at a word ID.
"""
import re

# Conservative on purpose: "like" and "you know" are NOT marked, because they're usually real words.
FILLERS = {"um", "umm", "uh", "uhh", "er", "erm", "ah", "hmm", "mm", "mhm"}

_strip = re.compile(r"[^\w']+")


def is_filler(text: str) -> bool:
    return _strip.sub("", text.lower()) in FILLERS


def build_words(raw: list[dict]) -> list[dict]:
    """raw: [{"text", "start", "end", "confidence"}] in any order -> clean, sorted, non-overlapping words."""
    items = sorted(
        (r for r in raw if str(r.get("text", "")).strip() and r.get("start") is not None),
        key=lambda r: (float(r["start"]), float(r["end"])))
    words: list[dict] = []
    for r in items:
        start, end = float(r["start"]), float(r["end"])
        if words and start < words[-1]["end"]:          # models sometimes overlap neighbors slightly
            start = words[-1]["end"]
        end = max(end, start + 0.01)                     # every word lasts at least 10 ms
        text = str(r["text"]).strip()
        words.append({
            "id": f"w{len(words)}",
            "text": text,
            "start": round(start, 3),
            "end": round(end, 3),
            "isFiller": is_filler(text),
            "confidence": round(float(r.get("confidence", 1.0)), 3),
            "speechGapAfter": 0.0,
        })
    for a, b in zip(words, words[1:]):
        a["speechGapAfter"] = round(max(0.0, b["start"] - a["end"]), 3)
    return words
