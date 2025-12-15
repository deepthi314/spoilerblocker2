// Check auth immediately (basic check)
if (!Auth.requireAuth()) {
    throw new Error('Not authenticated'); // Stop execution
}

document.addEventListener('DOMContentLoaded', async () => {
    // Show loading state or hide content until verified
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.3s';

    // Verify token with backend
    const user = await Auth.verify();

    if (user) {
        // Auth success, show content
        document.body.style.opacity = '1';

        // Update User Info
        document.getElementById('userName').textContent = user.name || 'User';
        const initial = (user.name || 'U').charAt(0).toUpperCase();
        document.getElementById('userAvatar').textContent = initial;

        // Initial setup for settings
        if (user.settings) {
            if (document.getElementById('settingSensitivity'))
                document.getElementById('settingSensitivity').value = user.settings.sensitivity || 'medium';
            if (document.getElementById('settingAutoBlock'))
                document.getElementById('settingAutoBlock').checked = !!user.settings.autoBlock;
            if (document.getElementById('settingNotify'))
                document.getElementById('settingNotify').checked = !!user.settings.notifications;
        }

        // Load Dashboard Data
        loadStats();
        loadActivity();
    }
    // If verify failed, it would have redirected in Auth.verify()

    // Navigation Logic
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.dataset.tab;

            // Update UI
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(tabId + '-tab').classList.add('active');

            // Fade in animation
            document.getElementById(tabId + '-tab').classList.add('fade-in');

            // Load data for specific tabs
            if (tabId === 'keywords') loadKeywords();
            if (tabId === 'shows') loadShows();
            if (tabId === 'detect') loadHistory();
        });
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        Auth.logout();
    });
});

// --- Overview ---
async function loadStats() {
    try {
        const stats = await Api.get('/stats');
        document.getElementById('dashTotalBlocked').textContent = stats.totalBlocked;
        document.getElementById('dashTotalScanned').textContent = stats.totalScanned;
        document.getElementById('dashActiveKeywords').textContent = stats.activeKeywords;
    } catch (err) {
        console.error('Failed to load stats', err);
    }
}

async function loadActivity() {
    try {
        const data = await Api.get('/detect/history?limit=5');
        const feed = document.getElementById('activityFeed');
        feed.innerHTML = '';

        if (data.logs.length === 0) {
            feed.innerHTML = '<div style="padding: 20px; color: var(--text-secondary);">No recent activity.</div>';
            return;
        }

        data.logs.forEach(log => {
            const date = Utils.formatDate(log.createdAt);
            const html = `
                <div class="activity-item">
                    <div style="font-size: 20px;">${log.result === 'blocked' ? '🚫' : '✅'}</div>
                    <div style="flex: 1;">
                        <div style="font-weight: 500;">
                            ${log.result === 'blocked' ? 'Blocked a Spoiler' : 'Clean Content Scan'}
                        </div>
                        <div style="font-size: 13px; color: var(--text-secondary);">
                            Detected ${log.detectedKeywords.length} keywords. Risk: ${log.riskLevel}
                        </div>
                    </div>
                    <div style="font-size: 12px; color: var(--text-secondary);">${date}</div>
                </div>
            `;
            feed.innerHTML += html;
        });
    } catch (err) {
        console.error(err);
    }
}

// --- Live Detection ---
async function initiateScan() {
    const text = document.getElementById('liveInput').value;
    if (!text) return;

    try {
        const result = await Api.post('/detect', { text });

        const resultDiv = document.getElementById('liveResult');
        resultDiv.style.display = 'block';
        resultDiv.className = 'result-panel ' + (result.isSpoiler ? 'blocked' : 'safe') + ' fade-in';

        resultDiv.innerHTML = `
            <div style="display: flex; gap: 20px; align-items: center;">
                <div style="font-size: 32px;">${result.isSpoiler ? '⚠️' : '✅'}</div>
                <div style="flex-grow: 1;">
                    <h3 style="margin: 0; font-size: 18px; color: ${result.isSpoiler ? 'var(--danger)' : 'var(--success)'}">${result.isSpoiler ? 'Spoiler Detected' : 'Safe Content'}</h3>
                    <p style="color: var(--text-secondary); margin: 0;">${result.message}</p>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 700; font-size: 24px;">${result.confidence}%</div>
                    <div style="font-size: 12px; color: var(--text-secondary);">Confidence</div>
                </div>
            </div>
        `;

        loadHistory(); // Refresh table
        loadStats(); // Update stats
    } catch (err) {
        Utils.showToast('Scan failed: ' + err.message, 'error');
    }
}

async function loadHistory() {
    try {
        const data = await Api.get('/detect/history');
        const tbody = document.getElementById('scanHistoryTable');
        tbody.innerHTML = '';

        data.logs.forEach(log => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${log.content.substring(0, 40)}${log.content.length > 40 ? '...' : ''}</td>
                <td>
                    <span style="color: ${log.result === 'blocked' ? 'var(--danger)' : 'var(--success)'}">
                        ${log.result.toUpperCase()}
                    </span>
                </td>
                <td>${log.riskLevel}</td>
                <td>${Utils.formatDate(log.createdAt)}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error(err);
    }
}

// --- Keywords ---
function toggleAddKeyword() {
    const panel = document.getElementById('addKeywordPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    if (panel.style.display === 'block') document.getElementById('newKeywordInput').focus();
}

async function loadKeywords() {
    try {
        const data = await Api.get('/keywords');
        const container = document.getElementById('keywordsList');
        container.innerHTML = '';

        if (data.keywords.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary);">No keywords added yet.</p>';
            return;
        }

        data.keywords.forEach(k => {
            const chip = document.createElement('div');
            chip.className = 'keyword-chip';
            chip.innerHTML = `
                ${k.keyword}
                <span class="remove" onclick="removeKeyword('${k.keyword}')">&times;</span>
            `;
            container.appendChild(chip);
        });
    } catch (err) {
        console.error(err);
    }
}

async function addKeyword() {
    const input = document.getElementById('newKeywordInput');
    const category = document.getElementById('newKeywordCategory');
    const keyword = input.value.trim();

    if (!keyword) return;

    try {
        await Api.post('/keywords', { keyword, category: category.value });
        input.value = '';
        loadKeywords();
        Utils.showToast('Keyword added', 'success');
    } catch (err) {
        Utils.showToast(err.message, 'error');
    }
}

async function removeKeyword(keyword) {
    if (!confirm(`Remove "${keyword}"?`)) return;
    try {
        await Api.delete(`/keywords/${keyword}`);
        loadKeywords();
        Utils.showToast('Keyword removed', 'success');
    } catch (err) {
        Utils.showToast(err.message, 'error');
    }
}

// --- Shows ---
function toggleAddShow() {
    const panel = document.getElementById('addShowPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

async function loadShows() {
    try {
        const data = await Api.get('/shows');
        const grid = document.getElementById('showsGrid');
        grid.innerHTML = '';

        if (data.shows.length === 0) {
            grid.innerHTML = '<p style="color: var(--text-secondary);">No shows added.</p>';
            return;
        }

        data.shows.forEach(show => {
            const div = document.createElement('div');
            div.className = 'show-card';
            div.innerHTML = `
                <div class="show-poster">
                    ${show.posterUrl ? `<img src="${show.posterUrl}" style="width:100%;height:100%;object-fit:cover;">` : 'No Poster'}
                </div>
                <div class="show-info">
                    <div class="show-title">${show.title}</div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
                        ${show.type.toUpperCase()} • ${show.status}
                    </div>
                    <button class="btn btn-secondary" style="width: 100%; font-size: 12px; padding: 6px;" onclick="removeShow('${show._id}')">Remove</button>
                </div>
            `;
            grid.appendChild(div);
        });
    } catch (err) {
        console.error(err);
    }
}

async function addShow() {
    const input = document.getElementById('newShowInput');
    const title = input.value.trim();

    if (!title) return;

    try {
        let posterUrl = `https://placehold.co/300x450/1f2937/F9FAFB?text=${encodeURIComponent(title)}&font=montserrat`;

        try {
            // Attempt to fetch official poster from TVMaze (Public API)
            const searchRes = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(title)}`);
            const searchData = await searchRes.json();

            if (searchData && searchData.length > 0 && searchData[0].show.image) {
                posterUrl = searchData[0].show.image.original || searchData[0].show.image.medium;
            }
        } catch (e) {
            console.warn("Failed to fetch official poster, using fallback.");
        }

        await Api.post('/shows', {
            title,
            type: 'tv',
            posterUrl: posterUrl,
            status: 'watching'
        });
        input.value = '';
        loadShows();
        Utils.showToast('Show added', 'success');
    } catch (err) {
        Utils.showToast(err.message, 'error');
    }
}

async function removeShow(id) {
    if (!confirm('Stop tracking this show?')) return;
    try {
        await Api.delete(`/shows/${id}`);
        loadShows();
    } catch (err) {
        Utils.showToast(err.message, 'error');
    }
}

// --- Settings ---
async function saveSettings() {
    const sensitivity = document.getElementById('settingSensitivity').value;
    const autoBlock = document.getElementById('settingAutoBlock').checked;
    const notifications = document.getElementById('settingNotify').checked;

    try {
        const data = await Api.put('/auth/settings', {
            sensitivity,
            autoBlock,
            notifications
        });

        // Update local user
        const user = Auth.getUser();
        user.settings = data.settings;
        localStorage.setItem('user', JSON.stringify(user));

        Utils.showToast('Settings saved successfully', 'success');
    } catch (err) {
        Utils.showToast(err.message, 'error');
    }
}
