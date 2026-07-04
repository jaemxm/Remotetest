"""Batch-generate all 40 scenes via Gemini and log progress.

Usage:
    GEMINI_API_KEY=... python3 src/batch_generate.py [--limit N] [--start N]
"""

from __future__ import annotations

import argparse
import re
import sys
import time
import traceback
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from gemini_gen import generate_gemini_image  # noqa: E402
from prompt_builder import build_prompt  # noqa: E402
from scene_configs import SCENES  # noqa: E402


OUT_DIR = ROOT.parent / "out" / "gemini"
LOG_PATH = ROOT.parent / "out" / "batch_log.txt"
DEFAULT_MODEL = "gemini-3-pro-image-preview"


def slugify(text: str) -> str:
    s = text.lower()
    s = re.sub(r"[^a-z0-9]+", "_", s).strip("_")
    return s or "scene"


def _out_path(scene: dict) -> Path:
    slug = slugify(scene["title"])
    return OUT_DIR / f"{scene['id']}_{slug}.jpg"


def log(msg: str) -> None:
    line = f"[{time.strftime('%H:%M:%S')}] {msg}"
    print(line, flush=True)
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with LOG_PATH.open("a") as f:
        f.write(line + "\n")


def run(model: str, limit: int | None, start: int, force: bool) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    scenes = SCENES[start:]
    if limit is not None:
        scenes = scenes[:limit]

    log(f"START model={model} count={len(scenes)} start={start} force={force}")

    for i, scene in enumerate(scenes):
        idx = start + i
        target = _out_path(scene)
        # Check both .jpg and .png (mime detection may swap)
        existing = None
        for ext in (".jpg", ".png"):
            candidate = target.with_suffix(ext)
            if candidate.exists() and candidate.stat().st_size > 5000:
                existing = candidate
                break

        if existing and not force:
            log(f"SKIP  #{idx+1:02d} {scene['title']}  (exists: {existing.name})")
            continue

        prompt = build_prompt(scene)
        log(f"GEN   #{idx+1:02d} {scene['title']}  → {target.name}")
        t0 = time.time()
        try:
            written = generate_gemini_image(prompt, target, model=model)
            dt = time.time() - t0
            sz = written.stat().st_size
            log(f"OK    #{idx+1:02d} {written.name}  {sz} bytes  {dt:.1f}s")
        except Exception as e:
            dt = time.time() - t0
            log(f"FAIL  #{idx+1:02d} {scene['title']}  {dt:.1f}s  {e}")
            traceback.print_exc()

        # Small pause to be gentle on the API
        time.sleep(1.5)

    log("DONE")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--start", type=int, default=0)
    parser.add_argument("--force", action="store_true", help="Overwrite existing files")
    args = parser.parse_args()
    run(args.model, args.limit, args.start, args.force)
