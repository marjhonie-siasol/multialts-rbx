// MultiAlts Landing Page Script
document.addEventListener('DOMContentLoaded', () => {
    // Copy Command on Website Explainer Card
    const webCopyBtn = document.getElementById('webCopyBtn');
    const webCommandCode = document.getElementById('webCommandCode');

    if (webCopyBtn && webCommandCode) {
        const btnTextSpan = webCopyBtn.querySelector('span');

        webCopyBtn.addEventListener('click', () => {
            const textToCopy = webCommandCode.innerText.trim();
            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalText = btnTextSpan ? btnTextSpan.innerText : webCopyBtn.innerText;
                if (btnTextSpan) {
                    btnTextSpan.innerText = 'Copied!';
                } else {
                    webCopyBtn.innerText = 'Copied!';
                }
                webCopyBtn.style.background = '#00c4b4';
                webCopyBtn.style.color = '#000000';

                setTimeout(() => {
                    if (btnTextSpan) {
                        btnTextSpan.innerText = originalText;
                    } else {
                        webCopyBtn.innerText = originalText;
                    }
                    webCopyBtn.style.background = '';
                    webCopyBtn.style.color = '';
                }, 2200);
            }).catch(err => {
                console.error('Clipboard copy failed:', err);
            });
        });
    }

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
});
