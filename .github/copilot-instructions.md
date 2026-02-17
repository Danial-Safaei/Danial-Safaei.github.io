# Copilot instructions for this repository

## Build, test, and lint
- This is a static site repository with no package manager or task runner configuration (`package.json`, `pyproject.toml`, `Makefile`, etc. are not present).
- No automated test framework is configured, so running a full suite or a single test is not applicable in the current codebase.
- The only workflow (`.github/workflows/snake.yml`) generates a GitHub contribution snake SVG; it does not build, test, or lint the website.
- For manual local verification, serve the repo root with `python3 -m http.server 8000` and open `http://localhost:8000`.

## High-level architecture
- The site is a single-page profile website deployed from static files:
  - `index.html`: all page content and section structure.
  - `style.css`: all styling and responsive behavior.
  - `interact.js`: client-side behavior initialized on `DOMContentLoaded`.
  - `images/`: static assets referenced by HTML/CSS.
- Content in `index.html` reflects the public profile links also listed in `README.md` (LinkedIn, GitHub, ResearchGate, Google Scholar, arXiv).
- `interact.js` currently initializes tagline text, theme toggling, smooth in-page scrolling, external-link hardening, and dynamic footer year.

## Key conventions in this codebase
- Keep navigation links and section IDs aligned (`nav a[href^="#"]` in JS depends on matching anchors like `#about`, `#research`, etc.).
- Keep HTML IDs/classes synchronized with both `style.css` selectors and `interact.js` DOM queries when renaming or restructuring sections.
- Preserve JS hooks unless refactoring both HTML and JS together:
  - `#toggle-dark` for theme toggle
  - `#tagline` for runtime tagline text
  - `#year` for footer year injection
- Theme behavior is implemented via `body.dark` plus `localStorage.getItem('theme')` / `setItem('theme', ...)`; follow this pattern for theme-related changes.
- For external links opened in new tabs, keep `target="_blank"` and allow `hardenExternalLinks()` to enforce `rel="noopener noreferrer"`.
- `style.css` intentionally has a late-file "Minimal academic overrides" section that uses `!important` to simplify the earlier animated theme; when changing visuals, update both the base styles and this override block to avoid unexpected results.
- `interact.js` contains additional helper functions (`animateSkillBars`, `setupScrollAnimations`, `setupFormHandler`, `setupParallax`, `enhanceFloatingShapes`) that are not currently wired into initialization; if enabled, add matching markup and call them from the `DOMContentLoaded` block.
