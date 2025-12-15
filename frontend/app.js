document.addEventListener('DOMContentLoaded', () => {
    // --- UTILS & GLOBALS ---
    const API_URL = 'http://localhost:5000/api';
    const token = localStorage.getItem('token');

    // Custom Cursor
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');
    if (cursorDot && cursorOutline) {
        window.addEventListener('mousemove', (e) => {
            const posX = e.clientX;
            const posY = e.clientY;
            cursorDot.style.left = `${posX}px`;
            cursorDot.style.top = `${posY}px`;
            cursorOutline.animate({ left: `${posX}px`, top: `${posY}px` }, { duration: 500, fill: "forwards" });
        });
    }

    // API Helper
    // API Helper
    async function apiCall(endpoint, method, body = null, auth = false) {
        const headers = { 'Content-Type': 'application/json' };
        if (auth && token) headers['x-auth-token'] = token;

        const config = { method, headers };
        if (body) config.body = JSON.stringify(body);

        try {
            const res = await fetch(`${API_URL}${endpoint}`, config);
            const data = await res.json();
            if (!res.ok) {
                console.error('API Request Failed:', endpoint, res.status, data);
            }
            return { ok: res.ok, data };
        } catch (err) {
            console.error('API Network/Parse Error:', err);
            return { ok: false, data: { msg: 'Network Error: Check if backend is running' } };
        }
    }

    // --- NAVIGATION & AUTH STATE ---
    function updateNavState() {
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const userGreeting = document.getElementById('userGreeting');

        if (token) {
            // Logged In State
            if (loginBtn) loginBtn.style.display = 'none';
            if (registerBtn) {
                registerBtn.textContent = 'Dashboard';
                registerBtn.onclick = () => window.location.href = 'dashboard.html';
                // Remove modal listener
                const newBtn = registerBtn.cloneNode(true);
                registerBtn.parentNode.replaceChild(newBtn, registerBtn);
                newBtn.addEventListener('click', () => window.location.href = 'dashboard.html');
            }

            // Update Greeting globally
            if (userGreeting) {
                try {
                    const user = JSON.parse(localStorage.getItem('user'));
                    if (user && user.username) {
                        userGreeting.innerText = `Hello, ${user.username}`;
                    }
                } catch (e) {
                    console.error("Error parsing user for greeting:", e);
                }
            }
        }
    }
    updateNavState();

    // --- MODALS ---
    const authModal = document.getElementById('authModal');
    if (authModal) {
        const loginBtn = document.getElementById('loginBtn');
        // Only attach if still visible/valid
        if (loginBtn && loginBtn.style.display !== 'none') {
            loginBtn.addEventListener('click', () => openModal('login'));
        }

        // Register btn handled in updateNavState partly, but for index page:
        // Re-query in case it wasn't replaced
        const regBtn = document.getElementById('registerBtn');
        if (regBtn && !token) {
            regBtn.addEventListener('click', () => openModal('register'));
        }

        const closeModal = document.querySelector('.close-modal');
        closeModal.addEventListener('click', () => authModal.classList.remove('active'));

        document.getElementById('switchToRegister').addEventListener('click', (e) => {
            e.preventDefault(); openModal('register');
        });
        document.getElementById('switchToLogin').addEventListener('click', (e) => {
            e.preventDefault(); openModal('login');
        });

        window.addEventListener('click', (e) => {
            if (e.target == authModal) authModal.classList.remove('active');
        });

        // Forms
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = e.target.querySelector('input[type="email"]').value;
            const password = e.target.querySelector('input[type="password"]').value;
            const res = await apiCall('/auth/login', 'POST', { email, password });

            if (res.ok) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                window.location.href = 'dashboard.html';
            } else {
                alert(res.data.msg || 'Login Failed');
            }
        });

        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = e.target.querySelector('input[type="text"]').value;
            const email = e.target.querySelector('input[type="email"]').value;
            const password = e.target.querySelector('input[type="password"]').value;
            const res = await apiCall('/auth/register', 'POST', { username, email, password });

            if (res.ok) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                window.location.href = 'dashboard.html';
            } else {
                // DEBUG: Show exact error from backend
                console.log('Reg Error Data:', res.data);
                alert(res.data.msg || 'Registration Failed: ' + JSON.stringify(res.data));
            }
        });
    }

    function openModal(mode) {
        const loginContainer = document.getElementById('loginFormContainer');
        const regContainer = document.getElementById('registerFormContainer');
        authModal.classList.add('active');
        if (mode === 'register') {
            loginContainer.classList.add('hidden');
            regContainer.classList.remove('hidden');
        } else {
            loginContainer.classList.remove('hidden');
            regContainer.classList.add('hidden');
        }
    }

    // --- DASHBOARD LOGIC ---
    // --- DASHBOARD LOGIC ---
    // Robust check: Run if the sidebar or dashboard container exists
    const dashboardContainer = document.querySelector('.dashboard-container');
    if (dashboardContainer) {

        // Auth Check
        if (!token) {
            // storage might be cleared or never set
            window.location.href = 'index.html';
        }

        // Greeting Logic
        const greet = document.getElementById('userGreeting');
        if (greet) {
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                if (user && user.username) {
                    greet.innerText = `Hello, ${user.username}`;
                }
            } catch (e) {
                console.error("Error parsing user:", e);
            }
        }

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent default link behavior if any
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'index.html';

                // Add Item Logic
                const setupAdd = (btnId, inputId, type) => {
                    const btn = document.getElementById(btnId);
                    if (!btn) return;

                    btn.addEventListener('click', async () => {
                        const input = document.getElementById(inputId);
                        const val = input.value.trim();
                        if (!val) return;

                        const me = await apiCall('/auth/me', 'GET', null, true);
                        if (!me.ok) return;

                        const prefs = me.data.preferences;
                        if (type === 'keyword') prefs.blockedKeywords.push(val);
                        else prefs.protectedShows.push(val);

                        const update = await apiCall('/preferences', 'PUT', prefs, true);
                        if (update.ok) {
                            input.value = '';
                            renderTags(type === 'keyword' ? 'keywordsList' : 'showsList',
                                type === 'keyword' ? update.data.blockedKeywords : update.data.protectedShows,
                                type);
                        }
                    });
                };

                setupAdd('addKeywordBtn', 'newKeyword', 'keyword');
                setupAdd('addShowBtn', 'newShow', 'show');

                // Render Helper
                window.removeItem = async (item, type) => {
                    const me = await apiCall('/auth/me', 'GET', null, true);
                    if (!me.ok) return;

                    let prefs = me.data.preferences;
                    if (type === 'keyword') prefs.blockedKeywords = prefs.blockedKeywords.filter(k => k !== item);
                    else prefs.protectedShows = prefs.protectedShows.filter(s => s !== item);

                    const update = await apiCall('/preferences', 'PUT', prefs, true);
                    if (update.ok) {
                        renderTags(type === 'keyword' ? 'keywordsList' : 'showsList',
                            type === 'keyword' ? update.data.blockedKeywords : update.data.protectedShows,
                            type);
                    }
                }

                function renderTags(id, items, type) {
                    const el = document.getElementById(id);
                    if (!el) return;
                    el.innerHTML = items.map(t =>
                        `<div class="tag">${t} <i class="fas fa-times" onclick="removeItem('${t}', '${type}')"></i></div>`
                    ).join('');
                }

                // --- DASHBOARD NAVIGATION ---
                const navItems = document.querySelectorAll('.nav-item');
                const cards = {
                    'keywords': document.getElementById('card-keywords'),
                    'shows': document.getElementById('card-shows'),
                    'analytics': document.getElementById('card-analytics')
                };
                // Add Overview to map logic logic
                // We will handle 'overview' specifically in the click handler

                navItems.forEach(item => {
                    item.addEventListener('click', (e) => {
                        e.preventDefault();
                        const tab = item.getAttribute('data-tab');
                        if (!tab) return;

                        // Update Active State
                        navItems.forEach(n => n.classList.remove('active'));
                        item.classList.add('active');

                        // Filter Cards (with animation)
                        if (tab === 'overview') {
                            Object.values(cards).forEach(c => {
                                if (!c) return;
                                c.classList.remove('hidden');
                                c.classList.remove('fade-in');
                                void c.offsetWidth;
                                c.classList.add('fade-in');
                            });
                        } else {
                            Object.entries(cards).forEach(([key, card]) => {
                                if (!card) return;
                                if (key === tab) {
                                    card.classList.remove('hidden');
                                    card.classList.remove('fade-in');
                                    void card.offsetWidth;
                                    card.classList.add('fade-in');
                                } else {
                                    card.classList.add('hidden');
                                }
                            });
                        }
                    });
                });
            }

    // --- LANDING PAGE SPECIFIC ---
    if (!window.location.pathname.includes('dashboard.html')) {
                // Stats Animation
                const counters = document.querySelectorAll('.count');
                counters.forEach(counter => {
                    const target = +counter.getAttribute('data-target');
                    const increment = target / 200;
                    const updateCount = () => {
                        const count = +counter.innerText;
                        if (count < target) {
                            counter.innerText = Math.ceil(count + increment);
                            setTimeout(updateCount, 10);
                        } else {
                            counter.innerText = target;
                        }
                    };
                    updateCount();
                });

                // Demo Area
                const demoCheckBtn = document.getElementById('demoCheckBtn');
                if (demoCheckBtn) {
                    const demoInput = document.getElementById('demoInput');
                    const demoOutput = document.getElementById('demoOutput');
                    const detectionStatus = document.getElementById('detectionStatus');

                    demoCheckBtn.addEventListener('click', async () => {
                        const text = demoInput.value;
                        if (!text) return;

                        detectionStatus.innerText = "Scanning...";
                        detectionStatus.style.color = "#f472b6";

                        // Attempt API call if we have token, else mock for demo
                        let result = null;
                        if (token) {
                            const res = await apiCall('/detect', 'POST', { text }, true);
                            if (res.ok) result = res.data;
                        }

                        if (!result) {
                            // Mock Fallback
                            setTimeout(() => {
                                const keywords = ['kills', 'dies', 'ending'];
                                const isSpoiler = keywords.some(k => text.toLowerCase().includes(k));

                                finishDemo({
                                    isSpoiler,
                                    detectedTerms: isSpoiler ? ['mock_spoiler'] : []
                                }, text);
                            }, 500);
                        } else {
                            finishDemo(result, text);
                        }
                    });

                    function finishDemo(result, originalText) {
                        if (result.isSpoiler) {
                            detectionStatus.innerText = "Spoiler Detected!";
                            detectionStatus.style.color = "#ef4444";
                            // Just block the whole thing for demo visual impact
                            demoOutput.innerHTML = `<span class="spoiler-redacted" title="Click to Reveal">██████████████████</span>`;

                            demoOutput.querySelector('.spoiler-redacted').addEventListener('click', function () {
                                this.outerHTML = `<p>${originalText}</p>`;
                            });
                        } else {
                            detectionStatus.innerText = "Safe content.";
                            detectionStatus.style.color = "#22c55e";
                            demoOutput.innerHTML = `<p>${originalText}</p>`;
                        }
                    }
                }
            }

            // --- WEBSOCKET SHARED ---
            // Minimal keep-alive
            const ws = new WebSocket('ws://localhost:5000');
            ws.onopen = () => console.log('WS Connected');
        });
