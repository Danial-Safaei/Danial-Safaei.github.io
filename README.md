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

A dependency-free static site — plain HTML, CSS, and JavaScript, with no build step, no framework, and no analytics or third-party tracking.

```
index.html      Home: research, publications, experience, education, software, contact
cv.html         Full curriculum vitae (print/PDF stylesheet included)
blog.html       Writing index, rendered from Markdown at runtime by blog.js
posts/          Markdown posts and posts.json manifest
style.css       Single stylesheet: design tokens, light/dark themes, print styles
interact.js     Theme toggle, in-page navigation, reveal, counters, back-to-top
```

To preview locally, serve the repository root and open `http://localhost:8000`:

```
python3 -m http.server 8000
```

### Adding a blog post

1. Create `posts/<slug>.md`.
2. Add an entry to `posts/posts.json` with `slug`, `title`, `date` (`YYYY-MM-DD`), `summary`, and `tags`.
