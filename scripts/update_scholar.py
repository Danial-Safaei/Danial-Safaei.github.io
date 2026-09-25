"""Refresh the site's citation data from the public Google Scholar profile.

Runs daily from .github/workflows/update-scholar.yml. Standard library only,
so no third-party package can break it (the earlier scholarly-based version
failed once bibtexparser 2.x removed a module that scholarly imports).

One pass keeps every copy of the numbers in step:
  * data/scholar.json       totals, h-index, i10-index, citations per year
  * data/publications.json  per-paper "cites" values (hand formatting kept)
  * index.html, cv.html     the static fallback numbers that crawlers and
                            no-JS visitors see (runtime JS reads the JSON)

Fail-safe by design: if Scholar is unreachable, rate-limits the runner, serves
a CAPTCHA, or returns anything that does not parse cleanly and plausibly, the
Scholar data is left untouched. The script always exits 0.

Google Scholar refuses requests from GitHub's servers (HTTP 403), so the
Action usually keeps the committed data. A weekly scheduled run on Danial's
own machine reads the profile in a real browser and feeds the numbers in with
--from-browser, which goes through exactly the same checks and rendering:

    python scripts/update_scholar.py --from-browser scholar-browser.json
    python scripts/update_scholar.py --offline   # re-render fallbacks only
"""

from __future__ import annotations

import html
import json
import re
import sys
import urllib.request
from datetime import date
from pathlib import Path

SCHOLAR_ID = "qNJPWrMAAAAJ"
PROFILE_URL = (f"https://scholar.google.com/citations?user={SCHOLAR_ID}"
               "&hl=en&cstart=0&pagesize=100")

ROOT = Path(__file__).resolve().parent.parent
SCHOLAR_JSON = ROOT / "data" / "scholar.json"
PUBS_JSON = ROOT / "data" / "publications.json"
INDEX_HTML = ROOT / "index.html"
CV_HTML = ROOT / "cv.html"

HEADERS = {
    "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                   "(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"),
    "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-GB,en;q=0.9",
}

MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July",
               "August", "September", "October", "November", "December"]


def log(message: str) -> None:
    print(f"[update_scholar] {message}")


# --------------------------------------------------------------------------
# Fetch and parse
# --------------------------------------------------------------------------

def fetch_profile(url: str = PROFILE_URL) -> str:
    request = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8", "replace")


def norm_title(title: str) -> str:
    """Case- and punctuation-insensitive key for matching titles."""
    return re.sub(r"[^a-z0-9]+", "", html.unescape(title).lower())


def parse_profile(page: str) -> dict:
    """Parse a Scholar profile page. Raises ValueError if it is not one."""
    if 'id="gsc_rsb_st"' not in page:
        raise ValueError("no citation table (blocked, CAPTCHA, or layout change)")

    table = page.split('id="gsc_rsb_st"', 1)[1].split("</table>", 1)[0]
    cells = [int(n) for n in re.findall(r'class="gsc_rsb_std">(\d+)</td>', table)]
    if len(cells) < 6:
        raise ValueError(f"citation table has {len(cells)} cells, expected 6")
    # Columns are "All" and "Since <year>"; the site reports "All".
    citations, h_index, i10_index = cells[0], cells[2], cells[4]

    # Citations-per-year histogram. Bars carry a z-index counted from the
    # right (1 = latest year); years with no citations have no bar at all.
    years = [int(y) for y in re.findall(r'class="gsc_g_t"[^>]*>\s*(\d{4})\s*<', page)]
    per_year = {year: 0 for year in years}
    for attrs, value in re.findall(
            r'<a\b([^>]*\bgsc_g_a\b[^>]*)>\s*<span class="gsc_g_al">(\d+)</span>', page):
        z_index = re.search(r"z-index:\s*(\d+)", attrs)
        if not z_index:
            continue
        position = len(years) - int(z_index.group(1))
        if 0 <= position < len(years):
            per_year[years[position]] = int(value)

    rows = []
    for chunk in page.split('class="gsc_a_tr"')[1:]:
        title = re.search(r'class="gsc_a_at"[^>]*>(.*?)</a>', chunk, re.S)
        if not title:
            continue
        cites = re.search(r'class="gsc_a_ac[^"]*"[^>]*>(\d*)</a>', chunk)
        rows.append({
            "title": html.unescape(re.sub(r"<[^>]+>", "", title.group(1))).strip(),
            "cites": int(cites.group(1)) if cites and cites.group(1) else 0,
        })

    return {
        "citations": citations,
        "hIndex": h_index,
        "i10Index": i10_index,
        "perYear": {str(year): per_year[year] for year in sorted(per_year)},
        "rows": rows,
    }


def unique_works(rows: list[dict]) -> int:
    """Count Scholar entries, folding truncated duplicates of the same title."""
    keys = sorted({norm_title(r["title"]) for r in rows if r["title"]}, key=len, reverse=True)
    kept: list[str] = []
    for key in keys:
        if len(key) >= 25 and any(other.startswith(key) for other in kept):
            continue
        kept.append(key)
    return len(kept)


def plausible(new: dict, old: dict) -> bool:
    """Reject broken scrapes: zeroed counters, empty histogram, big drops."""
    if new["citations"] <= 0 or new["works"] <= 0 or not new["perYear"]:
        return False
    if new["hIndex"] > new["works"] or new["i10Index"] > new["works"]:
        return False
    if sum(new["perYear"].values()) > new["citations"]:
        return False
    # Scholar totals are cumulative; a large drop means a bad scrape.
    if old and new["citations"] < int(old.get("citations", 0)) * 0.8:
        return False
    return True


# --------------------------------------------------------------------------
# data/publications.json - per-paper citations, formatting preserved
# --------------------------------------------------------------------------

def scholar_cites_for(title: str, rows: list[dict]) -> int | None:
    """Citations for one of our titles, or None if Scholar does not list it.

    Scholar sometimes splits one work into several entries (e.g. a truncated
    title); their citations are summed.
    """
    key = norm_title(title)
    matched = []
    for row in rows:
        row_key = norm_title(row["title"])
        if row_key == key or (len(row_key) >= 25 and len(key) >= 25 and
                              (key.startswith(row_key) or row_key.startswith(key))):
            matched.append(row["cites"])
    return sum(matched) if matched else None


def patch_publication_cites(text: str, rows: list[dict]) -> str:
    data = json.loads(text)
    for pub in data.get("publications", []):
        cites = scholar_cites_for(pub.get("title", ""), rows)
        if cites is None or cites == pub.get("cites"):
            continue
        pattern = re.compile(
            r'("id":\s*"' + re.escape(pub["id"]) + r'"(?:(?!"id":).)*?"cites":\s*)(null|\d+)',
            re.S)
        text, count = pattern.subn(lambda m: m.group(1) + str(cites), text, count=1)
        if count:
            log(f"cites {pub['id']}: {pub.get('cites')} -> {cites}")
    json.loads(text)  # must still be valid JSON
    return text


# --------------------------------------------------------------------------
# Static fallbacks in index.html and cv.html
# --------------------------------------------------------------------------

def bar_height(value: int, peak: int) -> int:
    # Mirrors interact.js: Math.max(Math.round(v / max * 100), 4)
    return max(int(value * 100 / peak + 0.5), 4)


def chart_html(per_year: dict, today: date, indent: str) -> str:
    years = sorted(per_year)[-4:]
    peak = max([per_year[y] for y in years] + [1])
    label = ("Citations per year: " +
             ", ".join(f"{per_year[y]} in {y}" for y in years) +
             ". Source: Google Scholar.")
    cols = []
    for year in years:
        ytd = " ytd" if year == str(today.year) else ""
        cols.append(
            f'{indent}    <div class="cite-col"><span class="cite-val">{per_year[year]}</span>'
            f'<span class="cite-bar{ytd}" style="--h: {bar_height(per_year[year], peak)}"></span>'
            f'<span class="cite-year">{year}</span></div>')
    return (f'{indent}<div class="cite-chart" id="cite-chart" role="img" aria-label="{label}">\n'
            + "\n".join(cols) + f"\n{indent}</div>")


def set_number(text: str, element_id: str, value: int) -> str:
    """Update <span ... id="X" data-target="N">N</span> or <span id="X">N</span>."""
    text = re.sub(r'(id="' + element_id + r'" data-target=")\d+(">)\d+(<)',
                  lambda m: f"{m.group(1)}{value}{m.group(2)}{value}{m.group(3)}", text)
    text = re.sub(r'(<span id="' + element_id + r'">)\d+(</span>)',
                  lambda m: f"{m.group(1)}{value}{m.group(2)}", text)
    return text


def set_text(text: str, element_id: str, value: str) -> str:
    return re.sub(r'(<span id="' + element_id + r'">)[^<]*(</span>)',
                  lambda m: f"{m.group(1)}{value}{m.group(2)}", text)


def render_static(scholar: dict, works: int, today: date) -> None:
    updated = date.fromisoformat(scholar["updated"])
    short = f"{MONTHS[updated.month - 1]} {updated.year}"
    long = f"{MONTHS_LONG[updated.month - 1]} {updated.year}"

    if INDEX_HTML.exists():
        text = original = INDEX_HTML.read_text(encoding="utf-8")
        text = set_number(text, "m-citations", scholar["citations"])
        text = set_number(text, "m-h", scholar["hIndex"])
        text = set_number(text, "m-i10", scholar["i10Index"])
        text = set_number(text, "m-works", works)
        text = set_text(text, "scholar-updated", short)
        block = re.search(r"([ \t]*)<!-- cite-chart:start -->\n(.*?)\n[ \t]*<!-- cite-chart:end -->",
                          text, re.S)
        if block:
            indent = block.group(1)
            text = (text[:block.start(2)] + chart_html(scholar["perYear"], today, indent)
                    + text[block.end(2):])
        if text != original:
            INDEX_HTML.write_text(text, encoding="utf-8")
            log("index.html fallbacks refreshed")

    if CV_HTML.exists():
        text = original = CV_HTML.read_text(encoding="utf-8")
        text = set_number(text, "cv-citations", scholar["citations"])
        text = set_number(text, "cv-h", scholar["hIndex"])
        text = set_number(text, "cv-i10", scholar["i10Index"])
        text = set_number(text, "cv-works", works)
        text = set_text(text, "cv-scholar-date", long)
        if text != original:
            CV_HTML.write_text(text, encoding="utf-8")
            log("cv.html fallbacks refreshed")


# --------------------------------------------------------------------------

def load_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def load_browser_profile(path: Path) -> dict:
    """Profile numbers read from Scholar in a real browser (see --from-browser).

    Expected JSON: {"citations": int, "hIndex": int, "i10Index": int,
    "perYear": {"2023": 13, ...}, "rows": [{"title": str, "cites": int}, ...]}
    """
    raw = json.loads(path.read_text(encoding="utf-8-sig"))
    profile = {
        "citations": int(raw["citations"]),
        "hIndex": int(raw["hIndex"]),
        "i10Index": int(raw["i10Index"]),
        "perYear": {str(k): int(v) for k, v in sorted(raw["perYear"].items())},
        "rows": [{"title": str(r["title"]).strip(), "cites": int(r.get("cites") or 0)}
                 for r in raw["rows"]],
    }
    if not profile["rows"]:
        raise ValueError("no publication rows")
    return profile


def refresh_from_scholar(old: dict, profile: dict | None = None) -> None:
    if profile is None:
        try:
            profile = parse_profile(fetch_profile())
        except Exception as exc:  # network block, rate limit, CAPTCHA, layout change
            log(f"Scholar not usable this run, keeping existing data: {exc}")
            return

    new = {
        "updated": old.get("updated", date.today().isoformat()),
        "source": f"Google Scholar ({SCHOLAR_ID})",
        "citations": profile["citations"],
        "hIndex": profile["hIndex"],
        "i10Index": profile["i10Index"],
        "works": unique_works(profile["rows"]),
        "perYear": profile["perYear"],
    }
    if not plausible(new, old):
        log(f"scrape looked implausible, keeping existing data: {new}")
        return

    comparable = lambda d: {k: v for k, v in d.items() if k != "updated"}
    if comparable(new) != comparable(old):
        new["updated"] = date.today().isoformat()
        SCHOLAR_JSON.write_text(json.dumps(new, indent=2) + "\n", encoding="utf-8")
        log(f"scholar.json updated: {new['citations']} citations, h={new['hIndex']}, "
            f"i10={new['i10Index']}, per year {new['perYear']}")
    else:
        log("scholar.json unchanged")

    if PUBS_JSON.exists():
        text = PUBS_JSON.read_text(encoding="utf-8")
        patched = patch_publication_cites(text, profile["rows"])
        if patched != text:
            PUBS_JSON.write_text(patched, encoding="utf-8")


def main(argv: list[str] | None = None) -> int:
    """Usage:
      update_scholar.py                        fetch Scholar directly (GitHub Action)
      update_scholar.py --from-browser F.json  use numbers read in a browser
      update_scholar.py --offline              only re-render the static fallbacks
    """
    args = sys.argv[1:] if argv is None else argv
    if "--offline" in args:
        log("offline: skipping Scholar, re-rendering fallbacks only")
    elif "--from-browser" in args:
        try:
            profile = load_browser_profile(Path(args[args.index("--from-browser") + 1]))
        except Exception as exc:
            log(f"could not read browser data, keeping existing data: {exc}")
        else:
            refresh_from_scholar(load_json(SCHOLAR_JSON), profile)
    else:
        refresh_from_scholar(load_json(SCHOLAR_JSON))

    # Always re-render the static fallbacks from the committed data, so a
    # hand edit to publications.json (e.g. a new paper) also reaches the HTML.
    scholar = load_json(SCHOLAR_JSON)
    pubs = load_json(PUBS_JSON).get("publications", [])
    if scholar.get("updated") and pubs:
        render_static(scholar, len(pubs), date.today())
    return 0


if __name__ == "__main__":
    sys.exit(main())
