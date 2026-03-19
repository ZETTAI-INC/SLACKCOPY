document.addEventListener('DOMContentLoaded', async () => {
  const messagesContainer = document.getElementById('messagesContainer');
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  const threadPanel = document.getElementById('threadPanel');
  const closeThread = document.getElementById('closeThread');

  let currentChannelId = null;
  let currentChannelName = '';
  let channels = [];
  let joinedChannelIds = [];
  let realtimeSubscription = null;
  let currentUser = null;

  // ローディング中はメッセージ領域を隠す
  if (messagesContainer) {
    messagesContainer.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#666;font-size:14px;">読み込み中...</div>';
  }

  // 現在のユーザーを取得（認証ガードは auth-guard.js で処理）
  try {
    currentUser = await getCurrentUser();
  } catch (e) { /* auth-guard.js がリダイレクト処理 */ }

  // ============ Supabaseからチャンネル取得 ============
  async function loadChannels() {
    channels = await fetchChannels();
    joinedChannelIds = await fetchMyChannelIds();
    console.log('Loaded channels:', channels, 'Joined:', joinedChannelIds);

    // 参加済みの最初のチャンネルをアクティブに
    const joinedChannel = channels.find(c => joinedChannelIds.includes(c.id));
    if (joinedChannel) {
      currentChannelId = joinedChannel.id;
      currentChannelName = joinedChannel.name;
      await loadMessages();
      setupRealtime();
    } else if (channels.length > 0) {
      currentChannelId = channels[0].id;
      currentChannelName = channels[0].name;
    }
    updateJoinLeaveBtn();
  }

  // ============ チャンネル作成 ============
  const addChannelBtn = document.getElementById('addChannelBtn');
  if (addChannelBtn) {
    addChannelBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const name = prompt('チャンネル名を入力してください');
      if (!name || !name.trim()) return;
      const ch = await createChannel(name.trim());
      if (!ch) { alert('チャンネルの作成に失敗しました'); return; }
      await joinChannel(ch.id);
      joinedChannelIds.push(ch.id);
      channels.push(ch);
      // サイドバーにチャンネルを追加
      addChannelToSidebar(ch);
      // 新チャンネルに切り替え
      currentChannelId = ch.id;
      currentChannelName = ch.name;
      const titleEl = document.querySelector('.channel-title');
      if (titleEl) titleEl.textContent = '# ' + ch.name;
      const mobileTitle = document.getElementById('mobileChannelTitle');
      if (mobileTitle) mobileTitle.textContent = '# ' + ch.name;
      if (messageInput) messageInput.placeholder = '#' + ch.name + ' へのメッセージ';
      await loadMessages();
      setupRealtime();
      updateJoinLeaveBtn();
    });
  }

  function addChannelToSidebar(ch) {
    const section = document.querySelector('.channel-item')?.closest('.sidebar-section');
    if (!section) return;
    const btn = document.createElement('button');
    btn.className = 'sidebar-item channel-item';
    btn.dataset.channel = ch.name;
    btn.innerHTML = '<span class="channel-hash">#</span><span>' + ch.name + '</span>';
    btn.addEventListener('click', async () => {
      document.querySelector('.channel-item.active')?.classList.remove('active');
      btn.classList.add('active');
      currentChannelId = ch.id;
      currentChannelName = ch.name;
      const titleEl = document.querySelector('.channel-title');
      if (titleEl) titleEl.textContent = '# ' + ch.name;
      const mobileTitle = document.getElementById('mobileChannelTitle');
      if (mobileTitle) mobileTitle.textContent = '# ' + ch.name;
      if (messageInput) messageInput.placeholder = '#' + ch.name + ' へのメッセージ';
      await loadMessages();
      setupRealtime();
      updateJoinLeaveBtn();
      if (typeof closeMobileSidebar === 'function') closeMobileSidebar();
    });
    // activeを移す
    document.querySelector('.channel-item.active')?.classList.remove('active');
    btn.classList.add('active');
    section.appendChild(btn);
  }

  // ============ チャンネル参加/退出 ============
  function updateJoinLeaveBtn() {
    const container = document.getElementById('joinLeaveBtnContainer');
    if (!container || !currentChannelId) return;
    const isJoined = joinedChannelIds.includes(currentChannelId);
    if (isJoined) {
      container.innerHTML = '<button class="header-btn channel-leave-btn" onclick="handleLeaveChannel()">チャンネルから退出</button>';
    } else {
      container.innerHTML = '<button class="header-btn channel-join-btn" onclick="handleJoinChannel()">チャンネルに参加</button>';
    }
  }

  window.handleJoinChannel = async function() {
    if (!currentChannelId) return;
    const success = await joinChannel(currentChannelId);
    if (success) {
      joinedChannelIds.push(currentChannelId);
      updateJoinLeaveBtn();
      await loadMessages();
    }
  }

  window.handleLeaveChannel = async function() {
    if (!currentChannelId) return;
    if (!confirm('このチャンネルから退出しますか？')) return;
    const success = await leaveChannel(currentChannelId);
    if (success) {
      joinedChannelIds = joinedChannelIds.filter(id => id !== currentChannelId);
      updateJoinLeaveBtn();
      if (messagesContainer) {
        messagesContainer.innerHTML = '<div style="text-align:center;padding:40px;color:#888;font-size:14px;">このチャンネルに参加するとメッセージを閲覧できます。</div>';
      }
    }
  }

  // ============ メッセージ取得・表示 ============
  async function loadMessages() {
    if (!currentChannelId) return;
    const messages = await fetchMessages(currentChannelId);
    renderMessages(messages);
  }

  function renderMessages(messages) {
    if (!messagesContainer) return;

    let html = '';
    const welcomeEl = document.getElementById('welcomeSection');

    if (messages.length === 0) {
      // メッセージが無い時だけウェルカム表示
      if (welcomeEl) welcomeEl.style.display = '';
      html += '<div class="day-divider"><span>今日</span></div>';
      html += '<div style="text-align:center;padding:40px;color:#666;font-size:14px;">メッセージはまだありません。最初のメッセージを送りましょう！</div>';
      messagesContainer.innerHTML = html;
      return;
    } else {
      if (welcomeEl) welcomeEl.style.display = 'none';
      let lastDate = '';
      messages.forEach(msg => {
        const date = new Date(msg.created_at).toLocaleDateString('ja-JP');
        if (date !== lastDate) {
          html += '<div class="day-divider"><span>' + date + '</span></div>';
          lastDate = date;
        }
        html += renderMessageHtml(msg);
      });
    }

    messagesContainer.innerHTML = html;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function renderMessageHtml(msg) {
    const time = new Date(msg.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    // ログイン中のユーザーなら「あなた」、それ以外はID先頭6文字
    let name = 'Anonymous';
    if (msg.user_id && currentUser && msg.user_id === currentUser.id) {
      name = currentUser.email ? currentUser.email.split('@')[0] : 'あなた';
    } else if (msg.user_id) {
      name = msg.user_id.substring(0, 6);
    }
    const initial = name.charAt(0).toUpperCase();
    const colors = ['#e8a0bf','#7eb8da','#a0c4a8','#c4a0e8','#e8c0a0','#a0b8e8'];
    const color = colors[name.charCodeAt(0) % colors.length];

    let threadHtml = '';
    if (msg.reply_count > 0) {
      threadHtml = '<div class="message-thread" onclick="openThread(\'' + msg.id + '\')"><span>💬 ' + msg.reply_count + '件の返信</span></div>';
    }

    // 自分のメッセージにだけ削除ボタンを表示
    let deleteHtml = '';
    if (currentUser && msg.user_id === currentUser.id) {
      deleteHtml = '<button class="msg-delete-btn" onclick="handleDeleteMessage(\'' + msg.id + '\')" title="削除">🗑</button>';
    }

    return '<div class="message" data-id="' + msg.id + '">' +
      '<div class="message-avatar" style="background:' + color + ';">' + initial + '</div>' +
      '<div class="message-body">' +
        '<div class="message-header">' +
          '<span class="message-author">' + escapeHtml(name) + '</span>' +
          '<span class="message-time">' + time + '</span>' +
        '</div>' +
        '<div class="message-text">' + escapeHtml(msg.content) + '</div>' +
        threadHtml +
      '</div>' +
      deleteHtml +
    '</div>';
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ============ メッセージ送信 ============
  async function handleSend() {
    const text = messageInput.value.trim();
    console.log('handleSend called:', { text, currentChannelId });
    if (!text) { console.log('empty text'); return; }
    if (!currentChannelId) { console.log('no channel selected'); return; }

    messageInput.value = '';
    messageInput.style.height = 'auto';
    updateSendBtn();

    const result = await sendMessage(currentChannelId, text);
    console.log('sendMessage result:', result);
    if (!result) {
      // リアルタイムで来なかった場合、手動でメッセージ再取得
      await loadMessages();
    }
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', handleSend);
  }

  if (messageInput) {
    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
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

  function updateSendBtn() {
    if (sendBtn) {
      sendBtn.disabled = !messageInput.value.trim();
    }
  }

  // ============ リアルタイム ============
  function setupRealtime() {
    if (realtimeSubscription) {
      unsubscribeFromMessages(realtimeSubscription);
    }
    if (!currentChannelId) return;

    realtimeSubscription = subscribeToMessages(currentChannelId, (newMsg) => {
      if (!newMsg.parent_id) {
        // メインメッセージ → リストに追加
        appendMessage(newMsg);
      }
    });
  }

  function appendMessage(msg) {
    if (!messagesContainer) return;
    // 「メッセージはまだありません」を削除
    const emptyMsg = messagesContainer.querySelector('div[style*="text-align:center"]');
    if (emptyMsg) emptyMsg.remove();

    const div = document.createElement('div');
    div.innerHTML = renderMessageHtml(msg);
    messagesContainer.appendChild(div.firstChild);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // ============ メッセージ削除 ============
  window.handleDeleteMessage = async function(messageId) {
    if (!confirm('このメッセージを削除しますか？')) return;
    const success = await deleteMessage(messageId);
    if (success) {
      const el = messagesContainer.querySelector('[data-id="' + messageId + '"]');
      if (el) el.remove();
    }
  }

  // ============ スレッド ============
  window.openThread = async function(messageId) {
    if (!threadPanel) return;
    threadPanel.style.display = 'flex';

    const replies = await fetchThreadReplies(messageId);
    const threadMessages = threadPanel.querySelector('.thread-messages');
    if (threadMessages) {
      let html = '<div style="padding:8px 16px;font-size:12px;color:#888;">' + replies.length + '件の返信</div>';
      replies.forEach(r => {
        html += renderMessageHtml(r);
      });
      threadMessages.innerHTML = html;
    }

    threadPanel.dataset.parentId = messageId;
  }

  if (closeThread) {
    closeThread.addEventListener('click', () => {
      if (threadPanel) threadPanel.style.display = 'none';
    });
  }

  // ============ チャンネル切り替え ============
  document.querySelectorAll('.channel-item').forEach((btn, index) => {
    btn.addEventListener('click', async () => {
      document.querySelector('.channel-item.active')?.classList.remove('active');
      btn.classList.add('active');

      // data-channelからチャンネル名取得
      const chName = btn.dataset.channel;

      // Supabaseのチャンネルと照合
      const matched = channels.find(c => c.name === chName || c.name === mapChannelName(chName));
      if (matched) {
        currentChannelId = matched.id;
        currentChannelName = matched.name;
      }

      // ヘッダー更新
      const titleEl = document.querySelector('.channel-title');
      if (titleEl) titleEl.textContent = '# ' + (currentChannelName || chName);

      if (messageInput) {
        messageInput.placeholder = '#' + (currentChannelName || chName) + ' へのメッセージ';
      }

      await loadMessages();
      setupRealtime();
      updateJoinLeaveBtn();
    });
  });

  function mapChannelName(name) {
    const map = {
      'all-kotaro': 'general',
      'social': 'random',
      'new-channel': 'general',
    };
    return map[name] || name;
  }

  // ============ セクション折りたたみ ============
  document.querySelectorAll('.sidebar-section-header').forEach(header => {
    header.addEventListener('click', () => {
      const section = header.parentElement;
      const items = section.querySelectorAll('.sidebar-item, .sidebar-placeholder');
      const isHidden = items.length > 0 && items[0].style.display === 'none';
      items.forEach(item => {
        item.style.display = isHidden ? '' : 'none';
      });
    });
  });

  // ============ ユーザー情報をUIに反映 ============
  function updateUserUI() {
    if (!currentUser) return;
    const displayName = currentUser.email ? currentUser.email.split('@')[0] : 'ユーザー';
    const initial = displayName.charAt(0).toUpperCase();

    const sidebarName = document.getElementById('sidebarUserName');
    if (sidebarName) sidebarName.textContent = displayName;

    const topAvatar = document.getElementById('topBarAvatar');
    if (topAvatar) topAvatar.textContent = initial;

    const iconUser = document.querySelector('.icon-sidebar-user');
    if (iconUser) iconUser.textContent = initial;
  }

  // ============ 初期化 ============
  // 未参加チャンネルがあれば自動参加
  async function autoJoinChannels() {
    const allChannels = await fetchChannels();
    const myIds = await fetchMyChannelIds();
    for (const ch of allChannels) {
      if (!myIds.includes(ch.id)) {
        await joinChannel(ch.id);
      }
    }
  }
  await autoJoinChannels();

  updateUserUI();
  updateSendBtn();
  await loadChannels();
});
