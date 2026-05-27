#!/usr/bin/env python3
"""
Limud — vertical short-form ad video builder.

Generates a 1080x1920 (9:16) MP4 under ~60 seconds advertising the
individual-product line on limud.co/products. 9 scenes, ~6 seconds
each, with simple ken-burns motion + a soft synthesized ambient pad.

Output:  marketing/limud_ad_short.mp4

Run with:  python3 scripts/build_ad_video.py
"""
from __future__ import annotations

import math
import os
import sys
from pathlib import Path
from typing import List, Tuple

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# moviepy 2.x API
from moviepy import ImageClip, AudioArrayClip, concatenate_videoclips, CompositeVideoClip, vfx

# ─────────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────────

W, H = 1080, 1920
FPS = 30
SCENE_DUR = 5.8           # seconds per scene
XFADE = 0.4               # seconds of crossfade between scenes

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "marketing"
OUT_DIR.mkdir(exist_ok=True)
FRAMES_DIR = ROOT / "scripts" / "ad_frames"
FRAMES_DIR.mkdir(exist_ok=True)

OUT_FILE = OUT_DIR / "limud_ad_short.mp4"

# ─────────────────────────────────────────────────────────────────
# FONTS — use Windows system fonts. Pillow finds them by name on win.
# ─────────────────────────────────────────────────────────────────

def load_font(weight: str, size: int) -> ImageFont.FreeTypeFont:
    candidates = {
        "extrabold": ["arialbd.ttf", "segoeuib.ttf", "arial.ttf"],
        "bold":      ["segoeuib.ttf", "arialbd.ttf", "arial.ttf"],
        "regular":   ["segoeui.ttf",  "arial.ttf",   "arial.ttf"],
    }[weight]
    for name in candidates:
        for base in [r"C:\Windows\Fonts", r"C:\WINDOWS\Fonts"]:
            p = Path(base) / name
            if p.exists():
                try:
                    return ImageFont.truetype(str(p), size)
                except Exception:
                    pass
    return ImageFont.load_default()


# ─────────────────────────────────────────────────────────────────
# COLORS / BRAND
# ─────────────────────────────────────────────────────────────────

# Tailwind-ish palette pulled from the actual TSX gradients used on /products.
INK = (17, 24, 39)            # gray-900
INK_2 = (55, 65, 81)          # gray-700
INK_3 = (107, 114, 128)       # gray-500
INK_4 = (156, 163, 175)       # gray-400
PAPER = (255, 255, 255)
CARD_BG = (250, 250, 252)
HAIRLINE = (229, 231, 235)

PRIMARY = (217, 70, 239)      # fuchsia-500
PRIMARY_DEEP = (192, 38, 211) # fuchsia-600
ACCENT = (139, 92, 246)       # violet-500
BLUE = (59, 130, 246)         # blue-500
EMERALD = (16, 185, 129)      # emerald-500
EMERALD_BG = (236, 253, 245)
EMERALD_INK = (4, 120, 87)

# Per-product accent gradients (matches PRODUCTS.ring in src/app/products/page.tsx)
PRODUCT_GRADS = {
    "exam-study":  [(217, 70, 239),  (236, 72, 153)],   # fuchsia → pink
    "practice":    [(59, 130, 246),  (99, 102, 241)],   # blue → indigo
    "math":        [(249, 115, 22),  (239, 68, 68)],    # orange → red
    "essay":       [(16, 185, 129),  (20, 184, 166)],   # emerald → teal
    "notes":       [(245, 158, 11),  (234, 179, 8)],    # amber → yellow
    "lab":         [(6, 182, 212),   (14, 165, 233)],   # cyan → sky
    "citation":    [(139, 92, 246),  (168, 85, 247)],   # violet → purple
    "lang":        [(244, 63, 94),   (236, 72, 153)],   # rose → pink
    "bundles":     [(217, 70, 239),  (59, 130, 246)],   # fuchsia → blue
    "hero":        [(124, 58, 237),  (236, 72, 153)],   # purple → pink
}


# ─────────────────────────────────────────────────────────────────
# DRAWING HELPERS
# ─────────────────────────────────────────────────────────────────

def vertical_gradient(size: Tuple[int, int], c1, c2) -> Image.Image:
    w, h = size
    base = Image.new("RGB", (1, h))
    for y in range(h):
        t = y / max(1, h - 1)
        r = int(c1[0] * (1 - t) + c2[0] * t)
        g = int(c1[1] * (1 - t) + c2[1] * t)
        b = int(c1[2] * (1 - t) + c2[2] * t)
        base.putpixel((0, y), (r, g, b))
    return base.resize((w, h))


def horizontal_gradient(size, c1, c2) -> Image.Image:
    w, h = size
    base = Image.new("RGB", (w, 1))
    for x in range(w):
        t = x / max(1, w - 1)
        r = int(c1[0] * (1 - t) + c2[0] * t)
        g = int(c1[1] * (1 - t) + c2[1] * t)
        b = int(c1[2] * (1 - t) + c2[2] * t)
        base.putpixel((x, 0), (r, g, b))
    return base.resize((w, h))


def diagonal_gradient(size, c1, c2) -> Image.Image:
    # Simple linear blend on the diagonal.
    w, h = size
    arr = np.zeros((h, w, 3), dtype=np.float32)
    yy, xx = np.mgrid[0:h, 0:w]
    t = (xx + yy) / (w + h - 2)
    for i, (a, b) in enumerate(zip(c1, c2)):
        arr[..., i] = a * (1 - t) + b * t
    return Image.fromarray(arr.astype(np.uint8))


def rounded_rect(draw: ImageDraw.ImageDraw, xy, radius, fill, outline=None, width=0):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def draw_text(draw, xy, text, font, fill, anchor="lt"):
    draw.text(xy, text, fill=fill, font=font, anchor=anchor)


def wrap_text(text: str, font: ImageFont.FreeTypeFont, max_width: int) -> List[str]:
    words = text.split()
    lines: List[str] = []
    cur = ""
    for w in words:
        trial = (cur + " " + w).strip()
        # measure
        bbox = font.getbbox(trial)
        width = bbox[2] - bbox[0]
        if width <= max_width:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def measure(font, text):
    bbox = font.getbbox(text)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]


def soft_shadow(img: Image.Image, radius=20, offset=(0, 10), opacity=120) -> Image.Image:
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(sh)
    sd.rectangle((0, 0, *img.size), fill=(0, 0, 0, opacity))
    blurred = sh.filter(ImageFilter.GaussianBlur(radius=radius))
    shadow.paste(blurred, offset, blurred)
    return shadow


# ─────────────────────────────────────────────────────────────────
# REUSABLE PHONE-FRAME MOCKUP
# ─────────────────────────────────────────────────────────────────

def phone_frame(content: Image.Image, frame_color=(20, 20, 28), bezel=24, corner=70) -> Image.Image:
    """Wrap a content image inside a rounded phone-style frame."""
    cw, ch = content.size
    pw, ph = cw + bezel * 2, ch + bezel * 2 + 30  # extra at top for notch
    frame = Image.new("RGBA", (pw, ph), (0, 0, 0, 0))
    d = ImageDraw.Draw(frame)
    rounded_rect(d, (0, 0, pw, ph), radius=corner, fill=(*frame_color, 255))
    # inner rounded mask + paste content
    inner = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    mask = Image.new("L", (cw, ch), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, cw, ch), radius=corner - 14, fill=255)
    inner.paste(content, (0, 0))
    inner.putalpha(mask)
    frame.paste(inner, (bezel, bezel + 30), inner)
    # notch
    notch_w, notch_h = int(pw * 0.28), 24
    nx = (pw - notch_w) // 2
    rounded_rect(d, (nx, 6, nx + notch_w, 6 + notch_h), radius=14, fill=(0, 0, 0, 255))
    return frame


# ─────────────────────────────────────────────────────────────────
# UI MOCKUP RENDERERS  (one per product, faithful to TSX layout)
# ─────────────────────────────────────────────────────────────────

# Inner content size used inside the phone frame.
INNER_W = 760
INNER_H = 1400


def base_page(title: str, sub: str, accent_grad, content_blocks: List[dict]) -> Image.Image:
    """Generic /<product> page mockup matching MarkdownToolPage shell."""
    img = Image.new("RGB", (INNER_W, INNER_H), PAPER)
    d = ImageDraw.Draw(img)

    # ── topbar (logo + nav)
    top_h = 80
    d.rectangle((0, 0, INNER_W, top_h), fill=PAPER)
    d.line((0, top_h, INNER_W, top_h), fill=HAIRLINE, width=2)
    # logo dot + word
    rounded_rect(d, (32, 22, 70, 60), radius=10, fill=PRIMARY)
    f_logo = load_font("extrabold", 30)
    draw_text(d, (84, 25), "Limud", f_logo, INK)
    f_topnav = load_font("regular", 22)
    draw_text(d, (INNER_W - 32, 30), "/products", f_topnav, INK_3, anchor="rt")

    # ── hero band with accent gradient
    hero_h = 360
    gband = diagonal_gradient((INNER_W, hero_h), accent_grad[0], accent_grad[1])
    img.paste(gband, (0, top_h))
    dh = ImageDraw.Draw(img)
    # title
    f_title = load_font("extrabold", 76)
    f_sub = load_font("regular", 30)
    dh.text((44, top_h + 60), title, font=f_title, fill=PAPER)
    sub_lines = wrap_text(sub, f_sub, INNER_W - 88)
    y = top_h + 170
    for ln in sub_lines[:3]:
        dh.text((44, y), ln, font=f_sub, fill=(255, 255, 255, 220))
        y += 40

    # ── content cards
    cy = top_h + hero_h + 28
    for block in content_blocks:
        card_h = block.get("h", 240)
        card_y = cy
        rounded_rect(dh, (32, card_y, INNER_W - 32, card_y + card_h), radius=24,
                     fill=CARD_BG, outline=HAIRLINE, width=2)
        # label chip
        chip = block.get("chip", "INPUT")
        f_chip = load_font("bold", 18)
        cw, _ = measure(f_chip, chip)
        chip_pad = 14
        rounded_rect(dh, (52, card_y + 22, 52 + cw + chip_pad * 2, card_y + 60),
                     radius=18, fill=PRIMARY)
        dh.text((52 + chip_pad, card_y + 26), chip, font=f_chip, fill=PAPER)
        # heading
        f_h = load_font("bold", 32)
        dh.text((52, card_y + 78), block.get("title", ""), font=f_h, fill=INK)
        # body lines
        f_b = load_font("regular", 24)
        bx, by = 52, card_y + 124
        for ln in block.get("lines", []):
            dh.text((bx, by), ln, font=f_b, fill=INK_2)
            by += 36
        cy += card_h + 24

    # ── footer CTA
    cta_y = INNER_H - 160
    rounded_rect(dh, (32, cta_y, INNER_W - 32, cta_y + 100), radius=28,
                 fill=PRIMARY_DEEP)
    f_cta = load_font("extrabold", 36)
    cw, _ = measure(f_cta, "Try it now →")
    dh.text(((INNER_W - cw) // 2, cta_y + 30), "Try it now →", font=f_cta, fill=PAPER)
    return img


def make_landing_mockup() -> Image.Image:
    return base_page(
        title="Limud",
        sub="AI study tools that don't do the work for you. Just sharper.",
        accent_grad=PRODUCT_GRADS["hero"],
        content_blocks=[
            {"chip": "8 TOOLS", "title": "Pick your moment",
             "lines": ["• Study Helper  • Practice Quiz",
                       "• Math Tutor    • Essay Coach",
                       "• Notes Cleaner • Lab Reviewer"], "h": 280},
            {"chip": "BUNDLES", "title": "Save up to 45% with bundles",
             "lines": ["Stack the 3 you use most.",
                       "One price, every tool."], "h": 220},
        ],
    )


def make_products_mockup() -> Image.Image:
    """The actual /products grid in mini."""
    img = Image.new("RGB", (INNER_W, INNER_H), PAPER)
    d = ImageDraw.Draw(img)
    # topbar
    top_h = 80
    d.line((0, top_h, INNER_W, top_h), fill=HAIRLINE, width=2)
    rounded_rect(d, (32, 22, 70, 60), radius=10, fill=PRIMARY)
    draw_text(d, (84, 25), "Limud", load_font("extrabold", 30), INK)
    draw_text(d, (INNER_W - 32, 30), "/products", load_font("regular", 22), INK_3, anchor="rt")
    # title chip
    f_chip = load_font("bold", 20)
    chip_text = "8 TOOLS · 4 BUNDLES"
    cw, _ = measure(f_chip, chip_text)
    rounded_rect(d, ((INNER_W-cw-40)//2, 110, (INNER_W+cw+40)//2, 156), radius=22,
                 fill=(253, 244, 255), outline=(232, 209, 248), width=2)
    d.text((((INNER_W-cw-40)//2)+20, 116), chip_text, font=f_chip, fill=PRIMARY_DEEP)
    # heading
    f_h1 = load_font("extrabold", 62)
    title = "Pick a tool. Learn deeper."
    cw, _ = measure(f_h1, title)
    d.text(((INNER_W - cw)//2, 180), title, font=f_h1, fill=INK)
    f_sub = load_font("regular", 26)
    sub = "One-time purchase or monthly subscription."
    cw, _ = measure(f_sub, sub)
    d.text(((INNER_W - cw)//2, 260), sub, font=f_sub, fill=INK_3)

    # product grid — 2 cols × 4 rows
    items = [
        ("Exam Study Helper", "$9 / exam",   PRODUCT_GRADS["exam-study"]),
        ("Practice Generator", "$5 / topic", PRODUCT_GRADS["practice"]),
        ("Math Tutor",         "$7 / pack",  PRODUCT_GRADS["math"]),
        ("Essay Coach",        "$7 / draft", PRODUCT_GRADS["essay"]),
        ("Notes Cleaner",      "$4 / lec.",  PRODUCT_GRADS["notes"]),
        ("Lab Report Reviewer","$6 / rep.",  PRODUCT_GRADS["lab"]),
        ("Citation Finder",    "$4 / pack",  PRODUCT_GRADS["citation"]),
        ("Language Lab",       "$12 / sem.", PRODUCT_GRADS["lang"]),
    ]
    grid_top = 330
    cell_w = (INNER_W - 32*2 - 24) // 2
    cell_h = 220
    gap = 24
    for i, (name, price, grad) in enumerate(items):
        col = i % 2
        row = i // 2
        x0 = 32 + col * (cell_w + gap)
        y0 = grid_top + row * (cell_h + gap)
        rounded_rect(d, (x0, y0, x0 + cell_w, y0 + cell_h), radius=24,
                     fill=CARD_BG, outline=HAIRLINE, width=2)
        # icon tile
        icon = diagonal_gradient((84, 84), grad[0], grad[1])
        mask = Image.new("L", (84, 84), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, 84, 84), radius=18, fill=255)
        img.paste(icon, (x0 + 22, y0 + 22), mask)
        # name + price
        f_n = load_font("bold", 24)
        d.text((x0 + 122, y0 + 32), name, font=f_n, fill=INK)
        f_p = load_font("regular", 22)
        d.text((x0 + 122, y0 + 70), price, font=f_p, fill=INK_3)
        # cta
        rounded_rect(d, (x0 + 22, y0 + cell_h - 60, x0 + cell_w - 22, y0 + cell_h - 22),
                     radius=14, fill=PRIMARY)
        cta_f = load_font("bold", 20)
        cw_t, _ = measure(cta_f, "Try it now →")
        d.text((x0 + (cell_w - cw_t)//2, y0 + cell_h - 52), "Try it now →", font=cta_f, fill=PAPER)
    return img


def make_study_mockup() -> Image.Image:
    return base_page(
        title="Exam Study Helper",
        sub="Drop in your coursework. Get a textbook, comic, diagrams, cheatsheet, or flashcards.",
        accent_grad=PRODUCT_GRADS["exam-study"],
        content_blocks=[
            {"chip": "INPUT", "title": "Your coursework",
             "lines": ["• Multi-file upload — chapter +",
                       "  notes + slides at once",
                       "• AI rewrites it the way you learn"], "h": 240},
            {"chip": "5 FORMATS", "title": "Pick how it explains",
             "lines": ["Textbook · Comic · Diagrams",
                       "Cheatsheet · Flashcards",
                       "Comics get AI-drawn panels."], "h": 240},
        ],
    )


def make_practice_mockup() -> Image.Image:
    return base_page(
        title="Practice Generator",
        sub="Quiz yourself on any topic. MCQ, fill-in-blank, or short answer — all AI-graded.",
        accent_grad=PRODUCT_GRADS["practice"],
        content_blocks=[
            {"chip": "TOPIC", "title": "Tell it what to drill",
             "lines": ["• Pick subject, difficulty, count",
                       "• 3 question types in one quiz",
                       "• Anchor to your own notes"], "h": 240},
            {"chip": "AI-GRADED", "title": "Honest feedback every question",
             "lines": ["Short-answer is graded by AI",
                       "with reasoning, not vibes."], "h": 220},
        ],
    )


def make_math_mockup() -> Image.Image:
    return base_page(
        title="Math Tutor",
        sub="Socratic, not solver. Hints, the next move, the common trap — never the answer.",
        accent_grad=PRODUCT_GRADS["math"],
        content_blocks=[
            {"chip": "WHAT YOU TRIED", "title": "Paste the problem + your attempt",
             "lines": ["• Names the concept",
                       "• Hands you the next hint",
                       "• Flags the trap"], "h": 240},
            {"chip": "ANTI-CHEATING", "title": "Never finishes for you",
             "lines": ["You do the math.",
                       "Limud makes sure you can."], "h": 220},
        ],
    )


def make_essay_mockup() -> Image.Image:
    return base_page(
        title="Essay Coach",
        sub="Coach, not ghost-writer. Mirrors your structure, points at the wobbles.",
        accent_grad=PRODUCT_GRADS["essay"],
        content_blocks=[
            {"chip": "YOUR DRAFT", "title": "Paste your draft — rough is fine",
             "lines": ["• Diagnoses thesis + evidence",
                       "• Flags weak transitions",
                       "• Gives 3 things to fix"], "h": 240},
            {"chip": "YOUR VOICE", "title": "Won't rewrite a single sentence",
             "lines": ["The voice stays yours.",
                       "The work is yours."], "h": 220},
        ],
    )


def make_notes_mockup() -> Image.Image:
    return base_page(
        title="Notes Cleaner",
        sub="Messy lecture notes → headings, TL;DR, decoded abbreviations. Never invents.",
        accent_grad=PRODUCT_GRADS["notes"],
        content_blocks=[
            {"chip": "RAW NOTES", "title": "Paste what you scribbled",
             "lines": ["• Fixes typos & abbreviations",
                       "• Adds headings",
                       "• Writes a 5-bullet TL;DR"], "h": 240},
            {"chip": "TRUTH-FAITHFUL", "title": "Only your words. Your facts.",
             "lines": ["If you didn't write it,",
                       "Limud won't add it."], "h": 220},
        ],
    )


def make_lab_mockup() -> Image.Image:
    return base_page(
        title="Lab Report Reviewer",
        sub="Outlines what each section should answer. Critiques your draft against the rubric.",
        accent_grad=PRODUCT_GRADS["lab"],
        content_blocks=[
            {"chip": "DATA + DRAFT", "title": "Drop in data + hypothesis",
             "lines": ["• Suggests graph types",
                       "• Flags missing controls",
                       "• Rubric-aligned critique"], "h": 240},
            {"chip": "YOU WRITE IT", "title": "Limud makes sure it lands",
             "lines": ["The lab report is yours.",
                       "We're the second pair of eyes."], "h": 220},
        ],
    )


def make_citation_mockup() -> Image.Image:
    return base_page(
        title="Citation Finder",
        sub="Paste a claim. Get real sources in APA, MLA, or Chicago — formatted.",
        accent_grad=PRODUCT_GRADS["citation"],
        content_blocks=[
            {"chip": "A CLAIM", "title": "Paste a sentence or paragraph",
             "lines": ["• Suggests primary sources",
                       "• APA / MLA / Chicago",
                       "• Flags weak claims"], "h": 240},
            {"chip": "EVIDENCE", "title": "We find. You decide.",
             "lines": ["We don't write your essay.",
                       "We find the sources."], "h": 220},
        ],
    )


def make_language_mockup() -> Image.Image:
    return base_page(
        title="Language Lab",
        sub="Spanish, French, Mandarin, Arabic, more. Drills anchored to your textbook.",
        accent_grad=PRODUCT_GRADS["lang"],
        content_blocks=[
            {"chip": "YOUR TEXTBOOK", "title": "Anchored to your current chapter",
             "lines": ["• Vocab + grammar drills",
                       "• Spaced-repetition tuned",
                       "• Reading at your level"], "h": 240},
            {"chip": "SEMESTER PASS", "title": "One language, all term",
             "lines": ["Drill daily.",
                       "Watch the gaps close."], "h": 220},
        ],
    )


def make_bundles_mockup() -> Image.Image:
    """Show the 4 bundles with savings + 'Get this bundle' CTA."""
    img = Image.new("RGB", (INNER_W, INNER_H), PAPER)
    d = ImageDraw.Draw(img)
    # topbar
    top_h = 80
    d.line((0, top_h, INNER_W, top_h), fill=HAIRLINE, width=2)
    rounded_rect(d, (32, 22, 70, 60), radius=10, fill=PRIMARY)
    draw_text(d, (84, 25), "Limud", load_font("extrabold", 30), INK)
    draw_text(d, (INNER_W - 32, 30), "/products  ▼", load_font("regular", 22), INK_3, anchor="rt")

    # header chip
    f_chip = load_font("bold", 22)
    chip = "📦 BUNDLES"
    cw, _ = measure(f_chip, chip)
    rounded_rect(d, ((INNER_W-cw-44)//2, 108, (INNER_W+cw+44)//2, 156), radius=22,
                 fill=(239, 246, 255), outline=(199, 218, 255), width=2)
    d.text((((INNER_W-cw-44)//2)+22, 114), chip, font=f_chip, fill=(37, 99, 235))

    f_h1 = load_font("extrabold", 56)
    title = "Use more tools? Pay less."
    cw, _ = measure(f_h1, title)
    d.text(((INNER_W - cw)//2, 178), title, font=f_h1, fill=INK)

    bundles = [
        ("All-Access Pass",   "Save 45%",  "$15/mo",  "All 8 tools",                     PRODUCT_GRADS["bundles"], "Best value"),
        ("Study Bundle",      "Save 22%",  "$9/mo",   "Study + Practice + Notes",        PRODUCT_GRADS["exam-study"], None),
        ("Writing Bundle",    "Save 20%",  "$8/mo",   "Essay + Citation + Notes",        PRODUCT_GRADS["essay"], None),
        ("STEM Bundle",       "Save 25%",  "$9/mo",   "Math + Lab + Practice",           PRODUCT_GRADS["math"], None),
    ]
    by = 270
    bh = 250
    for name, savings, price, includes, grad, badge in bundles:
        rounded_rect(d, (32, by, INNER_W - 32, by + bh), radius=28,
                     fill=CARD_BG, outline=HAIRLINE if not badge else (245, 158, 11), width=2 if not badge else 3)
        # icon
        icon = diagonal_gradient((90, 90), grad[0], grad[1])
        mask = Image.new("L", (90, 90), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, 90, 90), radius=20, fill=255)
        img.paste(icon, (60, by + 30), mask)
        # name
        f_n = load_font("bold", 30)
        d.text((170, by + 32), name, font=f_n, fill=INK)
        # savings chip
        f_s = load_font("bold", 18)
        sw, _ = measure(f_s, savings)
        rounded_rect(d, (170, by + 78, 170 + sw + 24, by + 112), radius=16,
                     fill=EMERALD_BG)
        d.text((182, by + 84), savings, font=f_s, fill=EMERALD_INK)
        # badge
        if badge:
            f_bd = load_font("bold", 16)
            bw, _ = measure(f_bd, badge)
            rounded_rect(d, (INNER_W - 32 - bw - 30, by + 32, INNER_W - 32 - 18, by + 60),
                         radius=14, fill=(245, 158, 11))
            d.text((INNER_W - 32 - bw - 24, by + 36), badge, font=f_bd, fill=PAPER)
        # includes
        f_inc = load_font("regular", 22)
        d.text((60, by + 138), f"Includes: {includes}", font=f_inc, fill=INK_2)
        # price + CTA
        f_price = load_font("extrabold", 36)
        d.text((60, by + 178), price, font=f_price, fill=INK)
        f_per = load_font("regular", 20)
        d.text((158, by + 192), "per month", font=f_per, fill=INK_3)
        rounded_rect(d, (INNER_W - 32 - 240, by + 178, INNER_W - 60, by + 222),
                     radius=14, fill=PRIMARY_DEEP)
        f_cta = load_font("bold", 22)
        cwt, _ = measure(f_cta, "Get this bundle →")
        d.text((INNER_W - 32 - 240 + (240 - cwt)//2, by + 184), "Get this bundle →",
               font=f_cta, fill=PAPER)
        by += bh + 20

    return img


# ─────────────────────────────────────────────────────────────────
# SCENE COMPOSITOR  — places phone mockup on a brand background +
# overlays caption text. Returns a 1080x1920 PIL Image.
# ─────────────────────────────────────────────────────────────────

def compose_scene(headline: str, sub: str, ui: Image.Image,
                  bg_c1, bg_c2,
                  tag: str = "", caption: str = "") -> Image.Image:
    canvas = Image.new("RGB", (W, H), PAPER)
    bg = diagonal_gradient((W, H), bg_c1, bg_c2)
    canvas.paste(bg)

    # decorative blobs
    blur = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bd = ImageDraw.Draw(blur)
    bd.ellipse((-200, -200, 700, 700), fill=(255, 255, 255, 22))
    bd.ellipse((W-500, H-500, W+300, H+300), fill=(255, 255, 255, 18))
    blur = blur.filter(ImageFilter.GaussianBlur(60))
    canvas.paste(blur, (0, 0), blur)

    # top tag chip
    if tag:
        d = ImageDraw.Draw(canvas)
        f_tag = load_font("bold", 28)
        tw, th = measure(f_tag, tag)
        pad = 22
        rounded_rect(d, ((W - tw - pad*2)//2, 80, (W + tw + pad*2)//2, 80 + th + pad),
                     radius=(th + pad)//2, fill=(255, 255, 255, 230))
        d.text(((W - tw)//2, 80 + pad//2 - 2), tag, font=f_tag, fill=INK)

    # headline + sub (top text block)
    d = ImageDraw.Draw(canvas)
    f_head = load_font("extrabold", 88)
    f_sub = load_font("regular", 38)
    # multiline
    head_lines = wrap_text(headline, f_head, W - 120)
    y = 180
    for ln in head_lines[:2]:
        lw, _ = measure(f_head, ln)
        d.text(((W - lw)//2, y), ln, font=f_head, fill=PAPER, anchor="lt")
        y += 100
    sub_lines = wrap_text(sub, f_sub, W - 160)
    y += 8
    for ln in sub_lines[:2]:
        lw, _ = measure(f_sub, ln)
        d.text(((W - lw)//2, y), ln, font=f_sub, fill=(255, 255, 255, 220))
        y += 48

    # phone mockup
    pf = phone_frame(ui)
    pw, ph = pf.size
    target_h = 1100
    scale = target_h / ph
    pf2 = pf.resize((int(pw * scale), int(ph * scale)), Image.LANCZOS)
    px = (W - pf2.size[0]) // 2
    py = 560
    # shadow
    shadow = soft_shadow(pf2, radius=40, offset=(0, 24), opacity=130)
    canvas.paste(shadow, (px, py + 8), shadow)
    canvas.paste(pf2, (px, py), pf2)

    # bottom caption
    if caption:
        d = ImageDraw.Draw(canvas)
        f_cap = load_font("bold", 36)
        cap_lines = wrap_text(caption, f_cap, W - 120)
        total_h = len(cap_lines) * 50
        cy = H - 80 - total_h
        for ln in cap_lines[:2]:
            lw, _ = measure(f_cap, ln)
            d.text(((W - lw)//2, cy), ln, font=f_cap, fill=PAPER)
            cy += 50
    return canvas


def compose_title_card(headline: str, sub: str, tag: str,
                       bg_c1, bg_c2) -> Image.Image:
    """First/last scene — no phone mockup, big text."""
    canvas = Image.new("RGB", (W, H), PAPER)
    bg = diagonal_gradient((W, H), bg_c1, bg_c2)
    canvas.paste(bg)

    blur = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bd = ImageDraw.Draw(blur)
    bd.ellipse((-300, 200, 800, 1300), fill=(255, 255, 255, 30))
    bd.ellipse((W-400, H-700, W+400, H+200), fill=(255, 255, 255, 25))
    blur = blur.filter(ImageFilter.GaussianBlur(80))
    canvas.paste(blur, (0, 0), blur)

    d = ImageDraw.Draw(canvas)
    # logo
    rounded_rect(d, ((W//2 - 60), 380, (W//2 + 60), 500), radius=28, fill=PAPER)
    f_logo = load_font("extrabold", 80)
    lw, _ = measure(f_logo, "L")
    d.text((W//2 - lw//2, 393), "L", font=f_logo, fill=PRIMARY_DEEP)

    f_tag = load_font("bold", 36)
    tw, th = measure(f_tag, tag)
    pad = 26
    rounded_rect(d, ((W - tw - pad*2)//2, 560, (W + tw + pad*2)//2, 560 + th + pad),
                 radius=(th + pad)//2, fill=(255, 255, 255, 240))
    d.text(((W - tw)//2, 560 + pad//2 - 2), tag, font=f_tag, fill=INK)

    f_head = load_font("extrabold", 130)
    head_lines = wrap_text(headline, f_head, W - 100)
    if len(head_lines) > 3:
        # downsize
        f_head = load_font("extrabold", 110)
        head_lines = wrap_text(headline, f_head, W - 100)
    y = 720
    for ln in head_lines:
        lw, _ = measure(f_head, ln)
        d.text(((W - lw)//2, y), ln, font=f_head, fill=PAPER)
        y += 140

    f_sub = load_font("regular", 48)
    sub_lines = wrap_text(sub, f_sub, W - 120)
    y += 30
    for ln in sub_lines[:3]:
        lw, _ = measure(f_sub, ln)
        d.text(((W - lw)//2, y), ln, font=f_sub, fill=(255, 255, 255, 230))
        y += 64

    # url at bottom
    f_url = load_font("bold", 56)
    url = "limud.co/products"
    uw, _ = measure(f_url, url)
    d.text(((W - uw)//2, H - 200), url, font=f_url, fill=PAPER)
    return canvas


# ─────────────────────────────────────────────────────────────────
# SCENE DEFINITIONS
# ─────────────────────────────────────────────────────────────────

def build_all_frames():
    print("[1/12] Hook intro", flush=True)
    frames = []
    frames.append(compose_title_card(
        headline="8 AI tools.\nOne for every\nbrain.",
        sub="Built for the way you actually study.",
        tag="LIMUD · /products",
        bg_c1=(124, 58, 237), bg_c2=(236, 72, 153),
    ))

    print("[2/12] Exam Study Helper", flush=True)
    frames.append(compose_scene(
        headline="Drop coursework.",
        sub="Get a textbook, comic, diagrams, or flashcards.",
        ui=make_study_mockup(),
        bg_c1=PRODUCT_GRADS["exam-study"][0], bg_c2=PRODUCT_GRADS["exam-study"][1],
        tag="EXAM STUDY HELPER",
        caption="$9 per exam · monthly from $5",
    ))

    print("[3/12] Practice Generator", flush=True)
    frames.append(compose_scene(
        headline="Drill any topic.",
        sub="MCQ, fill-in, short answer. AI-graded with reasoning.",
        ui=make_practice_mockup(),
        bg_c1=PRODUCT_GRADS["practice"][0], bg_c2=PRODUCT_GRADS["practice"][1],
        tag="PRACTICE GENERATOR",
        caption="$5 per topic · monthly from $4",
    ))

    print("[4/12] Math Tutor", flush=True)
    frames.append(compose_scene(
        headline="Hints, not answers.",
        sub="Names the concept. Hands you the next move. Flags the trap.",
        ui=make_math_mockup(),
        bg_c1=PRODUCT_GRADS["math"][0], bg_c2=PRODUCT_GRADS["math"][1],
        tag="MATH TUTOR",
        caption="$7 pack of 50 · monthly from $4",
    ))

    print("[5/12] Essay Coach", flush=True)
    frames.append(compose_scene(
        headline="Your draft. Your voice.",
        sub="Limud diagnoses the wobbles. Won't rewrite one sentence.",
        ui=make_essay_mockup(),
        bg_c1=PRODUCT_GRADS["essay"][0], bg_c2=PRODUCT_GRADS["essay"][1],
        tag="ESSAY COACH",
        caption="$7 per draft · monthly from $5",
    ))

    print("[6/12] Notes Cleaner", flush=True)
    frames.append(compose_scene(
        headline="Messy notes →\nstructured study.",
        sub="Decodes your abbreviations. Adds headings. TL;DR. Never invents.",
        ui=make_notes_mockup(),
        bg_c1=PRODUCT_GRADS["notes"][0], bg_c2=PRODUCT_GRADS["notes"][1],
        tag="NOTES CLEANER",
        caption="$4 per lecture · monthly from $4",
    ))

    print("[7/12] Lab Report Reviewer", flush=True)
    frames.append(compose_scene(
        headline="You write the lab report.",
        sub="Limud makes sure it lands. Rubric-aligned critique.",
        ui=make_lab_mockup(),
        bg_c1=PRODUCT_GRADS["lab"][0], bg_c2=PRODUCT_GRADS["lab"][1],
        tag="LAB REPORT REVIEWER",
        caption="$6 per report · monthly from $4",
    ))

    print("[8/12] Citation Finder", flush=True)
    frames.append(compose_scene(
        headline="Real sources.\nReal formats.",
        sub="APA, MLA, Chicago. Flags claims that don't hold up.",
        ui=make_citation_mockup(),
        bg_c1=PRODUCT_GRADS["citation"][0], bg_c2=PRODUCT_GRADS["citation"][1],
        tag="CITATION FINDER",
        caption="$4 per pack · monthly from $3",
    ))

    print("[9/12] Language Lab", flush=True)
    frames.append(compose_scene(
        headline="Anchored to\nyour textbook.",
        sub="Spanish, French, Mandarin, Arabic and more — at your level.",
        ui=make_language_mockup(),
        bg_c1=PRODUCT_GRADS["lang"][0], bg_c2=PRODUCT_GRADS["lang"][1],
        tag="LANGUAGE LAB",
        caption="$12 per semester · monthly from $5",
    ))

    print("[10/12] Bundles", flush=True)
    frames.append(compose_scene(
        headline="Use 3+ tools?\nSave up to 45%.",
        sub="All-Access · Study · Writing · STEM. Pick yours.",
        ui=make_bundles_mockup(),
        bg_c1=PRODUCT_GRADS["bundles"][0], bg_c2=PRODUCT_GRADS["bundles"][1],
        tag="BUNDLES",
        caption="One-time or monthly. Cancel anytime.",
    ))

    print("[11/12] Products grid", flush=True)
    frames.append(compose_scene(
        headline="All in one place.",
        sub="Pick your tool. Buy what you keep using. Try the rest.",
        ui=make_products_mockup(),
        bg_c1=(99, 102, 241), bg_c2=(236, 72, 153),
        tag="THE CATALOG",
        caption="limud.co/products",
    ))

    print("[12/12] CTA outro", flush=True)
    frames.append(compose_title_card(
        headline="Start free.\nPay only for\nthe tools you keep.",
        sub="Visit limud.co/products today.",
        tag="LIMUD",
        bg_c1=(236, 72, 153), bg_c2=(124, 58, 237),
    ))

    # save all frames
    for i, frame in enumerate(frames):
        out = FRAMES_DIR / f"scene_{i:02d}.png"
        frame.save(out, optimize=True)
        print(f"   -> {out.name} ({out.stat().st_size//1024} KB)", flush=True)
    return frames


# ─────────────────────────────────────────────────────────────────
# AUDIO  — synthesized soft ambient pad
# ─────────────────────────────────────────────────────────────────

def make_ambient_pad(duration_sec: float, sample_rate: int = 44100) -> np.ndarray:
    """Soft sustained chord pad (A minor 7 ish) at low volume."""
    n = int(duration_sec * sample_rate)
    t = np.linspace(0, duration_sec, n, endpoint=False)
    # chord: A2, E3, A3, C4 = 110, 164.81, 220, 261.63 Hz
    freqs = [110.0, 164.81, 220.0, 261.63, 329.63]
    weights = [0.45, 0.30, 0.30, 0.22, 0.18]
    sig = np.zeros(n)
    for f, w in zip(freqs, weights):
        # slight detune + slow LFO for warmth
        lfo = 1.0 + 0.0008 * np.sin(2 * np.pi * 0.13 * t)
        sig += w * np.sin(2 * np.pi * f * t * lfo)
    # soft attack/release envelope (no clicks)
    env = np.ones(n)
    fade = int(sample_rate * 1.5)
    env[:fade] = np.linspace(0, 1, fade) ** 1.4
    env[-fade:] = np.linspace(1, 0, fade) ** 1.4
    # global tremolo
    trem = 0.85 + 0.15 * np.sin(2 * np.pi * 0.18 * t)
    sig = sig * env * trem
    # gentle low-pass via running average to take edge off
    k = 8
    sig = np.convolve(sig, np.ones(k) / k, mode="same")
    # normalize then quiet it down — pad sits behind, doesn't dominate
    peak = np.max(np.abs(sig))
    if peak > 0:
        sig = sig / peak * 0.22  # soft target headroom
    # stereo: subtle width
    delay = int(sample_rate * 0.012)
    left = sig
    right = np.concatenate([np.zeros(delay), sig])[:n] * 0.95
    stereo = np.stack([left, right], axis=1)
    return stereo.astype(np.float32)


# ─────────────────────────────────────────────────────────────────
# RENDER
# ─────────────────────────────────────────────────────────────────

def render_video():
    frames = build_all_frames()

    # Build moviepy clips. Each clip: ken-burns zoom-in for life.
    clips = []
    for i, frame in enumerate(frames):
        arr = np.array(frame.convert("RGB"))
        clip = ImageClip(arr).with_duration(SCENE_DUR)
        # Subtle ken-burns scale-in (1.00 -> 1.04) to keep static frames lively.
        # moviepy 2.x uses resized with a lambda for time-varying transform.
        try:
            from moviepy.video.fx import Resize
            clip = clip.with_effects([Resize(lambda t, i=i: 1.00 + 0.04 * (t / SCENE_DUR))])
        except Exception:
            # Fallback: skip motion if effect API differs
            pass
        # crossfade
        clip = clip.with_fps(FPS)
        clips.append(clip)

    # Concatenate with crossfade. moviepy 2.x: use crossfadein on each but first.
    try:
        from moviepy.video.fx import CrossFadeIn, CrossFadeOut
        finals = []
        for i, c in enumerate(clips):
            if i > 0:
                c = c.with_effects([CrossFadeIn(XFADE)])
            if i < len(clips) - 1:
                c = c.with_effects([CrossFadeOut(XFADE)])
            finals.append(c)
        video = concatenate_videoclips(finals, method="compose", padding=-XFADE)
    except Exception as e:
        print(f"Crossfade fallback: {e}", flush=True)
        video = concatenate_videoclips(clips, method="compose")

    # Audio — ambient pad across the full duration
    total = video.duration
    audio_arr = make_ambient_pad(total + 0.2)
    audio = AudioArrayClip(audio_arr, fps=44100)
    video = video.with_audio(audio)

    print(f"\nRendering {total:.1f}s video to {OUT_FILE} ...", flush=True)
    video.write_videofile(
        str(OUT_FILE),
        fps=FPS,
        codec="libx264",
        audio_codec="aac",
        preset="medium",
        threads=4,
        logger=None,
    )
    print(f"\nDONE  {OUT_FILE}  ({OUT_FILE.stat().st_size//1024} KB, {total:.1f}s)")


if __name__ == "__main__":
    render_video()
