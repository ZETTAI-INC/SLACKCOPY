// 認証ガード - auth.html, workspace-select.html, workspace-create.html 以外で読み込む
(async function() {
  var page = location.pathname.split('/').pop();
  var noGuardPages = ['auth.html', 'workspace-select.html', 'workspace-create.html'];
  if (noGuardPages.indexOf(page) !== -1) return;

  try {
    var user = await getCurrentUser();
    if (!user) {
      window.location.href = 'auth.html';
      return;
    }
  } catch (e) {
    window.location.href = 'auth.html';
    return;
  }

  // ワークスペースチェック
  try {
    var workspaces = await fetchMyWorkspaces();
    if (workspaces.length === 0) {
      window.location.href = 'workspace-create.html';
      return;
    }
    // localStorageにワークスペースIDがなければ設定
    var savedWsId = localStorage.getItem('currentWorkspaceId');
    var valid = workspaces.some(function(ws) { return ws.id === savedWsId; });
    if (!savedWsId || !valid) {
      if (workspaces.length === 1) {
        localStorage.setItem('currentWorkspaceId', workspaces[0].id);
      } else {
        window.location.href = 'workspace-select.html';
        return;
      }
    }
  } catch (e) {
    console.error('workspace check error:', e);
  }

  // ログイン状態を監視
  var sb = getSupabase();
  sb.auth.onAuthStateChange(function(event) {
    if (event === 'SIGNED_OUT') {
      localStorage.removeItem('currentWorkspaceId');
      window.location.href = 'auth.html';
    }
  });
})();
