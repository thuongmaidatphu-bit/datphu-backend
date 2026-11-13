/**
 * ============================================================================
 * MODULE CỘNG ĐỒNG & WORKFLOW LƯU TRỮ ĐÁM MÂY CÓ TRÌNH TỰ
 * Đường dẫn: src/modules/community/communityRoutes.js
 * Hỗ trợ:
 *  - Tài khoản & Phân quyền 3 cấp: guest | member | admin
 *  - Unified Media Schema cho Ảnh, Video MP4 & YouTube
 *  - Trình tự bài viết: pinned -> published (mới nhất trước) -> archived
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const cloudRepo = require('./communityCloudRepo');

const TOKEN_SECRET = process.env.COMMUNITY_TOKEN_SECRET || 'datphu-community-rbac-secret-2026';
const ADMIN_INVITE_CODE = process.env.COMMUNITY_ADMIN_CODE || 'DATPHU-ADMIN';

function getDataDir() {
  return process.env.VERCEL ? os.tmpdir() : path.join(__dirname, '..', '..', '..', 'data');
}

function readJsonFile(fileName, fallback) {
  try {
    const fullPath = path.join(getDataDir(), fileName);
    if (fs.existsSync(fullPath)) {
      return JSON.parse(fs.readFileSync(fullPath, 'utf8') || JSON.stringify(fallback));
    }
  } catch (e) {}
  return fallback;
}

function writeJsonFile(fileName, data) {
  try {
    const dir = getDataDir();
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, fileName), JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });
  return res.end(JSON.stringify(payload));
}

function hashPassword(password, salt) {
  const s = salt || crypto.randomBytes(8).toString('hex');
  const hash = crypto.scryptSync(String(password), s, 32).toString('hex');
  return `${s}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  const check = crypto.scryptSync(String(password), salt, 32).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(check, 'hex'));
}

function signToken(user) {
  const payload = {
    id: user.id,
    name: user.name,
    account: user.account,
    role: user.role || 'member',
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyTokenFromReq(req) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    if (!token || !token.includes('.')) return null;
    const [data, sig] = token.split('.');
    const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(data).digest('base64url');
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

function normalizePostSchema(it, actor) {
  const mediaType = it.mediaType || (it.youtubeId ? 'youtube' : (it.videoSrc ? 'video' : 'photo'));
  return {
    id: it.id || ('art_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)),
    mediaType,
    title: String(it.title || '').trim().slice(0, 140),
    district: String(it.district || (actor && actor.name) || 'Đạo Tràng / Bà Con').slice(0, 80),
    category: String(it.category || 'Tâm Linh & Hiếu Hạnh').slice(0, 80),
    poem: String(it.poem || '').slice(0, 240),
    intro: String(it.intro || '').slice(0, 400),
    img: it.img || '',
    youtubeId: it.youtubeId || '',
    videoSrc: it.videoSrc || '',
    duration: it.duration || '',
    ownerId: it.ownerId || (actor ? actor.id : 'guest'),
    ownerName: it.ownerName || (actor ? actor.name : (it.district || 'Khách')),
    ownerRole: (actor && actor.role) || it.ownerRole || 'guest',
    status: it.status === 'pinned' ? 'pinned' : 'published',
    likes: Number(it.likes || 0),
    comments: Array.isArray(it.comments) ? it.comments : [],
    isUserUpload: true,
    createdAt: it.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function sortCommunityFeed(items, includeArchived = false) {
  return [...items]
    .filter(it => it && (includeArchived || it.status !== 'archived'))
    .sort((a, b) => {
      if (a.status === 'pinned' && b.status !== 'pinned') return -1;
      if (b.status === 'pinned' && a.status !== 'pinned') return 1;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
}

async function handle(pathname, req, res, body, sseClients, parsedUrl) {
  // ------------------------------------------------------------------------
  // A. ĐĂNG KÝ / ĐĂNG NHẬP / KIỂM TRA QUYỀN CỘNG ĐỒNG
  // ------------------------------------------------------------------------
  if (pathname === '/api/community/auth/register' && req.method === 'POST') {
    const name = String(body.name || '').trim().slice(0, 60);
    const account = String(body.account || '').trim().toLowerCase().slice(0, 80);
    const password = String(body.password || '');
    const adminCode = String(body.adminCode || '').trim();

    if (!name || !account || password.length < 4) {
      return sendJson(res, 400, { status: 'error', message: 'Vui lòng nhập Tên, SĐT/Email và Mật khẩu (tối thiểu 4 ký tự).' });
    }

    const users = readJsonFile('community_users.json', []);
    const cloudCheck = await cloudRepo.findCloudUser(account);
    if ((cloudCheck.ok && cloudCheck.user) || users.some(u => u.account === account)) {
      return sendJson(res, 409, { status: 'error', message: 'Tài khoản này đã được đăng ký trước đó.' });
    }

    const role = (adminCode && adminCode === ADMIN_INVITE_CODE) ? 'admin' : 'member';
    const newUser = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      name,
      account,
      role,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString()
    };
    const cloudCreated = await cloudRepo.createCloudUser(newUser);
    users.push(newUser);
    writeJsonFile('community_users.json', users);

    const token = signToken(newUser);
    return sendJson(res, 200, {
      status: 'ok',
      cloudDbUsed: cloudCreated.ok,
      token,
      user: { id: newUser.id, name: newUser.name, account: newUser.account, role: newUser.role }
    });
  }

  if (pathname === '/api/community/auth/login' && req.method === 'POST') {
    const account = String(body.account || '').trim().toLowerCase();
    const password = String(body.password || '');
    const cloudLookup = await cloudRepo.findCloudUser(account);
    const users = readJsonFile('community_users.json', []);
    const user = (cloudLookup.ok && cloudLookup.user) ? cloudLookup.user : users.find(u => u.account === account);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return sendJson(res, 401, { status: 'error', message: 'Sai tài khoản hoặc mật khẩu.' });
    }

    const token = signToken(user);
    return sendJson(res, 200, {
      status: 'ok',
      token,
      user: { id: user.id, name: user.name, account: user.account, role: user.role }
    });
  }

  if (pathname === '/api/community/auth/me' && req.method === 'GET') {
    const actor = verifyTokenFromReq(req);
    if (!actor) {
      return sendJson(res, 200, { status: 'ok', authenticated: false, user: { id: 'guest', name: 'Khách', role: 'guest' } });
    }
    return sendJson(res, 200, { status: 'ok', authenticated: true, user: actor });
  }

  // ------------------------------------------------------------------------
  // B. WORKFLOW LƯU TRỮ & PHÂN QUYỀN BẢNG TIN CỘNG ĐỒNG (CLOUD + FALLBACK)
  // ------------------------------------------------------------------------
  if (pathname === '/api/gallery/cloud-health' && req.method === 'GET') {
    const [postsCheck, usersCheck] = await Promise.all([
      cloudRepo.listCloudPosts(1, false),
      cloudRepo.findCloudUser('__health_check__')
    ]);
    return sendJson(res, 200, {
      status: 'ok',
      postsTableReady: !!postsCheck.ok,
      usersTableReady: !!usersCheck.ok,
      storageBucket: cloudRepo.COMMUNITY_BUCKET,
      serviceRoleConfigured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      adminCodeConfigured: !!process.env.COMMUNITY_ADMIN_CODE
    });
  }

  if (pathname === '/api/gallery/list' && req.method === 'GET') {
    const page = Math.max(1, Number(parsedUrl && parsedUrl.searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(parsedUrl && parsedUrl.searchParams.get('limit')) || 24));
    const cloudRes = await cloudRepo.listCloudPosts(120, false);
    const localRaw = readJsonFile('community_gallery.json', []);
    const raw = (cloudRes.ok && cloudRes.items.length > 0) ? cloudRes.items : localRaw;

    let items = sortCommunityFeed(raw, false);
    const mediaType = parsedUrl && parsedUrl.searchParams.get('mediaType');
    if (mediaType) items = items.filter(it => (it.mediaType || 'photo') === mediaType);
    const offset = (page - 1) * limit;
    const sliced = items.slice(offset, offset + limit);
    return sendJson(res, 200, {
      status: 'ok',
      cloudDbUsed: cloudRes.ok,
      page,
      limit,
      total: items.length,
      hasMore: offset + sliced.length < items.length,
      items: sliced
    });
  }

  if (pathname === '/api/gallery/admin-summary' && req.method === 'GET') {
    const actor = verifyTokenFromReq(req);
    if (!actor || actor.role !== 'admin') {
      return sendJson(res, 403, { status: 'error', message: 'Chỉ Quản trị viên (Admin) mới có quyền truy cập.' });
    }
    const cloudRes = await cloudRepo.listCloudPosts(120, true);
    const localRaw = readJsonFile('community_gallery.json', []);
    const raw = (cloudRes.ok && cloudRes.items.length > 0) ? cloudRes.items : localRaw;
    const items = sortCommunityFeed(raw, true);
    return sendJson(res, 200, {
      status: 'ok',
      cloudDbUsed: cloudRes.ok,
      counts: {
        total: items.length,
        published: items.filter(x => x.status === 'published').length,
        pinned: items.filter(x => x.status === 'pinned').length,
        archived: items.filter(x => x.status === 'archived').length
      },
      items
    });
  }

  if (pathname === '/api/gallery/moderate' && req.method === 'POST') {
    const actor = verifyTokenFromReq(req);
    if (!actor || actor.role !== 'admin') {
      return sendJson(res, 403, { status: 'error', message: 'Chỉ Quản trị viên (Admin) mới có quyền kiểm duyệt.' });
    }
    const action = String(body.action || '').trim();
    const current = readJsonFile('community_gallery.json', []);
    const cloudRes = await cloudRepo.listCloudPosts(120, true);
    const pool = (cloudRes.ok && cloudRes.items.length > 0) ? cloudRes.items : current;
    const target = pool.find(c => (body.id && c.id === body.id) || (body.title && c.title === body.title));
    if (!target) return sendJson(res, 404, { status: 'error', message: 'Không tìm thấy bài viết.' });

    if (action === 'delete') {
      await cloudRepo.deleteCloudPost(target.id);
      const next = current.filter(c => c.id !== target.id && c.title !== target.title);
      writeJsonFile('community_gallery.json', next);
      return sendJson(res, 200, { status: 'ok', action: 'delete', id: target.id });
    }

    const statusMap = { pin: 'pinned', unpin: 'published', restore: 'published', archive: 'archived' };
    const nextStatus = statusMap[action];
    if (!nextStatus) {
      return sendJson(res, 400, { status: 'error', message: 'Hành động kiểm duyệt không hợp lệ.' });
    }

    target.status = nextStatus;
    target.updatedAt = new Date().toISOString();
    await cloudRepo.updateCloudPost(target.id, { status: nextStatus });

    const localIdx = current.findIndex(c => c.id === target.id || c.title === target.title);
    if (localIdx !== -1) {
      current[localIdx].status = nextStatus;
      current[localIdx].updatedAt = target.updatedAt;
    } else {
      current.unshift(target);
    }
    writeJsonFile('community_gallery.json', current);
    return sendJson(res, 200, { status: 'ok', action, itemStatus: nextStatus, id: target.id });
  }

  if (pathname === '/api/gallery/publish' && req.method === 'POST') {
    const actor = verifyTokenFromReq(req);
    const newItems = Array.isArray(body.items) ? body.items : [body];
    const normalized = newItems
      .filter(it => it && it.title && (it.img || it.youtubeId || it.videoSrc))
      .map(it => normalizePostSchema(it, actor));

    if (normalized.length === 0) {
      return sendJson(res, 400, { status: 'error', message: 'Thiếu dữ liệu ảnh/video hoặc tiêu đề.' });
    }

    // Bước 1: Đẩy ảnh Base64 lên Supabase Storage để lấy URL CDN gọn nhẹ
    let cloudStorageCount = 0;
    const valid = await Promise.all(normalized.map(async (post) => {
      if (post.img && post.img.startsWith('data:image/')) {
        const uploaded = await cloudRepo.uploadDataUrlToCloudStorage(post.img, post.ownerId, post.id);
        if (uploaded.uploaded) {
          cloudStorageCount++;
          post.img = uploaded.url;
        }
      }
      return post;
    }));

    // Bước 2: Lưu Metadata vào Supabase Cloud Database + Mirror cục bộ
    const cloudSaved = await cloudRepo.upsertCloudPosts(valid);
    const current = readJsonFile('community_gallery.json', []);
    const merged = [...valid, ...current.filter(c => !valid.some(v => v.id === c.id))].slice(0, 120);
    const localSaved = writeJsonFile('community_gallery.json', merged);

    return sendJson(res, 200, {
      status: 'ok',
      savedToCloud: !!(cloudSaved.ok || localSaved),
      cloudDbUsed: cloudSaved.ok,
      cloudStorageCount,
      count: valid.length,
      role: actor ? actor.role : 'guest',
      items: valid
    });
  }

  if (pathname === '/api/gallery/delete' && req.method === 'POST') {
    const actor = verifyTokenFromReq(req);
    const current = readJsonFile('community_gallery.json', []);
    const cloudRes = await cloudRepo.listCloudPosts(100);
    const pool = cloudRes.ok ? cloudRes.items : current;
    const target = pool.find(c => (body.id && c.id === body.id) || (body.title && c.title === body.title));

    if (target) {
      const isAdmin = actor && actor.role === 'admin';
      const isOwner = actor && target.ownerId && target.ownerId === actor.id;
      const isGuestPost = !target.ownerId || target.ownerId === 'guest';
      if (!isAdmin && !isOwner && !isGuestPost) {
        return sendJson(res, 403, { status: 'error', message: 'Bạn chỉ có quyền xóa bài viết do chính mình đăng.' });
      }
    }

    if (target && target.id) await cloudRepo.deleteCloudPost(target.id);
    else if (body.id) await cloudRepo.deleteCloudPost(body.id);

    const next = current.filter(c => c.id !== body.id && c.title !== body.title);
    writeJsonFile('community_gallery.json', next);
    return sendJson(res, 200, { status: 'ok', remaining: next.length });
  }

  if (pathname === '/api/gallery/pin' && req.method === 'POST') {
    const actor = verifyTokenFromReq(req);
    if (!actor || actor.role !== 'admin') {
      return sendJson(res, 403, { status: 'error', message: 'Chỉ Quản trị viên (Admin) mới có quyền ghim bài nổi bật.' });
    }
    const current = readJsonFile('community_gallery.json', []);
    const cloudRes = await cloudRepo.listCloudPosts(100);
    const pool = (cloudRes.ok && cloudRes.items.length > 0) ? cloudRes.items : current;
    const item = pool.find(c => (body.id && c.id === body.id) || (body.title && c.title === body.title));
    if (!item) return sendJson(res, 404, { status: 'error', message: 'Không tìm thấy bài viết.' });

    const nextStatus = item.status === 'pinned' ? 'published' : 'pinned';
    item.status = nextStatus;
    item.updatedAt = new Date().toISOString();
    await cloudRepo.updateCloudPost(item.id, { status: nextStatus });

    const localItem = current.find(c => c.id === item.id || c.title === item.title);
    if (localItem) {
      localItem.status = nextStatus;
      localItem.updatedAt = item.updatedAt;
      writeJsonFile('community_gallery.json', current);
    }
    return sendJson(res, 200, { status: 'ok', itemStatus: nextStatus });
  }

  if (pathname === '/api/gallery/react' && req.method === 'POST') {
    const current = readJsonFile('community_gallery.json', []);
    const item = current.find(c => (body.id && c.id === body.id) || (body.title && c.title === body.title));
    let nextLikes = 1;
    if (item) {
      item.likes = Math.max(0, (item.likes || 0) + (Number(body.delta) || 1));
      item.updatedAt = new Date().toISOString();
      nextLikes = item.likes;
      writeJsonFile('community_gallery.json', current);
    }
    if (body.id) await cloudRepo.updateCloudPost(body.id, { likes: nextLikes });
    return sendJson(res, 200, { status: 'ok', likes: nextLikes });
  }

  if (pathname === '/api/gallery/comment' && req.method === 'POST') {
    const actor = verifyTokenFromReq(req);
    const text = String(body.text || '').trim().slice(0, 240);
    const author = String((actor && actor.name) || body.author || 'Bà Con Đất Phú').slice(0, 60);
    if (!text) {
      return sendJson(res, 400, { status: 'error', message: 'Nội dung lời chúc trống.' });
    }
    const current = readJsonFile('community_gallery.json', []);
    const item = current.find(c => (body.id && c.id === body.id) || (body.title && c.title === body.title));
    const commentObj = { author, role: actor ? actor.role : 'guest', text, time: new Date().toISOString() };
    if (item) {
      item.comments = Array.isArray(item.comments) ? item.comments : [];
      item.comments.unshift(commentObj);
      item.comments = item.comments.slice(0, 30);
      item.updatedAt = new Date().toISOString();
      writeJsonFile('community_gallery.json', current);
      await cloudRepo.updateCloudPost(item.id, { comments: item.comments });
    }
    return sendJson(res, 200, { status: 'ok', comment: commentObj });
  }

  return false;
}

module.exports = { handle };
