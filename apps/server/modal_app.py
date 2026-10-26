"""GPU transcription with WhisperX on Modal (optional; the default is local faster-whisper).

Setup once:  pip install modal  ->  modal setup  ->  modal deploy modal_app.py
Then set TRANSCRIBE_BACKEND=modal in .env.
Not tested yet: try it on Day 2 when Modal credits arrive, and note results in DECISIONS.md.
"""
import modal

image = (modal.Image.debian_slim(python_version="3.11")
         .apt_install("ffmpeg")
         .pip_install("whisperx==3.3.1"))
app = modal.App("unboring", image=image)


@app.function(gpu="A10G", timeout=1800)
def transcribe_whisperx(audio_bytes: bytes) -> list[dict]:
    import tempfile

    import whisperx

    with tempfile.NamedTemporaryFile(suffix=".wav") as f:
        f.write(audio_bytes)
        f.flush()
        audio = whisperx.load_audio(f.name)
    model = whisperx.load_model("large-v3", "cuda", compute_type="float16", language="en")
    result = model.transcribe(audio, batch_size=16)
    align_model, meta = whisperx.load_align_model(language_code="en", device="cuda")
    aligned = whisperx.align(result["segments"], align_model, meta, audio, "cuda",
                             return_char_alignments=False)
    return [{"text": w["word"], "start": w["start"], "end": w["end"], "confidence": w.get("score", 1.0)}
            for seg in aligned["segments"] for w in seg.get("words", []) if "start" in w]
