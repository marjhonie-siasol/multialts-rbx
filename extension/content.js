// MultiAlts Content Script for roblox.com/games/*
// Non-intrusive status indicator placed above the native Roblox Play button

const DAEMON_STATUS_URL = 'http://localhost:28491/status';
const DAEMON_UNLOCK_URL = 'http://localhost:28491/unlock';

function getPlayContainer() {
    return (
        document.querySelector('[data-testid="play-button"]') ||
        document.getElementById('game-details-play-button-container') ||
        document.querySelector('.game-play-buttons') ||
        document.querySelector('.play-button-container')
    );
}

function injectMultiAltsBadge() {
    // Avoid double injection
    if (document.getElementById('multiAltsActiveBadge')) return;

    // Clean up any legacy injected buttons if they exist
    const legacyWrapper = document.querySelector('.multialts-wrapper');
    if (legacyWrapper) legacyWrapper.remove();

    const playContainer = getPlayContainer();
    if (!playContainer || !playContainer.parentNode) return;

    let logoSrc = '';
    try {
        logoSrc = chrome.runtime.getURL('icon48.png');
    } catch (_) {}

    // Create the subtle badge
    const badge = document.createElement('div');
    badge.className = 'multialts-indicator-badge';
    badge.id = 'multiAltsActiveBadge';
    badge.innerHTML = `
        ${logoSrc ? `<img src="${logoSrc}" alt="MultiAlts" class="multialts-badge-logo">` : `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" class="multialts-badge-svg">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>`}
        <span class="multialts-badge-dot" id="multiAltsBadgeDot"></span>
        <span class="multialts-badge-text" id="multiAltsBadgeText">Running with MultiAlts</span>
    `;

    // Insert directly ABOVE the native blue Play button container
    playContainer.parentNode.insertBefore(badge, playContainer);

    // Verify engine status to style the indicator dot accurately
    checkEngineStatus();

    // Hook into native play button click to signal unlock daemon and record active presence
    hookNativePlayClick(playContainer);
}

async function checkEngineStatus() {
    const dot = document.getElementById('multiAltsBadgeDot');
    const text = document.getElementById('multiAltsBadgeText');
    if (!dot || !text) return;

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1200);
        const res = await fetch(DAEMON_STATUS_URL, { signal: controller.signal });
        clearTimeout(timeout);

        if (res.ok) {
            dot.className = 'multialts-badge-dot active';
            text.innerText = 'Running with MultiAlts';
            return;
        }
    } catch (_) {}

    dot.className = 'multialts-badge-dot offline';
    text.innerText = 'MultiAlts (Engine Offline)';
}

function hookNativePlayClick(playContainer) {
    if (playContainer.dataset.multialtsHooked === 'true') return;
    playContainer.dataset.multialtsHooked = 'true';

    playContainer.addEventListener('click', async () => {
        // 1. Signal local daemon to clear mutexes immediately upon launch
        try {
            await fetch(DAEMON_UNLOCK_URL, {
                method: 'POST',
                mode: 'cors'
            }).catch(() => {});
        } catch (_) {}

        // 2. Record active account as Playing in extension storage
        try {
            chrome.storage.local.get(['activeUserId', 'playingUsers'], (data) => {
                if (data.activeUserId) {
                    const playing = data.playingUsers || {};
                    playing[data.activeUserId] = Date.now();
                    chrome.storage.local.set({ playingUsers: playing });
                }
            });
        } catch (_) {}
    }, true);
}

// Observe dynamic DOM changes on Roblox SPA
const observer = new MutationObserver(() => {
    injectMultiAltsBadge();
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial run
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectMultiAltsBadge);
} else {
    injectMultiAltsBadge();
}
