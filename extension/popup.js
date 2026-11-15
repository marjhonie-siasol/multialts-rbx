// MultiAlts Popup Script
const DAEMON_URL = 'http://localhost:28491/status';

document.addEventListener('DOMContentLoaded', () => {
    checkEngine();
    loadAccounts();
    bindEvents();
});

// 1. Engine Check (Unique MultiAlts Indicator)
async function checkEngine() {
    const dot = document.getElementById('statusDot');
    const text = document.getElementById('statusText');
    const pill = document.getElementById('engineStatusPill');
    const banner = document.getElementById('setupBanner');

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1200);
        const res = await fetch(DAEMON_URL, { signal: controller.signal });
        clearTimeout(timeout);

        if (res.ok) {
            if (dot) dot.className = 'status-dot active';
            if (text) text.innerText = 'Engine Active';
            if (pill) pill.className = 'status-pill active';
            if (banner) banner.style.display = 'none';
            return true;
        }
    } catch (_) {}

    if (dot) dot.className = 'status-dot offline';
    if (text) text.innerText = 'Setup Needed';
    if (pill) pill.className = 'status-pill offline';
    if (banner) banner.style.display = 'flex';
    return false;
}

// 2. Events
function bindEvents() {
    // Copy Command
    const copyBtn = document.getElementById('copyCommandBtn');
    if (copyBtn) {
        copyBtn.onclick = () => {
            const cmd = document.getElementById('commandInput').value;
            navigator.clipboard.writeText(cmd).then(() => {
                showToast('Copied command!');
            });
        };
    }

    // Help Link ("What is this?")
    const helpLink = document.getElementById('helpLink');
    if (helpLink) {
        helpLink.onclick = (e) => {
            e.preventDefault();
            chrome.tabs.create({ url: helpLink.href });
        };
    }

    // GitHub Code Link
    const githubLink = document.getElementById('githubLink');
    if (githubLink) {
        githubLink.onclick = (e) => {
            e.preventDefault();
            chrome.tabs.create({ url: githubLink.href });
        };
    }

    // Add Current Account
    const addBtn = document.getElementById('addCurrentBtn');
    if (addBtn) addBtn.onclick = addCurrentAccount;

    // Sign into Alt
    const altBtn = document.getElementById('newLoginBtn');
    if (altBtn) altBtn.onclick = signIntoAlt;
}

// 3. Load Accounts
async function loadAccounts() {
    const data = await chrome.storage.local.get(['accounts', 'activeUserId']);
    const accounts = data.accounts || [];
    const activeUserId = data.activeUserId || null;

    const list = document.getElementById('accountsList');
    if (!list) return;

    if (accounts.length === 0) {
        list.innerHTML = `<div class="empty-state">No accounts saved</div>`;
        return;
    }

    list.innerHTML = '';
    accounts.forEach(acc => {
        const isActive = acc.id === activeUserId;
        const card = document.createElement('div');
        card.className = `account-card ${isActive ? 'active' : ''}`;
        
        card.innerHTML = `
            <div class="avatar">
                ${acc.avatarUrl ? `<img src="${acc.avatarUrl}" alt="${acc.name}">` : acc.name.slice(0, 2).toUpperCase()}
            </div>
            <div class="info">
                <div class="name">${acc.displayName || acc.name}</div>
                <div class="sub">@${acc.name}</div>
            </div>
            <button class="btn-del" data-id="${acc.id}" title="Remove">✕</button>
        `;

        card.onclick = (e) => {
            if (e.target.classList.contains('btn-del')) return;
            switchAccount(acc);
        };

        const delBtn = card.querySelector('.btn-del');
        delBtn.onclick = (e) => {
            e.stopPropagation();
            removeAccount(acc.id);
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
        loadAccounts();

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url && tab.url.includes('roblox.com')) {
            chrome.tabs.reload(tab.id);
        }
    } catch (err) {
        showToast('Switch failed.');
    }
}

// 6. Remove Account
async function removeAccount(id) {
    const data = await chrome.storage.local.get(['accounts', 'activeUserId']);
    let accounts = data.accounts || [];
    accounts = accounts.filter(a => a.id !== id);
    const activeUserId = data.activeUserId === id ? null : data.activeUserId;

    await chrome.storage.local.set({ accounts, activeUserId });
    showToast('Removed account.');
    loadAccounts();
}

// 7. Sign into Alt
async function signIntoAlt() {
    try {
        await chrome.cookies.remove({
            url: 'https://www.roblox.com',
            name: '.ROBLOSECURITY'
        });

        showToast('Session cleared. Sign into your alt!');
        
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url && tab.url.includes('roblox.com')) {
            chrome.tabs.update(tab.id, { url: 'https://www.roblox.com/login' });
        } else {
            chrome.tabs.create({ url: 'https://www.roblox.com/login' });
        }
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
