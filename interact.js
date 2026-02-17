const THEME_STORAGE_KEY = "theme";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

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
    const initialTheme = savedTheme === "light" ? "light" : "dark";
    applyTheme(initialTheme);

    toggleBtn.addEventListener("click", () => {
        const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
        applyTheme(nextTheme);
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
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
        { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    revealElements.forEach((el) => observer.observe(el));
}

function setupActiveNavLinks() {
    const sections = Array.from(document.querySelectorAll("main section[id]"));
    const navLinks = Array.from(document.querySelectorAll(".nav-link"));
    if (!sections.length || !navLinks.length) return;

    const byId = new Map(navLinks.map((link) => [link.getAttribute("href")?.slice(1), link]));

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                navLinks.forEach((link) => link.classList.remove("is-active"));
                const active = byId.get(entry.target.id);
                if (active) active.classList.add("is-active");
            });
        },
        { threshold: 0.45 }
    );

    sections.forEach((section) => observer.observe(section));
}

function setupHeroParallax() {
    const heroVisual = document.querySelector(".hero-visual");
    if (!heroVisual) return;
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return;

    let ticking = false;
    window.addEventListener(
        "scroll",
        () => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(() => {
                const offset = Math.min(window.scrollY * 0.08, 32);
                heroVisual.style.transform = `translateY(${offset}px)`;
                ticking = false;
            });
        },
        { passive: true }
    );
}

document.addEventListener("DOMContentLoaded", () => {
    hardenExternalLinks();
    setYear();
    setupThemeToggle();
    setupSmoothScroll();
    setupRevealAnimations();
    setupActiveNavLinks();
    setupHeroParallax();
});
