// DEN Chat Landing - Script

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initFaq();
});

// ── Mobile Navigation ──

function initMobileNav() {
  const btn = document.getElementById('nav-hamburger');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    menu.classList.toggle('open');
    const isOpen = menu.classList.contains('open');
    btn.setAttribute('aria-expanded', isOpen);
  });

  // Close on link click
  menu.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
  });
}

// ── Nostr Config ──

const ADMIN_PUBKEY = '3fc9e080c2dd77b21c6dafb0d5fabdbe2aaa90b43357f2afcccd8fef7bf43021';
const RELAYS = ['wss://relay.damus.io', 'wss://relay.primal.net', 'wss://nos.lol'];

// ── FAQ ──

const FAQ_DTAG = 'den-chat-faq';
const FAQ_PER_PAGE = 5;
let faqPage = 0;
let faqFiltered = [];
let faqData = []; // fetched from Nostr

function initFaq() {
  fetchFaqFromNostr().then(items => {
    faqData = items;
    faqFiltered = [...faqData];
    showFaqReady();
    renderFaq();
    bindFaqSearch();
  }).catch(() => {
    showFaqError();
  });
}

function showFaqReady() {
  const loading = document.getElementById('faq-loading');
  const error = document.getElementById('faq-error');
  const search = document.getElementById('faq-search-wrap');
  if (loading) loading.style.display = 'none';
  if (error) error.style.display = 'none';
  if (search) search.style.display = faqData.length > 0 ? 'flex' : 'none';
}

function showFaqError() {
  const loading = document.getElementById('faq-loading');
  const error = document.getElementById('faq-error');
  if (loading) loading.style.display = 'none';
  if (error) error.style.display = 'flex';
}

function retryFaqFetch() {
  const loading = document.getElementById('faq-loading');
  const error = document.getElementById('faq-error');
  if (loading) loading.style.display = 'flex';
  if (error) error.style.display = 'none';

  fetchFaqFromNostr().then(items => {
    faqData = items;
    faqFiltered = [...faqData];
    showFaqReady();
    renderFaq();
    bindFaqSearch();
  }).catch(() => {
    showFaqError();
  });
}

function bindFaqSearch() {
  const searchInput = document.getElementById('faq-search-input');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      faqFiltered = [...faqData];
    } else {
      faqFiltered = faqData.filter(
        item => item.q.toLowerCase().includes(query) || item.a.toLowerCase().includes(query)
      );
    }
    faqPage = 0;
    renderFaq();
  });
}

function renderFaq() {
  const list = document.getElementById('faq-list');
  const pagination = document.getElementById('faq-pagination');
  const noResults = document.getElementById('faq-no-results');
  if (!list || !pagination) return;

  const totalPages = Math.ceil(faqFiltered.length / FAQ_PER_PAGE);
  const start = faqPage * FAQ_PER_PAGE;
  const pageItems = faqFiltered.slice(start, start + FAQ_PER_PAGE);

  // Show/hide no results
  if (noResults) {
    noResults.style.display = faqFiltered.length === 0 ? 'block' : 'none';
  }

  // Render items
  list.innerHTML = pageItems.map((item, i) => `
    <div class="faq-item bg-den-muted border border-den-border rounded-lg overflow-hidden transition-colors" data-index="${start + i}">
      <button class="w-full flex items-center justify-between px-5 py-3 bg-transparent border-none text-den-fg text-[15px] font-semibold text-left cursor-pointer gap-4 hover:text-den-primary transition-colors font-sans" onclick="toggleFaq(this)">
        <span>${item.q}</span>
        <svg class="faq-chevron shrink-0 text-den-muted-fg" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      <div class="faq-answer">
        <div class="px-5 pb-5 text-sm text-den-muted-fg leading-relaxed text-start faq-prose">${typeof marked !== 'undefined' ? marked.parse(item.a) : item.a}</div>
      </div>
    </div>
  `).join('');

  // Render pagination
  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  const btnBase = 'flex items-center justify-center w-9 h-9 rounded-md bg-transparent border border-den-border text-den-muted-fg cursor-pointer transition-colors text-[13px] font-semibold hover:border-den-muted-fg hover:text-den-fg disabled:opacity-30 disabled:cursor-not-allowed';
  const btnActive = 'flex items-center justify-center w-9 h-9 rounded-md bg-den-primary border-den-primary text-white text-[13px] font-semibold cursor-pointer';

  let paginationHtml = `
    <button class="${btnBase}" onclick="faqPageNav(-1)" ${faqPage === 0 ? 'disabled' : ''} aria-label="Previous page">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
    </button>
  `;

  for (let i = 0; i < totalPages; i++) {
    paginationHtml += `<button class="${i === faqPage ? btnActive : btnBase}" onclick="faqPageNav(null, ${i})">${i + 1}</button>`;
  }

  paginationHtml += `
    <button class="${btnBase}" onclick="faqPageNav(1)" ${faqPage === totalPages - 1 ? 'disabled' : ''} aria-label="Next page">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
    </button>
  `;

  pagination.innerHTML = paginationHtml;
}

function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  const wasActive = item.classList.contains('active');

  // Close all
  document.querySelectorAll('.faq-item.active').forEach(el => el.classList.remove('active'));

  // Toggle current
  if (!wasActive) {
    item.classList.add('active');
  }
}

function faqPageNav(delta, page) {
  if (page !== null && page !== undefined) {
    faqPage = page;
  } else {
    faqPage += delta;
  }
  renderFaq();
}

// Nostr fetch for FAQ
function fetchFaqFromNostr() {
  return new Promise((resolve, reject) => {
    const filter = {
      authors: [ADMIN_PUBKEY],
      kinds: [30078],
      '#d': [FAQ_DTAG],
    };

    let bestEvent = null;
    let resolved = false;
    let completedRelays = 0;
    const sockets = [];

    const finish = () => {
      if (resolved) return;
      resolved = true;
      sockets.forEach(ws => { try { ws.close(); } catch {} });

      if (!bestEvent || !bestEvent.content) {
        resolve([]);
        return;
      }

      try {
        const arr = JSON.parse(bestEvent.content);
        if (Array.isArray(arr)) {
          const items = arr
            .filter(item => item.title && item.body)
            .map(item => ({ q: item.title, a: item.body }));
          resolve(items);
        } else {
          resolve([]);
        }
      } catch {
        reject(new Error('Failed to parse FAQ'));
      }
    };

    const timeout = setTimeout(finish, 8000);

    for (const relay of RELAYS) {
      try {
        const ws = new WebSocket(relay);
        sockets.push(ws);

        ws.onopen = () => {
          const subId = 'faq_' + Math.random().toString(36).slice(2, 8);
          ws.send(JSON.stringify(['REQ', subId, filter]));
        };

        ws.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            if (data[0] === 'EVENT' && data[2]) {
              const ev = data[2];
              // Keep the latest version (replaceable)
              if (!bestEvent || ev.created_at > bestEvent.created_at) {
                bestEvent = ev;
              }
            }
            if (data[0] === 'EOSE') {
              completedRelays++;
              if (completedRelays >= RELAYS.length) {
                clearTimeout(timeout);
                finish();
              }
            }
          } catch {}
        };

        ws.onerror = () => {
          completedRelays++;
          if (completedRelays >= RELAYS.length && !resolved) {
            clearTimeout(timeout);
            if (bestEvent) finish();
            else { resolved = true; reject(new Error('All relays failed')); }
          }
        };

        ws.onclose = () => {
          completedRelays++;
          if (completedRelays >= RELAYS.length && !resolved) {
            clearTimeout(timeout);
            finish();
          }
        };
      } catch {
        completedRelays++;
      }
    }
  });
}

// ── Download Modal ──

const BUILD_DTAG_PREFIX = 'den-chat-build-';

let downloadBuilds = null; // cached after first fetch
let downloadModalOpen = false;
let openBuildIdx = null;

function openDownloadModal() {
  const modal = document.getElementById('download-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  downloadModalOpen = true;
  document.body.style.overflow = 'hidden';

  if (!downloadBuilds) {
    renderDownloadContent('loading');
    fetchBuildsFromNostr().then(builds => {
      downloadBuilds = builds;
      renderDownloadContent('ready');
    }).catch(() => {
      renderDownloadContent('error');
    });
  } else {
    renderDownloadContent('ready');
  }
}

function closeDownloadModal() {
  const modal = document.getElementById('download-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  downloadModalOpen = false;
  document.body.style.overflow = '';
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && downloadModalOpen) closeDownloadModal();
});

// Platform icon SVGs
function platformIcon(name) {
  const n = name.toLowerCase();
  if (n.includes('windows') || n.includes('win')) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/></svg>';
  }
  if (n.includes('linux') || n.includes('deb') || n.includes('rpm') || n.includes('appimage')) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
  }
  if (n.includes('mac') || n.includes('dmg') || n.includes('apple')) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>';
  }
  // Source code
  if (n.includes('source')) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>';
  }
  // Generic download
  return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>';
}

function renderDownloadContent(state) {
  const container = document.getElementById('download-modal-content');
  if (!container) return;

  if (state === 'loading') {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center py-12 gap-3">
        <svg class="animate-spin h-6 w-6 text-den-primary" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <p class="text-sm text-den-muted-fg">Fetching available builds...</p>
      </div>`;
    return;
  }

  if (state === 'error') {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center py-12 gap-3">
        <p class="text-sm text-den-muted-fg">Failed to load builds.</p>
        <button onclick="retryDownloadFetch()" class="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-den-border bg-den-muted text-sm font-medium text-den-fg hover:bg-den-muted/80 transition-colors cursor-pointer">
          Try Again
        </button>
      </div>`;
    return;
  }

  // ready
  if (!downloadBuilds || downloadBuilds.length === 0) {
    container.innerHTML = '<p class="text-sm text-den-muted-fg text-center py-12">No builds published yet.</p>';
    return;
  }

  container.innerHTML = downloadBuilds.map((build, idx) => {
    const isOpen = openBuildIdx === idx;
    const date = new Date(build.published_at * 1000);
    const dateStr = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

    const platformsHtml = build.platforms.map(p => {
      const icon = platformIcon(p.platform);
      const filename = p.url.split('/').pop() || 'download';
      return `
        <a href="${p.url}" download class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-den-muted border border-den-border hover:border-den-muted-fg transition-colors no-underline group">
          <span class="text-den-primary shrink-0">${icon}</span>
          <span class="text-sm text-den-fg font-medium">${p.platform}</span>
          <span class="text-xs text-den-muted-fg truncate flex-1 text-right group-hover:text-den-fg/60 transition-colors">${filename}</span>
        </a>`;
    }).join('');

    const sourceHtml = build.sourceUrl ? `
      <a href="${build.sourceUrl}" download class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-den-muted border border-den-border hover:border-den-muted-fg transition-colors no-underline group">
        <span class="text-den-muted-fg shrink-0">${platformIcon('source')}</span>
        <span class="text-sm text-den-fg font-medium">Source Code</span>
        <span class="text-xs text-den-muted-fg truncate flex-1 text-right group-hover:text-den-fg/60 transition-colors">${build.sourceUrl.split('/').pop() || 'source'}</span>
      </a>` : '';

    return `
      <div class="rounded-xl border border-den-border overflow-hidden bg-den-surface">
        <button onclick="toggleBuild(${idx})" class="flex items-center justify-between w-full px-4 py-3 text-left cursor-pointer hover:bg-den-muted/50 transition-colors bg-transparent border-none font-sans">
          <div class="flex items-center gap-3 pr-4">
            <span class="text-sm font-semibold text-den-fg">${build.version}</span>
            <span class="text-xs text-den-muted-fg">${dateStr}</span>
          </div>
          <svg class="w-4 h-4 text-den-muted-fg shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        ${isOpen ? `
          <div class="px-4 pb-4 space-y-2">
            ${build.body ? `<p class="text-xs text-den-muted-fg leading-relaxed mb-3">${build.body}</p>` : ''}
            ${platformsHtml}
            ${sourceHtml}
          </div>
        ` : ''}
      </div>`;
  }).join('');
}

function toggleBuild(idx) {
  openBuildIdx = openBuildIdx === idx ? null : idx;
  renderDownloadContent('ready');
}

function retryDownloadFetch() {
  downloadBuilds = null;
  renderDownloadContent('loading');
  fetchBuildsFromNostr().then(builds => {
    downloadBuilds = builds;
    renderDownloadContent('ready');
  }).catch(() => {
    renderDownloadContent('error');
  });
}

// Nostr relay fetch
function fetchBuildsFromNostr() {
  return new Promise((resolve, reject) => {
    const filter = {
      authors: [ADMIN_PUBKEY],
      kinds: [30078],
    };

    const events = new Map(); // dedup by id
    let resolved = false;
    let completedRelays = 0;
    const sockets = [];

    const finish = () => {
      if (resolved) return;
      resolved = true;
      sockets.forEach(ws => { try { ws.close(); } catch {} });

      const builds = [];
      for (const ev of events.values()) {
        const dTag = ev.tags.find(t => t[0] === 'd')?.[1];
        if (!dTag || !dTag.startsWith(BUILD_DTAG_PREFIX)) continue;
        try {
          const data = JSON.parse(ev.content);
          if (data.deleted) continue;
          if (ev.tags.some(t => t[0] === 'deleted')) continue;
          if (data.version) {
            builds.push({
              id: ev.id,
              version: data.version,
              body: data.body || '',
              sourceUrl: data.sourceUrl || '',
              sourceExt: data.sourceExt || '',
              platforms: Array.isArray(data.platforms) ? data.platforms.map(p => ({
                platform: p.platform || '',
                url: p.url || '',
                ext: p.ext || '',
              })) : [],
              published_at: data.published_at || ev.created_at,
              created_at: ev.created_at,
            });
          }
        } catch {}
      }
      builds.sort((a, b) => b.published_at - a.published_at);
      // Auto-open latest build
      if (builds.length > 0) openBuildIdx = 0;
      resolve(builds);
    };

    // Timeout after 8 seconds
    const timeout = setTimeout(finish, 8000);

    for (const relay of RELAYS) {
      try {
        const ws = new WebSocket(relay);
        sockets.push(ws);

        ws.onopen = () => {
          const subId = 'builds_' + Math.random().toString(36).slice(2, 8);
          ws.send(JSON.stringify(['REQ', subId, filter]));
        };

        ws.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            if (data[0] === 'EVENT' && data[2]) {
              events.set(data[2].id, data[2]);
            }
            if (data[0] === 'EOSE') {
              completedRelays++;
              if (completedRelays >= RELAYS.length) {
                clearTimeout(timeout);
                finish();
              }
            }
          } catch {}
        };

        ws.onerror = () => {
          completedRelays++;
          if (completedRelays >= RELAYS.length && !resolved) {
            clearTimeout(timeout);
            if (events.size > 0) finish();
            else { resolved = true; reject(new Error('All relays failed')); }
          }
        };

        ws.onclose = () => {
          completedRelays++;
          if (completedRelays >= RELAYS.length && !resolved) {
            clearTimeout(timeout);
            finish();
          }
        };
      } catch {
        completedRelays++;
      }
    }
  });
}
