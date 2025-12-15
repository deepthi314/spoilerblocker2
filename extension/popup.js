// Extension Popup Logic

document.addEventListener('DOMContentLoaded', () => {
    // 1. Load Initial State
    loadState();

    // 2. Event Listeners
    document.getElementById('enableToggle').addEventListener('change', toggleProtection);
    document.getElementById('addKeywordBtn').addEventListener('click', addKeyword);
    document.getElementById('keywordInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addKeyword();
    });

    document.getElementById('dashboardBtn').addEventListener('click', () => {
        // Open the local dashboard file (assuming backend/frontend runs on localhost or file)
        // For development, we point to the absolute path of dashboard.html or localhost
        // Ideally this matches the deployed URL.
        chrome.tabs.create({ url: 'http://localhost:5000/dashboard.html' });
        // Note: Ideally updated to deployed URL
    });

    document.getElementById('loginLink').addEventListener('click', () => {
        chrome.tabs.create({ url: 'http://localhost:5000/login.html' });
    });

    document.getElementById('refreshBtn').addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'LOGIN_SUCCESS' }); // Force sync trigger attempt (mock)
        location.reload();
    });
});

function loadState() {
    chrome.storage.local.get(['isEnabled', 'blockedCount', 'keywords'], (data) => {
        // Status Toggle
        const isEnabled = data.isEnabled !== false;
        document.getElementById('enableToggle').checked = isEnabled;
        updateStatusText(isEnabled);

        // Stats
        document.getElementById('totalBlocked').textContent = data.blockedCount || 0;

        // Keywords
        renderKeywords(data.keywords || []);
    });
}

function toggleProtection(e) {
    const isEnabled = e.target.checked;

    chrome.storage.local.set({ isEnabled }, () => {
        updateStatusText(isEnabled);

        // Notify Tabs
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    type: 'TOGGLE_PROTECTION',
                    enabled: isEnabled
                });
            });
        });
    });
}

function updateStatusText(enabled) {
    const statusEl = document.getElementById('status');
    statusEl.textContent = enabled ? 'Protected ✓' : 'Disabled';
    statusEl.style.color = enabled ? '#6366F1' : '#EF4444';
}

function addKeyword() {
    const input = document.getElementById('keywordInput');
    const keyword = input.value.trim();

    if (!keyword) return;

    chrome.storage.local.get(['keywords'], (data) => {
        const keywords = data.keywords || [];

        if (!keywords.includes(keyword)) {
            keywords.push(keyword);

            // Save & Render
            chrome.storage.local.set({ keywords }, () => {
                renderKeywords(keywords);
                input.value = '';

                // Notify Content Scripts
                notifyKeywordsUpdate(keywords);
            });
        }
    });
}

function removeKeyword(keywordToRemove) {
    chrome.storage.local.get(['keywords'], (data) => {
        const keywords = (data.keywords || []).filter(k => k !== keywordToRemove);

        chrome.storage.local.set({ keywords }, () => {
            renderKeywords(keywords);
            notifyKeywordsUpdate(keywords);
        });
    });
}

function renderKeywords(keywords) {
    const list = document.getElementById('keywordsList');
    list.innerHTML = '';

    if (keywords.length === 0) {
        list.innerHTML = '<p style="color: #6B7280; font-size: 12px; font-style: italic; width: 100%; text-align: center;">No custom keywords yet.</p>';
        return;
    }

    keywords.forEach(keyword => {
        const chip = document.createElement('div');
        chip.className = 'keyword-chip';
        chip.innerHTML = `
            <span>${keyword}</span>
            <button class="remove-btn">×</button>
        `;

        chip.querySelector('.remove-btn').addEventListener('click', () => removeKeyword(keyword));
        list.appendChild(chip);
    });
}

function notifyKeywordsUpdate(keywords) {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
                type: 'UPDATE_KEYWORDS',
                keywords
            });
        });
    });
}
