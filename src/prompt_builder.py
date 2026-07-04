"""Compose the full image-generation prompt for a scene config."""

from __future__ import annotations


STYLE_HEADER = (
    "A high-quality 16-bit era pixel art illustration in the style of a classic "
    "retro SNES / Prince-of-Persia era game — chunky pixel grid, dithered "
    "color gradients, bold saturated NES/SNES palette, sharp pixel edges, NO "
    "photographic realism, NO smooth anti-aliasing except intentional pixel "
    "dithering. Cinematic composition, rich detail, warm heroic mood, "
    "landscape orientation (16:9)."
)

FRAME_HEADER = (
    "Around the scene, an ornate golden Celtic-knot decorative pixel-art "
    "border. At the bottom, a dark navy caption banner reads EXACTLY: "
    "\"{year}    {title}    {subtitle}\" in golden pixel-font uppercase "
    "letters with tiny golden stars flanking the title. No other text "
    "anywhere in the image."
)


def build_prompt(scene: dict) -> str:
    body = (
        f"Historical scene: {scene['iconic']}\n\n"
        f"Color palette: {scene['palette']}."
    )
    caption = FRAME_HEADER.format(
        year=scene["year"],
        title=scene["title"],
        subtitle=scene["subtitle"],
    )
    return f"{STYLE_HEADER}\n\n{body}\n\n{caption}"


if __name__ == "__main__":
    from scene_configs import SCENES
    for s in SCENES[:2]:
        print("=" * 60)
        print(f"Scene {s['id']}: {s['title']}")
        print("-" * 60)
        print(build_prompt(s))
