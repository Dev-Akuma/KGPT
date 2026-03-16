"""Memory Architect utility script.

This is an optional offline helper for local experiments.
The production app uses the API route in api/memory/extract.js.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MEMORY_DIR = ROOT / "brain" / "memory"


def load_json(path: Path) -> dict:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def load_profile() -> dict:
    return {
        "core_essence": load_json(MEMORY_DIR / "core_essence.json"),
        "ecosystem": load_json(MEMORY_DIR / "ecosystem.json").get("people", []),
        "shadow_work": load_json(MEMORY_DIR / "shadow_work.json"),
        "daily_routine": load_json(MEMORY_DIR / "daily_routine.json"),
        "ephemeral": load_json(MEMORY_DIR / "ephemeral.json"),
    }


def save_profile(profile: dict) -> None:
    save_json(MEMORY_DIR / "core_essence.json", profile.get("core_essence", {}))
    save_json(MEMORY_DIR / "ecosystem.json", {"people": profile.get("ecosystem", [])})
    save_json(MEMORY_DIR / "shadow_work.json", profile.get("shadow_work", {}))
    save_json(MEMORY_DIR / "daily_routine.json", profile.get("daily_routine", {}))
    save_json(MEMORY_DIR / "ephemeral.json", profile.get("ephemeral", {}))


if __name__ == "__main__":
    # Placeholder entrypoint for local testing workflows.
    profile = load_profile()
    print(json.dumps(profile, indent=2))
