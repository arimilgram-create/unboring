"""AI planning with a fake Meta client (tests only; the real app never fakes AI output)."""
import json
from types import SimpleNamespace

import pytest

from meta.meta_client import MetaClient, MetaError
from pipeline import ai_plan, cuts
from pipeline.plan import initial_plan
from pipeline.words import build_words

TEXT = ("We the People of the United States, in Order to form a more perfect Union, establish Justice. "
        "All legislative Powers herein granted shall be vested in a Congress of the United States. "
        "The House of Representatives shall be composed of Members chosen every second Year.").split()


def make_plan():
    raw, t = [], 0.0
    for w in TEXT:
        raw.append({"text": w, "start": t, "end": t + 0.3})
        t += 0.35
    words = build_words(raw)
    keep = cuts.detect(words, [], t + 0.5, cuts.PRESETS["explainer"])["keep"]
    src = {"originalUrl": "/o.mp4", "proxyUrl": "/p.mp4", "fps": 30, "width": 1280, "height": 720, "duration": t + 0.5}
    return initial_plan("abc123abc123", src, words, keep)


class FakeAPI:
    """Returns queued JSON answers, like the OpenAI SDK's client.chat.completions.create."""
    def __init__(self, answers):
        self.answers, self.calls = list(answers), []
        self.chat = SimpleNamespace(completions=SimpleNamespace(create=self.create))

    def create(self, **kw):
        self.calls.append(kw)
        content = json.dumps(self.answers.pop(0))
        return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=content))],
                               usage=SimpleNamespace(prompt_tokens=1000, completion_tokens=200))


STRUCTURE = {"hook": {"type": "promise", "text": "The rules behind everything", "atWord": "w0"},
             "chapters": [{"title": "Preamble", "atWord": "w0"}, {"title": "Congress", "atWord": "w16"}],
             "bigMoments": [{"kind": "keywordCard", "atWord": "w23", "untilWord": "w27", "why": "defines Congress"}],
             "tone": "clear"}
DETAIL_BAD = {"graphics": [{"template": "keywordCard", "atWord": "w23", "untilWord": "w27",
                            "props": {"term": "Congress"}, "why": "x"}], "camera": [], "highlightWords": []}
DETAIL_OK = {
    "graphics": [
        {"template": "hookText", "atWord": "w0", "untilWord": "w5", "props": {"text": "The rules behind everything"}, "why": "hook"},
        {"template": "keywordCard", "atWord": "w23", "untilWord": "w27",
         "props": {"term": "Congress", "definition": "Where all federal law-making power goes"}, "why": "defines it"},
        {"template": "iconPop", "atWord": "w24", "untilWord": "w26", "props": {"icon": "Landmark"}, "why": "overlaps; should lose"},
    ],
    "camera": [{"move": "punchIn", "atWord": "w16"}, {"move": "punchIn", "atWord": "w18"}, {"move": "punchOut", "atWord": "w28"}],
    "highlightWords": ["w8", "w20"],
}


def test_plans_retries_and_merges(tmp_path, monkeypatch):
    monkeypatch.setattr("config.SERVER_DIR", tmp_path)
    api = FakeAPI([STRUCTURE, DETAIL_BAD, DETAIL_OK])
    client = MetaClient(tmp_path / "p1", budget_usd=1.0, client=api)
    new = ai_plan.plan_with_ai(make_plan(), tmp_path / "p1", client=client)
    assert len(api.calls) == 3                      # the bad detail answer was retried
    assert "definition" in api.calls[2]["messages"][-1]["content"]  # the problem was explained
    names = [g["template"] for g in new["graphics"]]
    assert names == ["hookText", "keywordCard"]     # iconPop overlapped the higher-priority card
    assert [c["move"] for c in new["camera"]] == ["punchIn", "punchOut"]  # 2nd punchIn too soon
    assert all(g["id"].startswith("g_") for g in new["graphics"])
    assert new["captions"]["highlightWords"] == ["w8", "w20"]
    assert [c["title"] for c in new["chapters"]] == ["Preamble", "Congress"]
    assert new["revision"] == 2
    log = (tmp_path / "logs" / "ai_calls.jsonl").read_text().splitlines()
    assert len(log) == 3 and json.loads(log[1])["problems"]


def test_ids_are_stable(tmp_path, monkeypatch):
    monkeypatch.setattr("config.SERVER_DIR", tmp_path)
    a = ai_plan.plan_with_ai(make_plan(), tmp_path, client=MetaClient(tmp_path, 1.0, FakeAPI([STRUCTURE, DETAIL_OK])))
    b = ai_plan.plan_with_ai(make_plan(), tmp_path, client=MetaClient(tmp_path, 1.0, FakeAPI([STRUCTURE, DETAIL_OK])))
    assert [g["id"] for g in a["graphics"]] == [g["id"] for g in b["graphics"]]


def test_rejects_unknown_words_and_gives_up(tmp_path, monkeypatch):
    monkeypatch.setattr("config.SERVER_DIR", tmp_path)
    bad = {**STRUCTURE, "hook": {**STRUCTURE["hook"], "atWord": "w999"}}
    client = MetaClient(tmp_path, 1.0, FakeAPI([bad, bad, bad]))
    with pytest.raises(MetaError, match="still had problems"):
        ai_plan.plan_with_ai(make_plan(), tmp_path, client=client)


def test_budget_stops_calls(tmp_path, monkeypatch):
    monkeypatch.setattr("config.SERVER_DIR", tmp_path)
    client = MetaClient(tmp_path, budget_usd=0.0, client=FakeAPI([STRUCTURE]))
    with pytest.raises(MetaError, match="budget"):
        ai_plan.plan_with_ai(make_plan(), tmp_path, client=client)


def test_no_key_message(monkeypatch, tmp_path):
    monkeypatch.delenv("META_API_KEY", raising=False)
    with pytest.raises(MetaError, match="No Meta API key"):
        MetaClient(tmp_path)


def test_kept_words_skip_cuts_and_have_output_times():
    plan = make_plan()
    plan["keep"] = [k for k in plan["keep"]][:1]
    plan["keep"][0]["toWord"] = "w3"
    kw = ai_plan.kept_words(plan)
    assert [w["id"] for w in kw] == ["w0", "w1", "w2", "w3"] and kw[0]["t"] == pytest.approx(0.0, abs=0.11)


def test_catalog_icons_loaded():
    from meta import catalog
    icon = next(t for t in catalog.catalog()["templates"] if t["name"] == "iconPop")
    assert "Landmark" in icon["props"]["properties"]["icon"]["enum"]
    assert catalog.props_errors("iconPop", {"icon": "NotAnIcon"})
    assert "titleBehind" not in [t["name"] for t in catalog.templates_for("explainer", has_mask=False)]
