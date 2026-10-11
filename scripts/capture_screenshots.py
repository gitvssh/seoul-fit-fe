#!/usr/bin/env python3
"""Capture README and /about screenshots headlessly with Python Playwright.

Usage:
    python3 scripts/capture_screenshots.py https://seoulfit.damecasol.com
    python3 scripts/capture_screenshots.py http://localhost:3000 --out docs/assets/screenshots
    python3 scripts/capture_screenshots.py https://seoulfit.damecasol.com --dark   # *-dark.png variants

Requirements: python3 with the `playwright` package and a Chromium build
(`python3 -m playwright install chromium`). No Node dependency is added.

Every capture is deterministic: locale ko-KR, timezone Asia/Seoul, geolocation
granted at Seoul City Hall (37.5665, 126.978), prefers-color-scheme light
(or dark with --dark), headless Chromium. Outputs (PNG, committed by the
integrator after the map work lands):

    home-desktop.png    /                          1440x900
    home-mobile.png     /                          390x844
    detail-mobile.png   /?place=<category>:<id>    390x844  (opens the place sheet)
    places-desktop.png  /places/library            1440x900
    about-desktop.png   /about                     1440x900

The detail target defaults to the first library listed at /places/library and
can be fixed with --place library:17930. Kakao map tiles render only on hosts
registered for the map key, so run this against the deployed site for the map
captures. Keep the Kakao logo and attribution visible in published images.
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

from playwright.sync_api import Browser, Page, TimeoutError as PlaywrightTimeout, sync_playwright

SEOUL_CITY_HALL = {"latitude": 37.5665, "longitude": 126.978}
DESKTOP = {"width": 1440, "height": 900}
MOBILE = {"width": 390, "height": 844}
THEME_STORAGE_KEY = "seoul-fit.theme.v1"
CONSENT_BUTTON_LABELS = ("모두 거부", "Reject all", "모두 수락", "Accept all")


@dataclass(frozen=True)
class Shot:
    name: str
    path: str
    viewport: dict[str, int]
    mobile: bool = False


def consent_dismiss(page: Page) -> None:
    """Close the Cloudflare Zaraz consent modal when it is present (it has no stable selector)."""
    for label in CONSENT_BUTTON_LABELS:
        button = page.get_by_role("button", name=label)
        try:
            if button.count() > 0 and button.first.is_visible():
                button.first.click()
                page.wait_for_timeout(300)
                return
        except PlaywrightTimeout:
            continue


def resolve_detail_place(browser: Browser, base_url: str, timeout: int) -> str | None:
    """Read the first library link from /places/library to deep-link the map sheet."""
    context = browser.new_context(locale="ko-KR", timezone_id="Asia/Seoul", viewport=DESKTOP)
    page = context.new_page()
    try:
        page.goto(f"{base_url}/places/library", wait_until="networkidle", timeout=timeout)
        href = page.locator('a[href^="/places/library/"]').first.get_attribute("href", timeout=timeout)
    except PlaywrightTimeout:
        href = None
    finally:
        context.close()
    if not href:
        return None
    match = re.match(r"^/places/([a-z-]+)/(\d+)$", href)
    return f"{match.group(1)}:{match.group(2)}" if match else None


def capture(browser: Browser, base_url: str, shot: Shot, out_dir: Path, dark: bool, settle: int, timeout: int) -> Path:
    context = browser.new_context(
        locale="ko-KR",
        timezone_id="Asia/Seoul",
        viewport=shot.viewport,
        device_scale_factor=2 if shot.mobile else 1,
        is_mobile=shot.mobile,
        has_touch=shot.mobile,
        color_scheme="dark" if dark else "light",
        geolocation=SEOUL_CITY_HALL,
        permissions=["geolocation"],
    )
    theme = "dark" if dark else "light"
    context.add_init_script(
        f"try {{ localStorage.setItem('{THEME_STORAGE_KEY}', '{theme}'); }} catch (e) {{}}"
    )
    page = context.new_page()
    try:
        page.goto(f"{base_url}{shot.path}", wait_until="networkidle", timeout=timeout)
    except PlaywrightTimeout:
        # Live map tiles can keep the network busy; fall back to the load event.
        page.goto(f"{base_url}{shot.path}", wait_until="load", timeout=timeout)
    consent_dismiss(page)
    page.wait_for_timeout(settle)
    suffix = "-dark" if dark else ""
    target = out_dir / f"{shot.name}{suffix}.png"
    page.screenshot(path=str(target), full_page=False)
    context.close()
    return target


def main() -> int:
    parser = argparse.ArgumentParser(description="Capture Seoul Fit screenshots headlessly.")
    parser.add_argument("base_url", help="Site origin, e.g. https://seoulfit.damecasol.com")
    parser.add_argument("--out", default="docs/assets/screenshots", help="Output directory")
    parser.add_argument("--dark", action="store_true", help="Capture dark-mode variants (*-dark.png)")
    parser.add_argument("--place", help="Detail deep link target as <category>:<id>; defaults to the first library")
    parser.add_argument("--settle", type=int, default=2500, help="Extra wait in ms after network idle (map tiles)")
    parser.add_argument("--timeout", type=int, default=45000, help="Navigation timeout in ms")
    args = parser.parse_args()

    base_url = args.base_url.rstrip("/")
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        place = args.place or resolve_detail_place(browser, base_url, args.timeout)
        if not place:
            print("warning: no library found for detail-mobile; falling back to the map home", file=sys.stderr)
        detail_path = f"/?place={place}" if place else "/"

        shots = [
            Shot("home-desktop", "/", DESKTOP),
            Shot("home-mobile", "/", MOBILE, mobile=True),
            Shot("detail-mobile", detail_path, MOBILE, mobile=True),
            Shot("places-desktop", "/places/library", DESKTOP),
            Shot("about-desktop", "/about", DESKTOP),
        ]
        for shot in shots:
            target = capture(browser, base_url, shot, out_dir, args.dark, args.settle, args.timeout)
            print(f"captured {target}")
        browser.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
