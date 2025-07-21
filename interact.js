const words = ['Researcher', 'AI Enthusiast', 'PhD Student'];
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

document.addEventListener('DOMContentLoaded', () => {
    type();
    document.getElementById('toggle-dark').addEventListener('click', () => {
        document.body.classList.toggle('dark');
    });
});
