"""Speech to words with timestamps (spec Section 11.3).

Two backends, picked with TRANSCRIBE_BACKEND in .env:
- "local": faster-whisper on this computer's CPU. No accounts needed. Downloads the model once (~150 MB).
- "modal": WhisperX on a Modal GPU (faster and more accurate word timing). Needs `modal` set up.
Both return raw words; pipeline/words.py turns them into the edit plan's words[].
"""
from pathlib import Path
from typing import Callable

import config

_model = None


def _local(audio: Path, on_progress: Callable[[float], None]) -> list[dict]:
    global _model
    from faster_whisper import WhisperModel  # imported here so the server starts fast

    if _model is None:
        _model = WhisperModel(config.WHISPER_MODEL, device="cpu", compute_type="int8")
    segments, info = _model.transcribe(
        str(audio), language="en", word_timestamps=True, vad_filter=False,
        # Ask Whisper to keep disfluencies instead of cleaning them up.
        initial_prompt="Um, uh, so, I, I mean, like, hmm.")
    total = info.duration or 1.0
    raw = []
    for seg in segments:
        for w in seg.words or []:
            raw.append({"text": w.word, "start": w.start, "end": w.end, "confidence": w.probability})
        on_progress(min(0.99, seg.end / total))
    return raw


def _modal(audio: Path, on_progress: Callable[[float], None]) -> list[dict]:
    import modal  # pip install modal; then `modal setup` once

    fn = modal.Function.from_name("unboring", "transcribe_whisperx")
    on_progress(0.1)
    raw = fn.remote(audio.read_bytes())
    on_progress(0.99)
    return raw


def transcribe(audio: Path, on_progress: Callable[[float], None]) -> list[dict]:
    if config.TRANSCRIBE_BACKEND == "modal":
        return _modal(audio, on_progress)
    return _local(audio, on_progress)
