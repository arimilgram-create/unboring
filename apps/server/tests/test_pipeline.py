"""End-to-end ingest with a generated test video and a fake transcriber (no model download)."""
import subprocess
import time

import pytest
from fastapi.testclient import TestClient

import config
from main import app
from pipeline import transcribe

pytestmark = pytest.mark.skipif(not config.ffmpeg_path(), reason="needs ffmpeg")


@pytest.fixture
def clip(tmp_path):
    path = tmp_path / "clip.webm"
    subprocess.run([config.ffmpeg_path(), "-loglevel", "error", "-f", "lavfi", "-i", "testsrc=size=1280x720:rate=25",
                    "-f", "lavfi", "-i", "sine=frequency=440", "-t", "3", "-c:v", "libvpx", "-c:a", "libopus",
                    str(path)], check=True)
    return path


def test_upload_to_words(clip, monkeypatch):
    monkeypatch.setattr(transcribe, "transcribe", lambda audio, cb: [
        {"text": "We", "start": 0.1, "end": 0.3}, {"text": "um,", "start": 0.5, "end": 0.7},
        {"text": "the", "start": 1.2, "end": 1.3}, {"text": "People", "start": 1.3, "end": 1.8}])
    c = TestClient(app)
    with clip.open("rb") as f:
        pid = c.post("/api/projects", files={"file": ("my clip.webm", f, "video/webm")}).json()["id"]
    for _ in range(150):
        status = c.get(f"/api/projects/{pid}").json()
        if status["state"] != "processing":
            break
        time.sleep(0.2)
    assert status["state"] == "ready", status
    assert status["source"]["width"] == 1280 and status["source"]["fps"] == 30
    words = c.get(f"/api/projects/{pid}/words").json()
    assert [w["text"] for w in words] == ["We", "um,", "the", "People"]
    assert words[1]["isFiller"] and not words[0]["isFiller"]
    # The browser seeks video with Range requests; make sure they work.
    r = c.get(f"/files/{pid}/proxy.mp4", headers={"Range": "bytes=0-99"})
    assert r.status_code == 206 and len(r.content) == 100
    # Normalized file really is constant 30 fps.
    out = subprocess.run([config.ffprobe_path(), "-v", "error", "-select_streams", "v", "-show_entries",
                          "stream=r_frame_rate,avg_frame_rate", "-of", "csv=p=0",
                          str(config.PROJECTS_DIR / pid / "original.mp4")], capture_output=True, text=True)
    assert out.stdout.strip().startswith("30/1")
    # Events stream ends once ready.
    assert '"state": "ready"' in c.get(f"/api/projects/{pid}/events").text


def test_rejects_bad_type():
    r = TestClient(app).post("/api/projects", files={"file": ("notes.txt", b"hi", "text/plain")})
    assert r.status_code == 400
