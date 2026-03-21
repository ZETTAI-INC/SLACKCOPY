function getIconSidebar(activePage) {
  const items = [
    { href: 'index.html', id: 'home', label: 'ホーム', icon: '<svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 8l7-5 7 5v8a1 1 0 01-1 1h-3v-4H7v4H4a1 1 0 01-1-1V8z"/></svg>' },
    { href: 'dm.html', id: 'dm', label: 'DM', icon: '<svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 3h12a1 1 0 011 1v9a1 1 0 01-1 1H7l-4 3V4a1 1 0 011-1z"/></svg>' },
    { href: 'activity.html', id: 'activity', label: 'アクティ<br>ビティ', icon: '<svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 7A4 4 0 006 7v4l-2 2h12l-2-2V7z"/><path d="M8.5 15a1.5 1.5 0 003 0"/></svg>' },
    { href: 'files.html', id: 'files', label: 'ファイル', icon: '<svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="14" height="14" rx="2"/><path d="M3 8h14"/><path d="M8 3v5"/></svg>' },
    { href: '#', id: 'more', label: 'その他', icon: '<svg width="22" height="22" viewBox="0 0 20 20" fill="currentColor"><circle cx="4" cy="10" r="1.8"/><circle cx="10" cy="10" r="1.8"/><circle cx="16" cy="10" r="1.8"/></svg>' },
  ];
  let navHtml = items.map(it => {
    if (it.id === 'more') {
      return '<a href="#" class="icon-nav-item'+(it.id===activePage?' active':'')+'" id="moreNavBtn" onclick="event.preventDefault();toggleMorePopup();">'+it.icon+'<span>'+it.label+'</span></a>';
    }
    return '<a href="'+it.href+'" class="icon-nav-item'+(it.id===activePage?' active':'')+'">'+it.icon+'<span>'+it.label+'</span></a>';
  }).join('');
  return '<aside class="icon-sidebar"><div class="icon-sidebar-top"><div class="ws-icon-btn"><div class="ws-letter">K</div></div></div><nav class="icon-nav">'+navHtml+'</nav><div class="icon-sidebar-bottom"><a href="settings.html" class="icon-nav-item'+(activePage==='settings'?' active':'')+'"><svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="10" r="3"/><path d="M10 1v2m0 14v2M1 10h2m14 0h2m-3.3-5.3l-1.4 1.4M6.7 13.3l-1.4 1.4m0-9.4l1.4 1.4m6.6 6.6l1.4 1.4"/></svg><span>管理者</span></a><button class="icon-add-btn" title="追加"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 2v12M2 8h12"/></svg></button><div class="icon-sidebar-user" title="クリックでログアウト" style="cursor:pointer;" onclick="if(confirm(\'ログアウトしますか？\')){signOut().then(function(){location.href=\'auth.html\';})}">&#128036;</div></div></aside>';
}

function getChannelSidebar(activeChannel) {
  return '<aside class="channel-sidebar">'
  +'<div class="sidebar-header"><div class="sidebar-header-left"><h1 class="workspace-name">Workspace <span class="ws-dropdown">&#9662;</span></h1></div><div class="sidebar-header-right"><button class="sidebar-header-btn" title="設定" onclick="location.href=\'settings.html\'"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v1.5m0 11V15M1 8h1.5m11 0H15M3.05 3.05l1.06 1.06m7.78 7.78l1.06 1.06M3.05 12.95l1.06-1.06m7.78-7.78l1.06-1.06"/></svg></button><button class="sidebar-header-btn" title="新規メッセージ"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M11 1l4 4-9 9H2v-4L11 1z"/></svg></button></div></div>'
  +'<div class="sidebar-scroll">'
  +'<div class="promo-banner"><div class="promo-icon">&#128640;</div><div class="promo-text"><div class="promo-title">50% オフで利用</div><div class="promo-desc">このオファーの利用期限まであと 7 日です</div></div></div>'
  +'<div class="sidebar-section"><button class="sidebar-item" onclick="location.href=\'huddle.html\'"><span class="sidebar-item-icon"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="9" cy="9" r="7"/><path d="M6 9a3 3 0 006 0M9 6v0"/></svg></span><span>ハドルミーティング</span></button><button class="sidebar-item" onclick="location.href=\'members.html\'"><span class="sidebar-item-icon"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="2" y="2" width="14" height="14" rx="2"/><path d="M5 6h8M5 9h8M5 12h5"/></svg></span><span>ディレクトリ</span></button></div>'
  +'<div class="sidebar-section"><div class="sidebar-section-header"><span class="sidebar-section-icon">&#9734;</span><span>スター付き</span></div><div class="sidebar-placeholder">重要なアイテムをここにドラッグ＆ドロップします</div></div>'
  +'<div class="sidebar-section"><div class="sidebar-section-header"><span class="sidebar-section-icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M2 6h12M2 10h12M6 2v12M10 2v12"/></svg></span><span>チャンネル</span></div>'
  +'<button class="sidebar-item channel-item" onclick="location.href=\'index.html\'"><span class="channel-hash">#</span><span>all-Workspace</span></button>'
  +'<button class="sidebar-item channel-item" onclick="location.href=\'index.html\'"><span class="channel-hash">#</span><span>ソーシャル</span></button>'
  +'<button class="sidebar-item channel-item'+(activeChannel==='new-channel'?' active':'')+'" onclick="location.href=\'index.html\'"><span class="channel-hash">#</span><span>新しいチャンネル</span></button></div>'
  +'<div class="sidebar-section"><div class="sidebar-section-header"><span class="sidebar-section-icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M3 3h10a1 1 0 011 1v6a1 1 0 01-1 1H6l-3 3V4a1 1 0 011-1z"/></svg></span><span>ダイレクトメッセージ</span></div><button class="sidebar-item dm-item" onclick="location.href=\'dm.html\'"><span class="dm-avatar-small"><span class="dm-avatar-img">&#128036;</span><span class="dm-status-dot online"></span></span><span>ユーザー</span><span class="dm-self-label">(自分)</span></button></div>'
  +'<div class="sidebar-section"><div class="sidebar-section-header"><span class="sidebar-section-icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" opacity="0.7"><circle cx="3.5" cy="3.5" r="1.3"/><circle cx="8" cy="3.5" r="1.3"/><circle cx="12.5" cy="3.5" r="1.3"/><circle cx="3.5" cy="8" r="1.3"/><circle cx="8" cy="8" r="1.3"/><circle cx="12.5" cy="8" r="1.3"/><circle cx="3.5" cy="12.5" r="1.3"/><circle cx="8" cy="12.5" r="1.3"/><circle cx="12.5" cy="12.5" r="1.3"/></svg></span><span>App</span></div>'
  +'<button class="sidebar-item app-item"><span class="app-icon-small"><svg width="18" height="18" viewBox="0 0 18 18"><path d="M6.3 0a2.1 2.1 0 000 4.2h2.1V2.1A2.1 2.1 0 006.3 0z" fill="#36C5F0"/><path d="M0 8.4a2.1 2.1 0 004.2 0V6.3H2.1A2.1 2.1 0 000 8.4z" fill="#2EB67D"/><path d="M8.4 18a2.1 2.1 0 000-4.2H6.3v2.1A2.1 2.1 0 008.4 18z" fill="#ECB22E"/><path d="M18 6.3a2.1 2.1 0 00-4.2 0v2.1h2.1A2.1 2.1 0 0018 6.3z" fill="#E01E5A"/><path d="M4.2 6.3a2.1 2.1 0 000 4.2h4.2a2.1 2.1 0 000-4.2H4.2z" fill="#36C5F0"/><path d="M6.3 4.2a2.1 2.1 0 004.2 0V0a2.1 2.1 0 00-4.2 0v4.2z" fill="#2EB67D"/><path d="M13.8 6.3a2.1 2.1 0 00-4.2 0v4.2a2.1 2.1 0 004.2 0V6.3z" fill="#ECB22E"/><path d="M6.3 13.8a2.1 2.1 0 004.2 0V9.6a2.1 2.1 0 00-4.2 0v4.2z" fill="#E01E5A"/></svg></span><span class="app-name-bold">Slackbot</span><span class="badge">1</span></button></div>'
  +'<div class="sidebar-footer"><p class="sidebar-footer-text">一緒に使うと Slack はもっと楽しくなります。</p><button class="invite-btn"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="6" cy="5" r="3"/><path d="M1 14c0-3 2.5-5 5-5s5 2 5 5"/><path d="M12 5v6M9 8h6"/></svg> チームのメンバーを招待する</button></div>'
  +'</div></aside>';
}

// ============ Mobile UI ============
function getMobileHeader(title) {
  return '<div class="mobile-header">'
    +'<button class="mobile-header-back" onclick="openMobileSidebar()">'
    +'<svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3h14M3 8h14M3 13h14"/></svg>'
    +'</button>'
    +'<span class="mobile-header-title">'+title+'</span>'
    +'<div class="mobile-header-actions">'
    +'<button onclick="location.href=\'search.html\'"><svg width="20" height="20" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7.5" cy="7.5" r="5"/><path d="M11.5 11.5l4 4"/></svg></button>'
    +'</div></div>';
}

function getMobileTabBar(activePage) {
  var tabs = [
    { href: 'index.html', id: 'home', label: 'ホーム', icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 8l7-5 7 5v8a1 1 0 01-1 1h-3v-4H7v4H4a1 1 0 01-1-1V8z"/></svg>' },
    { href: 'dm.html', id: 'dm', label: 'DM', icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 3h12a1 1 0 011 1v9a1 1 0 01-1 1H7l-4 3V4a1 1 0 011-1z"/></svg>' },
    { href: 'activity.html', id: 'activity', label: 'アクティビティ', icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 7A4 4 0 006 7v4l-2 2h12l-2-2V7z"/><path d="M8.5 15a1.5 1.5 0 003 0"/></svg>' },
    { href: 'search.html', id: 'search', label: '検索', icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8.5" cy="8.5" r="5.5"/><path d="M13 13l4.5 4.5"/></svg>' },
    { href: 'profile.html', id: 'you', label: 'あなた', icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="7" r="4"/><path d="M3 18c0-3.5 3-6 7-6s7 2.5 7 6"/></svg>' },
  ];
  var html = '<div class="mobile-tab-bar"><nav>';
  tabs.forEach(function(t) {
    var active = t.id === activePage ? ' active' : '';
    if (t.id === 'you') {
      html += '<a href="'+t.href+'" class="mobile-tab-item'+active+'">'+t.icon+'<span>'+t.label+'</span></a>';
    } else {
      html += '<a href="'+t.href+'" class="mobile-tab-item'+active+'">'+t.icon+'<span>'+t.label+'</span></a>';
    }
  });
  html += '</nav></div>';
  return html;
}

function getMobileSidebarOverlay() {
  return '<div class="mobile-sidebar-overlay" id="mobileSidebarOverlay" onclick="closeMobileSidebar()"></div>';
}

function openMobileSidebar() {
  var sidebar = document.querySelector('.channel-sidebar') || document.querySelector('.dm-sidebar');
  if (sidebar) sidebar.classList.add('mobile-open');
  var overlay = document.getElementById('mobileSidebarOverlay');
  if (overlay) overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeMobileSidebar() {
  var sidebar = document.querySelector('.channel-sidebar') || document.querySelector('.dm-sidebar');
  if (sidebar) sidebar.classList.remove('mobile-open');
  var overlay = document.getElementById('mobileSidebarOverlay');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function insertSidebar(activePage, activeChannel, mobileTitle) {
  var app = document.querySelector('.app');
  if (!app) return;
  var target = app.querySelector('.main-wrapper') || app.querySelector('.main-content') || app.querySelector('main');
  if (!target) return;
  // デスクトップサイドバー
  target.insertAdjacentHTML('beforebegin', getIconSidebar(activePage) + getChannelSidebar(activeChannel || ''));
  // モバイルオーバーレイ
  target.insertAdjacentHTML('beforebegin', getMobileSidebarOverlay());
  // モバイルヘッダーをmain-wrapper/main-contentの先頭に挿入
  var title = mobileTitle || document.querySelector('.channel-title')?.textContent || document.title;
  target.insertAdjacentHTML('afterbegin', getMobileHeader(title));
  // モバイルタブバーをbodyの末尾に挿入
  document.body.insertAdjacentHTML('beforeend', getMobileTabBar(activePage));
  injectMorePopup();
}

// "その他" popup
function injectMorePopup() {
  if (document.getElementById('morePopup')) return;

  var style = document.createElement('style');
  style.textContent = '\
    #morePopup { display:none; position:fixed; z-index:9999; \
      background:#232529; border:1px solid #444; border-radius:10px; \
      box-shadow:0 8px 30px rgba(0,0,0,0.5); width:280px; padding:8px 0; \
      color:#ddd; font-family:var(--font); font-size:14px; }\
    #morePopup.show { display:block; }\
    .more-popup-title { padding:8px 16px; font-size:13px; font-weight:700; color:#999; }\
    .more-popup-item { display:flex; align-items:center; gap:10px; \
      padding:8px 16px; cursor:pointer; width:100%; border:none; background:none; \
      color:#ddd; font-size:14px; font-family:var(--font); text-align:left; }\
    .more-popup-item:hover { background:#2a2d32; }\
    .more-popup-item-icon { width:32px; height:32px; border-radius:8px; background:#333; \
      display:flex; align-items:center; justify-content:center; flex-shrink:0; }\
    .more-popup-item-text { flex:1; }\
    .more-popup-item-text strong { display:block; font-size:14px; color:#ddd; font-weight:600; }\
    .more-popup-item-text span { font-size:12px; color:#888; }\
    .more-popup-sep { height:1px; background:#383838; margin:6px 0; }\
    .more-popup-link { display:block; padding:8px 16px; color:#1D9BD1; \
      font-size:13px; text-decoration:none; cursor:pointer; }\
    .more-popup-link:hover { background:#2a2d32; }\
  ';
  document.head.appendChild(style);

  var popup = document.createElement('div');
  popup.id = 'morePopup';
  popup.innerHTML = '\
    <div class="more-popup-title">その他</div>\
    <button class="more-popup-item">\
      <div class="more-popup-item-icon">\
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#aaa" stroke-width="1.3">\
          <path d="M6 2L4 6l-3 1 2 2-.5 3L6 10.5 9.5 12 9 9l2-2-3-1L6 2z"/>\
          <path d="M11 1l-1 2.5 2 .5 1-1.5z"/>\
        </svg>\
      </div>\
      <div class="more-popup-item-text">\
        <strong>ツール</strong>\
        <span>ワークフローやアプリを作成および検索する</span>\
      </div>\
    </button>\
    <div class="more-popup-sep"></div>\
    <a class="more-popup-link" href="#">ナビゲーションバーをカスタマイズする</a>\
  ';
  document.body.appendChild(popup);

  // Close on outside click
  document.addEventListener('click', function(e) {
    var popup = document.getElementById('morePopup');
    var btn = document.getElementById('moreNavBtn');
    if (popup && popup.classList.contains('show') && !popup.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
      popup.classList.remove('show');
    }
  });
}

function toggleMorePopup() {
  var popup = document.getElementById('morePopup');
  var btn = document.getElementById('moreNavBtn');
  if (!popup || !btn) return;

  if (popup.classList.contains('show')) {
    popup.classList.remove('show');
    return;
  }

  var rect = btn.getBoundingClientRect();
  popup.style.left = (rect.right + 8) + 'px';
  popup.style.top = (rect.top - 20) + 'px';
  popup.classList.add('show');
}
