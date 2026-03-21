document.addEventListener('DOMContentLoaded', async () => {
  const messagesContainer = document.getElementById('dmMessagesContainer');
  const messageInput = document.getElementById('dmMessageInput');
  const sendBtn = document.getElementById('dmSendBtn');

  let currentUser = null;
  let currentDMChannelId = null;
  let currentDMPartner = null;
  let workspaceMembers = [];
  let selfMember = null;
  let realtimeSubscription = null;
  const currentWorkspaceId = localStorage.getItem('currentWorkspaceId');

  try {
    currentUser = await getCurrentUser();
  } catch (e) {}

  const avatarColors = ['#e8a0bf','#7eb8da','#a0c4a8','#c4a0e8','#e8c0a0','#a0b8e8'];

  function getDisplayName(userId) {
    if (currentUser && userId === currentUser.id) {
      return currentUser.email ? currentUser.email.split('@')[0] : 'ユーザー';
    }
    // Look up email from workspace members
    var allMembers = workspaceMembers.concat(selfMember ? [selfMember] : []);
    var member = allMembers.find(m => m.user_id === userId);
    if (member && member.email) {
      return member.email.split('@')[0];
    }
    return userId.substring(0, 8);
  }

  function getAvatarColor(name) {
    return avatarColors[name.charCodeAt(0) % avatarColors.length];
  }

  function getInitial(name) {
    return name.charAt(0).toUpperCase();
  }

  // ============ DM Sidebar ============
  async function loadMembers() {
    const members = await fetchWorkspaceMembers(currentWorkspaceId);
    selfMember = members.find(m => m.user_id === currentUser?.id) || null;
    workspaceMembers = members.filter(m => m.user_id !== currentUser?.id);
    renderDMSidebar();
  }

  function renderDMSidebar() {
    const dmList = document.getElementById('dmList');
    if (!dmList) return;

    let html = '';

    // Other workspace members
    workspaceMembers.forEach(member => {
      const name = getDisplayName(member.user_id);
      const initial = getInitial(name);
      const color = getAvatarColor(name);
      const isActive = currentDMPartner && currentDMPartner.userId === member.user_id;

      html += '<button class="dm-list-item' + (isActive ? ' active' : '') + '" data-user-id="' + member.user_id + '">' +
        '<div class="dm-list-item-avatar" style="background:' + color + ';">' + initial +
          '<span class="status-ring"></span>' +
        '</div>' +
        '<div class="dm-list-item-info">' +
          '<div class="dm-list-item-name">' + escapeHtml(name) + '</div>' +
        '</div>' +
      '</button>';
    });

    // Self (at bottom)
    if (currentUser) {
      const selfName = getDisplayName(currentUser.id);
      const selfInitial = getInitial(selfName);
      const selfColor = getAvatarColor(selfName);
      const selfActive = currentDMPartner && currentDMPartner.userId === currentUser.id;

      html += '<button class="dm-list-item' + (selfActive ? ' active' : '') + '" data-user-id="' + currentUser.id + '">' +
        '<div class="dm-list-item-avatar" style="background:' + selfColor + ';">' + selfInitial +
          '<span class="status-ring"></span>' +
        '</div>' +
        '<div class="dm-list-item-info">' +
          '<div class="dm-list-item-name">' + escapeHtml(selfName) + ' (自分)</div>' +
        '</div>' +
      '</button>';
    }

    dmList.innerHTML = html;

    // Attach click handlers
    dmList.querySelectorAll('.dm-list-item').forEach(item => {
      item.addEventListener('click', async () => {
        await selectDMPartner(item.dataset.userId);
        if (typeof closeMobileSidebar === 'function') closeMobileSidebar();
      });
    });
  }

  // ============ Select DM Partner ============
  async function selectDMPartner(userId) {
    const name = getDisplayName(userId);
    currentDMPartner = { userId: userId, displayName: name };

    const channel = await getOrCreateDMChannel(userId, currentWorkspaceId);
    if (!channel) return;

    currentDMChannelId = channel.id;

    updateHeader();
    renderDMSidebar();
    await loadMessages();
    setupRealtime();
  }

  // ============ Update Header ============
  function updateHeader() {
    if (!currentDMPartner) return;
    const name = currentDMPartner.displayName;
    const initial = getInitial(name);
    const color = getAvatarColor(name);
    const isSelf = currentUser && currentDMPartner.userId === currentUser.id;

    const headerName = document.getElementById('dmHeaderName');
    if (headerName) headerName.textContent = name;

    const headerAvatar = document.getElementById('dmHeaderAvatar');
    if (headerAvatar) {
      headerAvatar.style.background = color;
      // Update first text node (the initial letter)
      var textNode = headerAvatar.firstChild;
      if (textNode && textNode.nodeType === 3) textNode.textContent = initial;
    }

    if (messageInput) {
      messageInput.placeholder = name + ' へのメッセージ';
    }

    // Welcome section
    const welcomeAvatar = document.getElementById('dmWelcomeAvatar');
    if (welcomeAvatar) {
      welcomeAvatar.textContent = initial;
      welcomeAvatar.style.background = 'linear-gradient(135deg, ' + color + ' 0%, ' + color + '88 100%)';
    }

    const welcomeName = document.getElementById('dmWelcomeName');
    if (welcomeName) {
      welcomeName.innerHTML = escapeHtml(name) + (isSelf ? ' (自分)' : '') + ' <span class="online-dot"></span>';
    }

    const welcomeDesc = document.getElementById('dmWelcomeDesc');
    if (welcomeDesc) {
      if (isSelf) {
        welcomeDesc.innerHTML = '<strong style="color:#e0e0e0;">ここはあなただけのスペースです。</strong> メッセージの下書きや、To-doリストの作成、リンクやファイルの保管などに使うと便利です。';
      } else {
        welcomeDesc.innerHTML = 'この会話は <span style="color:#1D9BD1;cursor:pointer;">@' + escapeHtml(name) + '</span> さんとの 2 人だけに公開されています。もっとよく知り合うため、プロフィールをチェックしてみましょう。';
      }
    }

    const welcomeBtn = document.getElementById('dmWelcomeBtn');
    if (welcomeBtn) {
      welcomeBtn.textContent = isSelf ? 'プロフィールを編集する' : 'プロフィールを表示する';
    }
  }

  // ============ Messages ============
  async function loadMessages() {
    if (!currentDMChannelId) return;
    const messages = await fetchMessages(currentDMChannelId);
    renderMessages(messages);
  }

  function renderMessages(messages) {
    if (!messagesContainer) return;

    const welcome = document.getElementById('dmWelcomeSection');

    // Remove existing message elements
    messagesContainer.querySelectorAll('.message, .day-divider').forEach(el => el.remove());

    if (messages.length === 0) {
      if (welcome) welcome.style.display = '';
      return;
    }

    if (welcome) welcome.style.display = 'none';

    let html = '';
    let lastDate = '';
    messages.forEach(msg => {
      const date = new Date(msg.created_at).toLocaleDateString('ja-JP');
      if (date !== lastDate) {
        html += '<div class="day-divider"><span>' + date + '</span></div>';
        lastDate = date;
      }
      html += renderMessageHtml(msg);
    });

    messagesContainer.insertAdjacentHTML('beforeend', html);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function renderMessageHtml(msg) {
    const time = new Date(msg.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    let name = 'Anonymous';
    if (msg.user_id && currentUser && msg.user_id === currentUser.id) {
      name = currentUser.email ? currentUser.email.split('@')[0] : 'あなた';
    } else if (msg.user_id) {
      name = getDisplayName(msg.user_id);
    }
    const initial = getInitial(name);
    const color = getAvatarColor(name);

    let deleteHtml = '';
    if (currentUser && msg.user_id === currentUser.id) {
      deleteHtml = '<button class="msg-delete-btn" onclick="handleDeleteDMMessage(\'' + msg.id + '\')" title="削除">&#128465;</button>';
    }

    const formattedContent = typeof formatMessageText === 'function' ? formatMessageText(msg.content) : escapeHtml(msg.content);

    return '<div class="message" data-id="' + msg.id + '">' +
      '<div class="message-avatar" style="background:' + color + ';">' + initial + '</div>' +
      '<div class="message-body">' +
        '<div class="message-header">' +
          '<span class="message-author">' + escapeHtml(name) + '</span>' +
          '<span class="message-time">' + time + '</span>' +
        '</div>' +
        '<div class="message-text">' + formattedContent + '</div>' +
      '</div>' +
      deleteHtml +
    '</div>';
  }

  // ============ Send Message ============
  async function handleSend() {
    if (!messageInput || !currentDMChannelId) return;
    const text = messageInput.value.trim();
    if (!text) return;

    messageInput.value = '';
    messageInput.style.height = 'auto';
    updateSendBtn();

    // Optimistic UI
    const optimisticMsg = {
      id: 'temp-' + Date.now(),
      channel_id: currentDMChannelId,
      user_id: currentUser ? currentUser.id : null,
      content: text,
      created_at: new Date().toISOString(),
    };
    appendMessage(optimisticMsg);

    const result = await sendMessage(currentDMChannelId, text);
    if (!result) {
      await loadMessages();
    }
  }

  function appendMessage(msg) {
    if (!messagesContainer) return;
    const welcome = document.getElementById('dmWelcomeSection');
    if (welcome) welcome.style.display = 'none';

    const div = document.createElement('div');
    div.innerHTML = renderMessageHtml(msg);
    messagesContainer.appendChild(div.firstChild);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // ============ Realtime ============
  function setupRealtime() {
    if (realtimeSubscription) {
      unsubscribeFromMessages(realtimeSubscription);
    }
    if (!currentDMChannelId) return;

    realtimeSubscription = subscribeToMessages(currentDMChannelId, (newMsg) => {
      if (!newMsg.parent_id) {
        if (currentUser && newMsg.user_id === currentUser.id) {
          var temps = messagesContainer.querySelectorAll('[data-id^="temp-"]');
          if (temps.length > 0) { temps[0].remove(); }
        }
        appendMessage(newMsg);
      }
    });
  }

  // ============ Send Button ============
  function updateSendBtn() {
    if (sendBtn && messageInput) {
      sendBtn.disabled = !messageInput.value.trim();
    }
  }

  if (sendBtn) sendBtn.addEventListener('click', handleSend);

  if (messageInput) {
    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSend();
      }
    });
    messageInput.addEventListener('input', () => {
      messageInput.style.height = 'auto';
      messageInput.style.height = Math.min(messageInput.scrollHeight, 150) + 'px';
      updateSendBtn();
    });
  }

  // ============ Delete ============
  window.handleDeleteDMMessage = async function(messageId) {
    if (!confirm('このメッセージを削除しますか？')) return;
    const success = await deleteMessage(messageId);
    if (success) {
      const el = messagesContainer.querySelector('[data-id="' + messageId + '"]');
      if (el) el.remove();
    }
  }

  // ============ Search Filter ============
  const dmSearchInput = document.getElementById('dmSearchInput');
  if (dmSearchInput) {
    dmSearchInput.addEventListener('input', () => {
      const query = dmSearchInput.value.toLowerCase();
      document.querySelectorAll('.dm-list-item').forEach(item => {
        const name = item.querySelector('.dm-list-item-name')?.textContent?.toLowerCase() || '';
        item.style.display = name.includes(query) ? '' : 'none';
      });
    });
  }

  // ============ User UI ============
  function updateUserUI() {
    if (!currentUser) return;
    const displayName = currentUser.email ? currentUser.email.split('@')[0] : 'ユーザー';
    const initial = displayName.charAt(0).toUpperCase();

    const iconUser = document.querySelector('.icon-sidebar-user');
    if (iconUser) iconUser.textContent = initial;

    const topAvatar = document.getElementById('topBarAvatar');
    if (topAvatar) topAvatar.textContent = initial;

    if (currentWorkspaceId) {
      getWorkspace(currentWorkspaceId).then(function(ws) {
        if (!ws) return;
        const searchPh = document.getElementById('searchPlaceholder');
        if (searchPh) searchPh.textContent = ws.name + ' 内を検索する';
        const wsLetter = document.querySelector('.ws-letter');
        if (wsLetter) wsLetter.textContent = ws.name.charAt(0).toUpperCase();
      });
    }
  }

  // ============ Initialize ============
  updateUserUI();
  updateSendBtn();
  await loadMembers();

  // Select first member or self
  if (workspaceMembers.length > 0) {
    await selectDMPartner(workspaceMembers[0].user_id);
  } else if (currentUser) {
    await selectDMPartner(currentUser.id);
  }

  document.body.style.visibility = 'visible';
});
