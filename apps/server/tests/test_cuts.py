from pipeline.cuts import CutSettings, detect, retakes
from pipeline.words import build_words

S = CutSettings()


def W(*items):
    """W(("We", 0.0, 0.3), ...) -> words[]"""
    return build_words([{"text": t, "start": a, "end": b} for t, a, b in items])


def keep_words(result):
    return [(k["fromWord"], k["toWord"]) for k in result["keep"]]


def test_long_pause_is_cut():
    w = W(("We", 0.0, 0.3), ("the", 0.35, 0.5), ("People", 2.0, 2.4))
    r = detect(w, speech=[], duration=3, s=S)
    assert keep_words(r) == [("w0", "w1"), ("w2", "w2")]
    assert r["removed"]["pauses"] == 1


def test_short_pause_is_kept():
    w = W(("We", 0.0, 0.3), ("the", 0.6, 0.8))
    assert keep_words(detect(w, [], 1, S)) == [("w0", "w1")]


def test_pause_with_detected_speech_is_kept():
    # Whisper missed a word in the gap, but VAD heard speech there: don't cut it.
    w = W(("We", 0.0, 0.3), ("People", 2.0, 2.4))
    assert keep_words(detect(w, [{"start": 0.4, "end": 1.8}], 3, S)) == [("w0", "w1")]


def test_filler_with_no_gap_is_not_cut():
    w = W(("So", 0.0, 0.3), ("um", 0.3, 0.5), ("we", 0.5, 0.7))
    r = detect(w, [], 1, S)
    assert keep_words(r) == [("w0", "w2")] and r["removed"]["fillers"] == []


def test_filler_with_gaps_is_cut():
    w = W(("So", 0.0, 0.3), ("um,", 0.45, 0.65), ("we", 0.8, 1.0))
    r = detect(w, [], 1.2, S)
    assert r["removed"]["fillers"] == ["w1"]
    assert keep_words(r) == [("w0", "w0"), ("w2", "w2")]


def test_retake_keeps_the_last_take():
    words = "We the people of uh We the People of the United States".split()
    t, items = 0.0, []
    for x in words:
        items.append((x, t, t + 0.25))
        t += 0.3
    w = W(*items)
    takes = retakes(w, {4}, S)                 # "uh" (w4) is a filler, skipped when comparing
    assert takes == [(0, 3)]
    r = detect(w, [], t + 1, S)
    assert r["keep"][0]["fromWord"] == "w5"    # starts at the second "We"
    assert r["removed"]["retakes"] == [["w0", "w4"]]  # the "uh" between takes goes too


def test_no_false_retake_on_different_phrases():
    words = "To borrow Money on the credit To regulate Commerce with foreign Nations".split()
    w = W(*[(x, i * 0.3, i * 0.3 + 0.25) for i, x in enumerate(words)])
    assert retakes(w, set(), S) == []


def test_padding_never_overlaps_or_leaves_video():
    w = W(("a", 0.02, 0.3), ("b", 0.95, 1.2), ("c", 1.9, 2.0))
    k = detect(w, [], 2.03, S)["keep"]
    assert k[0]["padStart"] <= 0.02 and k[-1]["padEnd"] <= 0.03 + 1e-9
    for x, y, wx, wy in zip(k, k[1:], ["w0", "w1"], ["w1", "w2"]):
        end_x = {"w0": 0.3, "w1": 1.2}[x["toWord"]] + x["padEnd"]
        start_y = {"w1": 0.95, "w2": 1.9}[y["fromWord"]] - y["padStart"]
        assert end_x <= start_y


def test_ids_are_stable():
    w = W(("We", 0.0, 0.3), ("People", 2.0, 2.4))
    assert detect(w, [], 3, S)["keep"] == detect(w, [], 3, S)["keep"]
    assert detect(w, [], 3, S)["keep"][1]["id"] == "k_w1"


def test_empty():
    assert detect([], [], 1, S)["keep"] == []
