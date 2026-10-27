"""Runs the ingest stages for one project and records progress in status.json.

Each stage writes its output into the project folder, and a stage whose output already
exists is skipped, so a crash can resume from the last finished stage (spec Section 11).
The browser watches status.json through the /events stream.
"""
import json
import shutil
import threading
import time
import traceback
from pathlib import Path

import config
from pipeline import cuts, media, plan, transcribe, vad, words

STAGES = [
    ("probe", "Reading video"),
    ("normalize", "Fixing frame rate"),
    ("proxy", "Making preview copy"),
    ("audio", "Extracting audio"),
    ("transcribe", "Transcribing words"),
    ("vad", "Finding speech"),
    ("cuts", "Cutting pauses, fillers and retakes"),
    ("ai", "Planning graphics with Muse Spark"),
]

_lock = threading.Lock()


def project_dir(pid: str) -> Path:
    return config.PROJECTS_DIR / pid


def read_status(pid: str) -> dict | None:
    path = project_dir(pid) / "status.json"
    if not path.exists():
        return None
    with _lock:
        return json.loads(path.read_text(encoding="utf-8"))


def _write_status(pid: str, status: dict) -> None:
    status["updatedAt"] = time.time()
    path = project_dir(pid) / "status.json"
    tmp = path.with_suffix(".tmp")
    with _lock:
        tmp.write_text(json.dumps(status, indent=2), encoding="utf-8")
        tmp.replace(path)  # atomic swap, so readers never see half a file


def new_status(pid: str, name: str, input_file: str) -> dict:
    old = read_status(pid) if (project_dir(pid) / "status.json").exists() else None
    created = (old or {}).get("createdAt") or time.time()
    status = {
        "id": pid, "name": name, "input": input_file, "state": "processing", "error": None, "createdAt": created,
        "stages": [{"key": k, "label": label, "state": "waiting", "progress": 0.0} for k, label in STAGES],
        "source": None,
    }
    _write_status(pid, status)
    return status


def _set_stage(pid: str, key: str, **changes) -> None:
    status = read_status(pid)
    if not any(s["key"] == key for s in status["stages"]):  # project made before this stage existed
        label = dict(STAGES).get(key, key)
        status["stages"].append({"key": key, "label": label, "state": "waiting", "progress": 0.0})
    for s in status["stages"]:
        if s["key"] == key:
            s.update(changes)
    _write_status(pid, status)


def run(pid: str) -> None:
    folder = project_dir(pid)
    status = read_status(pid)
    src = folder / status["input"]
    original, proxy, audio = folder / "original.mp4", folder / "proxy.mp4", folder / "audio16k.wav"
    words_file = folder / "words.json"
    current = None
    try:
        current = "probe"
        _set_stage(pid, "probe", state="running")
        info = media.probe(src)
        if not info["hasAudio"]:
            raise media.MediaError("This video has no sound, so there's nothing to transcribe.")
        status = read_status(pid)
        status["source"] = {**info, "fps": config.FPS, "proxyUrl": f"/files/{pid}/proxy.mp4",
                            "originalUrl": f"/files/{pid}/original.mp4"}
        _write_status(pid, status)
        _set_stage(pid, "probe", state="done", progress=1.0)

        for key, out, fn, inp in [("normalize", original, media.normalize, src),
                                  ("proxy", proxy, media.make_proxy, original),
                                  ("audio", audio, media.extract_audio, original)]:
            current = key
            if not out.exists():
                _set_stage(pid, key, state="running")
                tmp = out.with_name("tmp_" + out.name)
                fn(inp, tmp)
                tmp.replace(out)
            _set_stage(pid, key, state="done", progress=1.0)

        current = "transcribe"
        if not words_file.exists():
            _set_stage(pid, "transcribe", state="running")
            raw = transcribe.transcribe(audio, lambda p: _set_stage(pid, "transcribe", progress=round(p, 3)))
            words_file.write_text(json.dumps(words.build_words(raw), indent=1), encoding="utf-8")
        _set_stage(pid, "transcribe", state="done", progress=1.0)

        current = "vad"
        speech_file = folder / "speech.json"
        if not speech_file.exists():
            _set_stage(pid, "vad", state="running")
            speech_file.write_text(json.dumps(vad.speech_segments(audio)), encoding="utf-8")
        _set_stage(pid, "vad", state="done", progress=1.0)

        current = "cuts"
        plan_file = folder / "plan.json"
        if not plan_file.exists():
            _set_stage(pid, "cuts", state="running")
            the_words = json.loads(words_file.read_text(encoding="utf-8"))
            speech = json.loads(speech_file.read_text(encoding="utf-8"))
            source = read_status(pid)["source"]
            result = cuts.detect(the_words, speech, source["duration"], cuts.PRESETS["explainer"])
            (folder / "cuts.json").write_text(json.dumps(result["removed"], indent=1), encoding="utf-8")
            tmp = folder / "tmp_plan.json"
            tmp.write_text(json.dumps(plan.initial_plan(pid, source, the_words, result["keep"]), indent=1),
                           encoding="utf-8")
            tmp.replace(plan_file)
            shutil.copyfile(plan_file, folder / "plan.auto.json")  # the untouched automatic edit, for "Reset"
        _set_stage(pid, "cuts", state="done", progress=1.0)

        current = "ai"
        if not (folder / "plan.ai.done").exists():
            run_ai(pid)
        else:
            _set_stage(pid, "ai", state="done", progress=1.0)

        status = read_status(pid)
        status["state"] = "ready"
        _write_status(pid, status)
    except Exception as exc:  # show the user which stage failed; details go to the console
        traceback.print_exc()
        status = read_status(pid)
        for s in status["stages"]:
            if s["key"] == current:
                s["state"] = "failed"
        status["state"] = "failed"
        status["error"] = str(exc) if isinstance(exc, media.MediaError) else f"{current} failed: {exc}"
        _write_status(pid, status)


def run_ai(pid: str) -> None:
    """AI planning. Never fails the project: without it you still get cuts + captions (spec Section 26)."""
    from meta.meta_client import MetaError, api_key
    from pipeline import ai_plan

    folder = project_dir(pid)
    if not api_key():
        _set_stage(pid, "ai", state="skipped", progress=0.0,
                   note="Add your Meta API key to apps/server/.env, then click 'Plan with AI'.")
        return
    _set_stage(pid, "ai", state="running", progress=0.0, note=None)
    try:
        plan_file = folder / "plan.json"
        current_plan = json.loads(plan_file.read_text(encoding="utf-8"))
        new = ai_plan.plan_with_ai(current_plan, folder,
                                   on_progress=lambda p: _set_stage(pid, "ai", progress=round(p, 3)))
        tmp = folder / "tmp_plan.json"
        tmp.write_text(json.dumps(new, indent=1), encoding="utf-8")
        tmp.replace(plan_file)
        shutil.copyfile(plan_file, folder / "plan.auto.json")
        (folder / "plan.ai.done").write_text(str(time.time()))
        _set_stage(pid, "ai", state="done", progress=1.0,
                   note=f"{len(new['graphics'])} graphics, {len(new['camera'])} camera moves")
    except Exception as exc:  # show it, keep the project usable
        traceback.print_exc()
        msg = str(exc) if isinstance(exc, (MetaError, ValueError)) else f"AI planning failed: {exc}"
        _set_stage(pid, "ai", state="failed", note=msg)


def start_ai(pid: str) -> None:
    threading.Thread(target=run_ai, args=(pid,), daemon=True).start()


def start(pid: str) -> None:
    threading.Thread(target=run, args=(pid,), daemon=True).start()
