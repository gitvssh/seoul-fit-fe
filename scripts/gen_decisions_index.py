#!/usr/bin/env python3
"""Generate docs/decisions/README.md from the decision records' front-matter.

Usage:
    python3 scripts/gen_decisions_index.py            # rewrite the index
    python3 scripts/gen_decisions_index.py --check    # exit 1 when the index is stale

The index is generated, never hand-edited (devkit policy decision-records.md §6).
Numbers that were never issued are listed as gaps so nothing is invented.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DECISIONS_DIR = ROOT / "docs" / "decisions"
INDEX_PATH = DECISIONS_DIR / "README.md"
FILENAME = re.compile(r"^(\d{4})-[a-z0-9-]+\.md$")
HEADER = (
    "# Decision records\n\n"
    "이 색인은 `scripts/gen_decisions_index.py`가 생성한다. 손으로 고치지 않는다.\n"
    "규칙: devkit `policy/decision-records.md` (단일 카운터, 불변 + 대체, status enum).\n\n"
    "| ID | Type | Status | Scope | Date | Title | Path |\n"
    "| --- | --- | --- | --- | --- | --- | --- |"
)


def parse_front_matter(text: str) -> dict[str, str]:
    match = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not match:
        return {}
    data: dict[str, str] = {}
    for line in match.group(1).splitlines():
        if ":" in line:
            key, value = line.split(":", 1)
            data[key.strip()] = value.split("#", 1)[0].strip()
    return data


def title_of(text: str) -> str:
    for line in text.splitlines():
        if line.startswith("# "):
            return re.sub(r"^(ADR|CIR)-\d{4}:\s*", "", line[2:]).strip()
    return ""


def build_index() -> str:
    rows: list[tuple[int, str]] = []
    numbers: dict[str, list[int]] = {}
    for path in sorted(DECISIONS_DIR.glob("*.md")):
        if path.name == "README.md":
            continue
        if not FILENAME.match(path.name):
            raise SystemExit(f"decision filename rule violated: {path.name}")
        text = path.read_text(encoding="utf-8")
        meta = parse_front_matter(text)
        record_id = meta.get("id", "")
        kind, number = record_id.split("-", 1)
        numbers.setdefault(kind, []).append(int(number))
        rows.append(
            (
                int(number),
                f"| {record_id} | {meta.get('type', '')} | {meta.get('status', '')} | "
                f"{meta.get('scope', '')} | {meta.get('date', '')} | {title_of(text)} | "
                f"[{path.name}]({path.name}) |",
            )
        )

    lines = [HEADER] + [row for _, row in sorted(rows)]
    gaps = []
    for kind, issued in numbers.items():
        missing = sorted(set(range(1, max(issued) + 1)) - set(issued))
        if missing:
            gaps.append(f"- {kind}: " + ", ".join(f"{kind}-{n:04d}" for n in missing))
    lines.append("")
    lines.append("## 결번")
    lines.append("")
    lines.append("\n".join(gaps) if gaps else "없음 — 발급된 번호는 모두 기록이 있다.")
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--check", action="store_true", help="verify the index is current")
    args = parser.parse_args()
    content = build_index()
    if args.check:
        current = INDEX_PATH.read_text(encoding="utf-8") if INDEX_PATH.exists() else ""
        if current != content:
            print("docs/decisions/README.md is stale; run scripts/gen_decisions_index.py", file=sys.stderr)
            return 1
        return 0
    INDEX_PATH.write_text(content, encoding="utf-8")
    print(f"wrote {INDEX_PATH.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
