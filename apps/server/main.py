"""UnBoring API server (FastAPI). Run: python -m uvicorn main:app --port 8000

Routes:
  POST /api/projects                 upload a video, start processing
  GET  /api/projects/{id}            project status (+ source info)
  GET  /api/projects/{id}/events     live progress (Server-Sent Events)
  GET  /api/projects/{id}/words      transcript words with timestamps
  GET  /api/projects/{id}/plan       the edit plan (words, keep ranges, ...)
  GET  /api/projects/{id}/cuts       what the automatic cuts removed, and why
  POST /api/projects/{id}/retry      re-run from the first unfinished stage
  GET  /files/{id}/proxy.mp4         media files for the browser
"""
import asyncio
import json
import re
import shutil
import uuid
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request, UploadFile
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles

import config
from pipeline import runner

app = FastAPI(title="UnBoring")

ALLOWED = {".mp4", ".mov", ".webm", ".mkv", ".m4v", ".avi"}
_ID = re.compile(r"^[a-f0-9]{12}$")


def _check_id(pid: str) -> str:
    if not _ID.match(pid) or not runner.project_dir(pid).exists():
        raise HTTPException(404, "Project not found")
    return pid


@app.get("/api/health")
def health():
    return {"ok": True, "ffmpeg": bool(config.ffmpeg_path()), "transcribe": config.TRANSCRIBE_BACKEND}


@app.post("/api/projects")
async def create_project(file: UploadFile):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED:
        raise HTTPException(400, f"Unsupported file type '{ext}'. Use MP4, MOV, WebM or MKV.")
    pid = uuid.uuid4().hex[:12]
    folder = runner.project_dir(pid)
    folder.mkdir(parents=True)
    dest = folder / f"input{ext}"
    size, limit = 0, config.MAX_UPLOAD_MB * 1024 * 1024
    with dest.open("wb") as out:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > limit:
                out.close()
                shutil.rmtree(folder, ignore_errors=True)
                raise HTTPException(413, f"File is over {config.MAX_UPLOAD_MB} MB.")
            out.write(chunk)
    runner.new_status(pid, Path(file.filename).stem, dest.name)
    runner.start(pid)
    return {"id": pid}


@app.get("/api/projects/{pid}")
def get_project(pid: str):
    status = runner.read_status(_check_id(pid))
    # Projects made before a new stage existed: finish the missing stages (finished ones are skipped).
    if status["state"] == "ready" and not (runner.project_dir(pid) / "plan.json").exists():
        status = runner.new_status(pid, status["name"], status["input"])
        runner.start(pid)
    return status


@app.post("/api/projects/{pid}/retry")
def retry(pid: str):
    status = runner.read_status(_check_id(pid))
    if status["state"] == "processing":
        raise HTTPException(409, "Already processing")
    runner.new_status(pid, status["name"], status["input"])
    runner.start(pid)
    return {"id": pid}


@app.get("/api/projects/{pid}/words")
def get_words(pid: str):
    path = runner.project_dir(_check_id(pid)) / "words.json"
    if not path.exists():
        raise HTTPException(404, "Transcript isn't ready yet")
    return json.loads(path.read_text(encoding="utf-8"))


def _json_file(pid: str, name: str, what: str):
    path = runner.project_dir(_check_id(pid)) / name
    if not path.exists():
        raise HTTPException(404, f"{what} isn't ready yet")
    return json.loads(path.read_text(encoding="utf-8"))


@app.get("/api/projects/{pid}/plan")
def get_plan(pid: str):
    return _json_file(pid, "plan.json", "The edit plan")


@app.get("/api/projects/{pid}/cuts")
def get_cuts(pid: str):
    return _json_file(pid, "cuts.json", "The cut list")


@app.get("/api/projects/{pid}/events")
async def events(pid: str, request: Request):
    _check_id(pid)

    async def stream():
        last = None
        while not await request.is_disconnected():
            status = runner.read_status(pid)
            if status and status.get("updatedAt") != last:
                last = status.get("updatedAt")
                yield f"data: {json.dumps(status)}\n\n"
                if status["state"] in ("ready", "failed"):
                    return
            await asyncio.sleep(0.4)

    return StreamingResponse(stream(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache"})


# Media for the browser. Starlette's static files support Range requests, which video seeking needs.
app.mount("/files", StaticFiles(directory=config.PROJECTS_DIR), name="files")
