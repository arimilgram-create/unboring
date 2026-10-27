"""All calls to the Meta Model API go through here (spec Section 13).

Every call: structured JSON output, checked against a JSON Schema plus our own rules,
retried up to 2 times with the problems appended, logged with tokens and cost,
and stopped if the project's AI budget would be exceeded (Meta's spend limit only notifies).
"""
import json
import os
import time
from pathlib import Path
from typing import Callable

from jsonschema import Draft202012Validator

import config

BASE_URL = "https://api.meta.ai/v1"
# USD per million tokens (input, output). Standard mode. Check dev.meta.ai pricing if these change.
PRICES = {"muse-spark-1.3": (1.25, 4.25), "muse-wonder-1.0": (4.0, 20.0)}


class MetaError(RuntimeError):
    pass


def api_key() -> str | None:
    return os.getenv("META_API_KEY") or None


class MetaClient:
    def __init__(self, project_dir: Path, budget_usd: float | None = None, client=None):
        if client is None:
            key = api_key()
            if not key:
                raise MetaError("No Meta API key yet. Put META_API_KEY in apps/server/.env, then click 'Plan with AI'.")
            from openai import OpenAI
            client = OpenAI(api_key=key, base_url=BASE_URL, timeout=180)
        self.client = client
        self.log = config.SERVER_DIR / "logs" / "ai_calls.jsonl"
        self.log.parent.mkdir(exist_ok=True)
        self.budget = budget_usd if budget_usd is not None else float(os.getenv("AI_BUDGET_USD", "1.50"))
        self.spent = 0.0
        self.project = project_dir.name

    def structured(self, *, name: str, model: str, system: str, user: str, schema: dict,
                   check: Callable[[dict], list[str]] = lambda _: [], max_output_tokens: int = 4000,
                   retries: int = 2) -> dict:
        messages = [{"role": "system", "content": system}, {"role": "user", "content": user}]
        validator = Draft202012Validator(schema)
        problems: list[str] = []
        for attempt in range(retries + 1):
            if self.spent >= self.budget:
                raise MetaError(f"AI budget for this video (${self.budget:.2f}) used up. Raise AI_BUDGET_USD in .env if you need more.")
            t0 = time.time()
            resp = self.client.chat.completions.create(
                model=model, messages=messages, max_tokens=max_output_tokens,
                response_format={"type": "json_schema", "json_schema": {"name": name, "schema": schema}})
            text = resp.choices[0].message.content or ""
            usage = getattr(resp, "usage", None)
            tin = getattr(usage, "prompt_tokens", 0) or 0
            tout = getattr(usage, "completion_tokens", 0) or 0
            pin, pout = PRICES.get(model, (1.25, 4.25))
            cost = tin / 1e6 * pin + tout / 1e6 * pout
            self.spent += cost
            try:
                data = json.loads(text)
                problems = [f"{'/'.join(map(str, e.path)) or 'root'}: {e.message}" for e in validator.iter_errors(data)]
                if not problems:
                    problems = check(data)
            except json.JSONDecodeError as e:
                data, problems = None, [f"not valid JSON: {e}"]
            self._log(name, model, attempt, tin, tout, cost, time.time() - t0, problems)
            if not problems:
                return data
            messages += [{"role": "assistant", "content": text},
                         {"role": "user", "content": "Your JSON had these problems:\n- " + "\n- ".join(problems[:20])
                          + "\nFix them and return the complete JSON again."}]
        raise MetaError(f"{name}: the AI's answer still had problems after {retries + 1} tries: {problems[:3]}")

    def _log(self, name, model, attempt, tin, tout, cost, secs, problems):
        with self.log.open("a", encoding="utf-8") as f:
            f.write(json.dumps({"t": time.time(), "project": self.project, "pass": name, "model": model,
                                "attempt": attempt, "inputTokens": tin, "outputTokens": tout,
                                "costUsd": round(cost, 5), "seconds": round(secs, 2),
                                "problems": problems[:5]}) + "\n")
