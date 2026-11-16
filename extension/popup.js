// MultiAlts Popup Script
const DAEMON_URL = 'http://localhost:28491/status';
let isManageMode = false;

document.addEventListener('DOMContentLoaded', () => {
    checkEngine();
    loadAccounts();
    bindEvents();
});

// 1. Engine Check
async function checkEngine() {
    const notice = document.getElementById('engineNoticeBar');

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1200);
        const res = await fetch(DAEMON_URL, { signal: controller.signal });
        clearTimeout(timeout);

        if (res.ok) {
            if (notice) {
                notice.className = 'engine-notice-bar active';
                notice.innerHTML = '<span class="notice-pip"></span><span class="notice-text">Engine active. Multiple accounts ready.</span>';
            }
            return true;
        }
    } catch (_) {}

    if (notice) {
        notice.className = 'engine-notice-bar offline';
        notice.innerHTML = '<span class="notice-text">PowerShell engine required for multiple accounts.</span> <a href="https://marjhonie-siasol.github.io/multialts-rbx/#setup" target="_blank" rel="noopener" class="notice-link" id="engineGuideLink">Guide &rarr;</a>';
        const guideLink = document.getElementById('engineGuideLink');
        if (guideLink) {
            guideLink.onclick = (e) => {
                e.preventDefault();
                chrome.tabs.create({ url: guideLink.href });
            };
        }
    }
    return false;
}

// 2. Events
function bindEvents() {
    // Engine Setup Dropdown Toggle (Above Uninstall)
    const engineToggle = document.getElementById('engineSetupToggleBtn');
    const enginePanel = document.getElementById('engineSetupPanel');
    if (engineToggle && enginePanel) {
        engineToggle.onclick = () => {
            const isHidden = enginePanel.style.display === 'none' || !enginePanel.style.display;
            enginePanel.style.display = isHidden ? 'flex' : 'none';
            engineToggle.classList.toggle('open', isHidden);
        };
    }

    // Copy Engine Install Command
    const copyBtn = document.getElementById('copyCommandBtn');
    if (copyBtn) {
        copyBtn.onclick = () => {
            const cmd = document.getElementById('commandInput').value;
            navigator.clipboard.writeText(cmd).then(() => {
                showToast('Copied install command!');
            });
        };
    }

    // Install Guide Link
    const helpLink = document.getElementById('helpLink');
    if (helpLink) {
        helpLink.onclick = (e) => {
            e.preventDefault();
            chrome.tabs.create({ url: helpLink.href });
        };
    }

    // Uninstall Collapsible Dropdown
    const uninstallToggle = document.getElementById('uninstallToggleBtn');
    const uninstallPanel = document.getElementById('uninstallPanel');
    if (uninstallToggle && uninstallPanel) {
        uninstallToggle.onclick = () => {
            const isHidden = uninstallPanel.style.display === 'none' || !uninstallPanel.style.display;
            uninstallPanel.style.display = isHidden ? 'flex' : 'none';
            uninstallToggle.classList.toggle('open', isHidden);
        };
    }

    // Copy Uninstall Command
    const copyUninstallBtn = document.getElementById('copyUninstallBtn');
    if (copyUninstallBtn) {
        copyUninstallBtn.onclick = () => {
            const cmd = document.getElementById('uninstallCommandInput').value;
            navigator.clipboard.writeText(cmd).then(() => {
                showToast('Copied uninstall command!');
            });
        };
    }

    // Uninstall Guide Link
    const uninstallGuideLink = document.getElementById('uninstallGuideLink');
    if (uninstallGuideLink) {
        uninstallGuideLink.onclick = (e) => {
            e.preventDefault();
            chrome.tabs.create({ url: uninstallGuideLink.href });
        };
    }

    // Sign into Alt
    const altBtn = document.getElementById('newLoginBtn');
    if (altBtn) altBtn.onclick = signIntoAlt;

    // Manage / Done Toggle
    const manageBtn = document.getElementById('manageAccountsBtn');
    if (manageBtn) {
        manageBtn.onclick = () => {
            isManageMode = !isManageMode;
            loadAccounts();
        };
    }
}

// Auto-detect active Roblox browser account silently without requiring clicks
async function autoDetectActiveAccount(currentAccounts) {
    try {
        const currentCookie = await chrome.cookies.get({
            url: 'https://www.roblox.com',
            name: '.ROBLOSECURITY'
        });
        if (!currentCookie || !currentCookie.value) return { accounts: currentAccounts, activeUserId: null };

        // Check if cookie matches an existing account
        const existing = currentAccounts.find(a => a.cookie === currentCookie.value);
        if (existing) {
            return { accounts: currentAccounts, activeUserId: existing.id };
        }

        // Active cookie not saved yet: fetch user info
        const userRes = await fetch('https://users.roblox.com/v1/users/authenticated', {
            credentials: 'include'
        });
        if (!userRes.ok) return { accounts: currentAccounts, activeUserId: null };

        const user = await userRes.json();
        if (!user || !user.id) return { accounts: currentAccounts, activeUserId: null };

        let avatarUrl = '';
        try {
            const thumbRes = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=48x48&format=Png&isCircular=true`);
            const thumbData = await thumbRes.json();
            if (thumbData.data && thumbData.data[0]) {
                avatarUrl = thumbData.data[0].imageUrl;
            }
        } catch (_) {}

        const updated = currentAccounts.filter(a => a.id !== user.id);
        updated.push({
            id: user.id,
            name: user.name,
            displayName: user.displayName,
            cookie: currentCookie.value,
            avatarUrl: avatarUrl
        });

        await chrome.storage.local.set({ accounts: updated, activeUserId: user.id });
        return { accounts: updated, activeUserId: user.id };
    } catch (_) {
        return { accounts: currentAccounts, activeUserId: null };
    }
}

// 3. Load Accounts with Real-Time Online / Playing / Offline Status
async function loadAccounts() {
    const data = await chrome.storage.local.get(['accounts', 'activeUserId', 'playingUsers']);
    let accounts = data.accounts || [];
    let activeUserId = data.activeUserId || null;
    let playingUsers = data.playingUsers || {};

    const list = document.getElementById('accountsList');
    if (!list) return;

    // Automatically detect and save logged-in Roblox account or Alt
    const detected = await autoDetectActiveAccount(accounts);
    accounts = detected.accounts;
    activeUserId = detected.activeUserId || null;
    if (data.activeUserId !== activeUserId) {
        await chrome.storage.local.set({ activeUserId });
    }

    // Update Manage button state
    const manageBtn = document.getElementById('manageAccountsBtn');
    if (manageBtn) {
        if (accounts.length === 0) {
            manageBtn.style.display = 'none';
            isManageMode = false;
        } else {
            manageBtn.style.display = 'inline-block';
            manageBtn.innerText = isManageMode ? 'Done' : 'Manage';
            manageBtn.classList.toggle('done-mode', isManageMode);
            manageBtn.title = isManageMode ? 'Finish removing accounts' : 'Manage and remove accounts';
        }
    }

    if (accounts.length === 0) {
        list.innerHTML = `<div class="empty-state">No accounts saved. Sign into Roblox to begin.</div>`;
        return;
    }

    // Fetch live presence from Roblox Presence API
    const userIds = accounts.map(a => a.id).filter(Boolean);
    const presenceMap = {};
    if (userIds.length > 0) {
        try {
            const presRes = await fetch('https://presence.roblox.com/v1/presence/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ userIds })
            });
            if (presRes.ok) {
                const presData = await presRes.json();
                (presData.userPresences || []).forEach(p => {
                    presenceMap[p.userId] = p;
                });
            }
        } catch (_) {}
    }

    list.innerHTML = '';
    accounts.forEach(acc => {
        const presence = presenceMap[acc.id];
        const isPresencePlaying = presence && (presence.userPresenceType === 2 || presence.userPresenceType === 3);
        const isLocalPlaying = playingUsers[acc.id] && (Date.now() - playingUsers[acc.id] < 1000 * 60 * 60 * 3);
        const isPlaying = isPresencePlaying || isLocalPlaying;
        const isCurrentBrowser = acc.id === activeUserId;

        let statusClass = 'offline';
        let statusLabel = 'Offline';
        let statusTitle = 'Offline — not in browser or game';

        if (isPlaying) {
            statusClass = 'playing';
            statusLabel = 'Playing';
            statusTitle = presence?.lastLocation ? `Playing: ${presence.lastLocation}` : 'Playing — running in game window';
        } else if (isCurrentBrowser) {
            statusClass = 'online';
            statusLabel = 'Online';
            statusTitle = 'Online — active session in browser';
        }

        const card = document.createElement('div');
        card.className = `account-card ${statusClass} ${isCurrentBrowser ? 'active' : ''} ${isManageMode ? 'manage-mode' : ''}`;
        
        let actionIconHtml = '';
        let actionTitle = '';
        let actionClass = 'btn-del';

        if (isManageMode) {
            // Manage Mode: Show Delete (Trash) Icon
            actionClass = 'btn-del remove-mode';
            actionTitle = `Delete @${acc.name} from MultiAlts`;
            actionIconHtml = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
        } else {
            // Normal Mode: Show Logout Icon
            actionClass = 'btn-del';
            actionTitle = isCurrentBrowser ? 'Log out of browser session' : 'Log out';
            actionIconHtml = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>';
        }

        card.innerHTML = `
            <div class="avatar">
                ${acc.avatarUrl ? `<img src="${acc.avatarUrl}" alt="${acc.name}">` : acc.name.slice(0, 2).toUpperCase()}
                <span class="avatar-status-pip ${statusClass}"></span>
            </div>
            <div class="info">
                <div class="name">${acc.displayName || acc.name}</div>
                <div class="sub">@${acc.name}</div>
            </div>
            <div class="status-badge ${statusClass}" title="${statusTitle}">
                <span class="status-dot"></span>
                <span class="status-label">${statusLabel}</span>
            </div>
            <button class="${actionClass}" data-id="${acc.id}" title="${actionTitle}" aria-label="${actionTitle}">${actionIconHtml}</button>
        `;

        card.onclick = (e) => {
            if (isManageMode) return;
            if (e.target.closest('.btn-del')) return;
            switchAccount(acc);
        };

        const delBtn = card.querySelector('.btn-del');
        delBtn.onclick = (e) => {
            e.stopPropagation();
            if (isManageMode) {
                removeAccountCompletely(acc);
            } else {
                logoutBrowserSession(acc);
            }
        };

        list.appendChild(card);
    });
}

// 4. Add Current Account
async function addCurrentAccount() {
    try {
        const cookie = await chrome.cookies.get({
            url: 'https://www.roblox.com',
            name: '.ROBLOSECURITY'
        });

        if (!cookie || !cookie.value) {
            showToast('Sign in on Roblox first!');
            return;
        }

        const userRes = await fetch('https://users.roblox.com/v1/users/authenticated', {
            credentials: 'include'
        });

        if (!userRes.ok) {
            showToast('Session invalid on Roblox.');
            return;
        }

        const user = await userRes.json();
        
        let avatarUrl = '';
        try {
            const thumbRes = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=48x48&format=Png&isCircular=true`);
            const thumbData = await thumbRes.json();
            if (thumbData.data && thumbData.data[0]) {
                avatarUrl = thumbData.data[0].imageUrl;
            }
        } catch (_) {}

        const data = await chrome.storage.local.get(['accounts']);
        let accounts = data.accounts || [];
        accounts = accounts.filter(a => a.id !== user.id);

        accounts.push({
            id: user.id,
            name: user.name,
            displayName: user.displayName,
            cookie: cookie.value,
            avatarUrl: avatarUrl
        });

        await chrome.storage.local.set({ accounts, activeUserId: user.id });
        showToast(`Saved @${user.name}!`);
        loadAccounts();
    } catch (err) {
        showToast('Error saving account.');
    }
}

// 5. Switch Account
async function switchAccount(account) {
    try {
        await chrome.cookies.set({
            url: 'https://www.roblox.com',
            domain: '.roblox.com',
            name: '.ROBLOSECURITY',
            value: account.cookie,
            path: '/',
            secure: true,
            httpOnly: true
        });

        await chrome.storage.local.set({ activeUserId: account.id });
        showToast(`Switched to @${account.name}`);
        await loadAccounts();

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url && tab.url.includes('roblox.com')) {
            if (tab.url.includes('/login') || tab.url.includes('/NewLogin')) {
                chrome.tabs.update(tab.id, { url: 'https://www.roblox.com/home' });
            } else {
                chrome.tabs.reload(tab.id);
            }
        }
    } catch (err) {
        showToast('Switch failed.');
    }
}

// 6. Logout Browser Session (Normal Mode)
async function logoutBrowserSession(acc) {
    try {
        const data = await chrome.storage.local.get(['activeUserId']);
        const currentCookie = await chrome.cookies.get({
            url: 'https://www.roblox.com',
            name: '.ROBLOSECURITY'
        });

        const isCurrentSession = (acc.id === data.activeUserId) || 
                                (currentCookie && currentCookie.value && currentCookie.value === acc.cookie);

        if (isCurrentSession) {
            // Remove .ROBLOSECURITY cookie from browser
            await chrome.cookies.remove({
                url: 'https://www.roblox.com',
                name: '.ROBLOSECURITY'
            });

            // Set activeUserId to null, but keep account in list
            await chrome.storage.local.set({ activeUserId: null });

            // Redirect any open Roblox tabs to login page
            try {
                const tabs = await chrome.tabs.query({ url: '*://*.roblox.com/*' });
                if (tabs && tabs.length > 0) {
                    tabs.forEach(t => {
                        chrome.tabs.update(t.id, { url: 'https://www.roblox.com/login' });
                    });
                }
            } catch (_) {}

            showToast(`Logged out of @${acc.name}`);
        } else {
            showToast(`@${acc.name} is not logged into the browser.`);
        }
        await loadAccounts();
    } catch (err) {
        console.error('Logout error:', err);
        showToast('Logout failed.');
    }
}

// 7. Remove Account Completely (Manage Mode)
async function removeAccountCompletely(acc) {
    try {
        const data = await chrome.storage.local.get(['accounts', 'activeUserId']);
        let accounts = data.accounts || [];
        accounts = accounts.filter(a => a.id !== acc.id);

        const currentCookie = await chrome.cookies.get({
            url: 'https://www.roblox.com',
            name: '.ROBLOSECURITY'
        });

        const isCurrentSession = (acc.id === data.activeUserId) || 
                                (currentCookie && currentCookie.value && currentCookie.value === acc.cookie);

        if (isCurrentSession) {
            await chrome.cookies.remove({
                url: 'https://www.roblox.com',
                name: '.ROBLOSECURITY'
            });
            await chrome.storage.local.set({ accounts, activeUserId: null });
            try {
                const tabs = await chrome.tabs.query({ url: '*://*.roblox.com/*' });
                if (tabs && tabs.length > 0) {
                    tabs.forEach(t => {
                        chrome.tabs.update(t.id, { url: 'https://www.roblox.com/login' });
                    });
                }
            } catch (_) {}
        } else {
            await chrome.storage.local.set({ accounts });
        }

        if (accounts.length === 0) {
            isManageMode = false;
        }

        showToast(`Removed @${acc.name}`);
        await loadAccounts();
    } catch (err) {
        console.error('Remove error:', err);
        showToast('Remove failed.');
    }
}

// 7. Sign into Alt
async function signIntoAlt() {
    try {
        await chrome.cookies.remove({
            url: 'https://www.roblox.com',
            name: '.ROBLOSECURITY'
        });

        await chrome.storage.local.set({ activeUserId: null });
        showToast('Session cleared. Sign into your alt!');
        
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url && tab.url.includes('roblox.com')) {
            chrome.tabs.update(tab.id, { url: 'https://www.roblox.com/login' });
        } else {
            chrome.tabs.create({ url: 'https://www.roblox.com/login' });
        }
        await loadAccounts();
    } catch (_) {}
}

// Toast helper
function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}
