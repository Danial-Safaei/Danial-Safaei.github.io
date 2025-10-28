const words = ['PhD Researcher', 'Safe AI Specialist', 'AV Safety Researcher', 'RL Expert', 'Siemens Collaborator'];
let wordIndex = 0;
let charIndex = 0;
let deleting = false;

function type() {
    const tagline = document.getElementById('tagline');
    const currentWord = words[wordIndex];
    if (!deleting) {
        tagline.textContent = currentWord.slice(0, charIndex + 1);
        charIndex++;
        if (charIndex === currentWord.length) {
            deleting = true;
            setTimeout(type, 1500);
            return;
        }
    } else {
        tagline.textContent = currentWord.slice(0, charIndex - 1);
        charIndex--;
        if (charIndex === 0) {
            deleting = false;
            wordIndex = (wordIndex + 1) % words.length;
        }
    }
    setTimeout(type, deleting ? 80 : 150);
}

// Animate skill bars
function animateSkillBars() {
    const skillBars = document.querySelectorAll('.skill-progress');
    skillBars.forEach(bar => {
        const progress = bar.getAttribute('data-progress');
        bar.style.setProperty('--progress', progress + '%');
    });
}

// Intersection Observer for scroll animations
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all cards and items
    const elements = document.querySelectorAll('.project-card, .research-card, .publication-item, .timeline-item, .contact-item');
    elements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Smooth scroll for navigation links
function setupSmoothScroll() {
    document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Form submission handler
function setupFormHandler() {
    const form = document.getElementById('contact-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Thank you for your message! This is a demo form. In production, this would send your message.');
            form.reset();
        });
    }
}

// Theme toggle with localStorage
function setupThemeToggle() {
    const toggleBtn = document.getElementById('toggle-dark');
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
    }
    
    toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        
        // Save theme preference
        if (document.body.classList.contains('dark')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    });
}

// Add parallax effect to hero section
function setupParallax() {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector('.hero');
        if (hero && scrolled < window.innerHeight) {
            hero.style.transform = `translateY(${scrolled * 0.5}px)`;
            hero.style.opacity = 1 - (scrolled / window.innerHeight);
        }
    });
}

// Floating shapes animation variety
function enhanceFloatingShapes() {
    const shapes = document.querySelectorAll('.shape');
    shapes.forEach((shape, index) => {
        const randomDuration = 15 + Math.random() * 10;
        const randomDelay = Math.random() * 5;
        shape.style.animationDuration = `${randomDuration}s`;
        shape.style.animationDelay = `${randomDelay}s`;
    });
}

// Cute Floating Particles System
function createParticle() {
    const particleEmojis = ['✨', '⭐', '💫', '🌟', '💖', '💕', '💗', '💝', '🎀', '🦋', '🌸', '🌺', '🌼', '🌻', '🌹', '🌷', '🎨', '🎯', '🔮', '💎', '🎪', '🎭', '🎬', '🎤', '🎧', '🎵', '🎶', '🎸', '🎹', '🎺', '🚀', '🛸', '⚡', '🌈', '☁️', '🌙', '🌝', '🌞', '🌛', '🌜'];

    const colors = ['pink', 'purple', 'blue', 'yellow', 'green', 'orange', 'rainbow'];
    const animations = ['', 'wiggle', 'spin', 'bounce'];

    const container = document.getElementById('particles-container');
    if (!container) return;

    const particle = document.createElement('div');
    particle.className = 'particle';

    // Random emoji
    particle.textContent = particleEmojis[Math.floor(Math.random() * particleEmojis.length)];

    // Random color
    particle.classList.add(colors[Math.floor(Math.random() * colors.length)]);

    // Random animation
    const animClass = animations[Math.floor(Math.random() * animations.length)];
    if (animClass) particle.classList.add(animClass);

    // Random position
    particle.style.left = Math.random() * 100 + '%';
    particle.style.bottom = '0px';

    // Random size variation
    const size = 15 + Math.random() * 25;
    particle.style.fontSize = size + 'px';

    container.appendChild(particle);

    // Remove particle after animation completes
    setTimeout(() => {
        particle.remove();
    }, 10000);
}

// Create particles on scroll
let lastScrollY = 0;
let particleCreationTimer = null;

function handleScroll() {
    const currentScrollY = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    const scrollProgress = currentScrollY / (scrollHeight - clientHeight);

    // Create more particles as user scrolls down
    if (currentScrollY > lastScrollY && scrollProgress > 0.1) {
        // Clear existing timer
        if (particleCreationTimer) {
            clearTimeout(particleCreationTimer);
        }

        // Create particles during scroll
        const particleCount = scrollProgress > 0.7 ? 3 : (scrollProgress > 0.4 ? 2 : 1);
        for (let i = 0; i < particleCount; i++) {
            setTimeout(() => createParticle(), i * 100);
        }

        // Create burst of particles near the end
        if (scrollProgress > 0.85) {
            for (let i = 0; i < 5; i++) {
                setTimeout(() => createParticle(), i * 50);
            }
        }
    }

    lastScrollY = currentScrollY;
}

// Throttle scroll events for performance
let ticking = false;
function throttledScroll() {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            handleScroll();
            ticking = false;
        });
        ticking = true;
    }
}

// Create initial particles on page load
function createInitialParticles() {
    for (let i = 0; i < 5; i++) {
        setTimeout(() => createParticle(), i * 200);
    }
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    type();
    setupThemeToggle();
    animateSkillBars();
    setupScrollAnimations();
    setupSmoothScroll();
    setupFormHandler();
    setupParallax();
    enhanceFloatingShapes();
    createInitialParticles();

    // Setup scroll-triggered particles
    window.addEventListener('scroll', throttledScroll);

    // Add entrance animation to hero content
    const heroElements = document.querySelectorAll('.profile-pic, #name, #tagline, .social-links, nav');
    heroElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        setTimeout(() => {
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, 100 * index);
    });
});
