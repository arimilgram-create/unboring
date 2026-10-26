"""Voice activity detection with Silero VAD (spec Section 11.4).

Uses the Silero model that ships inside faster-whisper, so nothing extra is downloaded.
More reliable than "is it quiet?" volume checks: breathing and room noise don't count as speech.
"""
from pathlib import Path

from faster_whisper.vad import VadOptions, get_speech_timestamps

from pipeline.transcribe import load_wav

SR = 16000


def speech_segments(audio: Path) -> list[dict]:
    """[{start, end}] in seconds where someone is talking."""
    samples = load_wav(audio)
    opts = VadOptions(threshold=0.5, min_speech_duration_ms=120, min_silence_duration_ms=150, speech_pad_ms=30)
    return [{"start": round(s["start"] / SR, 3), "end": round(s["end"] / SR, 3)}
            for s in get_speech_timestamps(samples, opts)]
