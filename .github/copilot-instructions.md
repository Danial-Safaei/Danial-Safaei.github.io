# Copilot instructions for this repository

## Build, test, and deploy
- Static site served by GitHub Pages from `main`. No build step, package manager, framework or test suite.
- Preview locally with `python -m http.server 8000` from the repo root.
- `.github/workflows/update-scholar.yml` runs `scripts/update_scholar.py` daily (standard library only). It refreshes `data/scholar.json`, the per-paper `cites` in `data/publications.json`, and the Scholar line in `cv.html`, then commits only if something changed. When Google Scholar blocks GitHub's runners, the committed data is kept.

## Architecture
- `index.html`, `cv.html`, `blog.html`, `posts/*.html`, `404.html`: complete static pages written by hand. Every page must work with JavaScript disabled. The only script is the small redirect in `blog.html` that sends old `blog.html?post=<slug>` links to `posts/<slug>.html`.
- `assets/css/site.css`: the one stylesheet. Colour tokens at the top (`:root` light; dark under `prefers-color-scheme` and `[data-theme="dark"]`), then layout.
- `assets/fonts/`: self-hosted Source Serif 4 (SIL OFL). No requests to Google Fonts or other third parties.
- `data/publications.json`: machine-readable paper list used by the Scholar script. The pages do not read it; when a paper is added, update `index.html`, `cv.html` and this file.
- `404.html` uses root-relative paths (`/assets/...`) because GitHub Pages serves it at any missing address.

## Conventions
- Design: one reading column, serif type, white page with blue links, no animation, no colour badges. Keep the home page short: bio, links, a few news items, research paragraph, publications, writing.
- Publication entries: title, authors (own name as `<span class="me">D. Safaei</span>`), venue and year, a row of links (`paper`, `arXiv`, `code`, `talk`, `explainer`), and one plain sentence.
- Keep `<span id="cv-citations">`, `<span id="cv-h">`, `<span id="cv-i10">` and `<span id="cv-scholar-date">` in `cv.html` with no other attributes; the Scholar script rewrites them.
- Writing: plain British English, no em dashes.
- Privacy: only published work belongs on the site. Do not describe unpublished or under-review research.
