"""Render an 8-bit dashboard of American History events."""

from __future__ import annotations

import re
from collections import Counter, OrderedDict
from pathlib import Path

from PIL import Image

from pixel_font import CHAR_H, CHAR_W, draw_text, measure


ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "american_history.txt"
OUT_DIR = ROOT / "out"
OUT_FILE = OUT_DIR / "american_history_8bit.png"


CANVAS_W, CANVAS_H = 320, 256
SCALE = 4

# NES-inspired palette
BG = (24, 20, 68)
PANEL = (16, 12, 44)
TITLE_BAR = (168, 40, 40)
TITLE_BAR_SHADOW = (100, 20, 20)
GOLD = (252, 216, 84)
WHITE = (252, 252, 252)
DIM = (168, 168, 200)
GRID = (52, 44, 100)
DIVIDER = (108, 108, 200)
BAR_BG = (36, 32, 88)
STAR_COLOR = (252, 216, 84)
GROUND = (60, 40, 20)
GROUND_TOP = (140, 92, 40)

CAT_ORDER = [
    "Native Nations and Exploration",
    "The Thirteen Colonies",
    "The American Revolution",
    "The Young U.S.A.",
    "The Civil War & Westward Expansion",
    "The Industrial Era & World War I",
    "The Great Depression & World War II",
    "Cold War & the Fifties",
    "Rights & Turmoil",
    "Modern America",
]

CAT_SHORT = {
    "Native Nations and Exploration": "NATIVE + EXPLORE",
    "The Thirteen Colonies": "13 COLONIES",
    "The American Revolution": "REVOLUTION",
    "The Young U.S.A.": "YOUNG USA",
    "The Civil War & Westward Expansion": "CIVIL WAR + WEST",
    "The Industrial Era & World War I": "INDUSTRIAL + WW1",
    "The Great Depression & World War II": "DEPRESSION + WW2",
    "Cold War & the Fifties": "COLD WAR + 50S",
    "Rights & Turmoil": "RIGHTS + TURMOIL",
    "Modern America": "MODERN AMERICA",
}

CAT_COLORS = {
    "Native Nations and Exploration": (76, 168, 84),
    "The Thirteen Colonies": (200, 108, 32),
    "The American Revolution": (216, 40, 40),
    "The Young U.S.A.": (60, 132, 240),
    "The Civil War & Westward Expansion": (168, 84, 200),
    "The Industrial Era & World War I": (216, 156, 40),
    "The Great Depression & World War II": (140, 140, 156),
    "Cold War & the Fifties": (40, 180, 220),
    "Rights & Turmoil": (232, 108, 168),
    "Modern America": (100, 220, 132),
}


def parse_events(path: Path):
    text = path.read_text(encoding="utf-8")
    events = []
    current = None
    header_re = re.compile(r"^===\s*(.+?)\s*\(\d+ cards\)\s*===$")
    line_re = re.compile(r"^\s*(\*|★)?\s*(.+?)\s*[—\-]{1,2}\s*(.+?):\s*(.+)$")
    for raw in text.splitlines():
        line = raw.rstrip()
        h = header_re.match(line.strip())
        if h:
            current = h.group(1).strip()
            continue
        m = line_re.match(line)
        if not m or current is None:
            continue
        star_ch, year_str, title, desc = m.groups()
        events.append({
            "star": bool(star_ch),
            "year_raw": year_str.strip(),
            "title": title.strip(),
            "desc": desc.strip(),
            "category": current,
        })
    return events


def approx_year(year_raw: str) -> int | None:
    s = year_raw.lower()
    if "ice age" in s or "ancient" in s or "millennia" in s:
        return 1000
    if "pre-1492" in s or "pre 1492" in s:
        return 1450
    if "today" in s:
        return 2025
    m = re.search(r"(\d{4})", year_raw)
    if m:
        return int(m.group(1))
    m = re.search(r"(\d{3})", year_raw)
    if m:
        return int(m.group(1))
    return None


def bucket_of(year: int) -> int:
    if year < 1500:
        return 0
    idx = 1 + (year - 1500) // 50
    return min(idx, 11)


BUCKET_LABELS = [
    "PRE",  # <1500
    "1500", "1550", "1600", "1650", "1700",
    "1750", "1800", "1850", "1900", "1950", "2000",
]


def fill_rect(pixels, x0, y0, x1, y1, color):
    for y in range(max(0, y0), min(CANVAS_H, y1)):
        for x in range(max(0, x0), min(CANVAS_W, x1)):
            pixels[x, y] = color


def outline_rect(pixels, x0, y0, x1, y1, color):
    for x in range(x0, x1):
        if 0 <= x < CANVAS_W:
            if 0 <= y0 < CANVAS_H:
                pixels[x, y0] = color
            if 0 <= y1 - 1 < CANVAS_H:
                pixels[x, y1 - 1] = color
    for y in range(y0, y1):
        if 0 <= y < CANVAS_H:
            if 0 <= x0 < CANVAS_W:
                pixels[x0, y] = color
            if 0 <= x1 - 1 < CANVAS_W:
                pixels[x1 - 1, y] = color


def dotted_hline(pixels, x0, x1, y, color, step=2):
    for x in range(x0, x1, step):
        if 0 <= x < CANVAS_W and 0 <= y < CANVAS_H:
            pixels[x, y] = color


def star_sprite(pixels, cx, cy, color):
    # 5x5 star
    pattern = [
        "00100",
        "01110",
        "11111",
        "01110",
        "10101",
    ]
    for dy, row in enumerate(pattern):
        for dx, ch in enumerate(row):
            if ch == '1':
                x = cx - 2 + dx
                y = cy - 2 + dy
                if 0 <= x < CANVAS_W and 0 <= y < CANVAS_H:
                    pixels[x, y] = color


def draw_brick(pixels, x0, y0, w, h, color_a, color_b):
    # Simple brick pattern
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            row = (y - y0) // 4
            offset = 0 if row % 2 == 0 else 4
            xx = (x - x0 + offset) % 8
            yy = (y - y0) % 4
            is_edge = (xx == 0) or (yy == 0)
            if 0 <= x < CANVAS_W and 0 <= y < CANVAS_H:
                pixels[x, y] = color_b if is_edge else color_a


def render(sample: int | None = None, out_file: Path | None = None):
    events = parse_events(DATA)
    if sample is not None:
        # Deterministic sample across categories so timeline+categories both show data
        chosen = []
        remaining = sample
        for cat in CAT_ORDER:
            if remaining <= 0:
                break
            for e in events:
                if e["category"] == cat:
                    chosen.append(e)
                    remaining -= 1
                    break
        # Top up from the head if still short
        for e in events:
            if remaining <= 0:
                break
            if e not in chosen:
                chosen.append(e)
                remaining -= 1
        events = chosen
    total = len(events)
    quizzes = sum(1 for e in events if e["star"])
    eras = len(CAT_ORDER)

    # Bucket timeline
    buckets = [0] * len(BUCKET_LABELS)
    bucket_cat = [Counter() for _ in BUCKET_LABELS]
    for e in events:
        y = approx_year(e["year_raw"])
        if y is None:
            continue
        b = bucket_of(y)
        buckets[b] += 1
        bucket_cat[b][e["category"]] += 1

    # Category counts
    cat_counts = Counter(e["category"] for e in events)
    cat_stars = Counter(e["category"] for e in events if e["star"])

    img = Image.new("RGB", (CANVAS_W, CANVAS_H), BG)
    pixels = img.load()

    # -- Title bar (y=0..20) --
    fill_rect(pixels, 0, 0, CANVAS_W, 22, TITLE_BAR)
    fill_rect(pixels, 0, 22, CANVAS_W, 24, TITLE_BAR_SHADOW)
    title = "AMERICAN HISTORY"
    tw, _ = measure(title, spacing=1, scale=2)
    tx = (CANVAS_W - tw) // 2
    # small stars flanking the title
    star_sprite(pixels, tx - 12, 10, GOLD)
    star_sprite(pixels, tx + tw + 8, 10, GOLD)
    draw_text(pixels, title, tx, 4, GOLD, spacing=1, scale=2)

    # -- Subtitle row (y=26..38) --
    sub = f"{total} EVENTS   {quizzes} QUIZZES   {eras} ERAS"
    sw, _ = measure(sub, spacing=1, scale=1)
    draw_text(pixels, sub, (CANVAS_W - sw) // 2, 28, WHITE, spacing=1, scale=1)

    # Divider
    dotted_hline(pixels, 8, CANVAS_W - 8, 40, DIVIDER, step=2)

    # -- Timeline panel (y=44..142) --
    tl_x0, tl_y0 = 12, 44
    tl_x1, tl_y1 = CANVAS_W - 12, 142
    fill_rect(pixels, tl_x0, tl_y0, tl_x1, tl_y1, PANEL)
    outline_rect(pixels, tl_x0, tl_y0, tl_x1, tl_y1, DIVIDER)

    label = "EVENTS BY ERA (50-YR BUCKETS)"
    draw_text(pixels, label, tl_x0 + 4, tl_y0 + 3, GOLD, spacing=1, scale=1)

    # Bars
    n_buckets = len(BUCKET_LABELS)
    chart_x0 = tl_x0 + 6
    chart_x1 = tl_x1 - 6
    chart_top = tl_y0 + 14
    chart_bottom = tl_y1 - 14  # leave room for labels
    chart_w = chart_x1 - chart_x0
    chart_h = chart_bottom - chart_top

    slot_w = chart_w // n_buckets
    bar_w = slot_w - 2
    max_val = max(buckets) if buckets else 1

    # gridlines (dotted)
    for frac in (0.25, 0.5, 0.75, 1.0):
        gy = int(chart_bottom - chart_h * frac)
        dotted_hline(pixels, chart_x0, chart_x1, gy, GRID, step=2)

    # baseline
    fill_rect(pixels, chart_x0, chart_bottom, chart_x1, chart_bottom + 1, DIVIDER)

    for i, count in enumerate(buckets):
        bx0 = chart_x0 + i * slot_w + 1
        bx1 = bx0 + bar_w
        bh = int(round(chart_h * (count / max_val))) if max_val else 0
        by0 = chart_bottom - bh
        by1 = chart_bottom
        # Bar composed of stacked category segments (Mario-block feel)
        top_cat = bucket_cat[i].most_common(1)
        base_color = CAT_COLORS[top_cat[0][0]] if top_cat else DIM
        fill_rect(pixels, bx0, by0, bx1, by1, base_color)
        # Highlight (lighter) 1px on top and left for 8-bit feel
        for x in range(bx0, bx1):
            if by0 < CANVAS_H:
                r, g, b = base_color
                pixels[x, by0] = (min(255, r + 40), min(255, g + 40), min(255, b + 40))
        for y in range(by0, by1):
            r, g, b = base_color
            if bx0 < CANVAS_W:
                pixels[bx0, y] = (min(255, r + 40), min(255, g + 40), min(255, b + 40))
        # Shadow bottom + right
        for x in range(bx0, bx1):
            if by1 - 1 >= 0:
                r, g, b = base_color
                pixels[x, by1 - 1] = (max(0, r - 60), max(0, g - 60), max(0, b - 60))

        # count number above the bar (only if bar tall enough)
        num_txt = str(count)
        nw, _ = measure(num_txt, scale=1)
        nx = bx0 + (bar_w - nw) // 2
        ny = max(chart_top, by0 - 8)
        if count > 0:
            draw_text(pixels, num_txt, nx, ny, WHITE, scale=1)

        # bucket label below
        lbl = BUCKET_LABELS[i]
        lw, _ = measure(lbl, scale=1)
        lx = bx0 + (bar_w - lw) // 2
        ly = chart_bottom + 3
        draw_text(pixels, lbl, lx, ly, DIM, scale=1)

    # -- Categories panel (y=148..238) --
    cp_x0, cp_y0 = 12, 148
    cp_x1, cp_y1 = CANVAS_W - 12, 238
    fill_rect(pixels, cp_x0, cp_y0, cp_x1, cp_y1, PANEL)
    outline_rect(pixels, cp_x0, cp_y0, cp_x1, cp_y1, DIVIDER)
    draw_text(pixels, "ERAS (486 CARDS)", cp_x0 + 4, cp_y0 + 3, GOLD, scale=1)

    # 2 columns x 5 rows
    col_w = (cp_x1 - cp_x0 - 8) // 2
    row_h = (cp_y1 - cp_y0 - 16) // 5
    max_cat = max(cat_counts.values())

    for idx, cat in enumerate(CAT_ORDER):
        col = idx // 5
        row = idx % 5
        cell_x0 = cp_x0 + 4 + col * col_w
        cell_y0 = cp_y0 + 14 + row * row_h

        color = CAT_COLORS[cat]
        # colored square (7x7)
        fill_rect(pixels, cell_x0, cell_y0 + 1, cell_x0 + 7, cell_y0 + 8, color)
        outline_rect(pixels, cell_x0, cell_y0 + 1, cell_x0 + 7, cell_y0 + 8, WHITE)

        # name
        name = CAT_SHORT[cat]
        draw_text(pixels, name, cell_x0 + 10, cell_y0 + 2, WHITE, scale=1)

        count = cat_counts[cat]
        stars = cat_stars[cat]

        # bar under the name
        bar_x0 = cell_x0 + 10
        bar_x1 = cell_x0 + col_w - 24
        bar_y = cell_y0 + 12
        fill_rect(pixels, bar_x0, bar_y, bar_x1, bar_y + 3, BAR_BG)
        fill_w = int((bar_x1 - bar_x0) * count / max_cat)
        fill_rect(pixels, bar_x0, bar_y, bar_x0 + fill_w, bar_y + 3, color)

        # count text to the right
        ct = f"{count}"
        cw, _ = measure(ct, scale=1)
        draw_text(pixels, ct, cell_x0 + col_w - 20, cell_y0 + 10, WHITE, scale=1)

        # stars indicator (small star + number) on far right
        if stars > 0:
            star_sprite(pixels, cell_x0 + col_w - 10, cell_y0 + 12, GOLD)
            draw_text(pixels, str(stars), cell_x0 + col_w - 6, cell_y0 + 10, GOLD, scale=1)

    # -- Ground / footer strip (y=244..256) --
    draw_brick(pixels, 0, 244, CANVAS_W, CANVAS_H - 244, GROUND, GROUND_TOP)
    footer = "PRESS  START  --  E PLURIBUS UNUM"
    fw, _ = measure(footer, scale=1)
    draw_text(pixels, footer, (CANVAS_W - fw) // 2, 247, GOLD, scale=1)

    # -- Corner star flourishes --
    star_sprite(pixels, 6, 3, GOLD)
    star_sprite(pixels, CANVAS_W - 7, 3, GOLD)

    # Upscale with NEAREST for crisp pixels
    final = img.resize((CANVAS_W * SCALE, CANVAS_H * SCALE), Image.NEAREST)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    target = out_file if out_file is not None else OUT_FILE
    final.save(target)

    # Also save the native-res version for embedding
    native_name = target.stem + "_native.png"
    img.save(target.parent / native_name)

    return {
        "total": total,
        "quizzes": quizzes,
        "eras": eras,
        "buckets": dict(zip(BUCKET_LABELS, buckets)),
        "categories": {cat: cat_counts[cat] for cat in CAT_ORDER},
        "output": str(target),
    }


if __name__ == "__main__":
    import sys
    sample = None
    out_file = None
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        sample = 5
        out_file = OUT_DIR / "test_5events.png"
    info = render(sample=sample, out_file=out_file)
    print("Wrote:", info["output"])
    print("Total events:", info["total"], "Quizzes:", info["quizzes"])
    print("Bucket counts:", info["buckets"])
    print("Category counts:", info["categories"])
