// DEN Chat Landing - Script

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initFaq();
  initGuides();
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
      sockets.forEach(ws => { try { ws.close(); } catch { } });

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
          } catch { }
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

// ── Guides & Tutorials ──

const GUIDES_DTAG = 'den-chat-guides';
const GUIDES_PER_PAGE = 6;
let guidesPage = 0;
let guidesData = [];
let guidesFiltered = [];
let guideModalOpen = false;

function initGuides() {
  fetchGuidesFromNostr().then(guides => {
    guidesData = guides;
    guidesFiltered = [...guidesData];
    showGuidesReady();
    renderGuides();
    bindGuidesSearch();
  }).catch(() => {
    showGuidesError();
  });
}

function showGuidesReady() {
  const loading = document.getElementById('guides-loading');
  const error = document.getElementById('guides-error');
  const search = document.getElementById('guides-search-wrap');
  if (loading) loading.style.display = 'none';
  if (error) error.style.display = 'none';
  if (search) search.style.display = guidesData.length > 0 ? 'flex' : 'none';
}

function showGuidesError() {
  const loading = document.getElementById('guides-loading');
  const error = document.getElementById('guides-error');
  if (loading) loading.style.display = 'none';
  if (error) error.style.display = 'flex';
}

function retryGuidesFetch() {
  const loading = document.getElementById('guides-loading');
  const error = document.getElementById('guides-error');
  if (loading) loading.style.display = 'flex';
  if (error) error.style.display = 'none';

  fetchGuidesFromNostr().then(guides => {
    guidesData = guides;
    guidesFiltered = [...guidesData];
    showGuidesReady();
    renderGuides();
    bindGuidesSearch();
  }).catch(() => {
    showGuidesError();
  });
}

function bindGuidesSearch() {
  const searchInput = document.getElementById('guides-search-input');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      guidesFiltered = [...guidesData];
    } else {
      guidesFiltered = guidesData.filter(
        g => g.title.toLowerCase().includes(query) || g.summary.toLowerCase().includes(query)
      );
    }
    guidesPage = 0;
    renderGuides();
  });
}

function renderGuides() {
  const list = document.getElementById('guides-list');
  const pagination = document.getElementById('guides-pagination');
  const noResults = document.getElementById('guides-no-results');
  if (!list || !pagination) return;

  const totalPages = Math.ceil(guidesFiltered.length / GUIDES_PER_PAGE);
  const start = guidesPage * GUIDES_PER_PAGE;
  const pageItems = guidesFiltered.slice(start, start + GUIDES_PER_PAGE);

  if (noResults) {
    noResults.style.display = guidesFiltered.length === 0 ? 'block' : 'none';
  }

  list.innerHTML = pageItems.map((guide, i) => {
    const idx = start + i;
    const dateStr = new Date(guide.publishedAt * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    return `
      <button onclick="openGuideModal(${idx})" class="guide-card bg-den-muted border border-den-border rounded-xl p-5 text-left hover:border-den-primary/40 transition-all cursor-pointer group">
        <div class="flex items-start gap-3">
          <div class="w-9 h-9 flex items-center justify-center rounded-lg bg-den-primary/10 text-den-primary shrink-0 mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/></svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-den-fg text-[15px] mb-1 group-hover:text-den-primary transition-colors">${guide.title}</div>
            ${guide.summary ? `<div class="text-xs text-den-muted-fg leading-relaxed line-clamp-2">${guide.summary}</div>` : ''}
            <div class="text-[11px] text-den-muted-fg/60 mt-2">${dateStr}</div>
          </div>
        </div>
      </button>`;
  }).join('');

  // Pagination (reuse FAQ pattern)
  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  const btnBase = 'flex items-center justify-center w-9 h-9 rounded-md bg-transparent border border-den-border text-den-muted-fg cursor-pointer transition-colors text-[13px] font-semibold hover:border-den-muted-fg hover:text-den-fg disabled:opacity-30 disabled:cursor-not-allowed';
  const btnActive = 'flex items-center justify-center w-9 h-9 rounded-md bg-den-primary border-den-primary text-white text-[13px] font-semibold cursor-pointer';

  let html = `
    <button class="${btnBase}" onclick="guidesPageNav(-1)" ${guidesPage === 0 ? 'disabled' : ''} aria-label="Previous">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
    </button>`;

  for (let i = 0; i < totalPages; i++) {
    html += `<button class="${i === guidesPage ? btnActive : btnBase}" onclick="guidesPageNav(null, ${i})">${i + 1}</button>`;
  }

  html += `
    <button class="${btnBase}" onclick="guidesPageNav(1)" ${guidesPage === totalPages - 1 ? 'disabled' : ''} aria-label="Next">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
    </button>`;

  pagination.innerHTML = html;
}

function guidesPageNav(delta, page) {
  if (page !== null && page !== undefined) {
    guidesPage = page;
  } else {
    guidesPage += delta;
  }
  renderGuides();
}

function openGuideModal(idx) {
  const guide = guidesFiltered[idx];
  if (!guide) return;
  const modal = document.getElementById('guide-modal');
  const title = document.getElementById('guide-modal-title');
  const content = document.getElementById('guide-modal-content');
  if (!modal || !title || !content) return;

  title.textContent = guide.title;
  const rendered = typeof marked !== 'undefined' ? marked.parse(guide.content) : guide.content;
  content.innerHTML = rendered;
  content.scrollTop = 0;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  guideModalOpen = true;
  document.body.style.overflow = 'hidden';
}

function closeGuideModal() {
  const modal = document.getElementById('guide-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  guideModalOpen = false;
  if (!downloadModalOpen) document.body.style.overflow = '';
}

// Two-step Nostr fetch for guides:
// 1. Fetch master list (kind:30078, d:'den-chat-guides') -> JSON array of a-tag coordinates
// 2. Fetch each referenced kind:30023 article event
function fetchGuidesFromNostr() {
  return new Promise((resolve, reject) => {
    // Step 1: fetch the master list
    fetchNostrReplaceable(GUIDES_DTAG).then(masterEvent => {
      if (!masterEvent || !masterEvent.content) {
        resolve([]);
        return;
      }

      let coordinates;
      try {
        coordinates = JSON.parse(masterEvent.content);
      } catch {
        resolve([]);
        return;
      }

      if (!Array.isArray(coordinates) || coordinates.length === 0) {
        resolve([]);
        return;
      }

      // Step 2: parse coordinates and fetch each article
      const filters = coordinates.map(coord => {
        const parts = coord.split(':');
        if (parts.length >= 3) {
          return { kinds: [parseInt(parts[0])], authors: [parts[1]], '#d': [parts.slice(2).join(':')] };
        }
        return null;
      }).filter(Boolean);

      Promise.allSettled(filters.map(f => fetchNostrEvents(f))).then(results => {
        const guides = [];
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          if (result.status !== 'fulfilled' || result.value.length === 0) continue;
          const ev = result.value.sort((a, b) => b.created_at - a.created_at)[0];
          const getTag = (name) => ev.tags.find(t => t[0] === name)?.[1] || '';
          guides.push({
            coordinate: coordinates[i],
            title: getTag('title') || 'Untitled',
            summary: getTag('summary'),
            imageUrl: getTag('image'),
            content: ev.content,
            publishedAt: parseInt(getTag('published_at')) || ev.created_at,
          });
        }

        // Preserve master list order
        const ordered = coordinates
          .map(coord => guides.find(g => g.coordinate === coord))
          .filter(Boolean);

        resolve(ordered);
      });
    }).catch(reject);
  });
}

// Generic Nostr helpers (used by guides)
function fetchNostrReplaceable(dTag) {
  return new Promise((resolve, reject) => {
    const filter = { authors: [ADMIN_PUBKEY], kinds: [30078], '#d': [dTag] };
    let bestEvent = null;
    let resolved = false;
    let completedRelays = 0;
    const sockets = [];

    const finish = () => {
      if (resolved) return;
      resolved = true;
      sockets.forEach(ws => { try { ws.close(); } catch { } });
      resolve(bestEvent);
    };

    const timeout = setTimeout(finish, 8000);

    for (const relay of RELAYS) {
      try {
        const ws = new WebSocket(relay);
        sockets.push(ws);
        ws.onopen = () => ws.send(JSON.stringify(['REQ', 'r_' + Math.random().toString(36).slice(2, 6), filter]));
        ws.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            if (data[0] === 'EVENT' && data[2]) {
              if (!bestEvent || data[2].created_at > bestEvent.created_at) bestEvent = data[2];
            }
            if (data[0] === 'EOSE') {
              completedRelays++;
              if (completedRelays >= RELAYS.length) { clearTimeout(timeout); finish(); }
            }
          } catch { }
        };
        ws.onerror = ws.onclose = () => {
          completedRelays++;
          if (completedRelays >= RELAYS.length && !resolved) { clearTimeout(timeout); finish(); }
        };
      } catch { completedRelays++; }
    }
  });
}

function fetchNostrEvents(filter) {
  return new Promise((resolve, reject) => {
    const events = [];
    let resolved = false;
    let completedRelays = 0;
    const sockets = [];

    const finish = () => {
      if (resolved) return;
      resolved = true;
      sockets.forEach(ws => { try { ws.close(); } catch { } });
      resolve(events);
    };

    const timeout = setTimeout(finish, 8000);

    for (const relay of RELAYS) {
      try {
        const ws = new WebSocket(relay);
        sockets.push(ws);
        ws.onopen = () => ws.send(JSON.stringify(['REQ', 'e_' + Math.random().toString(36).slice(2, 6), filter]));
        ws.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            if (data[0] === 'EVENT' && data[2]) {
              if (!events.find(e => e.id === data[2].id)) events.push(data[2]);
            }
            if (data[0] === 'EOSE') {
              completedRelays++;
              if (completedRelays >= RELAYS.length) { clearTimeout(timeout); finish(); }
            }
          } catch { }
        };
        ws.onerror = ws.onclose = () => {
          completedRelays++;
          if (completedRelays >= RELAYS.length && !resolved) { clearTimeout(timeout); finish(); }
        };
      } catch { completedRelays++; }
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
  if (e.key === 'Escape' && guideModalOpen) { closeGuideModal(); return; }
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

// Download a file via fetch and trigger save with correct filename
// This bypasses cross-origin `download` attribute limitations
async function downloadBlossomFile(url, filename, btnId) {
  // Only use fetch-based download for blossom URLs (hash-based paths)
  // For external links (GitHub, etc.), just open them directly
  const isBlossom = /\/[a-f0-9]{64}(\.[^/]*)?$/i.test(new URL(url, location.href).pathname);
  if (!isBlossom) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  const btn = document.getElementById(btnId);
  if (!btn) return;
  const label = btn.querySelector('.dl-label');
  const origLabel = label ? label.textContent : '';

  // Show downloading state
  btn.disabled = true;
  btn.style.opacity = '0.7';
  btn.style.cursor = 'wait';
  if (label) label.textContent = 'Downloading…';

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    // Track progress if content-length is available
    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;

    if (total > 0 && response.body) {
      const reader = response.body.getReader();
      const chunks = [];
      let loaded = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
        const pct = Math.round((loaded / total) * 100);
        if (label) label.textContent = `${pct}%`;
      }

      const blob = new Blob(chunks);
      triggerBlobDownload(blob, filename);
    } else {
      // No content-length, just download the whole thing
      const blob = await response.blob();
      triggerBlobDownload(blob, filename);
    }

    // Success flash
    if (label) label.textContent = '✓ Downloaded';
    setTimeout(() => {
      if (label) label.textContent = origLabel;
      btn.disabled = false;
      btn.style.opacity = '';
      btn.style.cursor = '';
    }, 2000);
  } catch (err) {
    if (label) label.textContent = 'Failed – click to retry';
    btn.disabled = false;
    btn.style.opacity = '';
    btn.style.cursor = '';
  }
}

function triggerBlobDownload(blob, filename) {
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
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

    const platformsHtml = build.platforms.map((p, pi) => {
      const icon = platformIcon(p.platform);
      const ext = p.ext ? (p.ext.startsWith('.') ? p.ext : '.' + p.ext) : '';
      const downloadUrl = ext && !p.url.match(/\.[a-z0-9]{1,10}$/i) ? p.url + ext : p.url;
      const downloadName = `DEN-Chat-${build.version}-${p.platform.replace(/\s+/g, '-')}${ext}`;
      const btnId = `dl-plat-${idx}-${pi}`;
      return `
        <button id="${btnId}" onclick="downloadBlossomFile('${downloadUrl}', '${downloadName}', '${btnId}')" class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-den-muted border border-den-border hover:border-den-muted-fg transition-colors no-underline group w-full text-left cursor-pointer font-sans">
          <span class="text-den-primary shrink-0">${icon}</span>
          <span class="text-sm text-den-fg font-medium">${p.platform}</span>
          <span class="dl-label text-xs text-den-muted-fg truncate flex-1 text-right group-hover:text-den-fg/60 transition-colors">${ext || p.url.split('/').pop() || 'download'}</span>
        </button>`;
    }).join('');

    const srcExt = build.sourceExt ? (build.sourceExt.startsWith('.') ? build.sourceExt : '.' + build.sourceExt) : '';
    const sourceDownloadUrl = srcExt && !build.sourceUrl.match(/\.[a-z0-9]{1,10}$/i) ? build.sourceUrl + srcExt : build.sourceUrl;
    const sourceDownloadName = `DEN-Chat-${build.version}-source${srcExt}`;
    const srcBtnId = `dl-src-${idx}`;
    const sourceHtml = build.sourceUrl ? `
      <button id="${srcBtnId}" onclick="downloadBlossomFile('${sourceDownloadUrl}', '${sourceDownloadName}', '${srcBtnId}')" class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-den-muted border border-den-border hover:border-den-muted-fg transition-colors no-underline group w-full text-left cursor-pointer font-sans">
        <span class="text-den-muted-fg shrink-0">${platformIcon('source')}</span>
        <span class="text-sm text-den-fg font-medium">Source Code</span>
        <span class="dl-label text-xs text-den-muted-fg truncate flex-1 text-right group-hover:text-den-fg/60 transition-colors">${srcExt || build.sourceUrl.split('/').pop() || 'source'}</span>
      </button>` : '';

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
          <div class="px-4 py-4 space-y-2">
            ${build.body ? `<div class="build-notes text-xs text-den-muted-fg leading-relaxed mb-3">${typeof marked !== 'undefined' ? marked.parse(build.body) : build.body}</div>` : ''}
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
      sockets.forEach(ws => { try { ws.close(); } catch { } });

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
        } catch { }
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
          } catch { }
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
