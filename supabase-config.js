// Supabase接続設定
const SUPABASE_URL = 'https://gmenhywfrxjtrktkfexl.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtZW5oeXdmcnhqdHJrdGtmZXhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MDgwNjYsImV4cCI6MjA4OTQ4NDA2Nn0.n5tQCbdCFIRqFGBg8zpdXBmC0JtKGTzLPqfpwcl1b8A'

// Supabaseクライアント初期化（CDN版を使用）
let _supabaseClient = null

function getSupabase() {
  if (!_supabaseClient) {
    _supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }
  return _supabaseClient
}

// ============ ワークスペース ============
async function fetchMyWorkspaces() {
  const sb = getSupabase()
  const user = await getCurrentUser()
  if (!user) return []
  // まずメンバーシップを取得
  const { data: members, error: mErr } = await sb
    .from('workspace_members')
    .select('workspace_id, role')
    .eq('user_id', user.id)
  if (mErr) { console.error('fetchMyWorkspaces members error:', mErr); return [] }
  if (!members || members.length === 0) return []
  // ワークスペース情報を取得
  const wsIds = members.map(m => m.workspace_id)
  const { data: workspaces, error: wErr } = await sb
    .from('workspaces')
    .select('*')
    .in('id', wsIds)
  if (wErr) { console.error('fetchMyWorkspaces workspaces error:', wErr); return [] }
  return (workspaces || []).map(ws => {
    const member = members.find(m => m.workspace_id === ws.id)
    return { ...ws, role: member ? member.role : 'member' }
  })
}

async function createWorkspace(name) {
  const sb = getSupabase()
  const user = await getCurrentUser()
  if (!user) return null
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36)
  const wsId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); })
  // まずワークスペース作成（select()なし）
  const { error: wsErr } = await sb.from('workspaces').insert({
    id: wsId, name: name, slug: slug, owner_id: user.id
  })
  if (wsErr) { console.error('createWorkspace insert error:', wsErr); return null }
  // オーナーとして参加（これでSELECTポリシーが通るようになる）
  const { error: memErr } = await sb.from('workspace_members').insert({ workspace_id: wsId, user_id: user.id, role: 'owner' })
  if (memErr) { console.error('createWorkspace member error:', memErr); return null }
  // デフォルトチャンネル作成
  const { error: chErr } = await sb.from('channels').insert([
    { name: 'general', description: '全体の会話用', workspace_id: wsId },
    { name: 'random', description: '雑談チャンネル', workspace_id: wsId },
  ])
  if (chErr) console.error('createWorkspace channels error:', chErr)
  // メンバー追加後にワークスペースを取得
  const { data } = await sb.from('workspaces').select('*').eq('id', wsId).single()
  return data || { id: wsId, name: name, slug: slug }
}

async function getWorkspace(workspaceId) {
  const sb = getSupabase()
  const { data, error } = await sb.from('workspaces').select('*').eq('id', workspaceId).single()
  if (error) { console.error('getWorkspace error:', error); return null }
  return data
}

async function inviteToWorkspace(workspaceId, email, inviterName) {
  const sb = getSupabase()
  // 招待前にワークスペース名とチャンネル一覧を取得（signUp後にセッションが変わる可能性があるため）
  const { data: wsData } = await sb.from('workspaces').select('name').eq('id', workspaceId).single()
  const wsName = wsData ? wsData.name : 'ワークスペース'
  const { data: channels } = await sb.from('channels').select('id').eq('workspace_id', workspaceId)

  const tempPassword = 'Welcome!' + Math.random().toString(36).slice(2, 10)
  const { data, error } = await sb.auth.signUp({ email: email, password: tempPassword })
  if (error) return { error: error.message }
  if (data.user) {
    const userId = data.user.id
    // workspace_membersに追加
    await sb.from('workspace_members').insert({ workspace_id: workspaceId, user_id: userId, role: 'member' })
    // 全チャンネルに自動参加
    if (channels) {
      for (const ch of channels) {
        await sb.from('channel_members').upsert({ channel_id: ch.id, user_id: userId }, { onConflict: 'channel_id,user_id' })
      }
    }
    // SECURITY DEFINER関数で通知作成（セッション変更の影響を受けない）
    const msg = (inviterName || 'メンバー') + ' さんがあなたを「' + wsName + '」に招待しました。ようこそ！'
    await sb.rpc('create_notification', { target_user_id: userId, notif_type: 'invite', notif_message: msg })
  }
  return { user: data.user, tempPassword: tempPassword }
}

// ============ チャンネル ============
async function fetchChannels(workspaceId) {
  const sb = getSupabase()
  let query = sb.from('channels').select('*').order('created_at', { ascending: true })
  if (workspaceId) query = query.eq('workspace_id', workspaceId)
  const { data, error } = await query
  if (error) { console.error('fetchChannels error:', error); return [] }
  return data || []
}

async function createChannel(name, workspaceId) {
  const sb = getSupabase()
  const row = { name: name }
  if (workspaceId) row.workspace_id = workspaceId
  const { data, error } = await sb.from('channels').insert(row).select()
  if (error) { console.error('createChannel error:', error); return null }
  return data ? data[0] : null
}

// ============ チャンネルメンバー ============
async function joinChannel(channelId) {
  const sb = getSupabase()
  const user = await getCurrentUser()
  if (!user) return false
  const { error } = await sb.from('channel_members').upsert({
    channel_id: channelId,
    user_id: user.id,
    joined_at: new Date().toISOString(),
  }, { onConflict: 'channel_id,user_id' })
  if (error) { console.error('joinChannel error:', error); return false }
  return true
}

async function leaveChannel(channelId) {
  const sb = getSupabase()
  const user = await getCurrentUser()
  if (!user) return false
  const { error } = await sb.from('channel_members').delete()
    .eq('channel_id', channelId)
    .eq('user_id', user.id)
  if (error) { console.error('leaveChannel error:', error); return false }
  return true
}

async function fetchMyChannelIds() {
  const sb = getSupabase()
  const user = await getCurrentUser()
  if (!user) return []
  const { data, error } = await sb.from('channel_members')
    .select('channel_id')
    .eq('user_id', user.id)
  if (error) { console.error('fetchMyChannelIds error:', error); return [] }
  return (data || []).map(row => row.channel_id)
}

// ============ メッセージ ============
async function fetchMessages(channelId) {
  const sb = getSupabase()
  const { data, error } = await sb
    .from('messages')
    .select('*')
    .eq('channel_id', channelId)
    .is('parent_id', null)
    .order('created_at', { ascending: true })
  if (error) { console.error('fetchMessages error:', error); return [] }
  return data || []
}

async function sendMessage(channelId, content) {
  const sb = getSupabase()
  let userId = null
  try {
    const { data } = await sb.auth.getUser()
    userId = data?.user?.id || null
  } catch (e) { /* not logged in */ }
  const { data, error } = await sb.from('messages').insert({
    channel_id: channelId,
    user_id: userId,
    content: content,
  }).select()
  if (error) { console.error('sendMessage error:', error); return null }
  return data ? data[0] : null
}

// ============ メッセージ削除 ============
async function deleteMessage(messageId) {
  const sb = getSupabase()
  const { error } = await sb.from('messages').delete().eq('id', messageId)
  if (error) { console.error('deleteMessage error:', error); return false }
  return true
}

// ============ スレッド ============
async function fetchThreadReplies(parentId) {
  const sb = getSupabase()
  const { data, error } = await sb
    .from('messages')
    .select('*')
    .eq('parent_id', parentId)
    .order('created_at', { ascending: true })
  if (error) { console.error('fetchThreadReplies error:', error); return [] }
  return data || []
}

async function sendThreadReply(channelId, parentId, content) {
  const sb = getSupabase()
  let userId = null
  try {
    const { data } = await sb.auth.getUser()
    userId = data?.user?.id || null
  } catch (e) { /* not logged in */ }
  const { data, error } = await sb.from('messages').insert({
    channel_id: channelId,
    user_id: userId,
    parent_id: parentId,
    content: content,
  }).select()
  if (error) { console.error('sendThreadReply error:', error); return null }
  return data ? data[0] : null
}

// ============ リアルタイム購読 ============
function subscribeToMessages(channelId, onNewMessage) {
  const sb = getSupabase()
  const subscription = sb
    .channel('messages-realtime-' + channelId)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: 'channel_id=eq.' + channelId,
    }, (payload) => {
      onNewMessage(payload.new)
    })
    .subscribe()
  return subscription
}

function unsubscribeFromMessages(subscription) {
  if (subscription) {
    getSupabase().removeChannel(subscription)
  }
}

// ============ 認証 ============
async function signInWithEmail(email, password) {
  const sb = getSupabase()
  const { data, error } = await sb.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }
  return { user: data.user }
}

async function signUpWithEmail(email, password) {
  const sb = getSupabase()
  const { data, error } = await sb.auth.signUp({ email, password })
  if (error) return { error: error.message }
  return { user: data.user }
}

async function signOut() {
  const sb = getSupabase()
  await sb.auth.signOut()
}

// ============ 通知 ============
async function fetchNotifications() {
  const sb = getSupabase()
  const { data, error } = await sb.from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) { console.error('fetchNotifications error:', error); return [] }
  return data || []
}

async function fetchUnreadCount() {
  const sb = getSupabase()
  const { count, error } = await sb.from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false)
  if (error) { console.error('fetchUnreadCount error:', error); return 0 }
  return count || 0
}

async function markNotificationsRead() {
  const sb = getSupabase()
  const { error } = await sb.from('notifications')
    .update({ is_read: true })
    .eq('is_read', false)
  if (error) console.error('markNotificationsRead error:', error)
}

async function createNotification(userId, type, message) {
  const sb = getSupabase()
  const { error } = await sb.from('notifications').insert({
    user_id: userId,
    type: type,
    message: message,
  })
  if (error) console.error('createNotification error:', error)
}

// inviteUserByEmail は inviteToWorkspace に統合済み

async function getCurrentUser() {
  const sb = getSupabase()
  const { data: { user } } = await sb.auth.getUser()
  return user
}
