"""Loads the shared template catalog (packages/shared/templates.json) and validates AI output against it."""
import json
from functools import lru_cache
from pathlib import Path

from jsonschema import Draft202012Validator

SHARED = Path(__file__).resolve().parents[3] / "packages" / "shared"


@lru_cache
def catalog() -> dict:
    data = json.loads((SHARED / "templates.json").read_text(encoding="utf-8"))
    icons = json.loads((SHARED / "icon-names.json").read_text(encoding="utf-8"))
    for t in data["templates"]:
        for prop in t["props"]["properties"].values():
            if prop.get("enum") == "ICON_NAMES":
                prop["enum"] = icons
    return data


def templates_for(preset: str, has_mask: bool) -> list[dict]:
    return [t for t in catalog()["templates"]
            if preset in t["presets"] and (has_mask or not t.get("requiresMask"))]


def camera_moves() -> list[dict]:
    return catalog()["cameraMoves"]


def props_errors(template: str, props: dict) -> list[str]:
    t = next((t for t in catalog()["templates"] if t["name"] == template), None)
    if t is None:
        return [f"unknown template '{template}'"]
    return [f"{template}.{'/'.join(map(str, e.path)) or 'props'}: {e.message}"
            for e in Draft202012Validator(t["props"]).iter_errors(props)]


PRIORITY = {"titleCard": 5, "titleBehind": 4, "hookText": 4, "statCallout": 3, "keywordCard": 2, "iconPop": 1}


def template(name: str) -> dict:
    return next(t for t in catalog()["templates"] if t["name"] == name)
