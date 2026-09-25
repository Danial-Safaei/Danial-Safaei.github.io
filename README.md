# Danial Safaei

Personal academic site: https://danial-safaei.github.io

PhD researcher in the Safe Autonomy Research Group at WMG, University of Warwick. Research on safety assurance and trustworthy evaluation for AI-enabled autonomous systems, including explainable evaluation and synthetic-data fidelity.

## Selected work

- **Quantifying Fidelity: A Decisive Feature Approach to Comparing Synthetic and Real Imagery** — *2026 IEEE Intelligent Vehicles Symposium (IV)*, pp. 847–854. [DOI](https://doi.org/10.1109/IV66570.2026.11624013) · [arXiv](https://arxiv.org/abs/2512.16468) · [Code](https://github.com/Danial-Safaei/DFF)
- **DeePLT: Personalized Lighting Facilitates by Trajectory Prediction of Recognized Residents in the Smart Home** — *International Journal of Information Technology*, vol. 16, no. 5, pp. 2987–2999. [DOI](https://doi.org/10.1007/s41870-023-01665-1)

## Profiles

- ORCID: https://orcid.org/0000-0002-4443-8763
- Google Scholar: https://scholar.google.co.uk/citations?user=qNJPWrMAAAAJ&hl=en
- GitHub: https://github.com/Danial-Safaei
- LinkedIn: https://www.linkedin.com/in/danial-safaei
- ResearchGate: https://www.researchgate.net/profile/Danial-Safaei

## About this repository

A dependency-free static site — plain HTML, CSS, and JavaScript, with no build step, no framework, and no analytics or third-party tracking. Every page ships real, committed content; JavaScript only upgrades it from live data and fails silently back to what is in the HTML.

```
index.html               Home: research, metrics, publications, experience, software, writing, contact
cv.html                  Curriculum vitae (print / save-as-PDF stylesheet included)
blog.html, blog.js       Writing index and post view, rendered from Markdown at runtime
posts/                   Markdown posts + posts.json manifest
data/publications.json   Single source of truth for the publication list
data/scholar.json        Citation metrics (written by the Scholar Action)
scripts/update_scholar.py  Standard-library Scholar refresher (see below)
style.css                Design tokens, light (default) and dark themes, print styles
interact.js              Theme toggle, navigation, reveal, counters, live-data loaders
favicon.svg              Site mark
```

### What updates itself

| What | Source | How |
| --- | --- | --- |
| Citations, h-index, i10-index, citations per year, per-paper citations | Google Scholar | `.github/workflows/update-scholar.yml` runs daily, rewrites `data/*.json` and the static fallbacks in `index.html` / `cv.html`, and commits only when something changed. If Scholar blocks the runner, the committed data is kept. |
| Repository cards (stars, language, last push) | GitHub API | Fetched in the browser on each visit |
| "Site updated" date | GitHub API (latest commit) | Fetched in the browser on each visit |
| Latest writing | `posts/posts.json` | Read in the browser on each visit |

### Adding a publication

Add an entry to `data/publications.json` (`group` is `peer` or `preprint`; the first link is used for the title). The homepage list, the "Works" count and the static fallbacks all follow from that one file; the Scholar Action fills in citation counts once Scholar lists the paper.

### Adding a blog post

1. Create `posts/<slug>.md`.
2. Add an entry to `posts/posts.json` with `slug`, `title`, `date` (`YYYY-MM-DD`), `summary`, and `tags`.

### Local preview

Serve the repository root and open `http://localhost:8000`:

```
python3 -m http.server 8000
```
