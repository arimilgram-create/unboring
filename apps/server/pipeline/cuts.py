"""Cut detection: remove dead air, fillers and retakes without clipping words (spec Section 12).

Input: words[] (with times), speech segments from VAD, video duration, preset settings.
Output: keep[] ranges, each pinned to words (fromWord..toWord) plus padding.
Keep IDs come from their first word ("k_w12"), so running this twice gives identical IDs.
"""
import re
from dataclasses import dataclass
from difflib import SequenceMatcher


@dataclass(frozen=True)
class CutSettings:
    min_silence: float = 0.50    # cut pauses longer than this
    pad: float = 0.10            # handle kept around words so consonants aren't clipped
    merge_gap: float = 0.30      # ranges closer than this are joined (breaths aren't cut)
    remove_fillers: bool = True
    filler_quiet: float = 0.08   # a filler needs this much quiet on both sides to be cut cleanly
    retake_min_words: int = 4
    retake_window: float = 15.0  # seconds
    retake_similarity: float = 0.8


PRESETS = {
    "explainer": CutSettings(),
    "podcastClip": CutSettings(min_silence=0.35, pad=0.06, merge_gap=0.25),
    "courtroomDrama": CutSettings(),
}

_norm = re.compile(r"[^a-z0-9']+")


def _token(text: str) -> str:
    return _norm.sub("", text.lower())


def removable_fillers(words: list[dict], s: CutSettings) -> set[int]:
    """Fillers with clean quiet on both sides. "um" glued to the next word stays (no harsh cuts)."""
    out = set()
    if not s.remove_fillers:
        return out
    for i, w in enumerate(words):
        if not w["isFiller"]:
            continue
        before = w["start"] - words[i - 1]["end"] if i > 0 else s.filler_quiet
        after = words[i + 1]["start"] - w["end"] if i + 1 < len(words) else s.filler_quiet
        if before >= s.filler_quiet and after >= s.filler_quiet:
            out.add(i)
    return out


def retakes(words: list[dict], skip: set[int], s: CutSettings) -> list[tuple[int, int]]:
    """Back-to-back repeated phrases. Returns (first, last) word indexes of each EARLIER take to cut.

    Speakers repeat a line until they're happy, so the last take wins. Only an immediate repeat
    counts: take A is words i..j-1 and the next words j.. say (nearly) the same thing.
    """
    idx = [i for i in range(len(words)) if i not in skip]       # ignore fillers between takes
    toks = [_token(words[i]["text"]) for i in idx]
    found, a = [], 0
    while a < len(idx):
        hit = None
        for b in range(a + s.retake_min_words, min(len(idx), a + 30) + 1):
            n = b - a
            if b + s.retake_min_words > len(idx):
                break
            if words[idx[b]]["start"] - words[idx[a]]["start"] > s.retake_window:
                break
            first, second = toks[a:b], toks[b:b + n]
            # The first take is often cut short ("We the people of— We the People of the United States"),
            # so compare it with the same number of words from the start of the second take.
            if len(second) >= s.retake_min_words and SequenceMatcher(None, first, second[:n]).ratio() >= s.retake_similarity:
                hit = b
                break
        if hit is not None:
            found.append((idx[a], idx[hit - 1]))
            a = hit
        else:
            a += 1
    return found


def _speech_in(segments: list[dict], start: float, end: float) -> float:
    """Seconds of detected speech between start and end."""
    return sum(max(0.0, min(end, g["end"]) - max(start, g["start"])) for g in segments)


def detect(words: list[dict], speech: list[dict], duration: float, s: CutSettings) -> dict:
    if not words:
        return {"keep": [], "removed": {"fillers": [], "retakes": [], "pauses": 0}}
    fillers = removable_fillers(words, s)
    takes = retakes(words, fillers, s)
    dropped = set(fillers)
    for a, b in takes:
        dropped.update(range(a, b + 1))

    # 1. Group kept words into runs. Break at a dropped word, or at a long pause that VAD confirms is silent.
    runs: list[list[int]] = [[]]
    pauses = 0
    prev = None
    for i, w in enumerate(words):
        if i in dropped:
            if runs[-1]:
                runs.append([])
            prev = None
            continue
        if prev is not None:
            gap_start, gap_end = words[prev]["end"], w["start"]
            if gap_end - gap_start > s.min_silence and _speech_in(speech, gap_start, gap_end) < 0.15:
                runs.append([])
                pauses += 1
        runs[-1].append(i)
        prev = i
    runs = [r for r in runs if r]
    if not runs:
        return {"keep": [], "removed": {"fillers": [], "retakes": [], "pauses": 0}}

    # 2. Merge runs separated by a tiny gap, unless something was deliberately removed between them.
    merged: list[list[int]] = [runs[0]]
    for r in runs[1:]:
        last = merged[-1]
        between_dropped = any(j in dropped for j in range(last[-1] + 1, r[0]))
        if not between_dropped and words[r[0]]["start"] - words[last[-1]]["end"] < s.merge_gap:
            last.extend(r)
        else:
            merged.append(r)

    # 3. Padding, clamped so ranges never overlap each other or leave the video.
    keep = []
    for k, r in enumerate(merged):
        first, last = words[r[0]], words[r[-1]]
        room_before = first["start"] if k == 0 else (first["start"] - words[merged[k - 1][-1]]["end"]) / 2
        room_after = (duration - last["end"]) if k == len(merged) - 1 else (words[merged[k + 1][0]]["start"] - last["end"]) / 2
        keep.append({
            "id": f"k_{first['id']}",
            "fromWord": first["id"], "toWord": last["id"],
            "padStart": round(max(0.0, min(s.pad, room_before)), 3),
            "padEnd": round(max(0.0, min(s.pad, room_after)), 3),
            "reason": "auto",
        })
    return {"keep": keep, "removed": {
        "fillers": [words[i]["id"] for i in sorted(fillers)],
        "retakes": [[words[a]["id"], words[b]["id"]] for a, b in takes],
        "pauses": pauses,
    }}
