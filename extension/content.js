// Spoiler Blocker Content Script

let isEnabled = true;
let userKeywords = [];
let userShows = [];

// 1. Initialization
chrome.storage.local.get(['isEnabled', 'keywords', 'shows'], (data) => {
    isEnabled = data.isEnabled !== false;
    userKeywords = data.keywords || [];
    userShows = data.shows || [];

    if (isEnabled) {
        startProtection();
    }
});

// 2. Message Listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'TOGGLE_PROTECTION') {
        isEnabled = message.enabled;
        if (isEnabled) {
            startProtection();
        } else {
            // Optional: Implement unblocking (reload page is simpler)
            location.reload();
        }
    } else if (message.type === 'UPDATE_KEYWORDS') {
        userKeywords = message.keywords || [];
        // Re-scan with new keywords
        if (isEnabled) scanPage();
    }
});

// 3. Core Protection Logic
function startProtection() {
    console.log("Spoiler Blocker: Protection Started");
    scanPage();

    // Observe for dynamic content (Infinity Scroll, SPAs)
    const observer = new MutationObserver((mutations) => {
        let shouldScan = false;
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length > 0) {
                shouldScan = true;
            }
        });
        if (shouldScan) scanPage();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Debounce scan to prevent performance issues
let scanTimeout;
function scanPage() {
    clearTimeout(scanTimeout);
    scanTimeout = setTimeout(() => {
        const textNodes = getTextNodes(document.body);
        textNodes.forEach(processNode);
    }, 500); // 500ms debounce
}

function getTextNodes(root) {
    const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    const nodes = [];
    let node;
    while (node = walker.nextNode()) {
        nodes.push(node);
    }
    return nodes;
}

function processNode(node) {
    // Skip if already blocked or inside script/style
    if (node.parentNode.classList.contains('spoiler-blurred') ||
        ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(node.parentNode.tagName)) {
        return;
    }

    const text = node.textContent;
    if (!text || text.trim().length < 10) return; // Skip short text

    const detection = detectSpoiler(text);

    if (detection.isSpoiler) {
        blockSpoiler(node, detection);
    }
}

// 4. Detection Algorithm (Client-Side)
function detectSpoiler(text) {
    let score = 0;
    const detected = [];

    // Priority: User Keywords
    userKeywords.forEach(keyword => {
        if (text.toLowerCase().includes(keyword.toLowerCase())) {
            score += 5;
            detected.push(keyword);
        }
    });

    // General Patterns
    const patterns = [
        /dies?|death|killed/i,
        /ending|finale/i,
        /spoiler/i,
        /plot twist/i
    ];

    patterns.forEach(pattern => {
        if (pattern.test(text)) score += 3;
    });

    return {
        isSpoiler: score >= 5,
        keywords: detected
    };
}

// 5. Blocking Mechanism (Blur Method)
function blockSpoiler(node, detection) {
    const parent = node.parentNode;

    // Safety check
    if (parent.tagName === 'BODY' || parent.tagName === 'HTML') return;

    // Report to background
    chrome.runtime.sendMessage({
        type: 'SPOILER_DETECTED',
        url: window.location.href,
        keywords: detection.keywords
    });

    // Apply Blur Effect
    parent.classList.add('spoiler-blurred');
    parent.style.filter = 'blur(6px)';
    parent.style.cursor = 'pointer';
    parent.style.transition = 'filter 0.3s';
    parent.title = 'Spoiler Detected: Click to Reveal';

    // Add Click to Reveal
    // Use 'once' listener to prevent multiple bindings if re-scanned
    parent.addEventListener('click', function reveal(e) {
        e.preventDefault();
        e.stopPropagation();

        if (confirm("⚠️ Potential Spoiler Detected!\nAre you sure you want to reveal this?")) {
            parent.style.filter = 'none';
            parent.classList.remove('spoiler-blurred');
            parent.removeEventListener('click', reveal);
            parent.style.cursor = 'auto';
            parent.title = '';
        }
    });
}
