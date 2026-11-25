# danial-safaei.github.io

Personal academic website of Danial Safaei, PhD researcher at WMG, University of Warwick.
Live at <https://danial-safaei.github.io/>.

The site is plain HTML and CSS served by GitHub Pages from `main`. There is no build step,
no framework and no JavaScript dependency: every page works with JavaScript turned off.

## Pages

| File | What it is |
| --- | --- |
| `index.html` | Home: short bio, links, news, research summary, publications, writing |
| `cv.html` | Curriculum vitae (prints cleanly to PDF from the browser) |
| `blog.html` | Writing: list of posts. Old `blog.html?post=<slug>` links are sent on to the post |
| `posts/*.html` | One page per post |
| `404.html` | Page shown for missing addresses (uses root-relative paths) |

Shared files: `assets/css/site.css` (the only stylesheet), `assets/fonts/` (Source Serif 4,
SIL Open Font License), `assets/img/` (photo and icons), `assets/video/` (the two conference
talks, linked from the publication list), `images/og-card.jpg` (link-preview image).

## Common edits

- **Add a paper.** Copy an existing `<li>` in the publication list of `index.html` and of
  `cv.html`, then add the paper to `data/publications.json` so its citation count is tracked.
  Mark your own name with `<span class="me">D. Safaei</span>`.
- **Add a news item.** Add one `<li>` at the top of the News list in `index.html`. Keep the
  list to four or five items.
- **Add a post.** Copy a file in `posts/`, change the title, date and text, and add it to
  `blog.html`, the Writing list in `index.html` and `sitemap.xml`.
- **Change the date at the bottom of a page.** Edit the "Last updated" line by hand.

## Citation numbers

`.github/workflows/update-scholar.yml` runs `scripts/update_scholar.py` every day. It reads the
public Google Scholar profile and, if the numbers changed, updates `data/scholar.json`, the
per-paper `cites` in `data/publications.json`, and the Scholar line in `cv.html`
(`#cv-citations`, `#cv-h`, `#cv-i10`, `#cv-scholar-date`). Keep those four `<span id="…">`
elements without other attributes. When Scholar blocks GitHub's servers, the committed numbers
stay as they are.

## Preview locally

```
python -m http.server 8000
```

then open <http://localhost:8000/>.

## Rules for content

- Only published work: papers that are out, or preprints that are public. Nothing under review.
- Plain British English.
- The talk videos contain images from KITTI and Virtual KITTI 2 (CC BY-NC-SA 3.0); keep that
  notice in the footer of `index.html`.
