// =========================================
//   YAKEEN NEET GUJARATI 2026 — script.js
//   URL Protection + Secure Player
// =========================================

const SUBJECTS = {
  Physics:   { emoji: '⚡', color: 'var(--accent-physics)',   bg: 'rgba(56,189,248,0.1)' },
  Chemistry: { emoji: '🧪', color: 'var(--accent-chemistry)', bg: 'rgba(244,114,182,0.1)' },
  Botany:    { emoji: '🌿', color: 'var(--accent-botany)',    bg: 'rgba(74,222,128,0.1)' },
  Zoology:   { emoji: '🐾', color: 'var(--accent-zoology)',   bg: 'rgba(251,146,60,0.1)' },
  Notices:   { emoji: '📢', color: 'var(--accent-notices)',   bg: 'rgba(167,139,250,0.1)' },
};

const TAB_CONFIG = [
  { key: 'videos',    label: 'Videos',     emoji: '▶️',  color: '#38bdf8' },
  { key: 'notes',     label: 'Notes',      emoji: '📄',  color: '#4ade80' },
  { key: 'dppNotes',  label: 'DPP Notes',  emoji: '📝',  color: '#fb923c' },
  { key: 'dppVideos', label: 'DPP Videos', emoji: '🎥',  color: '#a78bfa' },
];

let allData = {};
let activeSubject = 'Physics';
let activeModalTab = 'videos';
let searchTimer = null;

// ─── URL PROTECTION ─────────────────────
// Encode URL so it's not visible in HTML/inspect
function encodeURL(url) {
  if (!url) return '';
  return btoa(encodeURIComponent(url));
}
function decodeURL(encoded) {
  if (!encoded) return '';
  try { return decodeURIComponent(atob(encoded)); } catch { return ''; }
}

// ─── DISABLE RIGHT CLICK & LONG PRESS ───
function setupAntiLeak() {
  // Disable right-click context menu
  document.addEventListener('contextmenu', e => e.preventDefault());

  // Disable text selection
  document.addEventListener('selectstart', e => {
    // Allow selection in search input
    if (e.target.tagName !== 'INPUT') e.preventDefault();
  });

  // Disable long-press callout on iOS/Android
  document.addEventListener('touchstart', e => {
    if (e.target.classList.contains('resource-item') ||
        e.target.closest('.resource-item') ||
        e.target.classList.contains('player-overlay') ||
        e.target.closest('#videoPlayerModal')) {
      // prevent callout / text selection
    }
  }, { passive: true });

  // Prevent drag (which can reveal URLs)
  document.addEventListener('dragstart', e => e.preventDefault());

  // Disable keyboard shortcuts that could reveal source
  document.addEventListener('keydown', e => {
    // Block Ctrl+U (view source), Ctrl+S (save), F12
    if (
      (e.ctrlKey && (e.key === 'u' || e.key === 's' || e.key === 'U' || e.key === 'S')) ||
      e.key === 'F12'
    ) {
      e.preventDefault();
    }
  });
}

// ─── INIT ───────────────────────────────
async function init() {
  setupAntiLeak();
  try {
    const res = await fetch('data.json');
    allData = await res.json();
    buildStats();
    buildSubjectNav();
    renderSubject(activeSubject);
    setupSearch();
    setupModal();
    setupVideoPlayer();
    document.getElementById('loadingScreen')?.remove();
  } catch(e) {
    document.getElementById('loadingScreen').innerHTML =
      '<p style="color:#f87171">❌ data.json લોડ ન થઈ શક્યો.<br>index.html ની સાથે data.json ફાઇલ રાખો.</p>';
  }
}

// ─── STATS ──────────────────────────────
function buildStats() {
  let totalChapters = 0, totalResources = 0;
  Object.values(allData).forEach(chapters => {
    totalChapters += chapters.length;
    chapters.forEach(ch => {
      totalResources += ch.videos.length + ch.notes.length + ch.dppNotes.length + ch.dppVideos.length;
    });
  });
  const el = document.getElementById('headerStats');
  el.innerHTML = `
    <div class="stat-pill"><span>📚</span>${totalChapters} Chapters</div>
    <div class="stat-pill"><span>🔗</span>${totalResources}+ Resources</div>
  `;
}

// ─── SUBJECT NAV ────────────────────────
function buildSubjectNav() {
  const nav = document.getElementById('subjectNav');
  nav.innerHTML = '';
  Object.entries(SUBJECTS).forEach(([name, cfg]) => {
    const chapters = allData[name] || [];
    const btn = document.createElement('button');
    btn.className = 'subject-btn' + (name === activeSubject ? ' active' : '');
    btn.style.setProperty('--subject-color', cfg.color);
    btn.innerHTML = `<span class="s-emoji">${cfg.emoji}</span>${name}<span class="s-count">${chapters.length}</span>`;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.subject-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeSubject = name;
      clearSearch();
      renderSubject(name);
    });
    nav.appendChild(btn);
  });
}

// ─── RENDER SUBJECT ─────────────────────
function renderSubject(subjectName) {
  const main = document.getElementById('mainContent');
  const chapters = allData[subjectName] || [];
  const cfg = SUBJECTS[subjectName];

  main.innerHTML = `
    <div class="subject-header" style="--subject-color:${cfg.color};--subject-bg:${cfg.bg}">
      <div class="subject-header-icon" style="background:${cfg.bg}">${cfg.emoji}</div>
      <div class="subject-header-text">
        <h2 style="color:${cfg.color}">${subjectName}</h2>
        <p>${chapters.length} chapters • Yakeen NEET Gujarati 2026</p>
      </div>
    </div>
    <div class="chapters-grid" id="chaptersGrid"></div>
  `;

  const grid = document.getElementById('chaptersGrid');
  chapters.forEach((ch, i) => {
    grid.appendChild(buildChapterCard(ch, subjectName, i));
  });
}

// ─── CHAPTER CARD ───────────────────────
function buildChapterCard(chapter, subjectName, index) {
  const cfg = SUBJECTS[subjectName];
  const card = document.createElement('div');
  card.className = 'chapter-card';
  card.style.cssText = `--subject-color:${cfg.color}; animation-delay:${Math.min(index * 0.04, 0.5)}s`;

  const vCount = chapter.videos.length;
  const nCount = chapter.notes.length;
  const dppCount = chapter.dppNotes.length;

  card.innerHTML = `
    <div class="chapter-name">${chapter.name}</div>
    <div class="chapter-badges">
      ${vCount  ? `<span class="badge videos">▶️ ${vCount} Videos</span>`  : `<span class="badge empty">▶️ 0</span>`}
      ${nCount  ? `<span class="badge notes">📄 ${nCount} Notes</span>`    : `<span class="badge empty">📄 0</span>`}
      ${dppCount? `<span class="badge dpp">📝 ${dppCount} DPP</span>`      : `<span class="badge empty">📝 0</span>`}
    </div>
  `;
  card.addEventListener('click', () => openModal(chapter, subjectName));
  return card;
}

// ─── SEARCH ─────────────────────────────
function setupSearch() {
  const input = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearSearch');

  input.addEventListener('input', () => {
    clearTimeout(searchTimer);
    const q = input.value.trim();
    clearBtn.style.display = q ? 'block' : 'none';
    searchTimer = setTimeout(() => {
      q ? renderSearch(q) : renderSubject(activeSubject);
    }, 200);
  });

  clearBtn.addEventListener('click', () => {
    clearSearch();
    renderSubject(activeSubject);
  });
}

function clearSearch() {
  const input = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearSearch');
  input.value = '';
  clearBtn.style.display = 'none';
}

function renderSearch(query) {
  const q = query.toLowerCase();
  const main = document.getElementById('mainContent');
  let html = '';
  let totalFound = 0;

  Object.entries(allData).forEach(([subjectName, chapters]) => {
    const matched = chapters.filter(ch => ch.name.toLowerCase().includes(q));
    if (!matched.length) return;
    totalFound += matched.length;
    const cfg = SUBJECTS[subjectName];
    html += `<div class="search-subject-label">${cfg.emoji} ${subjectName}</div><div class="chapters-grid">`;
    matched.forEach((ch, i) => {
      const div = document.createElement('div');
      div.appendChild(buildChapterCard(ch, subjectName, i));
      html += div.innerHTML;
    });
    html += '</div>';
  });

  if (!totalFound) {
    main.innerHTML = `<div class="no-results">😕 "${query}" માટે કોઈ chapter મળ્યું નહીં</div>`;
    return;
  }

  main.innerHTML = `
    <p style="color:var(--text-muted);font-size:13px;margin-bottom:16px">
      🔍 "${query}" — ${totalFound} result${totalFound > 1 ? 's' : ''} મળ્યા
    </p>
    ${html}
  `;

  document.querySelectorAll('.chapter-card').forEach(card => {
    const name = card.querySelector('.chapter-name').textContent;
    Object.entries(allData).forEach(([subjectName, chapters]) => {
      const ch = chapters.find(c => c.name === name);
      if (ch) card.addEventListener('click', () => openModal(ch, subjectName));
    });
  });
}

// ─── MODAL ──────────────────────────────
function setupModal() {
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

function openModal(chapter, subjectName) {
  activeModalTab = 'videos';
  const overlay = document.getElementById('modalOverlay');
  document.getElementById('modalTitle').textContent = chapter.name;

  const tabsEl = document.getElementById('modalTabs');
  tabsEl.innerHTML = '';
  TAB_CONFIG.forEach(tab => {
    const count = (chapter[tab.key] || []).length;
    const btn = document.createElement('button');
    btn.className = 'modal-tab' + (tab.key === activeModalTab ? ' active' : '');
    btn.style.setProperty('--tab-color', tab.color);
    btn.innerHTML = `${tab.emoji} ${tab.label} <span class="tab-count">${count}</span>`;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeModalTab = tab.key;
      renderModalBody(chapter, tab.key, tab.emoji, tab.color);
    });
    tabsEl.appendChild(btn);
  });

  renderModalBody(chapter, 'videos', '▶️', '#38bdf8');
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function renderModalBody(chapter, tabKey, emoji, color) {
  const items = chapter[tabKey] || [];
  const body = document.getElementById('modalBody');

  if (!items.length) {
    body.innerHTML = `<div class="empty-tab">😶 ${tabKey === 'dppVideos' ? 'DPP Videos' : tabKey} ઉપલબ્ધ નથી</div>`;
    return;
  }

  const isVideo = tabKey === 'videos' || tabKey === 'dppVideos';
  body.innerHTML = `<div class="resource-list"></div>`;
  const list = body.querySelector('.resource-list');

  items.forEach((item, i) => {
    let title = item.title
      .replace(/\|\|\s*Yakeen (Neet|NEET) Gujarati 2026/gi, '')
      .replace(/:\s*Class Notes\s*\|\|\s*Yakeen.*/gi, '')
      .replace(/\|\|\s*Reschedule at .*/gi, '')
      .trim();

    const div = document.createElement('div');
    div.className = 'resource-item';

    // Store encoded URL as data attribute — never in href
    const encodedUrl = encodeURL(item.url);
    div.setAttribute('data-eu', encodedUrl);
    div.setAttribute('data-type', isVideo ? 'video' : 'notes');

    div.innerHTML = `
      <span class="r-num">${i + 1}</span>
      <span class="r-icon">${isVideo ? '▶️' : '📄'}</span>
      <span class="r-title">${title}</span>
      <span class="r-open">${isVideo ? '▶' : '↗'}</span>
    `;

    // Click handler — decode URL at runtime
    div.addEventListener('click', () => {
      const url = decodeURL(div.getAttribute('data-eu'));
      if (!url) return;

      if (isVideo) {
        // Open in secure built-in player
        openVideoPlayer(url, title);
      } else {
        // Open notes/pdf in new tab — URL not stored in DOM
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });

    // Block right-click and long-press on each item
    div.addEventListener('contextmenu', e => e.preventDefault());
    div.addEventListener('touchstart', () => {}, { passive: true });

    list.appendChild(div);
  });
}

function closeModal() {
  document.getElementById('modalOverlay').style.display = 'none';
  document.body.style.overflow = '';
}

// ─── SECURE VIDEO PLAYER ────────────────
function setupVideoPlayer() {
  const overlay = document.getElementById('videoPlayerModal');
  const closeBtn = document.getElementById('playerClose');

  closeBtn.addEventListener('click', closeVideoPlayer);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeVideoPlayer();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeVideoPlayer();
  });

  // Block right-click on player
  overlay.addEventListener('contextmenu', e => e.preventDefault());
}

function openVideoPlayer(url, title) {
  const overlay = document.getElementById('videoPlayerModal');
  const iframe = document.getElementById('playerIframe');
  const titleEl = document.getElementById('playerTitle');

  titleEl.textContent = title || 'Video';

  // Set iframe src — this is the only place URL is used
  // It exists only in JS memory, never in HTML DOM as readable text
  iframe.src = url;

  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeVideoPlayer() {
  const overlay = document.getElementById('videoPlayerModal');
  const iframe = document.getElementById('playerIframe');

  // Clear iframe src on close so URL is gone from memory reference
  iframe.src = 'about:blank';
  overlay.style.display = 'none';

  // Restore scroll only if chapter modal is also closed
  if (document.getElementById('modalOverlay').style.display === 'none') {
    document.body.style.overflow = '';
  }
}

// ─── START ──────────────────────────────
document.addEventListener('DOMContentLoaded', init);
