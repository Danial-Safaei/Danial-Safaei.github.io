"""Refresh data/scholar.json from Google Scholar.

Runs weekly via .github/workflows/update-scholar.yml. Designed to fail safely:
any error leaves the existing committed JSON untouched and exits 0, so the
site always has valid (if slightly stale) data and the workflow never breaks
the build. Values only change when Scholar was actually reachable.
"""

from __future__ import annotations

import json
import sys
from datetime import date, datetime
from pathlib import Path

SCHOLAR_ID = "qNJPWrMAAAAJ"
DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "scholar.json"


def fetch() -> dict:
    from scholarly import scholarly  # imported lazily so import errors are caught

    author = scholarly.search_author_id(SCHOLAR_ID)
    author = scholarly.fill(author, sections=["basics", "indices", "counts", "publications"])

    per_year = {str(k): int(v) for k, v in sorted(author.get("cites_per_year", {}).items())}
    works = len(author.get("publications", []))

    return {
        "updated": date.today().isoformat(),
        "source": f"Google Scholar ({SCHOLAR_ID})",
        "citations": int(author.get("citedby", 0)),
        "hIndex": int(author.get("hindex", 0)),
        "i10Index": int(author.get("i10index", 0)),
        "works": works,
        "perYear": per_year,
    }


def plausible(new: dict, old: dict) -> bool:
    """Reject obviously broken scrapes (empty profile, zeroed counters)."""
    if new["citations"] <= 0 or new["works"] <= 0 or not new["perYear"]:
        return False
    # Citations are cumulative on Scholar; a large drop signals a bad scrape.
    if old and new["citations"] < int(old.get("citations", 0)) * 0.8:
        return False
    return True


def main() -> int:
    old = {}
    if DATA_FILE.exists():
        try:
            old = json.loads(DATA_FILE.read_text(encoding="utf-8"))
        except Exception:
            old = {}

    try:
        new = fetch()
    except Exception as exc:  # network block, rate limit, library change...
        print(f"[update_scholar] fetch failed, keeping existing data: {exc}")
        return 0

    if not plausible(new, old):
        print("[update_scholar] scrape looked implausible, keeping existing data")
        return 0

    comparable_old = {k: v for k, v in old.items() if k != "updated"}
    comparable_new = {k: v for k, v in new.items() if k != "updated"}
    if comparable_old == comparable_new:
        print("[update_scholar] no changes")
        return 0

    DATA_FILE.write_text(json.dumps(new, indent=2) + "\n", encoding="utf-8")
    print(f"[update_scholar] updated: {new['citations']} citations, h={new['hIndex']}, "
          f"i10={new['i10Index']}, works={new['works']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
