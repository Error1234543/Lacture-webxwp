// =========================================
//   YAKEEN NEET GUJARATI 2026 — script.js
// =========================================

const SUBJECTS = {
  Physics:   { emoji: '⚡', color: 'var(--accent-physics)',   bg: 'rgba(56,189,248,0.1)' },
  Chemistry: { emoji: '🧪', color: 'var(--accent-chemistry)', bg: 'rgba(244,114,182,0.1)' },
  Botany:    { emoji: '🌿', color: 'var(--accent-botany)',    bg: 'rgba(74,222,128,0.1)' },
  Zoology:   { emoji: '🐾', color: 'var(--accent-zoology)',   bg: 'rgba(251,146,60,0.1)' },
  Notices:   { emoji: '📢', color: 'var(--accent-notices)',   bg: 'rgba(167,139,250,0.1)' },
};

const TAB_CONFIG = [
  { key: 'videos',   label: 'Videos',    emoji: '▶️',  color: '#38bdf8' },
  { key: 'notes',    label: 'Notes',     emoji: '📄',  color: '#4ade80' },
  { key: 'dppNotes', label: 'DPP Notes', emoji: '📝',  color: '#fb923c' },
  { key: 'dppVideos',label: 'DPP Videos',emoji: '🎥',  color: '#a78bfa' },
];

// ─── PLAYER & TOKEN SETTINGS ─────────────────────
const PLAYER_BASE_URL = "https://anonymouspwplayerr-3cfbfedeb317.herokuapp.com/pw";
const PW_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3Nzk0MzQwMjQuODMsImRhdGEiOnsiX2lkIjoiNjhiNTlmOTMyYzQxMTYxNTI5YWQ0MDU5IiwidXNlcm5hbWUiOiI5MTA2MTM1NDA5IiwiZmlyc3ROYW1lIjoiRGl5dSIsImxhc3ROYW1lIjoiR2FtaXQiLCJvcmdhbml6YXRpb24iOnsiX2lkIjoiNWViMzkzZWU5NWZhYjc0NjhhNzlkMTg5Iiwid2Vic2l0ZSI6InBoeXNpY3N3YWxsYWguY29tIiwibmFtZSI6IlBoeXNpY3N3YWxsYWgifSwiZW1haWwiOiJkaXZ5YW5naWdhbWl0OTBAZ21haWwuY29tIiwicm9sZXMiOlsiNWIyN2JkOTY1ODQyZjk1MGE3NzhjNmVmIl0sImNvdW50cnlHcm91cCI6IklOIiwidHlwZSI6IlVTRVIifSwianRpIjoialpYSlE1UlVUSHFBWjc4T0pLeWVpQV82OGI1OWY5MzJjNDExNjE1MjlhZDQwNTkiLCJpYXQiOjE3Nzg4MjkyMjR9._iVf42LKYHzbjOmkl5q30tmY8kli0Lw4hIMDwPZoxNYE";

let allData = {};
let activeSubject = 'Physics';
let activeModalTab = 'videos';
let searchTimer = null;

// ─── INIT ───────────────────────────────
async function init() {
  try {
    const res = await fetch('data.json');
    allData = await res.json();
    buildStats();
    buildSubjectNav();
    renderSubject(activeSubject);
    setupSearch();
    setupModal();
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
      ${vCount ? `<span class="badge videos">▶️ ${vCount} Videos</span>` : `<span class="badge empty">▶️ 0</span>`}
      ${nCount ? `<span class="badge notes">📄 ${nCount} Notes</span>` : `<span class="badge empty">📄 0</span>`}
      ${dppCount ? `<span class="badge dpp">📝 ${dppCount} DPP</span>` : `<span class="badge empty">📝 0</span>`}
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

// ─── CLEAR SEARCH ───────────────────────
function clearSearch() {
  const input = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearSearch');
  input.value = '';
  clearBtn.style.display = 'none';
}

// ─── RENDER SEARCH ──────────────────────
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
    const a = document.createElement('a');
    a.className = 'resource-item';
    
    if (item.url) {
      if (isVideo) {
        // dynamic parameter splitter taaki heroku ko arguments direct mil sakein
        let mainUrl = item.url;
        let extraParams = "";

        if (item.url.includes('&')) {
          const parts = item.url.split('&');
          mainUrl = parts; 
          extraParams = "&" + parts.slice(1).join('&'); 
        }

        const encodedUrl = encodeURIComponent(mainUrl);
        a.href = `${PLAYER_BASE_URL}?url=${encodedUrl}&token=${PW_TOKEN}${extraParams}`;
      } else {
        a.href = item.url;
      }
    } else {
      a.href = '#';
    }

    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    if (!item.url) a.style.pointerEvents = 'none';

    let title = item.title
      .replace(/\|\|\s*Yakeen (Neet|NEET) Gujarati 2026/gi, '')
      .replace(/:\s*Class Notes\s*\|\|\s*Yakeen.*/gi, '')
      .replace(/\|\|\s*Reschedule at .*/gi, '')
      .trim();

    a.innerHTML = `
      <span class="r-num">${i + 1}</span>
      <span class="r-icon">${isVideo ? '▶️' : '📄'}</span>
      <span class="r-title">${title}</span>
      <span class="r-open">↗</span>
    `;
    list.appendChild(a);
  });
}

function closeModal() {
  document.getElementById('modalOverlay').style.display = 'none';
  document.body.style.overflow = '';
}

// ─── START ──────────────────────────────
document.addEventListener('DOMContentLoaded', init);
