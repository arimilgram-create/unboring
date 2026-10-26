from pipeline.words import build_words, is_filler


def test_ids_sorted_and_gaps():
    raw = [{"text": " world", "start": 1.0, "end": 1.4}, {"text": "Hello", "start": 0.2, "end": 0.6}]
    w = build_words(raw)
    assert [x["id"] for x in w] == ["w0", "w1"]
    assert w[0]["text"] == "Hello" and w[1]["text"] == "world"
    assert w[0]["speechGapAfter"] == 0.4 and w[1]["speechGapAfter"] == 0.0


def test_overlap_is_fixed():
    w = build_words([{"text": "a", "start": 0.0, "end": 0.5}, {"text": "b", "start": 0.4, "end": 0.8}])
    assert w[1]["start"] >= w[0]["end"]


def test_empty_and_zero_length_words():
    w = build_words([{"text": "  ", "start": 0, "end": 1}, {"text": "x", "start": 2.0, "end": 2.0}])
    assert len(w) == 1 and w[0]["end"] > w[0]["start"]


def test_fillers_are_conservative():
    assert is_filler("Um,") and is_filler("uh") and is_filler("Hmm.")
    assert not is_filler("like") and not is_filler("know") and not is_filler("umbrella")


def test_load_wav_reads_ffmpeg_audio(tmp_path):
    import subprocess

    import config
    from pipeline import media
    from pipeline.transcribe import load_wav

    if not config.ffmpeg_path():
        return
    src = tmp_path / "tone.mp4"
    subprocess.run([config.ffmpeg_path(), "-loglevel", "error", "-f", "lavfi", "-i", "sine=frequency=440:duration=2",
                    str(src)], check=True)
    wav = tmp_path / "a.wav"
    media.extract_audio(src, wav)
    samples = load_wav(wav)
    assert samples.dtype.name == "float32" and abs(len(samples) - 32000) < 2000
    assert 0.05 < abs(samples).max() <= 1.0
