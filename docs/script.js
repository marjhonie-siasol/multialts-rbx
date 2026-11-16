// MultiAlts Landing Page Script
document.addEventListener('DOMContentLoaded', () => {
    // Copy Command on Install Terminal
    const webCopyBtn = document.getElementById('webCopyBtn');
    const webCommandCode = document.getElementById('webCommandCode');

    if (webCopyBtn) {
        const btnTextSpan = webCopyBtn.querySelector('span');

        webCopyBtn.addEventListener('click', () => {
            const textToCopy = 'irm https://raw.githubusercontent.com/marjhonie-siasol/multialts-rbx/main/install.ps1 | iex';
            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalText = btnTextSpan ? btnTextSpan.innerText : webCopyBtn.innerText;
                if (btnTextSpan) {
                    btnTextSpan.innerText = 'Copied!';
                } else {
                    webCopyBtn.innerText = 'Copied!';
                }
                webCopyBtn.style.background = 'rgba(255, 255, 255, 0.22)';
                webCopyBtn.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                webCopyBtn.style.color = '#ffffff';

                setTimeout(() => {
                    if (btnTextSpan) {
                        btnTextSpan.innerText = originalText;
                    } else {
                        webCopyBtn.innerText = originalText;
                    }
                    webCopyBtn.style.background = '';
                    webCopyBtn.style.borderColor = '';
                    webCopyBtn.style.color = '';
                }, 2200);
            }).catch(err => {
                console.error('Clipboard copy failed:', err);
            });
        });
    }

    // Copy Command on Uninstall Terminal
    const uninstallCopyBtn = document.getElementById('uninstallCopyBtn');
    const uninstallCommandCode = document.getElementById('uninstallCommandCode');

    if (uninstallCopyBtn) {
        const btnTextSpan = uninstallCopyBtn.querySelector('span');

        uninstallCopyBtn.addEventListener('click', () => {
            const textToCopy = 'irm https://raw.githubusercontent.com/marjhonie-siasol/multialts-rbx/main/uninstall.ps1 | iex';
            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalText = btnTextSpan ? btnTextSpan.innerText : uninstallCopyBtn.innerText;
                if (btnTextSpan) {
                    btnTextSpan.innerText = 'Copied!';
                } else {
                    uninstallCopyBtn.innerText = 'Copied!';
                }
                uninstallCopyBtn.style.background = 'rgba(255, 255, 255, 0.22)';
                uninstallCopyBtn.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                uninstallCopyBtn.style.color = '#ffffff';

                setTimeout(() => {
                    if (btnTextSpan) {
                        btnTextSpan.innerText = originalText;
                    } else {
                        uninstallCopyBtn.innerText = originalText;
                    }
                    uninstallCopyBtn.style.background = '';
                    uninstallCopyBtn.style.borderColor = '';
                    uninstallCopyBtn.style.color = '';
                }, 2200);
            }).catch(err => {
                console.error('Clipboard copy failed:', err);
            });
        });
    }

    // Lifecycle / Uninstall & Verify Section Copy Buttons
    const bindCopyButton = (buttonId, textToCopy) => {
        const btn = document.getElementById(buttonId);
        if (!btn) return;
        const btnSpan = btn.querySelector('span');

        btn.addEventListener('click', () => {
            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalText = btnSpan ? btnSpan.innerText : btn.innerText;
                if (btnSpan) btnSpan.innerText = 'Copied!';
                else btn.innerText = 'Copied!';
                btn.style.background = 'rgba(255, 255, 255, 0.22)';
                btn.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                btn.style.color = '#ffffff';

                setTimeout(() => {
                    if (btnSpan) btnSpan.innerText = originalText;
                    else btn.innerText = originalText;
                    btn.style.background = '';
                    btn.style.borderColor = '';
                    btn.style.color = '';
                }, 2200);
            }).catch(err => {
                console.error('Clipboard copy failed:', err);
            });
        });
    };

    bindCopyButton('lifecycleUninstallCopyBtn', 'irm https://raw.githubusercontent.com/marjhonie-siasol/multialts-rbx/main/uninstall.ps1 | iex');
    const verifyScriptCmd = '[PSCustomObject]@{\n    EngineRunning = [bool](Get-NetTCPConnection -LocalPort 28491 -ErrorAction SilentlyContinue)\n    FilesExist    = (Test-Path "$env:LOCALAPPDATA\\multialts-rbx")\n    AutoStartKey  = [bool](Get-ItemProperty "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "MultiAltsRBX" -ErrorAction SilentlyContinue)\n}';
    bindCopyButton('verifyInstallCopyBtn', verifyScriptCmd);
    bindCopyButton('verifyUninstallCopyBtn', verifyScriptCmd);

    // Commands Overview Section Copy Buttons
    bindCopyButton('cmdOverviewInstallBtn', 'irm https://raw.githubusercontent.com/marjhonie-siasol/multialts-rbx/main/install.ps1 | iex');
    bindCopyButton('cmdOverviewVerifyBtn', verifyScriptCmd);
    bindCopyButton('cmdOverviewUninstallBtn', 'irm https://raw.githubusercontent.com/marjhonie-siasol/multialts-rbx/main/uninstall.ps1 | iex');

    // Smooth scroll for in-page anchors
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId && targetId !== '#') {
                const targetElem = document.querySelector(targetId);
                if (targetElem) {
                    e.preventDefault();
                    targetElem.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // Lightweight markdown parser for GitHub release notes
    function parseReleaseMarkdown(md) {
        if (!md) return '<p class="release-notes-p">Release published via GitHub.</p>';
        
        // Escape HTML entities for safety
        let text = md
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Headings
        text = text.replace(/^#### (.*?)$/gm, '<h5 class="release-notes-h5">$1</h5>');
        text = text.replace(/^### (.*?)$/gm, '<h4 class="release-notes-h4">$1</h4>');
        text = text.replace(/^## (.*?)$/gm, '<h3 class="release-notes-h3">$1</h3>');

        // Bold & Italic
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Inline code
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Parse lines for lists and paragraphs
        const lines = text.split('\n');
        let inList = false;
        const out = [];

        for (let rawLine of lines) {
            const line = rawLine.trimEnd();
            const listMatch = line.match(/^(\s*)[-*]\s+(.*)$/);
            if (listMatch) {
                if (!inList) {
                    out.push('<ul class="release-notes-list">');
                    inList = true;
                }
                out.push(`<li>${listMatch[2]}</li>`);
            } else {
                if (inList) {
                    out.push('</ul>');
                    inList = false;
                }
                const trimmed = line.trim();
                if (trimmed.length > 0 && !trimmed.startsWith('<h') && !trimmed.startsWith('<ul')) {
                    out.push(`<p class="release-notes-p">${trimmed}</p>`);
                } else if (trimmed.length > 0) {
                    out.push(trimmed);
                }
            }
        }
        if (inList) {
            out.push('</ul>');
        }

        return out.join('\n');
    }

    // Dynamic GitHub Releases Fetcher & Renderer
    async function syncGitHubReleases() {
        const releasesFeed = document.getElementById('releasesFeed');
        if (!releasesFeed) return;

        const repoOwner = 'marjhonie-siasol';
        const repoName = 'multialts-rbx';
        const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/releases`;

        function renderFallbackReleases() {
            releasesFeed.innerHTML = `
                <article class="release-card-bordered is-latest">
                    <div class="release-card-topbar">
                        <div class="release-card-meta">
                            <code class="release-version-pill">v1.0.0</code>
                            <span class="command-badge badge-install">Latest Release</span>
                            <span class="release-card-date">Production Build</span>
                        </div>
                        <div class="release-card-actions">
                            <a href="downloads/multialts-extension.zip" download="multialts-extension.zip" class="btn-copy-inline">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="7 10 12 15 17 10"/>
                                    <line x1="12" y1="15" x2="12" y2="3"/>
                                </svg>
                                <span>Download multialts-extension.zip</span>
                                <span class="release-size-tag">398 KB</span>
                            </a>
                            <a href="https://github.com/marjhonie-siasol/multialts-rbx/releases" target="_blank" rel="noopener" class="btn-copy-inline">
                                <span>View GitHub Releases &rarr;</span>
                            </a>
                        </div>
                    </div>
                    <div class="release-card-content">
                        <h3 class="release-card-title">MultiAlts v1.0.0 Production Release</h3>
                        <div class="release-card-notes">
                            <p class="release-notes-p">Official production release of MultiAlts RBX. Complete zero-binary multi-instance Windows unlocker engine and companion Chromium extension.</p>
                            <h5 class="release-notes-h5">Core Highlights</h5>
                            <ul class="release-notes-list">
                                <li>High-frequency Win32 NT handle stripper clearing singleton locks in under 350ms.</li>
                                <li>1-click account switching in browser extension supporting unlimited Roblox accounts.</li>
                                <li>Complete PowerShell CLI control suite (status, start, stop, restart, unlock, clean, kill-all).</li>
                            </ul>
                        </div>
                    </div>
                </article>
            `;
        }

        try {
            const response = await fetch(apiUrl, {
                headers: { 'Accept': 'application/vnd.github.v3+json' }
            });

            if (!response.ok) {
                throw new Error(`GitHub API status ${response.status}`);
            }

            const releases = await response.json();
            if (Array.isArray(releases) && releases.length > 0) {
                releasesFeed.innerHTML = '';
                releases.forEach((rel, idx) => {
                    const isLatest = idx === 0;
                    const dateFormatted = new Date(rel.published_at || rel.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });

                    // Find primary .zip asset or fallback
                    const zipAsset = (rel.assets && rel.assets.find(a => a.name.endsWith('.zip'))) || (rel.assets && rel.assets[0]) || null;
                    const zipUrl = zipAsset ? zipAsset.browser_download_url : (rel.zipball_url || `https://github.com/${repoOwner}/${repoName}/releases/tag/${rel.tag_name}`);
                    const zipName = zipAsset ? zipAsset.name : 'multialts-extension.zip';
                    const zipSize = zipAsset ? `${(zipAsset.size / 1024).toFixed(0)} KB` : 'Archive';

                    const card = document.createElement('article');
                    card.className = `release-card-bordered ${isLatest ? 'is-latest' : ''}`;
                    card.innerHTML = `
                        <div class="release-card-topbar">
                            <div class="release-card-meta">
                                <code class="release-version-pill">${rel.tag_name || 'v1.0.0'}</code>
                                <span class="command-badge ${isLatest ? 'badge-install' : 'badge-verify'}">
                                    ${isLatest ? 'Latest Release' : (rel.prerelease ? 'Pre-release' : 'Previous Release')}
                                </span>
                                <span class="release-card-date">${dateFormatted}</span>
                            </div>
                            <div class="release-card-actions">
                                <a href="${zipUrl}" class="btn-copy-inline" download="${zipName}" title="Download release archive">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                        <polyline points="7 10 12 15 17 10"/>
                                        <line x1="12" y1="15" x2="12" y2="3"/>
                                    </svg>
                                    <span>Download ${zipName}</span>
                                    <span class="release-size-tag">${zipSize}</span>
                                </a>
                                <a href="${rel.html_url}" target="_blank" rel="noopener" class="btn-copy-inline" title="View release on GitHub">
                                    <span>View on GitHub &rarr;</span>
                                </a>
                            </div>
                        </div>
                        <div class="release-card-content">
                            <h3 class="release-card-title">${rel.name || rel.tag_name}</h3>
                            <div class="release-card-notes">
                                ${parseReleaseMarkdown(rel.body)}
                            </div>
                        </div>
                    `;
                    releasesFeed.appendChild(card);
                });
            } else {
                renderFallbackReleases();
            }
        } catch (err) {
            console.warn('GitHub Releases API error, rendering direct fallback:', err);
            renderFallbackReleases();
        }
    }

    syncGitHubReleases();

    // Mockup Manage / Done Interactive Toggle
    const mockupManageBtn = document.getElementById('mockupManageBtn');
    if (mockupManageBtn) {
        let isMockupManage = false;
        const logoutSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>';
        const deleteSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';

        mockupManageBtn.addEventListener('click', () => {
            isMockupManage = !isMockupManage;
            mockupManageBtn.innerText = isMockupManage ? 'Done' : 'Manage';
            mockupManageBtn.classList.toggle('done-mode', isMockupManage);

            document.querySelectorAll('.accounts-list .btn-del').forEach(btn => {
                if (isMockupManage) {
                    btn.classList.add('remove-mode');
                    btn.innerHTML = deleteSvg;
                    btn.title = 'Delete account from MultiAlts';
                } else {
                    btn.classList.remove('remove-mode');
                    btn.innerHTML = logoutSvg;
                    const card = btn.closest('.account-card');
                    btn.title = (card && card.classList.contains('active')) ? 'Log out of browser session' : 'Remove from saved alts';
                }
            });
        });

        // Allow clicking ✕ to remove account in mockup during Manage mode
        document.querySelectorAll('.accounts-list .btn-del').forEach(btn => {
            btn.addEventListener('click', function (e) {
                if (isMockupManage) {
                    e.stopPropagation();
                    const card = this.closest('.account-card');
                    if (card) {
                        card.style.transition = 'opacity 180ms ease, transform 180ms ease';
                        card.style.opacity = '0';
                        card.style.transform = 'translateX(20px)';
                        setTimeout(() => card.remove(), 180);
                    }
                }
            });
        });
    }

    // Setup Step Image Lightbox Modal
    const setupImageFrames = document.querySelectorAll('.step-img-frame');
    if (setupImageFrames.length > 0) {
        const modal = document.createElement('div');
        modal.className = 'lightbox-modal';
        modal.innerHTML = `
            <div class="lightbox-content">
                <button class="lightbox-close" type="button" aria-label="Close preview">✕</button>
                <img class="lightbox-img" src="" alt="Enlarged setup screenshot">
                <div class="lightbox-caption"></div>
            </div>
        `;
        document.body.appendChild(modal);

        const modalImg = modal.querySelector('.lightbox-img');
        const modalCaption = modal.querySelector('.lightbox-caption');
        const closeBtn = modal.querySelector('.lightbox-close');

        const closeModal = () => {
            modal.classList.remove('active');
            setTimeout(() => {
                modalImg.src = '';
                modalCaption.innerText = '';
            }, 180);
        };

        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('lightbox-content')) {
                closeModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal();
            }
        });

        setupImageFrames.forEach(frame => {
            frame.addEventListener('click', () => {
                const img = frame.querySelector('.step-img');
                if (img) {
                    modalImg.src = img.src;
                    modalImg.alt = img.alt;
                    modalCaption.innerText = img.alt || '';
                    modal.classList.add('active');
                }
            });
        });
    }
});
