// DEN Chat Landing - Script

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initFaq();
  initGuides();
  initAbout();
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

const ADMIN_PUBKEY = 'fb9fdfe293f2028c16ecf4d5178b1cd87c1d47a7ead284aa2dd230660096dd0c';
const FREEDEN_PUBKEY = '3fc9e08185bb76c87836bec1abd7dbf155548258356bf2af99b27dee7fa18042';
const FREEDEN_NPUB = 'npub18ly7pqxzm4mmy8rd47cdt74ahc424y95xdtl9t7vek8777l5xqss3pttwf';
// Mirrors the client's DEFAULT_RELAYS (plus damus) so the landing reads from
// wherever the admin's client publishes content — otherwise updates that land
// on relays the landing doesn't read would be invisible here.
const RELAYS = [
  'wss://relay.damus.io',
  'wss://relay.primal.net',
  'wss://nos.lol',
  'wss://relay.nostr.band',
  'wss://relay.snort.social',
  'wss://relay.wellorder.net',
  'wss://relay.nostr.info',
  'wss://nostr.mom',
  'wss://nostr.novacisko.cz',
  'wss://nostrcheck.me',
  'wss://pyramid.fiatjaf.com',
  'wss://relay.cxplay.org',
  'wss://relay.layer.systems',
  'wss://relay.nostr.moe',
  'wss://relay.poster.place',
  'wss://wheat.happytavern.co',
  'wss://relay.noswhere.com',
  'wss://search.nos.today',
];

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
      <div class="rounded-xl border border-den-border overflow-auto bg-den-surface">
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

// ── About / Freeden Profile ──

function initAbout() {
  fetchProfile(FREEDEN_PUBKEY).then(profile => {
    if (!profile) return;
    if (profile.picture) {
      const container = document.getElementById('freeden-avatar');
      if (container) {
        const img = document.createElement('img');
        img.src = profile.picture;
        img.alt = profile.display_name || profile.name || 'Freeden';
        img.className = 'w-full h-full object-cover';
        img.onerror = () => { img.style.display = 'none'; };
        container.innerHTML = '';
        container.appendChild(img);
      }
    }
    if (profile.display_name || profile.name) {
      const nameEl = document.getElementById('freeden-name');
      if (nameEl) nameEl.textContent = profile.display_name || profile.name;
    }
  }).catch(() => { /* keep placeholder */ });

  // Also load sponsors
  initSponsors();
}

function fetchProfile(pubkey) {
  return new Promise((resolve) => {
    const filter = { authors: [pubkey], kinds: [0], limit: 1 };
    let bestEvent = null;
    let resolved = false;
    let completedRelays = 0;
    const sockets = [];

    const finish = () => {
      if (resolved) return;
      resolved = true;
      sockets.forEach(ws => { try { ws.close(); } catch { } });
      if (!bestEvent || !bestEvent.content) { resolve(null); return; }
      try { resolve(JSON.parse(bestEvent.content)); }
      catch { resolve(null); }
    };

    const timeout = setTimeout(finish, 6000);

    for (const relay of RELAYS) {
      try {
        const ws = new WebSocket(relay);
        sockets.push(ws);

        ws.onopen = () => {
          ws.send(JSON.stringify(['REQ', 'prof_' + Math.random().toString(36).slice(2, 8), filter]));
        };

        ws.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            if (data[0] === 'EVENT' && data[2]) {
              const ev = data[2];
              if (!bestEvent || ev.created_at > bestEvent.created_at) bestEvent = ev;
            }
            if (data[0] === 'EOSE') {
              completedRelays++;
              if (completedRelays >= RELAYS.length) { clearTimeout(timeout); finish(); }
            }
          } catch { }
        };

        ws.onerror = () => {
          completedRelays++;
          if (completedRelays >= RELAYS.length && !resolved) { clearTimeout(timeout); finish(); }
        };

        ws.onclose = () => {
          completedRelays++;
          if (completedRelays >= RELAYS.length && !resolved) { clearTimeout(timeout); finish(); }
        };
      } catch {
        completedRelays++;
      }
    }
  });
}

function copyNpub() {
  navigator.clipboard.writeText(FREEDEN_NPUB).then(() => {
    const btn = document.getElementById('freeden-copy-btn');
    if (!btn) return;
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    btn.classList.add('text-green-400');
    setTimeout(() => {
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
      btn.classList.remove('text-green-400');
    }, 1500);
  }).catch(() => { });
}

// ── Sponsors ──

const SPONSOR_TIER_CONFIG = {
  mythic: { label: 'Mythic', cardW: 'w-52', cardH: 'h-32', logoMaxH: 'max-h-20', logoSize: 'w-10 h-10', hoverBorder: 'hover:border-orange-500/40', textSize: 'text-xs' },
  legendary: { label: 'Legendary', cardW: 'w-48', cardH: 'h-28', logoMaxH: 'max-h-16', logoSize: 'w-9 h-9', hoverBorder: 'hover:border-amber-500/40', textSize: 'text-xs' },
  epic: { label: 'Epic', cardW: 'w-40', cardH: 'h-24', logoMaxH: 'max-h-14', logoSize: 'w-8 h-8', hoverBorder: 'hover:border-purple-500/40', textSize: 'text-[11px]' },
  rare: { label: 'Rare', cardW: 'w-36', cardH: 'h-20', logoMaxH: 'max-h-12', logoSize: 'w-7 h-7', hoverBorder: 'hover:border-blue-500/40', textSize: 'text-[11px]' },
  common: { label: 'Common', cardW: '', cardH: '', logoMaxH: '', logoSize: '', hoverBorder: '', textSize: '' },
};

const DEN_LOGO_PATH = 'm907.73 888.19c-14.57 30.37-89.83 51.72-189.76 64.06 5.85-16.56 10.77-34.19 14.66-52.85l-110.69-249.99-44.5 49.32-87.19-156.39-87.19 156.39-44.5-49.32-110.94 250.31c3.89 18.59 8.8 36.14 14.63 52.64-100.38-12.32-176.05-33.71-190.67-64.17-24.45-50.96-43.84-108.37-57.13-171.91l217.42-490.57 65.58 75.02 192.52-284.86 192.52 284.86 65.57-75.02 216.94 489.95c-13.3 63.79-32.74 121.41-57.27 172.53z';

let currentSponsorsYear = new Date().getFullYear();
const MIN_SPONSORS_YEAR = 2026;
const MAX_SPONSORS_YEAR = new Date().getFullYear();

function initSponsors() {
  currentSponsorsYear = MAX_SPONSORS_YEAR;
  updateSponsorsYearUI();
  loadSponsorsForYear(currentSponsorsYear);
}

function updateSponsorsYearUI() {
  const label = document.getElementById('sponsors-year-label');
  const prevBtn = document.getElementById('sponsors-year-prev');
  const nextBtn = document.getElementById('sponsors-year-next');
  if (label) label.textContent = String(currentSponsorsYear);
  if (prevBtn) prevBtn.disabled = currentSponsorsYear <= MIN_SPONSORS_YEAR;
  if (nextBtn) nextBtn.disabled = currentSponsorsYear >= MAX_SPONSORS_YEAR;
}

function changeSponsorsYear(delta) {
  const newYear = currentSponsorsYear + delta;
  if (newYear < MIN_SPONSORS_YEAR || newYear > MAX_SPONSORS_YEAR) return;
  currentSponsorsYear = newYear;
  updateSponsorsYearUI();

  // Show loading skeleton again
  const section = document.getElementById('sponsors');
  if (section) section.style.display = '';
  const loadingEl = document.getElementById('sponsors-loading');
  if (!loadingEl) {
    // Re-create the skeleton
    const mythicWrap = document.getElementById('sponsors-wrap-mythic');
    if (mythicWrap) {
      const skel = document.createElement('div');
      skel.id = 'sponsors-loading';
      skel.className = 'space-y-6';
      skel.innerHTML = '<div class="flex items-start gap-4"><div class="w-52 h-32 rounded-xl bg-den-muted/30 animate-pulse"></div><div class="w-52 h-32 rounded-xl bg-den-muted/20 animate-pulse" style="animation-delay:.15s"></div></div>';
      mythicWrap.parentNode.insertBefore(skel, mythicWrap);
    }
  }

  loadSponsorsForYear(currentSponsorsYear);
}

function loadSponsorsForYear(year) {
  const dTag = 'den-sponsors-' + year;
  fetchSponsorData(dTag).then(data => {
    renderSponsors(data);
  }).catch(() => {
    renderSponsors(null);
  });
}

function fetchSponsorData(dTag) {
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
      if (!bestEvent || !bestEvent.content) { resolve(null); return; }
      try { resolve(JSON.parse(bestEvent.content)); }
      catch { resolve(null); }
    };

    const timeout = setTimeout(finish, 6000);

    for (const relay of RELAYS) {
      try {
        const ws = new WebSocket(relay);
        sockets.push(ws);
        ws.onopen = () => {
          ws.send(JSON.stringify(['REQ', 'spon_' + Math.random().toString(36).slice(2, 8), filter]));
        };
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
        ws.onerror = () => {
          completedRelays++;
          if (completedRelays >= RELAYS.length && !resolved) { clearTimeout(timeout); finish(); }
        };
        ws.onclose = () => {
          completedRelays++;
          if (completedRelays >= RELAYS.length && !resolved) { clearTimeout(timeout); finish(); }
        };
      } catch { completedRelays++; }
    }
  });
}

function renderSponsors(data) {
  const tiers = ['mythic', 'legendary', 'epic', 'rare', 'common'];
  let anyVisible = false;

  // Remove loading skeleton
  const loader = document.getElementById('sponsors-loading');
  if (loader) loader.remove();

  for (const tier of tiers) {
    const wrapper = document.getElementById('sponsors-wrap-' + tier);
    const container = document.getElementById('sponsors-' + tier);
    const anonEl = document.getElementById('sponsors-' + tier + '-anon');
    if (!container || !wrapper) continue;

    const cfg = SPONSOR_TIER_CONFIG[tier];
    const tierData = data && data.tiers && data.tiers[tier] ? data.tiers[tier] : { sponsors: [], anonymous: 0 };
    const sponsors = Array.isArray(tierData.sponsors) ? tierData.sponsors : [];
    const anonCount = typeof tierData.anonymous === 'number' ? tierData.anonymous : 0;

    // Hide if nothing in this tier
    if (sponsors.length === 0 && anonCount === 0) {
      wrapper.style.display = 'none';
      continue;
    }

    wrapper.style.display = '';
    anyVisible = true;
    container.innerHTML = '';

    if (tier === 'common') {
      // Common: text links only
      for (const s of sponsors) {
        if (!s.name) continue;
        if (s.link) {
          const a = document.createElement('a');
          a.href = s.link;
          a.target = '_blank';
          a.rel = 'noopener';
          a.className = 'text-sm text-den-primary hover:text-den-primary-hover underline transition-colors';
          a.textContent = s.name;
          container.appendChild(a);
        } else {
          const span = document.createElement('span');
          span.className = 'text-sm text-den-muted-fg';
          span.textContent = s.name;
          container.appendChild(span);
        }
      }
    } else {
      // Non-common: logo cards
      for (const s of sponsors) {
        const a = document.createElement('a');
        a.href = s.link || '#sponsors';
        if (s.link) { a.target = '_blank'; a.rel = 'noopener'; }
        a.className = `${cfg.cardW} rounded-xl border border-den-border bg-den-muted/50 flex flex-col items-center justify-center gap-3 pt-5 pb-3 ${cfg.hoverBorder} transition-colors no-underline group overflow-hidden`;

        if (s.logo) {
          const img = document.createElement('img');
          img.src = s.logo;
          img.alt = s.name || '';
          img.className = `max-w-[80%] ${cfg.logoMaxH} object-contain`;
          a.appendChild(img);
        }
        if (s.name) {
          const label = document.createElement('span');
          label.className = `${cfg.textSize} text-den-muted-fg font-medium text-center px-2 truncate w-full`;
          label.textContent = s.name;
          a.appendChild(label);
        }
        container.appendChild(a);
      }
    }

    // Anonymous — render as a card (matching the tier's card size) with the
    // count shown inside it, sitting alongside the named-sponsor cards.
    if (tier !== 'common' && anonCount > 0) {
      const w = cfg.cardW || 'w-40';
      const anonCard = document.createElement('div');
      anonCard.className = `${w} rounded-xl border border-dashed border-den-border bg-den-muted/30 flex flex-col items-center justify-center gap-3 pt-4 pb-3 text-center overflow-hidden`;
      // Number sits in a box the height of a tier logo so the card lines up
      // with the named-sponsor cards next to it.
      const numBox = document.createElement('div');
      numBox.className = `${cfg.logoMaxH.replace('max-h', 'h')} flex items-center justify-center`;
      const num = document.createElement('span');
      num.className = 'text-3xl font-bold text-den-fg leading-none';
      num.textContent = String(anonCount);
      numBox.appendChild(num);
      const lbl = document.createElement('span');
      lbl.className = `${cfg.textSize} text-den-muted-fg`;
      lbl.textContent = anonCount === 1 ? 'Anonymous' : 'Anonymous';
      anonCard.appendChild(numBox);
      anonCard.appendChild(lbl);
      container.appendChild(anonCard);
    }

    // Legacy text line: keep it only for the 'common' tier (which is a
    // text-link layout, not cards); hide it everywhere else.
    if (anonEl) {
      if (tier === 'common' && anonCount > 0) {
        anonEl.textContent = `Anonymous ${cfg.label} sponsors: ${anonCount}`;
        anonEl.style.display = '';
      } else {
        anonEl.style.display = 'none';
      }
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Hub Detail Page ──
// ══════════════════════════════════════════════════════════════════════════════

// ── Bech32 / naddr Decoder ──

const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

function bech32Polymod(values) {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const v of values) {
    const b = chk >>> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) {
      if ((b >>> i) & 1) chk ^= GEN[i];
    }
  }
  return chk;
}

function bech32HrpExpand(hrp) {
  const ret = [];
  for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) >>> 5);
  ret.push(0);
  for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) & 31);
  return ret;
}

function bech32Decode(str) {
  str = str.toLowerCase();
  const pos = str.lastIndexOf('1');
  if (pos < 1 || pos + 7 > str.length) return null;
  const hrp = str.slice(0, pos);
  const dataChars = str.slice(pos + 1);
  const data = [];
  for (const c of dataChars) {
    const idx = BECH32_CHARSET.indexOf(c);
    if (idx === -1) return null;
    data.push(idx);
  }
  if (bech32Polymod(bech32HrpExpand(hrp).concat(data)) !== 1) return null;
  return { prefix: hrp, words: data.slice(0, data.length - 6) };
}

function convertBits(data, fromBits, toBits, pad) {
  let acc = 0;
  let bits = 0;
  const maxv = (1 << toBits) - 1;
  const ret = [];
  for (const value of data) {
    if (value < 0 || value >>> fromBits !== 0) return null;
    acc = (acc << fromBits) | value;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      ret.push((acc >>> bits) & maxv);
    }
  }
  if (pad) {
    if (bits > 0) ret.push((acc << (toBits - bits)) & maxv);
  } else if (bits >= fromBits || ((acc << (toBits - bits)) & maxv)) {
    return null;
  }
  return ret;
}

function decodeNaddr(naddr) {
  const decoded = bech32Decode(naddr);
  if (!decoded || decoded.prefix !== 'naddr') return null;
  const bytes = convertBits(decoded.words, 5, 8, false);
  if (!bytes) return null;

  let identifier = '';
  const relays = [];
  let pubkey = '';
  let kind = null;
  let i = 0;

  while (i < bytes.length) {
    const type = bytes[i];
    const len = bytes[i + 1];
    if (len === undefined) break;
    const value = bytes.slice(i + 2, i + 2 + len);
    i += 2 + len;

    if (type === 0) {
      // Special: identifier (d-tag) — UTF-8 string
      identifier = String.fromCharCode(...value);
    } else if (type === 1) {
      // Relay URL — UTF-8 string
      relays.push(String.fromCharCode(...value));
    } else if (type === 2) {
      // Author pubkey — 32 bytes hex
      pubkey = Array.from(value).map(b => b.toString(16).padStart(2, '0')).join('');
    } else if (type === 3) {
      // Kind — 4 bytes big-endian uint32
      kind = (value[0] << 24) | (value[1] << 16) | (value[2] << 8) | value[3];
    }
  }

  return { identifier, relays, pubkey, kind };
}

// ── Bech32 Encoding (for npub) ──

function bech32Encode(hrp, words) {
  const checksummed = words.concat(bech32CreateChecksum(hrp, words));
  let result = hrp + '1';
  for (const w of checksummed) result += BECH32_CHARSET.charAt(w);
  return result;
}

function bech32CreateChecksum(hrp, data) {
  const values = bech32HrpExpand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0]);
  const mod = bech32Polymod(values) ^ 1;
  const ret = [];
  for (let i = 0; i < 6; i++) ret.push((mod >>> (5 * (5 - i))) & 31);
  return ret;
}

function hexToNpub(hex) {
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substring(i, i + 2), 16));
  }
  const words = convertBits(bytes, 8, 5, true);
  if (!words) return hex;
  return bech32Encode('npub', words);
}

// ── Route Detection ──

let creatorModalOpen = false;

window.addEventListener('DOMContentLoaded', () => {
  checkHubRoute();
});
window.addEventListener('hashchange', () => {
  checkHubRoute();
});

function checkHubRoute() {
  const hash = window.location.hash;
  const hubPage = document.getElementById('hub-page');
  const landing = document.getElementById('landing-content');
  if (!hubPage || !landing) return;

  const match = hash.match(/^#hub\/(naddr1\S+)$/);
  if (match) {
    landing.style.display = 'none';
    hubPage.classList.remove('hidden');
    window.scrollTo(0, 0);
    loadHubPage(match[1]);
  } else {
    hubPage.classList.add('hidden');
    landing.style.display = '';
    document.title = 'DEN Chat - Free your chat';
  }
}

// ── Hub Event Fetching ──

function fetchHubEvent(pubkey, dTag, relayHints) {
  return new Promise((resolve) => {
    const filter = { kinds: [36942], authors: [pubkey], '#d': [dTag] };

    // Combine relay hints with default relays, deduplicated
    const allRelays = [...new Set([...(relayHints || []), ...RELAYS])];

    let bestEvent = null;
    let resolved = false;
    let completedRelays = 0;
    const totalRelays = allRelays.length;
    const sockets = [];

    const finish = () => {
      if (resolved) return;
      resolved = true;
      sockets.forEach(ws => { try { ws.close(); } catch { } });

      if (!bestEvent) { resolve(null); return; }

      // Parse hub event into hub object
      const getTag = (name) => bestEvent.tags.find(t => t[0] === name)?.[1] || '';
      const getTags = (name) => bestEvent.tags.filter(t => t[0] === name).map(t => t[1]);

      let settings = {};
      try { settings = JSON.parse(bestEvent.content) || {}; } catch { }

      const hub = {
        name: getTag('n') || getTag('name') || 'Unnamed Hub',
        tags: getTags('t'),
        minPow: parseInt(getTag('w')) || 0,
        epoch: getTag('epoch') || '',
        nsfw: bestEvent.tags.some(t => t[0] === 'content-warning'),
        discoverable: getTag('f') || '',
        publishedAt: parseInt(getTag('published_at')) || bestEvent.created_at,
        description: settings.description || (typeof settings.settings === 'object' ? settings.settings.description : '') || '',
        icon: settings.icon || (typeof settings.settings === 'object' ? settings.settings.icon : '') || '',
        banner: settings.banner || (typeof settings.settings === 'object' ? settings.settings.banner : '') || '',
        channels: Array.isArray(settings.channels) ? settings.channels : [],
        roles: Array.isArray(settings.roles) ? settings.roles : [],
        categories: Array.isArray(settings.categories) ? settings.categories : [],
        creatorPubkey: bestEvent.pubkey,
        dTag: getTag('d'),
      };

      resolve(hub);
    };

    const timeout = setTimeout(finish, 10000);

    for (const relay of allRelays) {
      try {
        const ws = new WebSocket(relay);
        sockets.push(ws);

        ws.onopen = () => {
          const subId = 'hub_' + Math.random().toString(36).slice(2, 8);
          ws.send(JSON.stringify(['REQ', subId, filter]));
        };

        ws.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            if (data[0] === 'EVENT' && data[2]) {
              const ev = data[2];
              if (!bestEvent || ev.created_at > bestEvent.created_at) bestEvent = ev;
            }
            if (data[0] === 'EOSE') {
              completedRelays++;
              if (completedRelays >= totalRelays) { clearTimeout(timeout); finish(); }
            }
          } catch { }
        };

        ws.onerror = () => {
          completedRelays++;
          if (completedRelays >= totalRelays && !resolved) { clearTimeout(timeout); finish(); }
        };

        ws.onclose = () => {
          completedRelays++;
          if (completedRelays >= totalRelays && !resolved) { clearTimeout(timeout); finish(); }
        };
      } catch {
        completedRelays++;
      }
    }
  });
}

// ── Hub Page Loading ──

async function loadHubPage(naddr) {
  const container = document.getElementById('hub-page-content');
  if (!container) return;

  // Show loading skeleton
  container.innerHTML = `
    <div class="animate-pulse">
      <div class="w-full h-[280px] bg-den-muted/30 rounded-b-xl"></div>
      <div class="max-w-2xl mx-auto px-6 mt-6">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-20 h-20 rounded-2xl bg-den-muted/50"></div>
          <div class="flex-1 space-y-3">
            <div class="h-6 bg-den-muted/50 rounded w-48"></div>
            <div class="h-4 bg-den-muted/30 rounded w-32"></div>
          </div>
        </div>
        <div class="space-y-3 mb-6">
          <div class="h-4 bg-den-muted/30 rounded w-full"></div>
          <div class="h-4 bg-den-muted/30 rounded w-3/4"></div>
        </div>
        <div class="h-24 bg-den-muted/20 rounded-xl mb-6"></div>
        <div class="h-12 bg-den-primary/20 rounded-lg w-full mb-3"></div>
        <div class="h-12 bg-den-muted/20 rounded-lg w-full"></div>
      </div>
    </div>`;

  // Decode naddr
  const decoded = decodeNaddr(naddr);
  if (!decoded) {
    renderHubError(container, 'Invalid hub address.', naddr);
    return;
  }

  if (decoded.kind !== 36942) {
    renderHubError(container, 'Invalid hub address — wrong event kind.', naddr);
    return;
  }

  // Fetch hub event + creator profile in parallel
  const [hub, creatorProfile] = await Promise.all([
    fetchHubEvent(decoded.pubkey, decoded.identifier, decoded.relays),
    fetchProfile(decoded.pubkey),
  ]);

  if (!hub) {
    renderHubError(container, 'Hub not found. It may have been removed or the relays are unreachable.', naddr);
    return;
  }

  renderHubPage(hub, creatorProfile, naddr);

  // Update page title
  document.title = hub.name + ' — DEN Chat Hub';
}

function renderHubError(container, message, naddr) {
  container.innerHTML = `
    <div class="max-w-2xl mx-auto px-6 py-20 text-center">
      <div class="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-2xl bg-red-500/10">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
      </div>
      <h2 class="text-xl font-bold mb-2">Hub Not Found</h2>
      <p class="text-den-muted-fg text-sm mb-8 max-w-md mx-auto">${message}</p>
      <div class="flex flex-col items-center gap-3">
        <button onclick="loadHubPage('${naddr}')" class="inline-flex items-center gap-2 px-6 py-3 bg-den-primary text-white text-sm font-semibold rounded-lg hover:bg-den-primary-hover transition-colors cursor-pointer border-none">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
          Retry
        </button>
        <a href="#" onclick="window.location.hash='';return false;" class="text-sm text-den-muted-fg hover:text-den-fg transition-colors no-underline">← Back to DEN Chat</a>
      </div>
    </div>`;
}

// ── Hub Page Rendering ──

function renderHubPage(hub, creatorProfile, naddr) {
  const container = document.getElementById('hub-page-content');
  if (!container) return;

  const npub = hexToNpub(hub.creatorPubkey);
  const npubShort = npub.slice(0, 12) + '…' + npub.slice(-6);
  const creatorName = (creatorProfile && (creatorProfile.display_name || creatorProfile.name)) || npubShort;
  const creatorAvatar = creatorProfile && creatorProfile.picture ? creatorProfile.picture : '';
  const creatorNip05 = creatorProfile && creatorProfile.nip05 ? creatorProfile.nip05 : '';

  // Banner
  const bannerHtml = hub.banner
    ? `<div class="relative w-full max-w-[720px] mx-auto h-[280px] overflow-hidden rounded-t-xl">
        <img src="${hub.banner}" alt="Hub banner" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<div class=\\'w-full h-full bg-gradient-to-b from-den-primary/20 to-den-bg\\'></div>'">
        <div class="absolute inset-0 bg-gradient-to-t from-den-bg via-den-bg/40 to-transparent"></div>
      </div>`
    : `<div class="w-full max-w-[720px] mx-auto h-[280px] bg-gradient-to-b from-den-primary/20 to-den-bg rounded-t-xl"></div>`;

  // Icon
  const initials = hub.name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const iconHtml = hub.icon
    ? `<img src="${hub.icon}" alt="${hub.name}" class="w-20 h-20 rounded-2xl object-cover border-4 border-den-bg -mt-10 relative z-10" onerror="this.outerHTML='<div class=\\'w-20 h-20 rounded-2xl bg-den-primary/20 flex items-center justify-center text-den-primary text-xl font-bold border-4 border-den-bg -mt-10 relative z-10\\'>${initials}</div>'">`
    : `<div class="w-20 h-20 rounded-2xl bg-den-primary/20 flex items-center justify-center text-den-primary text-xl font-bold border-4 border-den-bg -mt-10 relative z-10">${initials}</div>`;

  // NSFW badge
  const nsfwBadge = hub.nsfw
    ? `<span class="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-xs font-semibold">NSFW</span>`
    : '';

  // Tags
  const tagsHtml = hub.tags.length > 0
    ? `<div class="flex flex-wrap gap-1.5 mt-3">${hub.tags.map(t => `<span class="bg-den-primary/10 text-den-primary text-xs px-2 py-0.5 rounded-full">${t}</span>`).join('')}</div>`
    : '';

  // Stats line
  const statsHtml = hub.minPow > 0
    ? `<div class="flex items-center gap-1.5 text-sm text-den-muted-fg mt-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>
        ${hub.minPow} processing
      </div>`
    : '';

  // Creator card
  const creatorAvatarHtml = creatorAvatar
    ? `<img src="${creatorAvatar}" alt="${creatorName}" class="w-10 h-10 rounded-full object-cover shrink-0" onerror="this.outerHTML='<div class=\\'w-10 h-10 rounded-full bg-den-primary/20 flex items-center justify-center text-den-primary text-sm font-bold shrink-0\\'>${creatorName[0] || '?'}</div>'">`
    : `<div class="w-10 h-10 rounded-full bg-den-primary/20 flex items-center justify-center text-den-primary text-sm font-bold shrink-0">${creatorName[0] || '?'}</div>`;

  container.innerHTML = `
    ${bannerHtml}
    <div class="max-w-2xl mx-auto px-6 pb-16">
      <!-- Icon + Name -->
      <div class="flex items-start gap-4">
        ${iconHtml}
        <div class="pt-2 min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="text-2xl font-bold truncate">${hub.name}</h1>
            ${nsfwBadge}
          </div>
          <div class="text-sm text-den-muted-fg mt-0.5">by ${creatorName}</div>
        </div>
      </div>

      ${tagsHtml}

      <!-- Description -->
      ${hub.description ? `<p class="text-sm text-den-muted-fg leading-relaxed mt-4">${hub.description}</p>` : ''}

      ${statsHtml}

      <!-- Creator Card -->
      <div class="mt-6">
        <button onclick="openCreatorModal()" id="hub-creator-card" class="w-full bg-den-muted border border-den-border rounded-xl p-4 flex items-center gap-3 text-left hover:border-den-muted-fg transition-colors cursor-pointer font-sans">
          ${creatorAvatarHtml}
          <div class="min-w-0 flex-1">
            <div class="text-sm font-semibold text-den-fg">${creatorName}</div>
            <div class="text-xs text-den-muted-fg truncate">${npubShort}</div>
          </div>
          <span onclick="event.stopPropagation();copyHubNpub()" id="hub-copy-npub" class="w-8 h-8 flex items-center justify-center rounded-lg text-den-muted-fg hover:text-den-fg hover:bg-den-border transition-colors cursor-pointer shrink-0" title="Copy npub">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          </span>
        </button>
      </div>

      <!-- Action Buttons -->
      <div class="mt-8 space-y-3">
        <button onclick="openInDenChat('${naddr}')" class="w-full inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-den-primary text-white text-[15px] font-semibold rounded-lg hover:bg-den-primary-hover transition-colors cursor-pointer border-none">
          <svg viewBox="0 0 980 980" class="w-5 h-5"><path fill="currentColor" fill-rule="evenodd" d="${DEN_LOGO_PATH}"/></svg>
          Open in DEN Chat
        </button>
        <div id="hub-deeplink-msg" class="hidden text-center text-sm text-den-muted-fg"></div>
        <div class="flex items-center gap-3 my-1">
          <div class="flex-1 border-t border-den-border"></div>
          <span class="text-xs text-den-muted-fg">or</span>
          <div class="flex-1 border-t border-den-border"></div>
        </div>
        <a href="https://web.denchat.top/#hub/${naddr}" target="_blank" rel="noopener" class="w-full inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-transparent text-den-fg text-[15px] font-semibold rounded-lg border border-den-border hover:border-den-muted-fg transition-colors no-underline">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          Open in Web
        </a>
      </div>

      <!-- Back link -->
      <div class="mt-8 text-center">
        <a href="#" onclick="window.location.hash='';return false;" class="text-sm text-den-muted-fg hover:text-den-fg transition-colors no-underline">← Back to DEN Chat</a>
      </div>
    </div>`;

  // Store data for modal
  window._hubCreatorProfile = creatorProfile;
  window._hubCreatorPubkey = hub.creatorPubkey;
}

// ── Deep Link Helper ──

function openInDenChat(naddr) {
  const protocolUrl = 'denchat://hub/' + naddr;

  // Track if the browser loses focus — means the OS found the app
  let appLaunched = false;
  const onBlur = () => { appLaunched = true; };
  window.addEventListener('blur', onBlur);

  // Attempt protocol launch via hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = protocolUrl;
  document.body.appendChild(iframe);
  setTimeout(() => {
    try { document.body.removeChild(iframe); } catch { }
  }, 2000);

  // Check after 2.5s — if the window never lost focus & is still visible, app probably isn't installed
  const msgEl = document.getElementById('hub-deeplink-msg');
  if (msgEl) {
    setTimeout(() => {
      window.removeEventListener('blur', onBlur);
      if (!appLaunched && !document.hidden) {
        msgEl.classList.remove('hidden');
        msgEl.innerHTML = 'DEN Chat doesn\'t seem to be installed. <a href="#" onclick="event.preventDefault();closeCreatorModal();openDownloadModal()" class="text-den-primary hover:text-den-primary-hover underline">Download it here</a>.';
      }
    }, 2500);
  }
}

// ── Copy Hub Creator npub ──

function copyHubNpub() {
  const pubkey = window._hubCreatorPubkey;
  if (!pubkey) return;
  const npub = hexToNpub(pubkey);
  navigator.clipboard.writeText(npub).then(() => {
    const btn = document.getElementById('hub-copy-npub');
    if (!btn) return;
    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
    btn.classList.add('text-green-400');
    setTimeout(() => {
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
      btn.classList.remove('text-green-400');
    }, 1500);
  }).catch(() => { });
}

// ── Creator Profile Modal ──

function openCreatorModal() {
  const profile = window._hubCreatorProfile;
  const pubkey = window._hubCreatorPubkey;
  if (!pubkey) return;

  const modal = document.getElementById('creator-modal');
  const content = document.getElementById('creator-modal-content');
  if (!modal || !content) return;

  const npub = hexToNpub(pubkey);
  const npubShort = npub.slice(0, 16) + '…' + npub.slice(-8);
  const displayName = (profile && (profile.display_name || profile.name)) || npubShort;
  const avatar = profile && profile.picture ? profile.picture : '';
  const banner = profile && profile.banner ? profile.banner : '';
  const nip05 = profile && profile.nip05 ? profile.nip05 : '';
  const about = profile && profile.about ? profile.about : '';
  const lud16 = profile && profile.lud16 ? profile.lud16 : '';

  const bannerHtml = banner
    ? `<div class="w-full h-32 overflow-hidden">
        <img src="${banner}" alt="Banner" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<div class=\\'w-full h-32 bg-gradient-to-b from-den-primary/15 to-den-bg\\'></div>'">
      </div>`
    : `<div class="w-full h-20 bg-gradient-to-b from-den-primary/10 to-transparent"></div>`;

  const avatarHtml = avatar
    ? `<img src="${avatar}" alt="${displayName}" class="w-16 h-16 rounded-full object-cover border-4 border-den-bg -mt-8 relative z-10" onerror="this.outerHTML='<div class=\\'w-16 h-16 rounded-full bg-den-primary/20 flex items-center justify-center text-den-primary text-lg font-bold border-4 border-den-bg -mt-8 relative z-10\\'>${displayName[0] || '?'}</div>'">`
    : `<div class="w-16 h-16 rounded-full bg-den-primary/20 flex items-center justify-center text-den-primary text-lg font-bold border-4 border-den-bg -mt-8 relative z-10">${displayName[0] || '?'}</div>`;

  content.innerHTML = `
    ${bannerHtml}
    <div class="px-6 pb-6">
      ${avatarHtml}
      <div class="mt-2">
        <div class="text-lg font-bold">${displayName}</div>
        ${nip05 ? `<div class="text-xs text-den-primary mt-0.5">${nip05}</div>` : ''}
      </div>

      ${about ? `<p class="text-sm text-den-muted-fg leading-relaxed mt-3">${about}</p>` : ''}

      <!-- npub -->
      <div class="mt-4 flex items-center gap-2 bg-den-muted rounded-lg px-3 py-2">
        <span class="text-xs text-den-muted-fg truncate flex-1 font-mono">${npubShort}</span>
        <button onclick="copyCreatorNpub()" id="creator-copy-npub" class="w-7 h-7 flex items-center justify-center rounded text-den-muted-fg hover:text-den-fg transition-colors cursor-pointer bg-transparent border-none shrink-0" title="Copy npub">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
        </button>
      </div>

      ${lud16 ? `
      <div class="mt-3 flex items-center gap-2 text-sm text-den-muted-fg">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        <span class="truncate">${lud16}</span>
      </div>` : ''}
    </div>`;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  creatorModalOpen = true;
  document.body.style.overflow = 'hidden';
}

function closeCreatorModal() {
  const modal = document.getElementById('creator-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  creatorModalOpen = false;
  document.body.style.overflow = '';
}

function copyCreatorNpub() {
  const pubkey = window._hubCreatorPubkey;
  if (!pubkey) return;
  const npub = hexToNpub(pubkey);
  navigator.clipboard.writeText(npub).then(() => {
    const btn = document.getElementById('creator-copy-npub');
    if (!btn) return;
    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
    btn.classList.add('text-green-400');
    setTimeout(() => {
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
      btn.classList.remove('text-green-400');
    }, 1500);
  }).catch(() => { });
}

// ── Escape key handler for creator modal ──
// (Extends existing keydown listener)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && creatorModalOpen) { closeCreatorModal(); return; }
});
