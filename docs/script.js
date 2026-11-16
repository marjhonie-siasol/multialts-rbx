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

    // GitHub Releases Integration & Auto-Sync
    const syncText = document.getElementById('syncText');
    const dynamicArea = document.getElementById('dynamicReleasesArea');

    async function syncGitHubReleases() {
        const repoOwner = 'marjhonie-siasol';
        const repoName = 'multialts-rbx';
        const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/releases`;

        try {
            const response = await fetch(apiUrl, {
                headers: { 'Accept': 'application/vnd.github.v3+json' }
            });

            if (!response.ok) {
                if (syncText) syncText.innerText = 'GitHub Sync Active (Local Archive)';
                return;
            }

            const releases = await response.json();
            if (Array.isArray(releases) && releases.length > 0) {
                if (syncText) {
                    syncText.innerText = `Synced with GitHub (${releases.length} live releases)`;
                }

                // If releases found, render any extra releases not already displayed
                if (dynamicArea) {
                    dynamicArea.innerHTML = '';
                    releases.forEach((rel, idx) => {
                        // If it's a new or additional release
                        const dateFormatted = new Date(rel.published_at || rel.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });

                        const zipAsset = (rel.assets && rel.assets.find(a => a.name.endsWith('.zip'))) || null;
                        const zipUrl = zipAsset ? zipAsset.browser_download_url : rel.zipball_url;
                        const zipSize = zipAsset ? `${(zipAsset.size / 1024).toFixed(0)} KB` : 'Source Zip';

                        const card = document.createElement('div');
                        card.className = `release-card ${idx === 0 ? 'github-live-release' : 'archive-release'}`;
                        card.style.marginTop = '20px';
                        card.innerHTML = `
                            <div class="release-topbar">
                                <div class="release-identity">
                                    <span class="release-version">${rel.tag_name || rel.name}</span>
                                    <span class="release-status-badge ${rel.prerelease ? 'archive' : 'latest'}">
                                        ${rel.prerelease ? 'Prerelease' : 'GitHub Release'}
                                    </span>
                                </div>
                                <div class="release-date">
                                    Published: ${dateFormatted}
                                </div>
                            </div>
                            <div class="release-main-content">
                                <h3 class="release-headline">${rel.name || rel.tag_name}</h3>
                                <p class="release-summary">${rel.body ? rel.body.substring(0, 200) + '...' : 'Release published via GitHub.'}</p>
                                <div class="release-download-group">
                                    <a href="${zipUrl}" class="btn-release-download">
                                        <span>Download .zip</span>
                                        <span class="file-size-tag">${zipSize}</span>
                                    </a>
                                    <a href="${rel.html_url}" target="_blank" rel="noopener" class="btn-release-github">
                                        <span>View on GitHub</span>
                                    </a>
                                </div>
                            </div>
                        `;
                        dynamicArea.appendChild(card);
                    });
                }
            } else {
                if (syncText) syncText.innerText = 'Connected to GitHub • Local Archive Active';
            }
        } catch (err) {
            console.log('GitHub API offline or rate-limited, showing local archive.', err);
            if (syncText) syncText.innerText = 'GitHub Sync Active (Local Archive)';
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
