"""Settings, read once from apps/server/.env (git-ignored) and the environment."""
import os
import shutil
from pathlib import Path

from dotenv import load_dotenv

SERVER_DIR = Path(__file__).resolve().parent
load_dotenv(SERVER_DIR / ".env")

DATA_DIR = Path(os.getenv("UNBORING_DATA_DIR", SERVER_DIR / "data"))
PROJECTS_DIR = DATA_DIR / "projects"
PROJECTS_DIR.mkdir(parents=True, exist_ok=True)

# "local" = faster-whisper on this computer (works with no accounts).
# "modal" = WhisperX on a Modal GPU (needs a Modal account; see modal_app.py).
TRANSCRIBE_BACKEND = os.getenv("TRANSCRIBE_BACKEND", "local")
# Model size for the local backend. "base.en" is fast on a laptop CPU; "small.en" is more accurate.
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base.en")

FPS = 30
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "2048"))


def ffmpeg_path() -> str | None:
    return os.getenv("FFMPEG") or shutil.which("ffmpeg")


def ffprobe_path() -> str | None:
    return os.getenv("FFPROBE") or shutil.which("ffprobe")
