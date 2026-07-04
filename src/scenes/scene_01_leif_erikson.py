"""Scene #1 — c. 1000 — Leif Erikson Reaches America.

High-fidelity 8-bit illustration for a history memorization app.
Native: 320 x 200 (Prince-of-Persia native), upscaled 5x for 1600 x 1000.
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from pixel_font import draw_text, measure  # noqa: E402
from scene_helpers import (  # noqa: E402
    draw_sprite, fill_rect, hline, new_canvas, put, scale_and_save,
)

W, H = 320, 200
SCALE = 5
BOUNDS = (W, H)


# ================== PALETTE ==================
# Sky (sunrise, 8-band gradient with dithering)
SKY = [
    (20, 16, 56),
    (44, 24, 80),
    (76, 32, 96),
    (128, 48, 108),
    (188, 84, 112),
    (232, 132, 108),
    (248, 176, 108),
    (252, 216, 148),
    (252, 240, 200),
]
STAR = (232, 232, 240)

# Sun
SUN_HI = (252, 252, 232)
SUN = (252, 220, 100)
SUN_MID = (252, 176, 68)
SUN_LO = (216, 116, 52)

# Clouds
CLOUD_H = (252, 236, 224)
CLOUD_M = (216, 176, 176)
CLOUD_L = (156, 108, 132)
CLOUD_S = (100, 64, 96)

# Distant land (atmospheric perspective)
MTN_A = (108, 96, 132)   # far mountains (violet-gray)
MTN_A_H = (152, 140, 172)
MTN_A_SNOW = (232, 224, 240)

MTN_B = (72, 76, 108)    # mid
MTN_B_H = (116, 120, 152)
MTN_B_SNOW = (208, 216, 232)

MTN_C = (44, 56, 72)     # near
MTN_C_H = (80, 96, 116)

CLIFF_D = (36, 28, 40)
CLIFF   = (76, 56, 68)
CLIFF_H = (140, 108, 116)

# Forest
FOR_D = (16, 40, 28)
FOR_M = (36, 84, 52)
FOR_H = (84, 148, 76)

# Beach & rocks
BEACH = (216, 188, 132)
BEACH_D = (156, 128, 76)
ROCK_D = (48, 40, 32)
ROCK = (100, 84, 64)
ROCK_H = (148, 128, 100)

# Sea
SEA_HZ = (56, 60, 132)
SEA_1  = (32, 60, 116)
SEA_2  = (44, 92, 160)
SEA_3  = (68, 132, 196)
SEA_DEEP = (16, 32, 76)
FOAM_H = (240, 244, 252)
FOAM_M = (172, 208, 240)
FOAM_L = (108, 168, 216)

# Ship hull — plank tones
HULL_D  = (44, 24, 12)
HULL_M  = (92, 52, 24)
HULL_L  = (148, 92, 44)
HULL_H  = (216, 156, 80)
HULL_HI = (248, 220, 156)
PLANK_LINE = (24, 12, 4)
KEEL = (12, 6, 2)

# Sail
SAIL_H = (252, 240, 200)
SAIL_C = (240, 216, 168)
SAIL_C_S = (188, 168, 124)
SAIL_R  = (200, 52, 48)
SAIL_R_H = (240, 96, 84)
SAIL_R_S = (140, 24, 24)
SPAR = (72, 44, 20)
SPAR_H = (140, 92, 44)
MAST = (64, 40, 16)
ROPE = (200, 156, 92)

# Dragon prow
DRG_D = (24, 12, 8)
DRG_M = (72, 36, 24)
DRG_L = (144, 76, 40)
DRG_H = (216, 148, 76)
DRG_HI = (248, 208, 120)
EYE_W = (252, 244, 200)
EYE_R = (200, 40, 40)
EYE_B = (24, 8, 8)
FANG = (240, 232, 200)
TONGUE = (200, 60, 80)

# Shields (three color families)
SH_RIM = (28, 16, 8)
SH_BOSS = (72, 52, 24)
SH_BOSS_H = (160, 120, 60)
SH_R = (200, 52, 52); SH_R_S = (128, 24, 24); SH_R_H = (232, 116, 100)
SH_Y = (232, 188, 68); SH_Y_S = (172, 124, 40); SH_Y_H = (252, 232, 156)
SH_B = (60, 92, 176); SH_B_S = (32, 52, 116); SH_B_H = (128, 172, 232)

# Leif
SKIN_H = (248, 208, 156)
SKIN = (224, 172, 120)
SKIN_S = (168, 108, 68)
BEARD_H = (216, 148, 68)
BEARD = (164, 96, 40)
HELM_H = (232, 188, 84)
HELM = (172, 132, 44)
HELM_S = (100, 72, 28)
HELM_HORN = (240, 224, 176)
HELM_HORN_S = (168, 148, 96)
TUNIC = (76, 48, 28)
TUNIC_H = (140, 92, 52)
CAPE = (176, 48, 40)
CAPE_H = (216, 84, 68)
CAPE_S = (120, 24, 24)
BOOT = (24, 16, 12)
BELT = (52, 32, 16)
BELT_BRASS = (216, 168, 68)
SPEAR_H = (108, 68, 32)
SPEAR_TIP_H = (228, 228, 232)
SPEAR_TIP = (172, 172, 188)
SPEAR_TIP_S = (100, 100, 116)

# Birds
BIRD = (32, 24, 32)

# Frame / caption
FRAME_D = (12, 8, 32)
FRAME_M = (36, 28, 84)
FRAME_H = (108, 88, 168)
GOLD = (252, 216, 84)
GOLD_H = (252, 248, 200)
CAP_TXT = (240, 240, 240)


# ================== SKY ==================
def draw_sky(pixels):
    horizon = 96
    # 9 bands from top of frame to horizon
    band_count = len(SKY)
    band_h = horizon / band_count
    for y in range(horizon):
        t = y / horizon
        idx = min(band_count - 1, int(t * band_count))
        color = SKY[idx]
        hline(pixels, 0, W, y, color, W, H)
    # 2x2 Bayer dithering at band transitions
    bayer = [(0, 0), (1, 1), (0, 1), (1, 0)]
    for i in range(band_count - 1):
        y_center = int((i + 1) * band_h)
        col_a = SKY[i]
        col_b = SKY[i + 1]
        for row in range(-1, 2):
            y = y_center + row
            if 0 <= y < H:
                for x in range(W):
                    # dither strength based on row
                    strength = 2 - abs(row)  # 1, 2, 1
                    if ((x + y) % 4) < strength:
                        put(pixels, x, y, col_a if row < 0 else col_b, W, H)

    # A few morning stars in the deep sky
    for x, y in [(24, 8), (60, 18), (100, 6), (156, 12), (208, 4),
                 (272, 10), (300, 20), (44, 22), (128, 22)]:
        put(pixels, x, y, STAR, W, H)


# ================== SUN ==================
def draw_sun(pixels, cx, cy, r):
    for y in range(cy - r - 2, cy + r + 3):
        for x in range(cx - r - 2, cx + r + 3):
            dx = x - cx
            dy = y - cy
            d2 = dx * dx + dy * dy
            if d2 <= (r - 3) * (r - 3):
                put(pixels, x, y, SUN_HI, W, H)
            elif d2 <= (r - 1) * (r - 1):
                put(pixels, x, y, SUN, W, H)
            elif d2 <= r * r:
                put(pixels, x, y, SUN_MID, W, H)
            elif d2 <= (r + 1) * (r + 1):
                # halo dither
                if (x + y) % 2 == 0:
                    put(pixels, x, y, SUN_LO, W, H)
    # Rays — long horizontals + short verticals
    for dx in (-r - 8, -r - 12, r + 8, r + 12):
        put(pixels, cx + dx, cy, SUN, W, H)
        put(pixels, cx + dx - 1, cy, SUN_MID, W, H)
        put(pixels, cx + dx + 1, cy, SUN_MID, W, H)
    for dy in (-r - 8, -r - 12, r + 8, r + 12):
        put(pixels, cx, cy + dy, SUN, W, H)
        put(pixels, cx, cy + dy - 1, SUN_MID, W, H)
        put(pixels, cx, cy + dy + 1, SUN_MID, W, H)
    # Diagonals
    for k in (r + 6, r + 10):
        for sx, sy in [(k, k), (-k, k), (k, -k), (-k, -k)]:
            put(pixels, cx + sx // 2, cy + sy // 2, SUN, W, H)


# ================== CLOUDS ==================
def draw_cloud(pixels, cx, cy, w, h):
    for y in range(cy, cy + h):
        for x in range(cx, cx + w):
            nx = (x - cx - w / 2) / (w / 2)
            ny = (y - cy - h / 2) / (h / 2)
            d = nx * nx + ny * ny * 1.6
            if d < 0.55:
                put(pixels, x, y, CLOUD_H, W, H)
            elif d < 0.85:
                put(pixels, x, y, CLOUD_M, W, H)
            elif d < 1.0:
                put(pixels, x, y, CLOUD_L, W, H)
    # under-shadow line
    for x in range(cx + 2, cx + w - 2):
        put(pixels, x, cy + h - 1, CLOUD_S, W, H)


def draw_clouds(pixels):
    draw_cloud(pixels, 8, 30, 44, 10)
    draw_cloud(pixels, 92, 22, 52, 12)
    draw_cloud(pixels, 232, 16, 48, 10)
    draw_cloud(pixels, 176, 44, 36, 8)


# ================== SEA ==================
def draw_sea(pixels):
    horizon = 96
    # Bands with gradient
    seg = [
        (horizon, horizon + 4, SEA_HZ),
        (horizon + 4, horizon + 18, SEA_1),
        (horizon + 18, horizon + 44, SEA_2),
        (horizon + 44, H - 20, SEA_3),
    ]
    for y0, y1, c in seg:
        for y in range(y0, y1):
            hline(pixels, 0, W, y, c, W, H)

    # Dither between sea bands
    for y0, _, _ in seg[1:]:
        y = y0 - 1
        for x in range(W):
            if (x + y) % 3 == 0:
                # keep as-is
                pass

    # Sun-glare column shimmering on water
    glare_cx = 244
    for y in range(horizon, H - 20):
        dist = y - horizon
        wobble = ((y * 53) % 13) - 6
        gcx = glare_cx + wobble // 2
        half = max(1, 6 - dist // 12)
        for x in range(gcx - half, gcx + half + 1):
            put(pixels, x, y, FOAM_H, W, H)
        # softer edges
        for x in (gcx - half - 1, gcx + half + 1):
            put(pixels, x, y, FOAM_M, W, H)

    # Wave crests — curled shapes ("~~~")
    def wave_curl(y, xs, main, light):
        for x in xs:
            # a "~" crest of 6 pixels
            hline(pixels, x, x + 6, y, main, W, H)
            put(pixels, x - 1, y + 1, main, W, H)
            put(pixels, x + 6, y - 1, main, W, H)
            put(pixels, x + 2, y - 1, light, W, H)
            put(pixels, x + 3, y - 1, light, W, H)

    wave_curl(104, [12, 44, 76, 108, 140, 172, 268, 300], FOAM_M, FOAM_H)
    wave_curl(118, [4, 36, 68, 100, 132, 164, 196, 228, 260, 292], FOAM_L, FOAM_M)
    wave_curl(134, [20, 52, 84, 116, 148, 180, 268, 300], FOAM_M, FOAM_H)
    wave_curl(150, [8, 40, 72, 104, 136, 168, 232, 264, 296], FOAM_L, FOAM_M)
    wave_curl(166, [24, 56, 88, 120, 152, 184, 216, 280], FOAM_M, FOAM_H)
    wave_curl(176, [0, 36, 72, 108, 144, 180, 216, 252, 288], FOAM_L, FOAM_M)


# ================== COAST ==================
def _fill_between(pixels, xs, ys, base_y, color, highlight):
    for i in range(len(xs) - 1):
        x0, y0 = xs[i], ys[i]
        x1, y1 = xs[i + 1], ys[i + 1]
        if x1 == x0:
            continue
        for x in range(x0, x1 + 1):
            t = (x - x0) / (x1 - x0)
            y = int(round(y0 + (y1 - y0) * t))
            for yy in range(y, base_y + 1):
                put(pixels, x, yy, color, W, H)
            put(pixels, x, y, highlight, W, H)


def draw_coast(pixels):
    horizon = 96
    # Layer A — far
    xs = [176, 190, 204, 220, 236, 252, 268, 284, 300, 320]
    ys = [90, 82, 88, 74, 84, 78, 88, 76, 90, 92]
    _fill_between(pixels, xs, ys, horizon, MTN_A, MTN_A_H)
    for x, y in zip(xs, ys):
        put(pixels, x, y, MTN_A_SNOW, W, H)
        put(pixels, x + 1, y + 1, MTN_A_SNOW, W, H)

    # Layer B — mid
    xs = [172, 188, 200, 216, 232, 248, 264, 280, 296, 320]
    ys = [104, 92, 100, 84, 96, 88, 100, 90, 98, 104]
    _fill_between(pixels, xs, ys, horizon + 12, MTN_B, MTN_B_H)
    for x, y in zip(xs, ys):
        put(pixels, x, y, MTN_B_SNOW, W, H)

    # Layer C — near cliff
    xs = [168, 180, 196, 208, 224, 240, 256, 276, 296, 320]
    ys = [118, 106, 116, 100, 112, 104, 116, 100, 110, 118]
    _fill_between(pixels, xs, ys, horizon + 26, MTN_C, MTN_C_H)

    # Cliff wall down to sea
    cliff_base = horizon + 26
    for x in range(168, W):
        h_cliff = 8 + ((x * 17) % 6)
        for y in range(cliff_base, cliff_base + h_cliff):
            put(pixels, x, y, CLIFF, W, H)
        put(pixels, x, cliff_base, CLIFF_H, W, H)
        put(pixels, x, cliff_base + h_cliff - 1, CLIFF_D, W, H)

    # Forest strip on top of near mountains
    for x in range(168, W):
        put(pixels, x, cliff_base - 2, FOR_D, W, H)
        put(pixels, x, cliff_base - 1, FOR_M, W, H)
    # Individual conifers along the ridge
    for i, x in enumerate(range(174, W, 5)):
        tall = 4 + (i % 3) * 2
        _tree(pixels, x, cliff_base - 3, tall)

    # Beach line where cliff meets water
    beach_y = cliff_base + 10
    for x in range(168, W):
        put(pixels, x, beach_y, BEACH_D, W, H)
        put(pixels, x, beach_y + 1, BEACH, W, H)

    # Some rocks in the surf near the coast
    for cx, cy in [(174, beach_y + 4), (196, beach_y + 6),
                   (224, beach_y + 3), (254, beach_y + 5),
                   (284, beach_y + 6)]:
        _rock(pixels, cx, cy)


def _tree(pixels, x, base_y, h):
    for y in range(base_y - h, base_y + 1):
        depth = base_y - y
        w = depth // 2 + 1
        for dx in range(-w, w + 1):
            put(pixels, x + dx, y, FOR_D, W, H)
        # highlight column
        put(pixels, x, y, FOR_M, W, H)
        if depth > 0 and depth % 2 == 0:
            put(pixels, x - 1, y, FOR_H, W, H)


def _rock(pixels, cx, cy):
    for dy, row in enumerate([" DDD ", "DHHHD", "DHRRD", " DDD "]):
        for dx, ch in enumerate(row):
            if ch == 'D':
                put(pixels, cx - 2 + dx, cy - 1 + dy, ROCK_D, W, H)
            elif ch == 'H':
                put(pixels, cx - 2 + dx, cy - 1 + dy, ROCK_H, W, H)
            elif ch == 'R':
                put(pixels, cx - 2 + dx, cy - 1 + dy, ROCK, W, H)


# ================== BIRDS ==================
def draw_birds(pixels):
    for cx, cy in [(56, 32), (72, 38), (128, 26), (164, 40), (36, 46)]:
        for dy, row in enumerate([" B B ", "BBBBB", "  B  "]):
            for dx, ch in enumerate(row):
                if ch == 'B':
                    put(pixels, cx - 2 + dx, cy - 1 + dy, BIRD, W, H)


# ================== SHIP ==================
# Ship anchor: bow (dragon head) around x=170, stern around x=30
# Deck line y=130, keel line y=160
BOW_X = 170
STERN_X = 30
DECK_Y = 130
KEEL_Y = 160


def draw_ship(pixels):
    # ----- Mast -----
    mast_x = 96
    for y in range(DECK_Y - 78, DECK_Y - 4):
        put(pixels, mast_x, y, MAST, W, H)
        put(pixels, mast_x - 1, y, MAST, W, H)
    # Mast top cap
    for x in range(mast_x - 2, mast_x + 2):
        put(pixels, x, DECK_Y - 80, SPAR_H, W, H)
        put(pixels, x, DECK_Y - 79, SPAR, W, H)

    # ----- Spar (yardarm) -----
    spar_y = DECK_Y - 78
    for x in range(mast_x - 46, mast_x + 46):
        put(pixels, x, spar_y, SPAR, W, H)
        put(pixels, x, spar_y - 1, SPAR_H, W, H)
        put(pixels, x, spar_y + 1, SPAR, W, H)
    # spar tips
    for tip_x in (mast_x - 46, mast_x + 45):
        put(pixels, tip_x, spar_y - 2, SPAR_H, W, H)
        put(pixels, tip_x, spar_y + 2, SPAR_H, W, H)

    # ----- Sail (billowing right; wind from left) -----
    sail_left = mast_x - 44
    sail_right = mast_x + 44
    sail_top = spar_y + 2
    sail_bottom = DECK_Y - 6
    stripes = [SAIL_C, SAIL_R, SAIL_C, SAIL_R, SAIL_C, SAIL_R, SAIL_C]
    stripe_h = (sail_bottom - sail_top) // len(stripes)
    # Billow contour — parabolic bulge on the right side
    for i, base in enumerate(stripes):
        y0 = sail_top + i * stripe_h
        y1 = y0 + stripe_h
        for y in range(y0, y1):
            k = (y - sail_top) / (sail_bottom - sail_top)
            bulge = int(8 * (k * (1 - k) * 4))  # 0..8
            left = sail_left - bulge // 3
            right = sail_right + bulge
            # end caps taper
            edge_taper = 0 if 4 < (y - sail_top) < (sail_bottom - sail_top - 4) else 3
            for x in range(left + edge_taper, right - edge_taper):
                put(pixels, x, y, base, W, H)
    # Highlights on left (wind-side)
    for i in range(len(stripes)):
        base = stripes[i]
        hi = SAIL_H if base == SAIL_C else SAIL_R_H
        y0 = sail_top + i * stripe_h + 1
        y1 = y0 + stripe_h - 2
        for y in range(y0, y1):
            k = (y - sail_top) / (sail_bottom - sail_top)
            bulge = int(8 * (k * (1 - k) * 4))
            left = sail_left - bulge // 3
            put(pixels, left + 1, y, hi, W, H)
            put(pixels, left + 2, y, hi, W, H)
    # Shadow on right (leeward)
    for i in range(len(stripes)):
        base = stripes[i]
        sh = SAIL_C_S if base == SAIL_C else SAIL_R_S
        y0 = sail_top + i * stripe_h + 1
        y1 = y0 + stripe_h - 2
        for y in range(y0, y1):
            k = (y - sail_top) / (sail_bottom - sail_top)
            bulge = int(8 * (k * (1 - k) * 4))
            right = sail_right + bulge - 1
            put(pixels, right, y, sh, W, H)
            put(pixels, right - 1, y, sh, W, H)

    # Ropes from spar tips down to hull ends
    for step in range(0, 74):
        put(pixels, sail_left - step // 8, spar_y + step, ROPE, W, H)
        put(pixels, sail_right + step // 6, spar_y + step, ROPE, W, H)

    # ----- Hull -----
    # Rough gunwale line
    gunwale_y = DECK_Y - 3
    hull_left = STERN_X + 4
    hull_right = BOW_X - 6

    # Top plank strip (highlight)
    for x in range(hull_left, hull_right):
        put(pixels, x, gunwale_y, HULL_HI, W, H)
        put(pixels, x, gunwale_y + 1, HULL_H, W, H)
        put(pixels, x, gunwale_y + 2, HULL_L, W, H)

    # ----- Shields (7 shields across gunwale) -----
    shield_r = 6
    ship_gap = 14
    shield_start = hull_left + 10
    shield_defs = [
        (SH_R, SH_R_S, SH_R_H, SH_Y),
        (SH_Y, SH_Y_S, SH_Y_H, SH_R),
        (SH_B, SH_B_S, SH_B_H, SH_Y),
        (SH_R, SH_R_S, SH_R_H, SH_Y),
        (SH_Y, SH_Y_S, SH_Y_H, SH_B),
        (SH_B, SH_B_S, SH_B_H, SH_R),
        (SH_R, SH_R_S, SH_R_H, SH_Y),
    ]
    for i, (c, cs, ch, boss_c) in enumerate(shield_defs):
        sx = shield_start + i * ship_gap
        sy = gunwale_y + shield_r + 1
        _shield(pixels, sx, sy, shield_r, c, cs, ch, boss_c)

    # Lower hull with plank lines (below shield row)
    plank_top = gunwale_y + shield_r * 2 + 2
    plank_bot = KEEL_Y
    hull_x0 = hull_left - 2
    hull_x1 = hull_right + 2
    for y in range(plank_top, plank_bot):
        depth = y - plank_top
        max_depth = plank_bot - plank_top
        # Taper the hull as we go down and toward the ends
        end_taper = int(depth * 0.6)
        for x in range(hull_x0 + end_taper, hull_x1 - end_taper):
            # Plank tone: alternate rows
            row = (depth // 3) % 3
            if row == 0:
                put(pixels, x, y, HULL_L, W, H)
            elif row == 1:
                put(pixels, x, y, HULL_M, W, H)
            else:
                put(pixels, x, y, HULL_D, W, H)
        # Plank line separator
        if depth % 3 == 2:
            for x in range(hull_x0 + end_taper, hull_x1 - end_taper):
                put(pixels, x, y, PLANK_LINE, W, H)

    # Keel line
    keel_y = plank_bot
    for x in range(hull_x0 + int((plank_bot - plank_top) * 0.6),
                   hull_x1 - int((plank_bot - plank_top) * 0.6)):
        put(pixels, x, keel_y, KEEL, W, H)

    # ---- Curved bow rising toward dragon head ----
    for i in range(18):
        x = hull_right + i
        top = gunwale_y - i // 2 - 2
        bot = plank_bot - i - 4
        if bot < top:
            continue
        for y in range(top, bot + 1):
            put(pixels, x, y, HULL_M, W, H)
        put(pixels, x, top, HULL_H, W, H)
        put(pixels, x, top + 1, HULL_L, W, H)
        put(pixels, x, bot, HULL_D, W, H)

    # ---- Curved stern rising ----
    for i in range(16):
        x = hull_left - i
        top = gunwale_y - i // 2 - 1
        bot = plank_bot - i - 3
        if bot < top:
            continue
        for y in range(top, bot + 1):
            put(pixels, x, y, HULL_M, W, H)
        put(pixels, x, top, HULL_H, W, H)
        put(pixels, x, top + 1, HULL_L, W, H)
        put(pixels, x, bot, HULL_D, W, H)

    # ---- Oars (5 oars extending into water) ----
    oar_top_xs = [hull_left + 10, hull_left + 32, hull_left + 54,
                  hull_left + 76, hull_left + 98]
    for ox in oar_top_xs:
        # shaft angled down-right
        for k in range(20):
            xx = ox + k
            yy = plank_bot + 2 + k
            put(pixels, xx, yy, HULL_M, W, H)
            put(pixels, xx, yy + 1, HULL_D, W, H)
        # blade
        for j in range(5):
            for k in range(4):
                put(pixels, ox + 20 + j, plank_bot + 22 + j + k, HULL_L, W, H)
        # foam splash where oar enters water
        put(pixels, ox + 20, plank_bot + 22, FOAM_H, W, H)
        put(pixels, ox + 21, plank_bot + 23, FOAM_M, W, H)

    # ---- Dragon head prow ----
    _dragon_head(pixels, hull_right + 14, gunwale_y - 26)

    # ---- Stern curl ----
    _stern_curl(pixels, hull_left - 20, gunwale_y - 22)

    # Water reflection under the hull
    for x in range(hull_left - 10, hull_right + 20):
        yy = plank_bot + 6
        if (x + yy) % 2 == 0:
            put(pixels, x, yy, FOAM_M, W, H)
        yy2 = plank_bot + 10
        if (x + yy2) % 3 == 0:
            put(pixels, x, yy2, FOAM_L, W, H)


def _shield(pixels, cx, cy, r, col, cols, colh, boss):
    for y in range(cy - r, cy + r + 1):
        for x in range(cx - r, cx + r + 1):
            dx = x - cx
            dy = y - cy
            d2 = dx * dx + dy * dy
            if d2 > r * r:
                continue
            if d2 > (r - 1) * (r - 1):
                put(pixels, x, y, SH_RIM, W, H)
            elif d2 > (r - 2) * (r - 2):
                put(pixels, x, y, cols, W, H)
            else:
                # top-left highlight
                if dx + dy < -1:
                    put(pixels, x, y, colh, W, H)
                else:
                    put(pixels, x, y, col, W, H)
    # boss (raised metal center)
    put(pixels, cx, cy, boss, W, H)
    put(pixels, cx - 1, cy, boss, W, H)
    put(pixels, cx + 1, cy, boss, W, H)
    put(pixels, cx, cy - 1, boss, W, H)
    put(pixels, cx, cy + 1, boss, W, H)
    put(pixels, cx - 1, cy - 1, SH_BOSS_H, W, H)
    put(pixels, cx + 1, cy - 1, SH_BOSS_H, W, H)


def _dragon_head(pixels, x, y):
    """Big dragon head sprite ~34 wide × 30 tall, facing right/up."""
    P = {
        '.': None,
        'D': DRG_D, 'M': DRG_M, 'L': DRG_L, 'H': DRG_H, 'A': DRG_HI,
        'W': EYE_W, 'R': EYE_R, 'B': EYE_B,
        'F': FANG, 'T': TONGUE,
    }
    rows = [
        "................DDDD..............",
        "..............DDMMMMDD............",
        "............DDMMLLLLMMDD..........",
        "..........DDMMLLLLLLLLMMDD........",
        ".........DMLLLLLLLLLLLLLMMD.......",
        "........DMLLLLLLLHHHHLLLLMD.......",
        ".......DMLLLLLLLHHAAHHLLLLMD......",
        ".......DMLLLLLLHAAAAAAHLLLLMD.....",
        "......DMLLLLLLHAAAWWAAAHLLLLMD....",
        "......DMLLLLLLHAAWRRWAAHLLLLMD....",
        ".....DMLLLLLLLHAAWRBRAWHLLLLMD....",
        ".....DMLLLLLLLHAAWWRWAWHLLLLMD....",
        ".....DMLLLLLLLLHAAWRWAAHLLLLMDD...",
        "....DMLLLLLLLLLLHAAAAAAHLLLLMDDL..",
        "....DMLLLLLLLLLLLHAAAAHLLLLLMDLL..",
        "...DMLLLLLLLLLLLLLHHHHLLLLLLMDLL..",
        "...DMLLLLLLLLLLLLLLLLLLLLLLLMLLL..",
        "...DMLLLLLLLLLLLLLLLLLLLLLLLMLL...",
        "...DMLLLLLLLLLLLLLLLLLLLLLLLM.....",
        "...DDMLLLLLLLLLLLLLLLLLLLLLM......",
        "....DDMLLLLLLLLLLLLLLLLLMLM.......",
        ".....DDMMLLLLLLLLLLLLLMMMD........",
        "......DDMMLLLFFFFFLLLMMDD.........",
        ".......DDMMMFFFFFFFMMMD...........",
        "........DDDMMTTTTTMMMD............",
        "..........DDDMTTMMMD..............",
        "............DDMMMD................",
        "..............DDD.................",
    ]
    for dy, row in enumerate(rows):
        for dx, ch in enumerate(row):
            c = P.get(ch)
            if c is not None:
                put(pixels, x + dx, y + dy, c, W, H)


def _stern_curl(pixels, x, y):
    """Curled tail on the stern."""
    P = {'D': DRG_D, 'M': DRG_M, 'L': DRG_L, 'H': DRG_H}
    rows = [
        "......DDD..",
        "....DDMMMDD",
        "...DMLLLLMD",
        "..DMLLHHLLM",
        ".DMLHHDDHHL",
        ".DMLHDDDDHL",
        ".DMLHHDDHHL",
        ".DMLLHHLLM.",
        "..DMLLLLM..",
        "...DMMMD...",
        "....DDD....",
    ]
    for dy, row in enumerate(rows):
        for dx, ch in enumerate(row):
            c = P.get(ch)
            if c is not None:
                put(pixels, x + dx, y + dy, c, W, H)


# ================== LEIF ==================
def draw_leif(pixels, x, y):
    """Large detailed Viking warrior sprite ~34 wide × 74 tall (with spear).

    Origin (x, y) is top-left of the spear tip. The character body starts
    ~20 rows below that.
    """
    P = {
        '.': None,
        'K': BOOT,
        'T': TUNIC, 't': TUNIC_H,
        'C': CAPE, 'c': CAPE_H, 'X': CAPE_S,
        'S': SKIN, 's': SKIN_S, 'H': SKIN_H,
        'B': BEARD, 'b': BEARD_H,
        'M': HELM, 'm': HELM_H, 'D': HELM_S,
        'W': HELM_HORN, 'w': HELM_HORN_S,
        'P': SPEAR_H, 'p': (52, 32, 12),
        'F': SPEAR_TIP, 'f': SPEAR_TIP_H, 'g': SPEAR_TIP_S,
        'L': BELT,
        'G': (232, 188, 68),
    }
    rows = [
        # 0-6: spear tip
        ".......................f..........",
        "......................fFf.........",
        ".....................fFFFf........",
        ".....................FFFFF........",
        ".....................gFFFg........",
        "......................gFg.........",
        "......................gPg.........",
        # 7-12: spear shaft, helmet horns growing
        "..W...................gPg....W....",
        "..Ww..................pPp....w....",
        ".WWw..................pPp....Ww...",
        ".Www..................pPp....Www..",
        "WWww..................pPp....Wwww.",
        "WWww..................pPp....Wwww.",
        # 13-19: helmet crown
        ".www........DDDDDDDD..pPp....Www..",
        "..w........DDMMMMMMMDD.pPp...ww...",
        "..........DDMMMMMMMMMMDp.....w....",
        ".........DDMMMMMmmMMMMMDD.........",
        "........DDMMMMMmmmmMMMMMDD........",
        "........DMMMMMmmmmmmMMMMMD........",
        ".......DDMMMMMMmmmmMMMMMMDD.......",
        # 20-23: helmet body + bolt line
        "......DDMMMMMMMMMMMMMMMMMMDD......",
        "......DMMMMMMMMMMMMMMMMMMMMD......",
        "......DMMMMmMMMMMMMMMMMmMMMD......",
        "......DDDDDDMMMMMMMMMMDDDDDDD.....",
        # 24-30: face
        "........HHSSSSSSSSSSSSSSHH........",
        ".......HSSSSSSSSSSSSSSSSSSH.......",
        "......HSSKKKSSSSSSSSSSKKKSSH......",
        "......HSKKBKSSSSSSSSSKKBKSH.......",
        "......HSSKKSSSSSSSSSSKKSSH........",
        ".......HHSSSSSSSSSSSSSSHH.........",
        "........HSSSSHHHHHHSSSSH..........",
        # 31-36: nose + mustache
        ".........HSSSSSSSSSSSH............",
        ".........HHSSSSSSSSHH.............",
        "..........BBbbBBBbbBB.............",
        ".........BBBBBBBBBBBBB............",
        ".........BbBBBBBBBBbBB............",
        "........BBBBBBBBBBBBBBB...........",
        # 37-44: beard
        "........BbBBBBbBBbBBBBBB..........",
        "........BBBBBBBBBBBBBBBB..........",
        ".........BBBBBBBBBBBBBB...........",
        "..........BBBBBBBBBBBB............",
        "...........BBBBBBBBBB.............",
        "............BBBBBBBB..............",
        ".............BBBBBB...............",
        "..............BBBB................",
        # 45-49: cape + shoulders
        "......CCCC..........CCCC..........",
        ".....CcCCCCCCCCCCCCCCCcC..........",
        "....CcCTTTTTTTTTTTTTTTCcC.........",
        "....CXTTtTTtTTtTTtTTtTXC..........",
        "....CXTTTtTTtTTtTTtTTTXC..........",
        # 50-55: torso (chainmail-textured tunic)
        "....XXTTtTTtTTtTTtTTtTXX..........",
        "....XX.TTTtTTtTTtTTTTt.XX.........",
        ".......TTtTTtTTtTTtTTt............",
        ".......TTTTtTTtTTtTTTT............",
        ".......TTtTTtTTtTTtTTt............",
        ".......TTTtTTtTTtTTtTT............",
        # 56-58: belt
        ".......LLLLLLLLLLLLLLL............",
        ".......LGGLLGGLLGGLLGL............",
        ".......LLLLLLLLLLLLLLL............",
        # 59-62: tunic below belt
        ".......TTtTTtTTtTTtTTt............",
        ".......TTTtTTtTTtTTtTT............",
        ".......TTtTTtTTtTTtTTt............",
        ".......TTtTTtT.TTtTTtT............",
        # 63-66: legs
        ".......TTTTT...TTTTTTT............",
        ".......TTTT....TTTTTTT............",
        ".......TTTT.....TTTTTT............",
        ".......TTTT.....TTTTTT............",
        # 67-69: shins
        "........TTT......TTTTT............",
        "........TTT......TTTT.............",
        "........TT........TTT.............",
        # 70-73: boots
        ".......KKKK......KKKK.............",
        ".......KKKKK....KKKKK.............",
        "......KKKKKK...KKKKKK.............",
        "......KKKKKK...KKKKKK.............",
    ]
    for dy, row in enumerate(rows):
        for dx, ch in enumerate(row):
            c = P.get(ch)
            if c is not None:
                put(pixels, x + dx, y + dy, c, W, H)


# ================== FRAME + CAPTION ==================
def draw_frame(pixels):
    # Double frame
    for x in range(W):
        put(pixels, x, 0, FRAME_D, W, H)
        put(pixels, x, 1, FRAME_M, W, H)
        put(pixels, x, H - 2, FRAME_M, W, H)
        put(pixels, x, H - 1, FRAME_D, W, H)
    for y in range(H):
        put(pixels, 0, y, FRAME_D, W, H)
        put(pixels, 1, y, FRAME_M, W, H)
        put(pixels, W - 2, y, FRAME_M, W, H)
        put(pixels, W - 1, y, FRAME_D, W, H)

    # Corner ornaments
    for cx, cy in [(4, 4), (W - 5, 4), (4, H - 5), (W - 5, H - 5)]:
        put(pixels, cx, cy, GOLD, W, H)
        put(pixels, cx - 1, cy, GOLD_H, W, H)
        put(pixels, cx + 1, cy, GOLD_H, W, H)
        put(pixels, cx, cy - 1, GOLD_H, W, H)
        put(pixels, cx, cy + 1, GOLD_H, W, H)


def draw_caption(pixels):
    banner_y0 = H - 20
    fill_rect(pixels, 2, banner_y0, W - 2, H - 2, FRAME_D, W, H)
    # gold top edge
    for x in range(2, W - 2):
        put(pixels, x, banner_y0, GOLD, W, H)
        put(pixels, x, banner_y0 + 1, FRAME_M, W, H)

    year = "C. 1000"
    title = "LEIF  ERIKSON"
    sub = "NORSE  REACH  VINLAND"
    tw, _ = measure(title, scale=1)
    sw, _ = measure(sub, scale=1)

    draw_text(pixels, year, 8, banner_y0 + 4, GOLD_H, scale=1, bounds=BOUNDS)
    draw_text(pixels, title, (W - tw) // 2, banner_y0 + 4, GOLD, scale=1, bounds=BOUNDS)
    draw_text(pixels, sub, (W - sw) // 2, banner_y0 + 12, CAP_TXT, scale=1, bounds=BOUNDS)

    # Star flourishes
    _small_star(pixels, 118, banner_y0 + 7, GOLD_H)
    _small_star(pixels, 208, banner_y0 + 7, GOLD_H)


def _small_star(pixels, cx, cy, color):
    rows = ["..#..", "#.#.#", ".###.", "#.#.#", "..#.."]
    for dy, row in enumerate(rows):
        for dx, ch in enumerate(row):
            if ch == '#':
                put(pixels, cx - 2 + dx, cy - 2 + dy, color, W, H)


# ================== COMPOSE ==================
def render(out_path: Path):
    img, pixels = new_canvas(W, H, SKY[0])
    draw_sky(pixels)
    draw_sun(pixels, 244, 46, 12)
    draw_clouds(pixels)
    draw_birds(pixels)
    draw_sea(pixels)
    draw_coast(pixels)
    draw_ship(pixels)
    # Big Leif on the stern, silhouetted against the sunrise sky.
    draw_leif(pixels, x=6, y=54)
    draw_frame(pixels)
    draw_caption(pixels)
    return scale_and_save(img, SCALE, out_path)


if __name__ == "__main__":
    out = Path(__file__).resolve().parent.parent.parent / "out" / "scene_01_leif_erikson.png"
    p = render(out)
    print("Wrote:", p)
