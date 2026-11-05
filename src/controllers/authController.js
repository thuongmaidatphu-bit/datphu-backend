const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

const PUBLIC_ROLES = ['merchant', 'worker', 'customer'];

// Khởi tạo CSDL Users & Profiles mẫu
function loadUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      const initialUsers = [
        {
          id: "usr-admin-01",
          fullName: "Nguyễn Quốc Khánh (Chủ Sàn)",
          email: "admin@datphu.vn",
          phone: "0901234567",
          role: "master_admin",
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
          role: "merchant",
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
          role: "worker",
          workerId: "THO-01",
          passwordHash: hashPassword("123456"),
          zaloId: "zalo_chutung_6k",
          status: "active",
          createdAt: new Date().toISOString()
        }
      ];
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
    console.error("Lỗi lưu users:", e);
  }
}

function hashPassword(pass) {
  return crypto.createHash('sha256').update(pass + "_datphu_salt_2026").digest('hex');
}

// Lưu trữ OTP tạm trong bộ nhớ (hết hạn sau 5 phút)
const otpStore = new Map();

// Tạo JWT Token giả lập an toàn
function generateToken(user) {
  const payload = {
    sub: user.id,
    fullName: user.fullName,
    phone: user.phone,
    email: user.email,
    role: user.role,
    merchantId: user.merchantId,
    workerId: user.workerId,
    exp: Math.floor(Date.now() / 1000) + (86400 * 7) // 7 ngày
  };
  const tokenString = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = crypto.createHmac('sha256', 'datphu_jwt_secret_2026').update(tokenString).digest('hex').slice(0, 16);
  return `${tokenString}.${signature}`;
}

// 1. GỬI MÃ OTP ĐẾN SỐ ĐIỆN THOẠI / ZALO ZNS
function handleSendOtp(req, res, body) {
  const { phone } = body;
  if (!phone || phone.length < 9) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Số điện thoại không hợp lệ' }));
  }

  // Sinh mã OTP 6 số
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(phone, {
    code: otpCode,
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 phút
  });

  console.log(`[AUTH SMS/ZALO OTP] Mã OTP gửi tới số ${phone} là: [ ${otpCode} ] (Có hiệu lực 5 phút)`);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: `Đã gửi mã xác thực OTP tới số ${phone} qua tin nhắn SMS/Zalo ZNS`,
    debugOtp: otpCode,
    devOtp: otpCode // Cho phép trải nghiệm nhanh trên môi trường test
  }));
}

// 2. XÁC THỰC MÃ OTP SỐ ĐIỆN THOẠI & ĐĂNG NHẬP / ĐĂNG KÝ TỰ ĐỘNG
function handleVerifyOtp(req, res, body) {
  const { phone, otp, role = 'merchant', fullName } = body;
  
  // Kiểm tra OTP
  const stored = otpStore.get(phone);
  if (!stored || stored.code !== otp || Date.now() > stored.expiresAt) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Mã xác thực OTP không chính xác hoặc đã hết hạn' }));
  }

  // Xóa OTP sau khi dùng
  otpStore.delete(phone);

  const users = loadUsers();
  let user = users.find(u => u.phone === phone);

  // Nếu là người dùng mới: Tự động đăng ký
  if (!user) {
    user = {
      id: `usr-${Date.now().toString().slice(-6)}`,
      fullName: fullName || `Người dùng ${phone.slice(-4)}`,
      phone,
      role: PUBLIC_ROLES.includes(role) ? role : 'customer',
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

// 3. ĐĂNG NHẬP BẰNG EMAIL & MẬT KHẨU
function handleLoginEmail(req, res, body) {
  const { email, password } = body;
  const users = loadUsers();
  const hash = hashPassword(password);

  const user = users.find(u => u.email === email && u.passwordHash === hash);
  if (!user) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Email hoặc mật khẩu không chính xác' }));
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
      role: user.role
    }
  }));
}

// 4. ĐĂNG KÝ BẰNG EMAIL & PHÂN QUYỀN VAI TRÒ
function handleRegisterEmail(req, res, body) {
  const { email, password, fullName, phone, role = 'merchant' } = body;
  if (!email || !password || !fullName) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Vui lòng điền đầy đủ Email, Mật khẩu và Họ tên' }));
  }

  const users = loadUsers();
  if (users.find(u => u.email === email)) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Email này đã được đăng ký trong hệ thống' }));
  }

  const newUser = {
    id: `usr-${Date.now().toString().slice(-6)}`,
    fullName,
    email,
    phone: phone || '',
    role: PUBLIC_ROLES.includes(role) ? role : 'customer',
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
      role: newUser.role
    }
  }));
}

// 5. ĐĂNG NHẬP NHANH 1 CHẠM QUA ZALO (ZALO OAUTH / MINI APP ID)
function handleZaloLogin(req, res, body) {
  const { zaloId, zaloName, zaloPhone, role = 'merchant' } = body;
  if (!zaloId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Thiếu thông tin định danh Zalo ID' }));
  }

  const users = loadUsers();
  let user = users.find(u => u.zaloId === zaloId || (zaloPhone && u.phone === zaloPhone));

  // Tự động kết nối hoặc tạo mới tài khoản liên kết Zalo
  if (!user) {
    user = {
      id: `usr-zalo-${Date.now().toString().slice(-5)}`,
      fullName: zaloName || 'Khách hàng Zalo',
      phone: zaloPhone || '',
      zaloId,
      role: PUBLIC_ROLES.includes(role) ? role : 'customer',
      status: 'active',
      createdAt: new Date().toISOString()
    };
    users.push(user);
    saveUsers(users);
  } else {
    // Cập nhật Zalo ID nếu chưa có
    if (!user.zaloId) {
      user.zaloId = zaloId;
      saveUsers(users);
    }
  }

  const token = generateToken(user);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: 'Đăng nhập Zalo 1 chạm thành công!',
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

module.exports = {
  handleSendOtp,
  handleVerifyOtp,
  handleLoginEmail,
  handleRegisterEmail,
  handleZaloLogin
};
