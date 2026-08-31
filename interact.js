/*
 * interact.js — behaviour + live data for danial-safaei.github.io
 *
 * Static-first: every number and card in the HTML is real, committed data.
 * At runtime this file upgrades the page from live sources, failing silently
 * back to the committed values:
 *   - data/scholar.json      (refreshed weekly by GitHub Actions)
 *   - data/publications.json (single source of truth for the pub list)
 *   - api.github.com         (repository cards)
 *   - posts/posts.json       (latest writing)
 */

const THEME_STORAGE_KEY = "theme";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const GITHUB_USER = "Danial-Safaei";
const REPO_NAMES = ["DFF", "Danial-Safaei.github.io", "RealTraj"];

function prefersReducedMotion() {
    return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function esc(s) {
    const d = document.createElement("span");
    d.textContent = String(s == null ? "" : s);
    return d.innerHTML;
}

/* ---------- Basics ---------- */

function hardenExternalLinks() {
    document.querySelectorAll('a[target="_blank"]').forEach((link) => {
        link.rel = "noopener noreferrer";
    });
}

function setYear() {
    const el = document.getElementById("year");
    if (el) el.textContent = String(new Date().getFullYear());
}

/* ---------- Theme (light default; dark is explicit) ---------- */

function applyTheme(theme) {
    const isDark = theme === "dark";
    document.body.classList.toggle("dark", isDark);
    const btn = document.getElementById("toggle-dark");
    if (btn) {
        btn.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
        btn.setAttribute("aria-pressed", String(isDark));
    }
}

function setupThemeToggle() {
    const btn = document.getElementById("toggle-dark");
    if (!btn) return;
    applyTheme(document.body.classList.contains("dark") ? "dark" : "light");
    btn.addEventListener("click", () => {
        const next = document.body.classList.contains("dark") ? "light" : "dark";
        applyTheme(next);
        try {
            localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch (e) { /* theme still applies for this page view */ }
    });
}

/* ---------- Smooth in-page navigation ---------- */

function setupSmoothScroll() {
    const behavior = prefersReducedMotion() ? "auto" : "smooth";
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener("click", (event) => {
            const href = link.getAttribute("href");
            if (!href || href === "#") return;
            let target;
            try { target = document.querySelector(href); } catch (e) { return; }
            if (!target) return;
            event.preventDefault();
            target.scrollIntoView({ behavior, block: "start" });
            const hadTabindex = target.hasAttribute("tabindex");
            if (!hadTabindex) target.setAttribute("tabindex", "-1");
            target.focus({ preventScroll: true });
            if (!hadTabindex) {
                target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
            }
            if (window.history && typeof window.history.pushState === "function") {
                window.history.pushState(null, "", href);
            }
        });
    });
}

/* ---------- Reveal on scroll ---------- */

function setupRevealAnimations() {
    const elements = document.querySelectorAll(".reveal");
    if (!elements.length) return;
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
        elements.forEach((el) => el.classList.add("is-visible"));
        return;
    }
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.08, rootMargin: "0px 0px -36px 0px" });
    elements.forEach((el) => observer.observe(el));
}

/* ---------- Active nav ---------- */

function setupActiveNavLinks() {
    const sections = Array.from(document.querySelectorAll("main section[id]"));
    const navLinks = Array.from(document.querySelectorAll('.nav a[href^="#"]'));
    if (!sections.length || !navLinks.length || !("IntersectionObserver" in window)) return;
    const ids = new Set(navLinks.map((l) => (l.getAttribute("href") || "").slice(1)));
    const setActive = (id) => {
        navLinks.forEach((link) => {
            const active = link.getAttribute("href") === `#${id}`;
            link.classList.toggle("is-active", active);
            if (active) link.setAttribute("aria-current", "true");
            else link.removeAttribute("aria-current");
        });
    };
    const observer = new IntersectionObserver((entries) => {
        const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (!visible.length) return;
        const id = visible[0].target.id;
        if (ids.has(id)) setActive(id);
    }, { threshold: [0.12, 0.35, 0.6], rootMargin: "-14% 0px -52% 0px" });
    sections.forEach((s) => observer.observe(s));
}

/* ---------- Counters ---------- */

function animateCounter(el) {
    const target = Number(el.dataset.target);
    if (!Number.isFinite(target)) return;
    const duration = 750;
    const start = performance.now();
    const step = (now) => {
        const p = Math.min((now - start) / duration, 1);
        el.textContent = String(Math.round((1 - Math.pow(1 - p, 3)) * target));
        if (p < 1) requestAnimationFrame(step);
    };
    el.textContent = "0";
    requestAnimationFrame(step);
}

function setupStatCounters() {
    const counters = document.querySelectorAll(".stat-num[data-target]");
    if (!counters.length) return;
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            animateCounter(entry.target);
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.6 });
    counters.forEach((el) => observer.observe(el));
}

function setupCiteChart() {
    const chart = document.getElementById("cite-chart");
    if (!chart) return;
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
        chart.classList.add("is-in");
        return;
    }
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.4 });
    observer.observe(chart);
}

/* ---------- Back to top / print ---------- */

function setupBackToTop() {
    const btn = document.getElementById("back-to-top");
    if (!btn) return;
    btn.hidden = false;
    let ticking = false;
    const update = () => {
        btn.classList.toggle("is-visible", window.scrollY > 700);
        ticking = false;
    };
    window.addEventListener("scroll", () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
    }, { passive: true });
    update();
}

function setupPrintButton() {
    const btn = document.getElementById("print-cv");
    if (btn) btn.addEventListener("click", () => window.print());
}

/* ==========================================================================
   Live data loaders — every one fails silently to the committed HTML.
   ========================================================================== */

async function fetchJson(url) {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error(`${url} -> ${res.status}`);
    return res.json();
}

/* ----- Scholar metrics + chart (data/scholar.json, weekly Action) ----- */

async function loadScholar() {
    let data;
    try { data = await fetchJson("data/scholar.json"); } catch (e) { return; }
    if (!data || !Number.isFinite(data.citations)) return;

    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el && Number.isFinite(value)) {
            el.dataset.target = String(value);
            el.textContent = String(value);
        }
    };
    set("m-citations", data.citations);
    set("m-h", data.hIndex);
    set("m-i10", data.i10Index);
    set("m-works", data.works);

    const updated = document.getElementById("scholar-updated");
    if (updated && data.updated) {
        const d = new Date(`${data.updated}T00:00:00`);
        if (!Number.isNaN(d.getTime())) {
            updated.textContent = d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
        }
    }

    const chart = document.getElementById("cite-chart");
    const perYear = data.perYear || {};
    const years = Object.keys(perYear).sort().slice(-4);
    if (chart && years.length) {
        const currentYear = String(new Date().getFullYear());
        const max = Math.max(...years.map((y) => perYear[y]), 1);
        const wasIn = chart.classList.contains("is-in");
        chart.innerHTML = years.map((y) => {
            const v = perYear[y];
            const h = Math.max(Math.round((v / max) * 100), 4);
            const ytd = y === currentYear ? " ytd" : "";
            return `<div class="cite-col"><span class="cite-val">${esc(v)}</span>` +
                `<span class="cite-bar${ytd}" style="--h: ${h}"></span>` +
                `<span class="cite-year">${esc(y)}</span></div>`;
        }).join("");
        chart.setAttribute("aria-label",
            "Citations per year: " + years.map((y) => `${perYear[y]} in ${y}`).join(", ") + ". Source: Google Scholar.");
        if (wasIn) chart.classList.add("is-in");
    }
}

/* ----- Publications (data/publications.json) ----- */

function accentOf(pub) {
    const types = (pub.tags || []).map((t) => t.type);
    for (const t of ["safeai", "smart", "bio", "ml"]) {
        if (types.includes(t)) return t;
    }
    return "";
}

function renderPub(pub) {
    const tags = (pub.tags || []).map((t) =>
        `<span class="tag tag-${esc(t.type)}">${esc(t.label)}</span>`).join("");
    const authors = esc(pub.authors).replace(/D\. Safaei/g, '<span class="me">D. Safaei</span>');
    const links = (pub.links || []).map((l) => {
        const external = /^https?:/i.test(l.href);
        const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : "";
        return `<a href="${esc(l.href)}"${attrs}>${esc(l.label)}</a>`;
    }).join("");
    const cites = Number.isFinite(pub.cites) ? `<span class="pub-cites">${esc(pub.cites)} citations</span>` : "";
    const titleLink = (pub.links && pub.links[0]) ? esc(pub.links[0].href) : null;
    const title = titleLink
        ? `<a href="${titleLink}" target="_blank" rel="noopener noreferrer">${esc(pub.title)}</a>`
        : esc(pub.title);
    return `<li class="pub" data-accent="${accentOf(pub)}">` +
        `<div class="pub-year">${esc(pub.year)}</div><div>` +
        (tags ? `<div class="pub-tags">${tags}</div>` : "") +
        `<h4 class="pub-title">${title}</h4>` +
        `<p class="pub-authors">${authors}</p>` +
        `<p class="pub-venue">${pub.venue}</p>` +
        `<div class="pub-links">${links}${cites}</div>` +
        `</div></li>`;
}

async function loadPublications() {
    const root = document.getElementById("pub-root");
    if (!root) return;
    let data;
    try { data = await fetchJson("data/publications.json"); } catch (e) {
        root.insertAdjacentHTML("beforeend",
            '<p class="blog-empty">Unable to load the publication list right now — see ' +
            '<a href="https://scholar.google.co.uk/citations?user=qNJPWrMAAAAJ&hl=en" target="_blank" rel="noopener noreferrer">Google Scholar</a>.</p>');
        return;
    }
    const pubs = data.publications || [];
    const peer = pubs.filter((p) => p.group === "peer");
    const pre = pubs.filter((p) => p.group === "preprint");
    const group = (title, list) => list.length
        ? `<div class="pub-group"><div class="pub-group-head"><h3>${title}</h3>` +
          `<span class="pub-group-count">${list.length} work${list.length === 1 ? "" : "s"}</span></div>` +
          `<ol class="pub-list">${list.map(renderPub).join("")}</ol></div>`
        : "";
    root.innerHTML = group("Peer-reviewed", peer) + group("Preprints and working papers", pre);
}

/* ----- GitHub repositories (live API) ----- */

async function loadRepos() {
    const root = document.getElementById("repo-root");
    if (!root) return;
    let repos;
    try {
        repos = await fetchJson(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`);
    } catch (e) { return; }
    if (!Array.isArray(repos)) return;
    const byName = new Map(repos.map((r) => [r.name, r]));
    const chosen = REPO_NAMES.map((n) => byName.get(n)).filter(Boolean);
    if (!chosen.length) return;
    root.innerHTML = chosen.map((r) => {
        const updated = new Date(r.pushed_at);
        const when = Number.isNaN(updated.getTime()) ? "" :
            updated.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
        const stars = r.stargazers_count ? `<span>★ ${esc(r.stargazers_count)}</span>` : "";
        return `<a class="repo-card" href="${esc(r.html_url)}" target="_blank" rel="noopener noreferrer">` +
            `<span class="repo-name">${esc(r.name)}</span>` +
            `<span class="repo-desc">${esc(r.description || "")}</span>` +
            `<span class="repo-meta">` +
            (r.language ? `<span class="dot">${esc(r.language)}</span>` : "") +
            stars +
            (when ? `<span>updated ${esc(when)}</span>` : "") +
            `</span></a>`;
    }).join("");
}

/* ----- Latest writing (posts/posts.json) ----- */

async function loadHomePosts() {
    const root = document.getElementById("home-posts");
    if (!root) return;
    let posts;
    try { posts = await fetchJson("posts/posts.json"); } catch (e) { return; }
    if (!Array.isArray(posts) || !posts.length) return;
    const latest = posts.slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 3);
    root.innerHTML = latest.map((p) => {
        const d = new Date(`${p.date}T00:00:00`);
        const when = Number.isNaN(d.getTime()) ? esc(p.date) :
            d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
        return `<a class="home-post" href="blog.html?post=${encodeURIComponent(p.slug)}">` +
            `<span class="post-date">${when}</span>` +
            `<h3>${esc(p.title)}</h3>` +
            `<p>${esc(p.summary || "")}</p></a>`;
    }).join("");
}

/* ----- Last site update (GitHub commits API) ----- */

async function loadSiteUpdated() {
    const el = document.getElementById("site-updated");
    if (!el) return;
    try {
        const commits = await fetchJson(
            `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_USER}.github.io/commits?per_page=1`);
        const date = commits && commits[0] && commits[0].commit && commits[0].commit.committer.date;
        if (!date) return;
        const d = new Date(date);
        if (Number.isNaN(d.getTime())) return;
        el.textContent = "Site updated " +
            d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    } catch (e) { /* keep the static footer text */ }
}

/* ---------- Init ---------- */

document.addEventListener("DOMContentLoaded", () => {
    hardenExternalLinks();
    setYear();
    setupThemeToggle();
    setupSmoothScroll();
    setupRevealAnimations();
    setupActiveNavLinks();
    setupStatCounters();
    setupCiteChart();
    setupBackToTop();
    setupPrintButton();

    loadScholar();
    loadPublications();
    loadRepos();
    loadHomePosts();
    loadSiteUpdated();
});
