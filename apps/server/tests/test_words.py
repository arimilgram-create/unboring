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
