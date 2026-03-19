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

// ============ チャンネル ============
async function fetchChannels() {
  const sb = getSupabase()
  const { data, error } = await sb
    .from('channels')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) { console.error('fetchChannels error:', error); return [] }
  return data || []
}

async function createChannel(name) {
  const sb = getSupabase()
  const { data, error } = await sb.from('channels').insert({ name: name }).select()
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

async function getCurrentUser() {
  const sb = getSupabase()
  const { data: { user } } = await sb.auth.getUser()
  return user
}
