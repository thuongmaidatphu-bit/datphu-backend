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

function sortCommunityFeed(items) {
  return [...items]
    .filter(it => it && it.status !== 'archived')
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
    if (users.some(u => u.account === account)) {
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
    users.push(newUser);
    writeJsonFile('community_users.json', users);

    const token = signToken(newUser);
    return sendJson(res, 200, {
      status: 'ok',
      token,
      user: { id: newUser.id, name: newUser.name, account: newUser.account, role: newUser.role }
    });
  }

  if (pathname === '/api/community/auth/login' && req.method === 'POST') {
    const account = String(body.account || '').trim().toLowerCase();
    const password = String(body.password || '');
    const users = readJsonFile('community_users.json', []);
    const user = users.find(u => u.account === account);

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
  // B. WORKFLOW LƯU TRỮ & PHÂN QUYỀN BẢNG TIN CỘNG ĐỒNG
  // ------------------------------------------------------------------------
  if (pathname === '/api/gallery/list' && req.method === 'GET') {
    const raw = readJsonFile('community_gallery.json', []);
    let items = sortCommunityFeed(raw);
    const mediaType = parsedUrl && parsedUrl.searchParams.get('mediaType');
    if (mediaType) items = items.filter(it => (it.mediaType || 'photo') === mediaType);
    const limit = Number(parsedUrl && parsedUrl.searchParams.get('limit')) || 60;
    return sendJson(res, 200, { status: 'ok', total: items.length, items: items.slice(0, limit) });
  }

  if (pathname === '/api/gallery/publish' && req.method === 'POST') {
    const actor = verifyTokenFromReq(req);
    const newItems = Array.isArray(body.items) ? body.items : [body];
    const valid = newItems
      .filter(it => it && it.title && (it.img || it.youtubeId || it.videoSrc))
      .map(it => normalizePostSchema(it, actor));

    if (valid.length === 0) {
      return sendJson(res, 400, { status: 'error', message: 'Thiếu dữ liệu ảnh/video hoặc tiêu đề.' });
    }

    const current = readJsonFile('community_gallery.json', []);
    const merged = [...valid, ...current.filter(c => !valid.some(v => v.id === c.id))].slice(0, 120);
    const saved = writeJsonFile('community_gallery.json', merged);

    return sendJson(res, 200, {
      status: 'ok',
      savedToCloud: saved,
      count: valid.length,
      role: actor ? actor.role : 'guest',
      items: valid
    });
  }

  if (pathname === '/api/gallery/delete' && req.method === 'POST') {
    const actor = verifyTokenFromReq(req);
    const current = readJsonFile('community_gallery.json', []);
    const target = current.find(c => (body.id && c.id === body.id) || (body.title && c.title === body.title));

    if (target) {
      const isAdmin = actor && actor.role === 'admin';
      const isOwner = actor && target.ownerId && target.ownerId === actor.id;
      const isGuestPost = !target.ownerId || target.ownerId === 'guest';
      if (!isAdmin && !isOwner && !isGuestPost) {
        return sendJson(res, 403, { status: 'error', message: 'Bạn chỉ có quyền xóa bài viết do chính mình đăng.' });
      }
    }

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
    const item = current.find(c => (body.id && c.id === body.id) || (body.title && c.title === body.title));
    if (!item) return sendJson(res, 404, { status: 'error', message: 'Không tìm thấy bài viết.' });

    item.status = item.status === 'pinned' ? 'published' : 'pinned';
    item.updatedAt = new Date().toISOString();
    writeJsonFile('community_gallery.json', current);
    return sendJson(res, 200, { status: 'ok', itemStatus: item.status });
  }

  if (pathname === '/api/gallery/react' && req.method === 'POST') {
    const current = readJsonFile('community_gallery.json', []);
    const item = current.find(c => (body.id && c.id === body.id) || (body.title && c.title === body.title));
    if (item) {
      item.likes = Math.max(0, (item.likes || 0) + (Number(body.delta) || 1));
      item.updatedAt = new Date().toISOString();
      writeJsonFile('community_gallery.json', current);
    }
    return sendJson(res, 200, { status: 'ok', likes: item ? item.likes : 1 });
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
    }
    return sendJson(res, 200, { status: 'ok', comment: commentObj });
  }

  return false;
}

module.exports = { handle };
