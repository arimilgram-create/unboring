"""ffmpeg steps: normalize to constant 30 fps, make the 720p preview proxy, extract speech audio.

Spec: docs/BUILD_SPEC.md Sections 11.1 and 11.2.
Why normalize first: webcam/Chromebook recordings are often variable frame rate, which breaks
exact timing. Everything after this step works on a clean constant-30-fps file.
"""
import json
import subprocess
from pathlib import Path

import config


class MediaError(RuntimeError):
    pass


def _run(args: list[str]) -> None:
    exe = config.ffmpeg_path()
    if not exe:
        raise MediaError("ffmpeg is not installed or not on PATH. Run setup.bat again.")
    proc = subprocess.run([exe, "-hide_banner", "-loglevel", "error", "-y", *args],
                          capture_output=True, text=True)
    if proc.returncode != 0:
        raise MediaError(proc.stderr.strip()[-800:] or "ffmpeg failed")


def probe(path: Path) -> dict:
    """Width, height, duration (seconds) and whether there's an audio track."""
    exe = config.ffprobe_path()
    if not exe:
        raise MediaError("ffprobe is not installed or not on PATH. Run setup.bat again.")
    proc = subprocess.run(
        [exe, "-v", "error", "-print_format", "json", "-show_streams", "-show_format", str(path)],
        capture_output=True, text=True)
    if proc.returncode != 0:
        raise MediaError("Couldn't read this file. Is it a video?")
    info = json.loads(proc.stdout)
    video = next((s for s in info.get("streams", []) if s.get("codec_type") == "video"), None)
    if video is None:
        raise MediaError("This file has no video track.")
    has_audio = any(s.get("codec_type") == "audio" for s in info.get("streams", []))
    duration = float(info.get("format", {}).get("duration") or video.get("duration") or 0)
    return {"width": int(video["width"]), "height": int(video["height"]),
            "duration": duration, "hasAudio": has_audio}


def normalize(src: Path, dst: Path) -> None:
    """Constant 30 fps H.264 + AAC 48 kHz MP4 (the full-quality file export will use)."""
    _run(["-i", str(src), "-vf", f"fps={config.FPS}", "-c:v", "libx264", "-preset", "medium",
          "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
          "-movflags", "+faststart", str(dst)])


def make_proxy(src: Path, dst: Path) -> None:
    """720p preview copy with a keyframe every 15 frames, so seeking at jump cuts is cheap."""
    _run(["-i", str(src), "-vf", "scale=-2:720", "-c:v", "libx264", "-preset", "veryfast",
          "-crf", "23", "-g", "15", "-keyint_min", "15", "-sc_threshold", "0",
          "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", str(dst)])


def extract_audio(src: Path, dst: Path) -> None:
    """Mono 16 kHz WAV, the format speech models expect."""
    _run(["-i", str(src), "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", str(dst)])
