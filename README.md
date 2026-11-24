# Danial Safaei

Personal academic site: https://danial-safaei.github.io

PhD researcher in the Safe Autonomy Research Group at WMG, University of Warwick, working with Siemens Digital Industries Software. Research on when simulation can be trusted as safety evidence for AI-enabled automated driving: metrics that check whether a perception model uses the same evidence in simulation as on real roads.

## Selected work

- **C-DFF: Concept-Level Diagnostics for Mechanism Parity in Simulation-Based Validation of Autonomous Driving Perception**, *2026 IEEE 29th International Conference on Intelligent Transportation Systems (ITSC)*, in press. [arXiv](https://arxiv.org/abs/2610.33760)
- **Quantifying Fidelity: A Decisive Feature Approach to Comparing Synthetic and Real Imagery**, *2026 IEEE Intelligent Vehicles Symposium (IV)*, pp. 847–854. [DOI](https://doi.org/10.1109/IV66570.2026.11624013) · [arXiv](https://arxiv.org/abs/2512.16468) · [Code](https://github.com/Danial-Safaei/DFF)
- **Mechanism Parity for Simulation-Based Validation of Autonomous-Driving Perception**, arXiv preprint, November 2026. [arXiv](https://arxiv.org/abs/2611.27447)
- **DeePLT: Personalized Lighting Facilitates by Trajectory Prediction of Recognized Residents in the Smart Home**, *International Journal of Information Technology*, vol. 16, no. 5, pp. 2987–2999. [DOI](https://doi.org/10.1007/s41870-023-01665-1)
- **Probabilistic Pedestrian Forecasts from a Handheld Phone: World-Frame Heat Maps, Visual-Inertial Height Drift, and Evaluation without Ground Truth**, arXiv preprint, October 2026. [arXiv](https://arxiv.org/abs/2610.04736) · [Code](https://github.com/Danial-Safaei/handheld-pedestrian-forecasts)

## Profiles

- ORCID: https://orcid.org/0000-0002-4443-8763
- Google Scholar: https://scholar.google.co.uk/citations?user=qNJPWrMAAAAJ&hl=en
- GitHub: https://github.com/Danial-Safaei
- LinkedIn: https://www.linkedin.com/in/danial-safaei
- ResearchGate: https://www.researchgate.net/profile/Danial-Safaei

## About this repository

A dependency-free static site: plain HTML, CSS and JavaScript, with no build step, no framework, and no analytics, cookies or third-party tracking. Every page ships real, committed content; JavaScript only upgrades it and fails silently back to what is in the HTML.

```
index.html                 Home: the idea at 7 reading levels, animated explainer, pipeline,
                           results, videos, publications, citations, about, code, writing, contact
cv.html                    Curriculum vitae (print / save-as-PDF styles included)
blog.html, blog.js         Writing index and post view, rendered from Markdown at runtime
404.html                   Not-found page
posts/                     Markdown posts + posts.json manifest
data/publications.json     Single source of truth for the publication list
data/scholar.json          Citation metrics (written by the Scholar Action)
scripts/update_scholar.py  Standard-library Scholar refresher (see below)
assets/css/site.css        Design tokens, light and dark themes, reading levels, print styles
assets/js/site.js          Theme, reading level, explainer, figures, watermark, live-data loaders
assets/fonts/              Atkinson Hyperlegible Next and Overpass (SIL Open Font License)
assets/img/                Portrait, video posters, touch icon, NAIC line drawing (watermark)
assets/video/              The 55-second explainer and the IEEE IV 2026 and ITSC 2026 talks
images/og-card.jpg         Social sharing card (1200 x 630)
favicon.svg                Site mark
style.css, interact.js     Previous design, no longer loaded by any page
```

### Reading levels

The home page can be read at seven levels, from 1 (anyone, no technical words) to 7 (specialist). Adaptive text sits in a wrapper with class `lv` (blocks) or `lvi` (inline text); each child says which levels it is for, for example `<p data-l="4 5">`. Every level must be covered exactly once inside each wrapper. The choice is remembered in the visitor's browser, and a link such as `https://danial-safaei.github.io/?level=6` opens the page at that level. It also works without JavaScript in current browsers.

### What updates itself

| What | Source | How |
| --- | --- | --- |
| Citations, h-index, i10-index, citations per year, per-paper citations | Google Scholar | `.github/workflows/update-scholar.yml` runs daily, rewrites `data/*.json` and the static fallbacks in `index.html` / `cv.html`, and commits only when something changed. Scholar often blocks GitHub's runners; then the committed data is kept, and `python3 scripts/update_scholar.py --from-browser F.json` can take numbers read in a browser. |
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

### Credits

The page watermark is an original line drawing of the National Automotive Innovation Centre at the University of Warwick (architects: Cullinan Studio). The talk videos contain images from the KITTI and Virtual KITTI 2 datasets (CC BY-NC-SA 3.0).
