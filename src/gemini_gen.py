"""Thin wrapper around Google's Gemini / Imagen image generation APIs.

Reads GEMINI_API_KEY from the environment. Never log the key.
"""

from __future__ import annotations

import base64
import json
import os
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Optional


API_BASE = "https://generativelanguage.googleapis.com/v1beta"


def _api_key() -> str:
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        raise RuntimeError(
            "GEMINI_API_KEY not set. `export GEMINI_API_KEY=...` or `source .env`."
        )
    return key


def _post(url: str, body: dict, timeout: int = 180) -> dict:
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {e.code}: {err[:800]}") from e


def generate_gemini_image(
    prompt: str,
    out_path: Path,
    model: str = "gemini-3-pro-image-preview",
    aspect_ratio: str = "16:9",
    retries: int = 2,
) -> Path:
    """Generate an image using Gemini's Nano Banana family (generateContent)."""
    url = f"{API_BASE}/models/{model}:generateContent?key={_api_key()}"
    body = {
        "contents": [{
            "role": "user",
            "parts": [{"text": prompt}],
        }],
        "generationConfig": {
            "responseModalities": ["IMAGE"],
            "imageConfig": {"aspectRatio": aspect_ratio},
        },
    }

    last_err = None
    for attempt in range(retries + 1):
        try:
            result = _post(url, body)
            break
        except Exception as e:
            last_err = e
            if attempt < retries:
                time.sleep(2 * (attempt + 1))
            else:
                raise
    for cand in result.get("candidates", []):
        parts = cand.get("content", {}).get("parts", [])
        for part in parts:
            inline = part.get("inlineData") or part.get("inline_data")
            if inline and "data" in inline:
                img = base64.b64decode(inline["data"])
                mime = inline.get("mimeType") or inline.get("mime_type") or "image/jpeg"
                # Rewrite extension if mismatch
                ext = ".jpg" if "jpeg" in mime else ".png" if "png" in mime else ""
                if ext and not str(out_path).lower().endswith(ext):
                    out_path = out_path.with_suffix(ext)
                out_path.parent.mkdir(parents=True, exist_ok=True)
                out_path.write_bytes(img)
                return out_path
    raise RuntimeError(f"No image in response: {json.dumps(result)[:800]}")


def generate_imagen(
    prompt: str,
    out_path: Path,
    model: str = "imagen-4.0-ultra-generate-001",
    aspect_ratio: str = "16:9",
    retries: int = 2,
) -> Path:
    """Generate an image using Imagen 4 (predict endpoint)."""
    url = f"{API_BASE}/models/{model}:predict?key={_api_key()}"
    body = {
        "instances": [{"prompt": prompt}],
        "parameters": {
            "sampleCount": 1,
            "aspectRatio": aspect_ratio,
        },
    }

    last_err = None
    for attempt in range(retries + 1):
        try:
            result = _post(url, body)
            break
        except Exception as e:
            last_err = e
            if attempt < retries:
                time.sleep(2 * (attempt + 1))
            else:
                raise
    preds = result.get("predictions", [])
    for pred in preds:
        b64 = pred.get("bytesBase64Encoded") or pred.get("bytes_base64_encoded")
        if b64:
            img = base64.b64decode(b64)
            out_path.parent.mkdir(parents=True, exist_ok=True)
            out_path.write_bytes(img)
            return out_path
    raise RuntimeError(f"No image in response: {json.dumps(result)[:800]}")


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 3:
        print("Usage: gemini_gen.py <prompt-file> <out.png> [model]")
        sys.exit(1)
    prompt = Path(sys.argv[1]).read_text(encoding="utf-8")
    out = Path(sys.argv[2])
    model = sys.argv[3] if len(sys.argv) > 3 else "gemini-3-pro-image-preview"
    if model.startswith("imagen"):
        p = generate_imagen(prompt, out, model=model)
    else:
        p = generate_gemini_image(prompt, out, model=model)
    print("Wrote:", p)
