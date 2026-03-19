// 認証ガード - auth.html以外の全ページで読み込む
// Supabase CDN と supabase-config.js の後に読み込むこと
(async function() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      window.location.href = 'auth.html';
      return;
    }
  } catch (e) {
    window.location.href = 'auth.html';
    return;
  }

  // ログイン状態を監視 — ログアウトしたら auth.html にリダイレクト
  const sb = getSupabase();
  sb.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      window.location.href = 'auth.html';
    }
  });
})();
