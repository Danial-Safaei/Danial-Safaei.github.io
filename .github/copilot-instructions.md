# Copilot instructions for this repository

## Build, test, and deploy
- Static site served by GitHub Pages from `main`; there is no build step, package manager, or test framework.
- Preview locally with `python3 -m http.server 8000` from the repo root.
- Workflows:
  - `.github/workflows/update-scholar.yml` runs `scripts/update_scholar.py` daily (standard library only). It refreshes `data/scholar.json`, the per-paper `cites` in `data/publications.json`, and the static fallback numbers in `index.html` and `cv.html`, then commits only if something changed.
  - `.github/workflows/snake.yml` is unrelated to the site (contribution-graph SVG).

## Architecture
- `index.html`, `cv.html`, `blog.html`, `404.html`: complete static pages. Content must stay meaningful with JavaScript disabled.
- `interact.js`: behaviour plus live-data loaders (`loadScholar`, `loadPublications`, `loadRepos`, `loadHomePosts`, `loadSiteUpdated`). Every loader fails silently back to the committed HTML.
- `data/publications.json`: single source of truth for the publication list; the homepage renders it at runtime and the "Works" count is its length.
- `blog.js` + `posts/`: Markdown posts rendered client-side; `blog.html?post=<slug>` shows one post.
- `style.css`: one stylesheet with design tokens; light theme by default, dark only via `body.dark`.

## Conventions
- Keep these hooks in sync across HTML, CSS and JS: `#toggle-dark`, `#year`, `#site-updated`, `#cite-chart`, `#m-citations`, `#m-h`, `#m-i10`, `#m-works`, `#scholar-updated`, `#pub-root`, `#repo-root`, `#home-posts`, `#cv-citations`, `#cv-h`, `#cv-i10`, `#cv-works`, `#cv-scholar-date`, `#print-cv`.
- `scripts/update_scholar.py` rewrites the block between `<!-- cite-chart:start -->` and `<!-- cite-chart:end -->` in `index.html`; do not remove the markers.
- Scroll-reveal is opt-in: the inline script in `index.html` adds `html.js`, and `.reveal` is only hidden under `.js`. `setupRevealAnimations` sets `window.__revealReady`; without it the page reveals everything after 2.5 s.
- Theme: `localStorage.theme === "dark"` is the only way to get dark mode; there is no system-preference listener.
- External links use `target="_blank"`; `hardenExternalLinks()` enforces `rel="noopener noreferrer"`.
- Privacy: only published work belongs on the site. Do not describe unpublished or under-review research.
