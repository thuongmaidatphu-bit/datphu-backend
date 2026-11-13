/**
 * ============================================================================
 * CLOUD REPOSITORY: KẾT NỐI SUPABASE DATABASE & STORAGE CHO CỘNG ĐỒNG
 * Hỗ trợ:
 *  - Upload ảnh Base64 lên Supabase Object Storage -> trả về URL CDN gọn nhẹ
 *  - Lưu & truy vấn bài viết / tài khoản trên Supabase PostgreSQL
 *  - Fallback an toàn sang JSON cục bộ nếu bảng Supabase chưa được khởi tạo
 * ============================================================================
 */

const cloudGateway = require('../../core/cloudGateway');

const SUPABASE_URL = process.env.SUPABASE_URL || cloudGateway.SUPABASE_URL;
const SUPABASE_WRITE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'sb_publishable_jAkkgpNicp_xFBYPOFBvFQ_1w1GBDAC';

const COMMUNITY_BUCKET = process.env.SUPABASE_COMMUNITY_BUCKET || 'products';

function cloudHeaders(extra = {}) {
  return Object.assign({
    apikey: SUPABASE_WRITE_KEY,
    Authorization: `Bearer ${SUPABASE_WRITE_KEY}`,
    'Content-Type': 'application/json'
  }, extra);
}

function mapRowToPost(row) {
  if (!row) return null;
  return {
    id: row.id,
    mediaType: row.media_type || 'photo',
    title: row.title || '',
    district: row.district || 'Đạo Tràng / Bà Con',
    category: row.category || 'Tâm Linh & Hiếu Hạnh',
    poem: row.poem || '',
    intro: row.intro || '',
    img: row.img || '',
    youtubeId: row.youtube_id || '',
    videoSrc: row.video_src || '',
    duration: row.duration || '',
    ownerId: row.owner_id || 'guest',
    ownerName: row.owner_name || 'Khách',
    ownerRole: row.owner_role || 'guest',
    status: row.status || 'published',
    likes: Number(row.likes || 0),
    comments: Array.isArray(row.comments) ? row.comments : [],
    isUserUpload: row.is_user_upload !== false,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapPostToRow(post) {
  return {
    id: post.id,
    media_type: post.mediaType || 'photo',
    title: post.title || '',
    district: post.district || 'Đạo Tràng / Bà Con',
    category: post.category || 'Tâm Linh & Hiếu Hạnh',
    poem: post.poem || '',
    intro: post.intro || '',
    img: post.img || '',
    youtube_id: post.youtubeId || '',
    video_src: post.videoSrc || '',
    duration: post.duration || '',
    owner_id: post.ownerId || 'guest',
    owner_name: post.ownerName || 'Khách',
    owner_role: post.ownerRole || 'guest',
    status: post.status || 'published',
    likes: Number(post.likes || 0),
    comments: Array.isArray(post.comments) ? post.comments : [],
    is_user_upload: post.isUserUpload !== false,
    created_at: post.createdAt || new Date().toISOString(),
    updated_at: post.updatedAt || new Date().toISOString()
  };
}

async function uploadDataUrlToCloudStorage(dataUrl, ownerId, postId) {
  try {
    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(String(dataUrl || ''));
    if (!match) return { uploaded: false, url: dataUrl };

    const mimeType = match[1];
    const ext = mimeType.includes('png') ? 'png' : (mimeType.includes('webp') ? 'webp' : 'jpg');
    const buffer = Buffer.from(match[2], 'base64');
    const now = new Date();
    const ym = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const safeOwner = String(ownerId || 'guest').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = `community/${ym}/${safeOwner}/${postId}.${ext}`;

    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${COMMUNITY_BUCKET}/${filePath}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_WRITE_KEY,
        Authorization: `Bearer ${SUPABASE_WRITE_KEY}`,
        'Content-Type': mimeType,
        'x-upsert': 'true'
      },
      body: buffer
    });

    if (!res.ok) return { uploaded: false, url: dataUrl };
    return {
      uploaded: true,
      url: `${SUPABASE_URL}/storage/v1/object/public/${COMMUNITY_BUCKET}/${filePath}`,
      storagePath: filePath
    };
  } catch (e) {
    return { uploaded: false, url: dataUrl };
  }
}

async function listCloudPosts(limit = 60, includeArchived = false) {
  try {
    const statusFilter = includeArchived ? '' : '&status=neq.archived';
    const url = `${SUPABASE_URL}/rest/v1/community_posts?select=*${statusFilter}&order=created_at.desc&limit=${limit}`;
    const res = await fetch(url, { method: 'GET', headers: cloudHeaders() });
    if (!res.ok) return { ok: false, items: [] };
    const rows = await res.json();
    if (!Array.isArray(rows)) return { ok: false, items: [] };
    return { ok: true, items: rows.map(mapRowToPost) };
  } catch (e) {
    return { ok: false, items: [] };
  }
}

async function upsertCloudPosts(posts) {
  try {
    const rows = posts.map(mapPostToRow);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/community_posts?on_conflict=id`, {
      method: 'POST',
      headers: cloudHeaders({ Prefer: 'resolution=merge-duplicates,return=representation' }),
      body: JSON.stringify(rows)
    });
    if (!res.ok) return { ok: false };
    const data = await res.json();
    return { ok: Array.isArray(data), items: Array.isArray(data) ? data.map(mapRowToPost) : [] };
  } catch (e) {
    return { ok: false };
  }
}

async function updateCloudPost(id, updates) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/community_posts?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: cloudHeaders({ Prefer: 'return=representation' }),
      body: JSON.stringify(Object.assign({}, updates, { updated_at: new Date().toISOString() }))
    });
    return { ok: res.ok };
  } catch (e) {
    return { ok: false };
  }
}

async function deleteCloudPost(id) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/community_posts?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: cloudHeaders()
    });
    return { ok: res.ok };
  } catch (e) {
    return { ok: false };
  }
}

async function findCloudUser(account) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/community_users?select=*&account=eq.${encodeURIComponent(account)}&limit=1`;
    const res = await fetch(url, { method: 'GET', headers: cloudHeaders() });
    if (!res.ok) return { ok: false, user: null };
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) return { ok: true, user: null };
    const u = rows[0];
    return {
      ok: true,
      user: { id: u.id, name: u.name, account: u.account, role: u.role, passwordHash: u.password_hash, createdAt: u.created_at }
    };
  } catch (e) {
    return { ok: false, user: null };
  }
}

async function createCloudUser(user) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/community_users`, {
      method: 'POST',
      headers: cloudHeaders({ Prefer: 'return=representation' }),
      body: JSON.stringify({
        id: user.id,
        name: user.name,
        account: user.account,
        role: user.role,
        password_hash: user.passwordHash,
        created_at: user.createdAt
      })
    });
    return { ok: res.ok };
  } catch (e) {
    return { ok: false };
  }
}

module.exports = {
  COMMUNITY_BUCKET,
  uploadDataUrlToCloudStorage,
  listCloudPosts,
  upsertCloudPosts,
  updateCloudPost,
  deleteCloudPost,
  findCloudUser,
  createCloudUser
};
