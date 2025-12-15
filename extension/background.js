// Background Service Worker for Spoiler Blocker

// 1. Installation & Initialization
chrome.runtime.onInstalled.addListener(() => {
    console.log("Spoiler Blocker Extension Installed");
    // Set default settings
    chrome.storage.local.set({
        isEnabled: true,
        blockedCount: 0,
        keywords: [],
        shows: [],
        authToken: null,
        user: null
    });
});

// 2. Data Synchronization (Mocking API calls for now, replace with real endpoints later)
async function syncUserData(token) {
    if (!token) return;

    try {
        console.log("Syncing user data...");
        // In a real app, fetch from: http://localhost:3000/api/keywords
        // const response = await fetch('http://localhost:3000/api/keywords', {
        //     headers: { 'Authorization': `Bearer ${token}` }
        // });
        // const data = await response.json();

        // Simulating sync success for demonstration
        console.log("Sync successful");
    } catch (error) {
        console.error("Sync failed:", error);
    }
}

// 3. Periodic Sync (Every 5 minutes)
setInterval(() => {
    chrome.storage.local.get(['authToken'], async (data) => {
        if (data.authToken) {
            await syncUserData(data.authToken);
        }
    });
}, 5 * 60 * 1000);

// 4. Message Handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Handle detected spoilers
    if (message.type === 'SPOILER_DETECTED') {
        // Increment blocked count
        chrome.storage.local.get(['blockedCount'], (data) => {
            const newCount = (data.blockedCount || 0) + 1;
            chrome.storage.local.set({ blockedCount: newCount });

            // Update Badge
            chrome.action.setBadgeText({ text: newCount.toString() });
            chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
        });

        // Optional: Show notification (throttled)
        // chrome.notifications.create({
        //     type: 'basic',
        //     iconUrl: 'icons/icon48.png',
        //     title: 'Spoiler Blocked!',
        //     message: `Blocked content on ${new URL(message.url).hostname}`
        // });
    }
});

// 5. External Messaging (For Website Login Sync)
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    if (message.type === 'LOGIN_SUCCESS') {
        console.log("Received login token from website");

        chrome.storage.local.set({
            authToken: message.token,
            user: message.user
        }, () => {
            // Trigger immediate sync
            syncUserData(message.token);

            // Notify popup if needed
            chrome.runtime.sendMessage({ type: 'AUTH_UPDATED' });
        });

        sendResponse({ success: true });
    }
});
