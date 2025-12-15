document.addEventListener('DOMContentLoaded', () => {
    // Redirect to dashboard if logged in
    // Wrap in try-catch to prevent Auth errors from stopping other init logic
    try {
        if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) {
            const loginBtn = document.querySelector('a[href="login.html"]');
            if (loginBtn) {
                loginBtn.textContent = 'Dashboard';
                loginBtn.href = 'dashboard.html';
            }
            const getStartedBtn = document.querySelector('a[href="login.html#register"]');
            if (getStartedBtn) {
                getStartedBtn.style.display = 'none';
            }
        }
    } catch (e) {
        console.error("Auth check failed:", e);
    }

    // Navbar scroll effect
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // Animate stats
    animateNumbers();
});

const samples = {
    got: "Wait, I can't believe Jon Snow killed Daenerys in the final episode! That was such a shock.",
    mcu: "Iron Man dying at the end of Endgame was the saddest moment in cinema history.",
    sw: "Darth Vader is actually Luke's father! No way!"
};

function fillDemo(type) {
    const input = document.getElementById('demoInput');
    if (input) {
        input.value = samples[type] || "";
        updateCharCount();
    }
}

const demoInput = document.getElementById('demoInput');
if (demoInput) {
    demoInput.addEventListener('input', updateCharCount);
}

function updateCharCount() {
    const input = document.getElementById('demoInput');
    const display = document.getElementById('charCount');
    if (input && display) {
        display.textContent = `${input.value.length} characters`;
    }
}

async function analyzeText() {
    const input = document.getElementById('demoInput');
    if (!input || !input.value) return;

    const btnText = document.getElementById('btnText');
    const btnLoader = document.getElementById('btnLoader');
    const resultPanel = document.getElementById('resultPanel');

    // Loading state
    if (btnText) btnText.style.display = 'none';
    if (btnLoader) btnLoader.style.display = 'inline-block';

    setTimeout(() => {
        const result = localDetect(input.value);

        // Show result
        if (btnText) btnText.style.display = 'inline';
        if (btnLoader) btnLoader.style.display = 'none';

        if (resultPanel) {
            resultPanel.className = 'result-panel active ' + (result.isSpoiler ? 'blocked' : 'safe');
            const icon = document.getElementById('statusIcon');
            const title = document.getElementById('statusTitle');
            const msg = document.getElementById('statusMsg');
            const score = document.getElementById('confidenceScore');

            if (icon) icon.textContent = result.isSpoiler ? '⚠️' : '✅';
            if (title) {
                title.textContent = result.isSpoiler ? 'Spoiler Detected' : 'Safe Content';
                title.style.color = result.isSpoiler ? 'var(--danger)' : 'var(--success)';
            }
            if (msg) msg.textContent = result.message;
            if (score) score.textContent = result.confidence + '%';
        }

    }, 800);
}

function localDetect(text) {
    const patterns = [
        /dies?|death|killed|dead/i,
        /ending|finale/i,
        /spoiler/i,
        /betrays?/i
    ];

    let score = 0;
    patterns.forEach(p => {
        if (p.test(text)) score += 3;
    });

    const confidence = Math.min((score * 20) + Math.floor(Math.random() * 20), 99);
    const isSpoiler = score > 0;

    return {
        isSpoiler,
        confidence: isSpoiler ? confidence : 5,
        message: isSpoiler
            ? 'This text contains potential plot spoilers.'
            : 'No spoilers detected in this text.'
    };
}

async function animateNumbers() {
    try {
        // Fetch real global stats from the backend
        const stats = await Api.get('/stats/global');

        const targets = {
            statSpoilers: stats.totalBlocked || 0,
            statUsers: stats.totalUsers || 0,
            statKeywords: stats.totalKeywords || 0,
            statAccuracy: stats.accuracy || 99
        };

        for (const [id, target] of Object.entries(targets)) {
            const el = document.getElementById(id);
            if (!el) continue;

            // Handle percentage separately
            if (id === 'statAccuracy') {
                el.textContent = target + '%';
                continue;
            }

            // Animate counts
            let current = 0;
            // Adaptive increment based on target size to keep animation duration ~1s
            const increment = Math.max(1, Math.ceil(target / 50));

            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    el.textContent = target.toLocaleString() + '+';
                    clearInterval(timer);
                } else {
                    el.textContent = Math.floor(current).toLocaleString();
                }
            }, 20);
        }
    } catch (err) {
        console.error("Failed to load global stats:", err);
        // Fallback to static numbers if API fails
        const fallback = {
            statSpoilers: 500000,
            statUsers: 10000,
            statKeywords: 25000
        };
        // Simple render of fallback
        Object.keys(fallback).forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = fallback[id].toLocaleString() + '+';
        });
    }
}

// ------------------------------------------------------------------
// VIDEO MODAL LOGIC (Globally Accessible)
// ------------------------------------------------------------------

window.openVideoModal = function (videoId = 'P_N_cEw48vI') {
    const modal = document.getElementById('videoModal');
    if (!modal) {
        console.error("Video Modal element not found!");
        return;
    }

    if (window.changeVideo) {
        window.changeVideo(videoId);
    }

    modal.style.display = 'flex';
    // Force reflow for animation
    void modal.offsetWidth;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
};

window.changeVideo = function (videoId) {
    const thumb = document.getElementById('videoThumb');
    const watchLink = document.getElementById('watchLink');

    // Set Thumbnail
    if (thumb) {
        thumb.style.backgroundImage = `url('https://img.youtube.com/vi/${videoId}/maxresdefault.jpg')`;
    }

    // Set Link
    if (watchLink) {
        watchLink.href = `https://www.youtube.com/watch?v=${videoId}`;
    }
};

window.closeVideoModal = function (e) {
    // If clicked inside modal content (but not close button), ignore
    if (e && e.target.closest('.video-modal') && !e.target.classList.contains('close-modal')) {
        return;
    }

    const modal = document.getElementById('videoModal');
    const frame = document.getElementById('videoFrame');

    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
            if (frame) frame.src = ""; // Stop playback
        }, 300);
    }
    document.body.style.overflow = '';
};

// Global Event Listener for Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('videoModal');
        // Only close if it's actually open
        if (modal && modal.style.display === 'flex') {
            const closeBtn = document.querySelector('.close-modal');
            // Mock an event target or just call the logic directly
            window.closeVideoModal(null);
        }

        // Also close login modal
        const loginModal = document.getElementById('loginModal');
        if (loginModal && loginModal.classList.contains('active')) {
            window.closeLoginModal(null);
        }
    }
});

// ------------------------------------------------------------------
// LOGIN MODAL LOGIC
// ------------------------------------------------------------------

window.openLoginModal = function (tab = 'login') {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'flex'; // Ensure it's flex before animating
        // Force reflow
        void modal.offsetWidth;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        switchLoginTab(tab);
    } else {
        console.error("Login Modal not found");
    }
};

window.closeLoginModal = function (e) {
    if (e && e.target.closest('.video-modal') && !e.target.classList.contains('close-modal')) return;
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
        document.body.style.overflow = '';
    }
};

window.switchLoginTab = function (tab) {
    const tabs = document.querySelectorAll('#loginModal .tab');
    const loginForm = document.getElementById('landingLoginForm');
    const regForm = document.getElementById('landingRegisterForm');

    if (tab === 'login') {
        tabs[0].style.color = 'white';
        tabs[0].style.borderBottomColor = 'var(--primary)';
        tabs[1].style.color = 'var(--text-secondary)';
        tabs[1].style.borderBottomColor = 'transparent';
        loginForm.style.display = 'block';
        regForm.style.display = 'none';

        // Update header
        const header = document.querySelector('#loginModal h3');
        if (header) header.textContent = 'Welcome Back';
    } else {
        tabs[1].style.color = 'white';
        tabs[1].style.borderBottomColor = 'var(--primary)';
        tabs[0].style.color = 'var(--text-secondary)';
        tabs[0].style.borderBottomColor = 'transparent';
        loginForm.style.display = 'none';
        regForm.style.display = 'block';

        const header = document.querySelector('#loginModal h3');
        if (header) header.textContent = 'Create Account';
    }
};

window.handleLandingLogin = async function (e) {
    e.preventDefault();
    const email = document.getElementById('landingLoginEmail').value;
    const password = document.getElementById('landingLoginPassword').value;

    try {
        await Auth.login(email, password);
        Utils.showToast('Login successful! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    } catch (err) {
        Utils.showToast(err.message || 'Login failed', 'error');
    }
};

window.handleLandingRegister = async function (e) {
    e.preventDefault();
    const name = document.getElementById('landingRegName').value;
    const email = document.getElementById('landingRegEmail').value;
    const password = document.getElementById('landingRegPassword').value;

    try {
        await Auth.register(name, email, password);
        Utils.showToast('Account created! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    } catch (err) {
        Utils.showToast(err.message || 'Registration failed', 'error');
    }
};
