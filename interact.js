/*
 * interact.js — dependency-free behaviour for danial-safaei.github.io
 * Theme toggle, in-page navigation, reveal-on-scroll, counters, back-to-top.
 */

const THEME_STORAGE_KEY = "theme";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function prefersReducedMotion() {
    return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/* ---------- External links ---------- */

function hardenExternalLinks() {
    document.querySelectorAll('a[target="_blank"]').forEach((link) => {
        link.rel = "noopener noreferrer";
    });
}

/* ---------- Footer year ---------- */

function setYear() {
    const el = document.getElementById("year");
    if (el) {
        el.textContent = String(new Date().getFullYear());
    }
}

/* ---------- Theme ---------- */

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

    // The pre-paint inline script already set the class; sync the button state to it.
    applyTheme(document.body.classList.contains("dark") ? "dark" : "light");

    btn.addEventListener("click", () => {
        const next = document.body.classList.contains("dark") ? "light" : "dark";
        applyTheme(next);
        try {
            localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch (e) { /* storage unavailable; theme still applies for this page view */ }
    });

    // Follow the system preference while the visitor has made no explicit choice.
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event) => {
        let saved = null;
        try {
            saved = localStorage.getItem(THEME_STORAGE_KEY);
        } catch (e) { /* ignore */ }
        if (saved !== "light" && saved !== "dark") {
            applyTheme(event.matches ? "dark" : "light");
        }
    };

    if (typeof media.addEventListener === "function") {
        media.addEventListener("change", onChange);
    } else if (typeof media.addListener === "function") {
        media.addListener(onChange);
    }
}

/* ---------- Smooth in-page navigation ---------- */

function setupSmoothScroll() {
    const behavior = prefersReducedMotion() ? "auto" : "smooth";

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener("click", (event) => {
            const href = link.getAttribute("href");
            if (!href || href === "#") return;

            let target;
            try {
                target = document.querySelector(href);
            } catch (e) {
                return;
            }
            if (!target) return;

            event.preventDefault();
            target.scrollIntoView({ behavior, block: "start" });

            // Move focus so keyboard and screen-reader users follow the jump,
            // without leaving a permanent tab stop on a non-interactive element.
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

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        },
        { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    elements.forEach((el) => observer.observe(el));
}

/* ---------- Active navigation link ---------- */

function setupActiveNavLinks() {
    const sections = Array.from(document.querySelectorAll("main section[id]"));
    const navLinks = Array.from(document.querySelectorAll('.nav a[href^="#"]'));
    if (!sections.length || !navLinks.length || !("IntersectionObserver" in window)) return;

    const ids = new Set(navLinks.map((link) => (link.getAttribute("href") || "").slice(1)));

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
            const visible = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
            if (!visible.length) return;
            const id = visible[0].target.id;
            if (ids.has(id)) setActive(id);
        },
        { threshold: [0.15, 0.4, 0.7], rootMargin: "-12% 0px -50% 0px" }
    );

    sections.forEach((section) => observer.observe(section));
}

/* ---------- Metric counters ---------- */

function setupStatCounters() {
    const counters = document.querySelectorAll(".stat-num[data-target]");
    if (!counters.length) return;

    const setFinal = (el) => {
        el.textContent = el.dataset.target || el.textContent;
    };

    // Values are already correct in the HTML; animation is progressive enhancement only.
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
        counters.forEach(setFinal);
        return;
    }

    const animate = (el) => {
        const target = Number(el.dataset.target);
        if (!Number.isFinite(target)) {
            setFinal(el);
            return;
        }

        const duration = 750;
        const start = performance.now();
        el.textContent = "0";

        const step = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = String(Math.round(eased * target));
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                el.textContent = String(target);
            }
        };

        requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                animate(entry.target);
                observer.unobserve(entry.target);
            });
        },
        { threshold: 0.6 }
    );

    counters.forEach((el) => observer.observe(el));
}

/* ---------- Citations chart ---------- */

function setupCiteChart() {
    const chart = document.getElementById("cite-chart");
    if (!chart) return;

    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
        chart.classList.add("is-in");
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-in");
                observer.unobserve(entry.target);
            });
        },
        { threshold: 0.5 }
    );

    observer.observe(chart);
}

/* ---------- Back to top ---------- */

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

/* ---------- Print CV ---------- */

function setupPrintButton() {
    const btn = document.getElementById("print-cv");
    if (!btn) return;
    btn.addEventListener("click", () => window.print());
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
});
