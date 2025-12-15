document.addEventListener('DOMContentLoaded', () => {
    // Register ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    initHeroAnimations();
    initScrollAnimations();
    initGlitchEffect();
});

function initHeroAnimations() {
    const tl = gsap.timeline();

    tl.from('.navbar', {
        y: -100,
        opacity: 0,
        duration: 1,
        ease: 'power4.out'
    })
        .from('.glitch-text', {
            x: -50,
            opacity: 0,
            duration: 0.8,
            ease: 'back.out(1.7)'
        }, '-=0.5')
        .from('.gradient-text', {
            x: -50,
            opacity: 0,
            duration: 0.8,
            ease: 'back.out(1.7)'
        }, '-=0.6')
        .from('.subtitle', {
            y: 20,
            opacity: 0,
            duration: 0.8
        }, '-=0.6')
        .from('.cta-group', {
            y: 20,
            opacity: 0,
            duration: 0.8
        }, '-=0.6')
        .from('.hero-visual', {
            scale: 0.8,
            opacity: 0,
            duration: 1.5,
            ease: 'power2.out'
        }, '-=1');
}

function initScrollAnimations() {
    // Features Cards Stagger
    gsap.from('.card', {
        scrollTrigger: {
            trigger: '.features-section',
            start: 'top 80%',
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power2.out'
    });

    // Timeline Steps
    gsap.utils.toArray('.step').forEach((step, i) => {
        gsap.from(step, {
            scrollTrigger: {
                trigger: step,
                start: 'top 85%',
            },
            x: i % 2 === 0 ? -50 : 50,
            opacity: 0,
            duration: 0.8,
            ease: 'power2.out'
        });
    });

    // Stats Counter
    ScrollTrigger.create({
        trigger: '.stats-section',
        start: 'top 75%',
        onEnter: () => {
            document.querySelectorAll('.count').forEach(counter => {
                const target = +counter.getAttribute('data-target');
                gsap.to(counter, {
                    innerText: target,
                    duration: 2,
                    snap: { innerText: 1 },
                    ease: 'power2.out'
                });
            });
        },
        once: true
    });
}

function initGlitchEffect() {
    const glitchText = document.querySelector('.glitch-text');
    if (!glitchText) return;

    const originalText = glitchText.getAttribute('data-text');
    const chars = '010101SP0IL3RBL0CK3R';

    glitchText.addEventListener('mouseover', () => {
        let iterations = 0;
        const interval = setInterval(() => {
            glitchText.innerText = originalText.split('')
                .map((letter, index) => {
                    if (index < iterations) {
                        return originalText[index];
                    }
                    return chars[Math.floor(Math.random() * chars.length)];
                })
                .join('');

            if (iterations >= originalText.length) {
                clearInterval(interval);
                glitchText.innerText = originalText;
            }

            iterations += 1 / 2;
        }, 50);
    });
}
