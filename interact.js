const THEME_STORAGE_KEY = "theme";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const VISITOR_BADGE_BASE_URL = "https://api.visitorbadge.io/api";
const VISITOR_BADGE_PATH = encodeURIComponent("https://danial-safaei.github.io/");
const VISITOR_BADGE_STYLE = "flat";
const VISITOR_BADGE_LABEL_STYLE = "none";
const VISITOR_BADGE_LABEL_COLOR = "%2307111f";
const VISITOR_BADGE_COUNT_COLOR = "%230f5fd7";
const VIEW_BADGE_URL = `${VISITOR_BADGE_BASE_URL}/total?path=${VISITOR_BADGE_PATH}&style=${VISITOR_BADGE_STYLE}&labelStyle=${VISITOR_BADGE_LABEL_STYLE}&labelColor=${VISITOR_BADGE_LABEL_COLOR}&countColor=${VISITOR_BADGE_COUNT_COLOR}`;
const VISIT_BADGE_URL = `${VISITOR_BADGE_BASE_URL}/visitors?path=${VISITOR_BADGE_PATH}&style=${VISITOR_BADGE_STYLE}&labelStyle=${VISITOR_BADGE_LABEL_STYLE}&labelColor=${VISITOR_BADGE_LABEL_COLOR}&countColor=${VISITOR_BADGE_COUNT_COLOR}`;
const NAV_OBSERVER_THRESHOLDS = [0.2, 0.45, 0.7];
const NAV_OBSERVER_ROOT_MARGIN = "-10% 0px -55% 0px";

function hardenExternalLinks() {
    document.querySelectorAll('a[target="_blank"]').forEach((link) => {
        link.rel = "noopener noreferrer";
    });
}

function setYear() {
    const yearEl = document.getElementById("year");
    if (yearEl) {
        yearEl.textContent = String(new Date().getFullYear());
    }
}

function applyTheme(theme) {
    const isDark = theme === "dark";
    document.body.classList.toggle("dark", isDark);

    const toggleBtn = document.getElementById("toggle-dark");
    if (toggleBtn) {
        toggleBtn.textContent = isDark ? "Switch to light" : "Switch to dark";
        toggleBtn.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
    }
}

function setupThemeToggle() {
    const toggleBtn = document.getElementById("toggle-dark");
    if (!toggleBtn) return;

    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme === "light" || savedTheme === "dark"
        ? savedTheme
        : (prefersDark ? "dark" : "light");

    applyTheme(initialTheme);

    toggleBtn.addEventListener("click", () => {
        const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
        applyTheme(nextTheme);
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    });
}

function setupVisitorCounters() {
    const counters = [
        { badgeId: "view-count-badge", fallbackId: "view-count-fallback", url: VIEW_BADGE_URL },
        { badgeId: "visit-count-badge", fallbackId: "visit-count-fallback", url: VISIT_BADGE_URL },
    ];

    counters.forEach(({ badgeId, fallbackId, url }) => {
        const badge = document.getElementById(badgeId);
        const fallback = document.getElementById(fallbackId);
        if (!badge) return;

        const showBadge = () => {
            badge.hidden = false;
            if (fallback) fallback.hidden = true;
        };

        const showFallback = () => {
            badge.hidden = true;
            if (fallback) fallback.hidden = false;
        };

        badge.addEventListener("load", showBadge, { once: true });
        badge.addEventListener("error", () => {
            console.warn(`Unable to load visitor badge: ${url}`);
            showFallback();
        }, { once: true });
        badge.src = url;
    });
}

function setupSmoothScroll() {
    const prefersReducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;
    const behavior = prefersReducedMotion ? "auto" : "smooth";

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener("click", (event) => {
            const href = link.getAttribute("href");
            if (!href || href === "#") return;

            const target = document.querySelector(href);
            if (!target) return;

            event.preventDefault();
            target.scrollIntoView({ behavior, block: "start" });
            if (window.location.hash !== href) {
                history.pushState(null, "", href);
            }
        });
    });
}

function setupRevealAnimations() {
    const revealElements = document.querySelectorAll(".reveal");
    const prefersReducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
        revealElements.forEach((el) => el.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        },
        { threshold: 0.12, rootMargin: "0px 0px -30px 0px" }
    );

    revealElements.forEach((el) => observer.observe(el));
}

function setupActiveNavLinks() {
    const sections = Array.from(document.querySelectorAll("main section[id]"));
    const navLinks = Array.from(document.querySelectorAll(".nav-link"));
    if (!sections.length || !navLinks.length || !("IntersectionObserver" in window)) return;

    const navLinkById = new Map(navLinks.map((link) => [link.getAttribute("href")?.slice(1), link]));

    const setActive = (id) => {
        navLinks.forEach((link) => {
            const active = link.getAttribute("href") === `#${id}`;
            link.classList.toggle("is-active", active);
            if (active) {
                link.setAttribute("aria-current", "true");
            } else {
                link.removeAttribute("aria-current");
            }
        });
    };

    const observer = new IntersectionObserver(
        (entries) => {
            const visibleEntries = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

            if (!visibleEntries.length) return;
            const activeId = visibleEntries[0].target.id;
            if (navLinkById.has(activeId)) {
                setActive(activeId);
            }
        },
        { threshold: NAV_OBSERVER_THRESHOLDS, rootMargin: NAV_OBSERVER_ROOT_MARGIN }
    );

    sections.forEach((section) => observer.observe(section));
    if (sections[0]) {
        setActive(sections[0].id);
    }
}

function initializeCounters() {
    const counters = document.querySelectorAll(".stat-num[data-target]");
    if (!counters.length) return;

    counters.forEach((counter) => {
        counter.textContent = counter.dataset.target || counter.textContent;
    });
}

document.addEventListener("DOMContentLoaded", () => {
    hardenExternalLinks();
    setYear();
    setupThemeToggle();
    setupVisitorCounters();
    setupSmoothScroll();
    setupRevealAnimations();
    setupActiveNavLinks();
    initializeCounters();
});
