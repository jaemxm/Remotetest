"""Shared helpers for individual scene rendering."""

from __future__ import annotations

from PIL import Image


def new_canvas(w: int, h: int, bg):
    img = Image.new("RGB", (w, h), bg)
    return img, img.load()


def in_bounds(pixels, x, y, w, h):
    return 0 <= x < w and 0 <= y < h


def put(pixels, x, y, color, w, h):
    if 0 <= x < w and 0 <= y < h:
        pixels[x, y] = color


def fill_rect(pixels, x0, y0, x1, y1, color, w, h):
    for y in range(max(0, y0), min(h, y1)):
        for x in range(max(0, x0), min(w, x1)):
            pixels[x, y] = color


def hline(pixels, x0, x1, y, color, w, h):
    if 0 <= y < h:
        for x in range(max(0, x0), min(w, x1)):
            pixels[x, y] = color


def vline(pixels, x, y0, y1, color, w, h):
    if 0 <= x < w:
        for y in range(max(0, y0), min(h, y1)):
            pixels[x, y] = color


def draw_sprite(pixels, sprite_rows, x, y, palette, w, h, transparent=' '):
    """sprite_rows: list of strings; each char is a palette key or transparent."""
    for dy, row in enumerate(sprite_rows):
        for dx, ch in enumerate(row):
            if ch == transparent:
                continue
            color = palette.get(ch)
            if color is None:
                continue
            put(pixels, x + dx, y + dy, color, w, h)


def scale_and_save(img, scale, out_path):
    w, h = img.size
    final = img.resize((w * scale, h * scale), Image.NEAREST)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    final.save(out_path)
    return out_path
