#!/usr/bin/env python3
"""
Capture mobile-portrait screenshots of every product surface on limud.co
for the advertising video. Targets 1080x1920 (9:16 vertical).

Run with: python3 scripts/capture_screenshots.py
Output:   scripts/ad_screenshots/*.png
"""
import os
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "ad_screenshots"
OUT.mkdir(exist_ok=True)

BASE = os.environ.get("LIMUD_BASE", "https://limud.co")

# Vertical viewport — capture at native 9:16, deviceScaleFactor 2 for crispness.
VIEWPORT = {"width": 540, "height": 960}  # 1080x1920 effective with deviceScaleFactor=2
DSF = 2

# Pages to capture. Each tuple = (output_filename, url_path, settle_delay_seconds, extra_wait_selector_or_None)
PAGES = [
    ("01_landing.png",       "/",                                  4, "h1"),
    ("02_products.png",      "/products",                          4, "h1"),
    ("03_study.png",         "/study",                             5, "h1"),
    ("04_practice.png",      "/practice",                          5, "h1"),
    ("05_math_tutor.png",    "/math-solver",                       5, "h1"),
    ("06_essay_coach.png",   "/essay-coach",                       5, "h1"),
    ("07_notes_cleaner.png", "/notes-cleaner",                     5, "h1"),
    ("08_lab_report.png",    "/lab-report",                        5, "h1"),
    ("09_citation.png",      "/citation-finder",                   5, "h1"),
    ("10_language_lab.png",  "/language-lab",                      5, "h1"),
    ("11_bundles.png",       "/products#bundles",                  4, "h1"),
    ("12_checkout.png",      "/products/bundle/study-bundle/checkout?billing=monthly", 5, "h1"),
]


def main():
    chrome_exe = (
        r"C:\Users\nitsa\AppData\Local\ms-playwright\chromium-1223\chrome-win64\chrome.exe"
    )
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, executable_path=chrome_exe)
        ctx = browser.new_context(
            viewport=VIEWPORT,
            device_scale_factor=DSF,
            user_agent=(
                "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) "
                "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1"
            ),
        )
        page = ctx.new_page()

        for fname, path, delay, sel in PAGES:
            url = BASE.rstrip("/") + path
            print(f"-> {fname} :: {url}", flush=True)
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=30000)
                if sel:
                    try:
                        page.wait_for_selector(sel, timeout=15000)
                    except Exception as e:
                        print(f"   (selector wait timed out: {e})", flush=True)
                page.wait_for_timeout(delay * 1000)

                # Scroll to top to ensure consistent framing.
                page.evaluate("window.scrollTo(0, 0)")
                page.wait_for_timeout(400)

                out = OUT / fname
                page.screenshot(path=str(out), full_page=False, type="png")
                print(f"   saved {out} ({out.stat().st_size//1024} KB)", flush=True)
            except Exception as e:
                print(f"   FAILED: {e}", flush=True)
                # Save what we can
                try:
                    page.screenshot(path=str(OUT / fname), full_page=False, type="png")
                except Exception:
                    pass

        browser.close()

    print("\nDONE")


if __name__ == "__main__":
    main()
