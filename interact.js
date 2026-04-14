const THEME_STORAGE_KEY = "theme";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const REVEAL_DURATION_MS = 540;
const PARALLAX_TRANSITION = `opacity ${REVEAL_DURATION_MS}ms ease`;
const VISITOR_BADGE_BASE_URL = "https://api.visitorbadge.io/api";
const VISITOR_BADGE_PATH = encodeURIComponent("https://danial-safaei.github.io/");
const VISITOR_BADGE_STYLE = "flat";
const VISITOR_BADGE_LABEL_STYLE = "none";
const VISITOR_BADGE_LABEL_COLOR = "%230A1128";
const VISITOR_BADGE_COUNT_COLOR = "%234F39E0";
const VIEW_BADGE_URL = `${VISITOR_BADGE_BASE_URL}/total?path=${VISITOR_BADGE_PATH}&style=${VISITOR_BADGE_STYLE}&labelStyle=${VISITOR_BADGE_LABEL_STYLE}&labelColor=${VISITOR_BADGE_LABEL_COLOR}&countColor=${VISITOR_BADGE_COUNT_COLOR}`;
const VISIT_BADGE_URL = `${VISITOR_BADGE_BASE_URL}/visitors?path=${VISITOR_BADGE_PATH}&style=${VISITOR_BADGE_STYLE}&labelStyle=${VISITOR_BADGE_LABEL_STYLE}&labelColor=${VISITOR_BADGE_LABEL_COLOR}&countColor=${VISITOR_BADGE_COUNT_COLOR}`;

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

function setupVisitorCounters() {
    const counters = [
        {
            badgeId: "view-count-badge",
            fallbackId: "view-count-fallback",
            url: VIEW_BADGE_URL,
        },
        {
            badgeId: "visit-count-badge",
            fallbackId: "visit-count-fallback",
            url: VISIT_BADGE_URL,
        },
    ];

    counters.forEach(({ badgeId, fallbackId, url }) => {
        const badge = document.getElementById(badgeId);
        const fallback = document.getElementById(fallbackId);
        if (!badge) return;

        const showBadge = () => {
            badge.hidden = false;
            if (fallback) {
                fallback.hidden = true;
            }
        };

        const showFallback = () => {
            badge.hidden = true;
            if (fallback) {
                fallback.hidden = false;
            }
        };

        badge.addEventListener("load", showBadge, { once: true });
        badge.addEventListener("error", () => {
            console.warn(`Unable to load visitor badge: ${url}`);
            showFallback();
        }, { once: true });
        badge.src = url;
    });
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
        { threshold: 0.1, rootMargin: "0px 0px -30px 0px" }
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
                navLinks.forEach((link) => {
                    link.classList.remove("is-active");
                    link.removeAttribute("aria-current");
                });
                const active = byId.get(entry.target.id);
                if (active) {
                    active.classList.add("is-active");
                    active.setAttribute("aria-current", "true");
                }
            });
        },
        { threshold: 0.35, rootMargin: "0px 0px -20% 0px" }
    );

    sections.forEach((section) => observer.observe(section));
}

function setupHeroParallax() {
    const heroVisual = document.querySelector(".hero-visual");
    if (!heroVisual) return;
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return;

    let parallaxReady = false;
    let ticking = false;

    const enableParallax = (e) => {
        if (e && e.propertyName !== "transform") return;
        parallaxReady = true;
        heroVisual.style.transition = PARALLAX_TRANSITION;
    };

    if (heroVisual.classList.contains("is-visible")) {
        heroVisual.style.transition = PARALLAX_TRANSITION;
        parallaxReady = true;
    } else {
        heroVisual.addEventListener("transitionend", enableParallax);
    }

    window.addEventListener(
        "scroll",
        () => {
            if (!parallaxReady || ticking) return;
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

function initParticleCanvas() {
    const canvas = document.getElementById("particle-canvas");
    if (!canvas) return;
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return;

    const ctx = canvas.getContext("2d");
    const PARTICLE_COUNT = 72;
    const MAX_DIST = 135;
    const SPEED = 0.32;

    let particles = [];
    let animFrame = null;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function makeParticle() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * SPEED,
            vy: (Math.random() - 0.5) * SPEED,
            r: Math.random() * 1.6 + 0.6,
            a: Math.random() * 0.45 + 0.15,
        };
    }

    function init() {
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(makeParticle());
        }
    }

    function step() {
        for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const isDark = document.body.classList.contains("dark");
        const lineColor = isDark ? "102,229,255" : "15,96,255";
        const dotColor = isDark ? "102,229,255" : "15,96,255";

        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.hypot(dx, dy);
                if (dist < MAX_DIST) {
                    const alpha = (1 - dist / MAX_DIST) * 0.12;
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(${lineColor},${alpha})`;
                    ctx.lineWidth = 0.8;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }

        for (const p of particles) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${dotColor},${p.a})`;
            ctx.fill();
        }
    }

    function animate() {
        step();
        draw();
        animFrame = requestAnimationFrame(animate);
    }

    function pause() {
        if (animFrame !== null) {
            cancelAnimationFrame(animFrame);
            animFrame = null;
        }
    }

    function resume() {
        if (animFrame === null) animate();
    }

    window.addEventListener("resize", () => { resize(); init(); }, { passive: true });
    document.addEventListener("visibilitychange", () => {
        document.hidden ? pause() : resume();
    });

    resize();
    init();
    animate();
}

function animateCounters() {
    const counters = document.querySelectorAll(".stat-num[data-target]");
    if (!counters.length) return;

    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) {
        counters.forEach((c) => { c.textContent = c.dataset.target; });
        return;
    }

    if (!("IntersectionObserver" in window)) {
        counters.forEach((c) => { c.textContent = c.dataset.target; });
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                const target = parseInt(el.dataset.target, 10);
                const start = parseInt(el.textContent, 10) || 0;
                const duration = 1100;
                const startTime = performance.now();

                function step(now) {
                    const elapsed = now - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    el.textContent = Math.round(start + (target - start) * eased);
                    if (progress < 1) requestAnimationFrame(step);
                }

                requestAnimationFrame(step);
                observer.unobserve(el);
            });
        },
        { threshold: 0.6 }
    );

    counters.forEach((c) => observer.observe(c));
}

document.addEventListener("DOMContentLoaded", () => {
    hardenExternalLinks();
    setYear();
    setupThemeToggle();
    setupVisitorCounters();
    setupSmoothScroll();
    setupRevealAnimations();
    setupActiveNavLinks();
    setupHeroParallax();
    initParticleCanvas();
    animateCounters();
});
