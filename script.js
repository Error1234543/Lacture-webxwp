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
        // Pure URL ko encode karenge taaki "Failed to get signed URL" na aaye
        const encodedUrl = encodeURIComponent(item.url);
        
        // Extra parameters ko extract karke bahar duplicate jodenge taaki player ko parameters bhi mil sakein
        let extraParams = "";
        if (item.url.includes('&')) {
          const parts = item.url.split('&');
          extraParams = "&" + parts.slice(1).join('&'); 
        }

        // Final URL Structure: Base + Encoded Entire URL + Token + External Parameters
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
