// MultiAlts Content Script for roblox.com/games/*

const DAEMON_UNLOCK_URL = 'http://localhost:28491/unlock';

function injectMultiAltsButton() {
    // Avoid double injection
    if (document.getElementById('multiAltsPlayBtn')) return;

    // Find Roblox native play button / container
    const playContainer = 
        document.querySelector('[data-testid="play-button"]') ||
        document.getElementById('game-details-play-button-container') ||
        document.querySelector('.game-play-buttons') ||
        document.querySelector('.play-button-container');

    if (!playContainer) return;

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'multialts-wrapper';
    wrapper.innerHTML = `
        <button class="multialts-btn" id="multiAltsPlayBtn" type="button">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
            </svg>
            <span>Play MultiAlts</span>
        </button>
        <div class="multialts-launch-info" id="multiAltsLaunchInfo">
            <span class="multialts-status-dot"></span>
            <span id="multiAltsLaunchText">Launching Roblox...</span>
        </div>
    `;

    playContainer.parentNode.insertBefore(wrapper, playContainer.nextSibling);

    const btn = document.getElementById('multiAltsPlayBtn');
    const info = document.getElementById('multiAltsLaunchInfo');
    const text = document.getElementById('multiAltsLaunchText');

    btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        info.classList.add('visible');
        text.innerText = 'Unlocking mutex & launching...';

        try {
            // Signal local daemon to clear any single-instance mutexes immediately
            await fetch(DAEMON_UNLOCK_URL, { 
                method: 'POST',
                mode: 'cors'
            }).catch(() => {});
        } catch (_) {}

        // Record active account as Playing in local storage
        try {
            chrome.storage.local.get(['activeUserId', 'playingUsers'], (data) => {
                if (data.activeUserId) {
                    const playing = data.playingUsers || {};
                    playing[data.activeUserId] = Date.now();
                    chrome.storage.local.set({ playingUsers: playing });
                }
            });
        } catch (_) {}

        // Trigger Roblox's native play button click to execute auth and launch
        const nativeBtn = 
            playContainer.querySelector('button') || 
            playContainer.querySelector('[data-testid="play-button"]') ||
            document.querySelector('.btn-common-play-game') ||
            playContainer;

        if (nativeBtn && nativeBtn !== btn) {
            nativeBtn.click();
            text.innerText = 'Roblox instance launching in parallel!';
        } else {
            text.innerText = 'Click normal Play to launch with active account.';
        }

        setTimeout(() => {
            info.classList.remove('visible');
        }, 4000);
    });
}

// Observe DOM for dynamic page changes on Roblox SPA
const observer = new MutationObserver(() => {
    injectMultiAltsButton();
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial run
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectMultiAltsButton);
} else {
    injectMultiAltsButton();
}
