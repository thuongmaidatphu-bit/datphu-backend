/**
 * ============================================================================
 * MODULE 1: AUTHENTICATION & RBAC PHÂN QUYỀN
 * Đường dẫn: src/modules/auth/authController.js
 * Bản quyền: CÔNG TY TNHH THƯƠNG MẠI ĐẤT PHÚ (MST: 4401020233)
 * ============================================================================
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const cloudGateway = require('../../core/cloudGateway');

const USERS_FILE = path.join(__dirname, '..', '..', 'data', 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'datphu-onebase-super-secret-key-2026';

// 4 Cấp độ phân quyền RBAC
const ROLES = {
  MASTER_ADMIN: 'master_admin', // Chủ Sàn
  MERCHANT: 'merchant',         // Chủ Quán / Homestay
  WORKER: 'worker',             // Thợ 6K An Sinh
  CUSTOMER: 'customer'          // Khách Hàng / Cư Dân
};

const PUBLIC_ROLES = [ROLES.MERCHANT, ROLES.WORKER, ROLES.CUSTOMER];

// Bộ nhớ tạm lưu mã OTP số điện thoại (Hết hạn sau 5 phút)
const otpStore = new Map();

function hashPassword(password, salt = '_datphu_salt_2026') {
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

function generateToken(user) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: user.id,
    phone: user.phone || null,
    email: user.email || null,
    role: user.role,
    fullName: user.fullName,
    merchantId: user.merchantId || null,
    workerId: user.workerId || null,
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 ngày
  })).toString('base64url');

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

function verifyToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (signature !== expectedSig) return null;
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch (e) {
    return null;
  }
}

function loadUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      const initialUsers = [
        {
          id: "usr-admin-01",
          fullName: "Nguyễn Quốc Khánh (Chủ Sàn Đất Phú)",
          email: "admin@datphu.vn",
          phone: "0901234567",
          role: ROLES.MASTER_ADMIN,
          passwordHash: hashPassword("Admin@123"),
          zaloId: "zalo_khanh_master",
          status: "active",
          createdAt: new Date().toISOString()
        },
        {
          id: "usr-merchant-01",
          fullName: "Chủ Quán Đất Phú Phòng Nghỉ",
          email: "thanhgiang@gmail.com",
          phone: "0977478899",
          role: ROLES.MERCHANT,
          merchantId: "M-01",
          passwordHash: hashPassword("123456"),
          zaloId: "zalo_thanhgiang_86leduan",
          status: "active",
          createdAt: new Date().toISOString()
        },
        {
          id: "usr-worker-01",
          fullName: "Chú Nguyễn Văn Tùng (Thợ Điện Nước)",
          email: "chutung.diennuoc@gmail.com",
          phone: "0912345678",
          role: ROLES.WORKER,
          workerId: "THO-01",
          passwordHash: hashPassword("123456"),
          zaloId: "zalo_chutung_6k",
          status: "active",
          createdAt: new Date().toISOString()
        },
        {
          id: "usr-cust-01",
          fullName: "Khách Hàng Tuy Hòa",
          email: "khachhang@datphu.vn",
          phone: "0988112233",
          role: ROLES.CUSTOMER,
          passwordHash: hashPassword("123456"),
          status: "active",
          createdAt: new Date().toISOString()
        }
      ];
      const dir = path.dirname(USERS_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(USERS_FILE, JSON.stringify(initialUsers, null, 2), 'utf-8');
      return initialUsers;
    }
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (e) {
    console.error("Lỗi ghi file users.json:", e);
  }
}

// 1. GỬI MÃ OTP SỐ ĐIỆN THOẠI
function handleSendOtp(req, res, body) {
  const { phone } = body;
  if (!phone || phone.length < 9) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Số điện thoại không hợp lệ' }));
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(phone, {
    code: otpCode,
    expiresAt: Date.now() + 5 * 60 * 1000
  });

  console.log(`[AUTH SMS/ZALO OTP] Mã xác thực gửi tới ${phone}: [ ${otpCode} ]`);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: `Đã gửi mã xác thực OTP tới số ${phone} qua tin nhắn SMS/Zalo ZNS`,
    debugOtp: otpCode,
    devOtp: otpCode
  }));
}

// 2. XÁC MINH OTP SĐT & ĐĂNG NHẬP / TẠO TÀI KHOẢN TỰ ĐỘNG
function handleVerifyOtp(req, res, body) {
  const { phone, otp, role = ROLES.CUSTOMER, fullName } = body;
  const stored = otpStore.get(phone);

  if (!stored || stored.code !== otp || Date.now() > stored.expiresAt) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Mã xác thực OTP không chính xác hoặc đã hết hạn' }));
  }

  otpStore.delete(phone);
  const users = loadUsers();
  let user = users.find(u => u.phone === phone);

  if (!user) {
    user = {
      id: `usr-${Date.now().toString().slice(-6)}`,
      fullName: fullName || `Người dùng ${phone.slice(-4)}`,
      phone,
      role: PUBLIC_ROLES.includes(role) ? role : ROLES.CUSTOMER,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    users.push(user);
    saveUsers(users);
  }

  const token = generateToken(user);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: 'Xác thực số điện thoại thành công!',
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role
    }
  }));
}

// 3. ĐĂNG KÝ CHUẨN (POST /api/auth/register hoặc /api/auth/register-email)
function handleRegister(req, res, body) {
  const { email, phone, password, fullName, role = ROLES.CUSTOMER } = body;
  if ((!email && !phone) || !password || !fullName) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Vui lòng cung cấp đầy đủ thông tin định danh và mật khẩu' }));
  }

  const users = loadUsers();
  if (email && users.find(u => u.email === email)) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Email này đã tồn tại trong hệ sinh thái' }));
  }
  if (phone && users.find(u => u.phone === phone)) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Số điện thoại này đã được đăng ký' }));
  }

  const safeRole = PUBLIC_ROLES.includes(role) ? role : ROLES.CUSTOMER;
  const newUser = {
    id: `usr-${Date.now().toString().slice(-6)}`,
    fullName,
    email: email || '',
    phone: phone || '',
    role: safeRole,
    passwordHash: hashPassword(password),
    status: 'active',
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);

  const token = generateToken(newUser);
  res.writeHead(201, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: 'Đăng ký tài khoản thành công!',
    token,
    user: {
      id: newUser.id,
      fullName: newUser.fullName,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role
    }
  }));
}

// 4. ĐĂNG NHẬP CHUẨN (POST /api/auth/login hoặc /api/auth/login-email)
function handleLogin(req, res, body) {
  const { email, phone, password } = body;
  const identifier = email || phone;
  if (!identifier || !password) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Vui lòng nhập tài khoản và mật khẩu' }));
  }

  const users = loadUsers();
  const hash = hashPassword(password);
  const user = users.find(u => (u.email === identifier || u.phone === identifier) && u.passwordHash === hash);

  if (!user) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Tài khoản hoặc mật khẩu không chính xác' }));
  }

  const token = generateToken(user);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: 'Đăng nhập thành công!',
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      merchantId: user.merchantId || null,
      workerId: user.workerId || null
    }
  }));
}

// 5. ĐĂNG NHẬP NHANH QUA ZALO & ZALO CALLBACK
function handleZaloLogin(req, res, body) {
  const { zaloId, zaloName, zaloPhone, role = ROLES.CUSTOMER } = body;
  if (!zaloId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Thiếu định danh Zalo ID' }));
  }

  const users = loadUsers();
  let user = users.find(u => u.zaloId === zaloId || (zaloPhone && u.phone === zaloPhone));

  if (!user) {
    user = {
      id: `usr-zalo-${Date.now().toString().slice(-5)}`,
      fullName: zaloName || 'Khách hàng Zalo',
      phone: zaloPhone || '',
      zaloId,
      role: PUBLIC_ROLES.includes(role) ? role : ROLES.CUSTOMER,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    users.push(user);
    saveUsers(users);
  } else if (!user.zaloId) {
    user.zaloId = zaloId;
    saveUsers(users);
  }

  const token = generateToken(user);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: 'Đăng nhập Zalo 1-chạm thành công!',
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      zaloId: user.zaloId
    }
  }));
}

function handleZaloCallback(req, res, query) {
  // Giả lập tiếp nhận mã authorization_code từ Zalo OAuth
  const code = query.get('code') || 'mock_zalo_auth_code';
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: "Zalo OAuth Authorization Callback tiếp nhận thành công",
    authCode: code,
    provider: "Zalo Open Platform / ZNS Phú Yên"
  }));
}

// 6. THÔNG TIN NGƯỜI DÙNG HIỆN TẠI (GET /api/auth/me)
function handleGetMe(req, res) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const decoded = verifyToken(token);

  if (!decoded) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Token không hợp lệ hoặc đã hết hạn' }));
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, user: decoded }));
}

// 7. MIDDLEWARE BẢO VỆ ENDPOINT & PHÂN QUYỀN RBAC
function authMiddleware(req, res, allowedRoles = []) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const decoded = verifyToken(token);

  if (!decoded) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Yêu cầu xác thực tài khoản (Token missing or invalid)' }));
    return null;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: `Từ chối truy cập: Tài khoản quyền [${decoded.role}] không đủ thẩm quyền truy cập tài nguyên này.` 
    }));
    return null;
  }

  req.user = decoded;
  return decoded;
}

module.exports = {
  ROLES,
  PUBLIC_ROLES,
  verifyToken,
  authMiddleware,
  handleSendOtp,
  handleVerifyOtp,
  handleRegister,
  handleLogin,
  handleZaloLogin,
  handleZaloCallback,
  handleGetMe
};
