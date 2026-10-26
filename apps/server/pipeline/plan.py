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
