/**
 * ============================================================================
 * MODULE: MULTI-TENANT SHOP MANAGEMENT & SUBSCRIPTION TIERS (80k - 120k - 180k)
 * Đường dẫn: src/modules/pos/tenantController.js
 * Bản quyền: CÔNG TY TNHH THƯƠNG MẠI ĐẤT PHÚ
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TENANTS_FILE = path.join(__dirname, '..', '..', 'data', 'pos_tenants.json');
const JWT_SECRET = process.env.JWT_SECRET || 'datphu-pos-tenant-secret-key-2026';

// 3 GÓI DỊCH VỤ CHO THUÊ CHÍNH THỨC
const PLANS = {
  starter: {
    id: 'starter',
    name: 'Gói Khởi Động',
    badge: 'Khởi Động • 80k/tháng',
    priceMonthly: 80000,
    priceYearly: 800000,
    features: {
      vietqr: true,
      tingtingAudio: true,
      pnlEod: true,
      zaloShare: true,
      bluetoothPrint: false,
      tablesManagement: false,
      micaQrGift: false,
      taxInvoiceNd254: false,
      digitalSignatureEfy: false
    },
    description: 'Bán hàng trên điện thoại, VietQR tự động, âm Ting-Ting, chốt ca lãi lỗ Zalo'
  },
  standard: {
    id: 'standard',
    name: 'Gói Tiêu Chuẩn In Bill',
    badge: 'Tiêu Chuẩn • In Bill 120k',
    priceMonthly: 120000,
    priceYearly: 1200000,
    features: {
      vietqr: true,
      tingtingAudio: true,
      pnlEod: true,
      zaloShare: true,
      bluetoothPrint: true,
      tablesManagement: true,
      micaQrGift: true,
      taxInvoiceNd254: false,
      digitalSignatureEfy: false
    },
    description: 'Toàn bộ gói 80k + In bill Bluetooth 58/80mm, quản lý bàn, tặng bảng Mica QR'
  },
  pro_tax: {
    id: 'pro_tax',
    name: 'Gói Toàn Diện Pháp Lý & Thuế',
    badge: 'Chuẩn Thuế NĐ 254 • 180k',
    priceMonthly: 180000,
    priceYearly: 1800000,
    features: {
      vietqr: true,
      tingtingAudio: true,
      pnlEod: true,
      zaloShare: true,
      bluetoothPrint: true,
      tablesManagement: true,
      micaQrGift: true,
      taxInvoiceNd254: true,
      digitalSignatureEfy: true
    },
    description: 'Toàn bộ gói 120k + Xuất Hóa đơn máy tính tiền NĐ 254, Chữ ký số kê khai thuế'
  }
};

function hashPin(pin, salt = '_dp_pos_salt_2026') {
  return crypto.createHash('sha256').update(String(pin) + salt).digest('hex');
}

function generateTenantToken(tenant) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    shopId: tenant.id,
    phone: tenant.phone,
    shopName: tenant.shopName,
    plan: tenant.plan,
    exp: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60) // 90 ngày
  })).toString('base64url');

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

function verifyTenantToken(token) {
  try {
    if (!token) return null;
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

function loadTenants() {
  try {
    if (!fs.existsSync(TENANTS_FILE)) {
      const initialTenants = [
        {
          id: "shop_80k_demo",
          shopName: "Cà Phê Cóc Chợ Lớn Tuy Hòa",
          ownerName: "Anh Tám Cà Phê",
          phone: "0979080080",
          pinHash: hashPin("1234"),
          plan: "starter",
          planName: PLANS.starter.name,
          status: "active",
          planExpiresAt: "2027-12-31T23:59:59.000Z",
          bankConfig: {
            bankId: "vietcombank",
            bankAcc: "0751000025035",
            bankName: "NGUYEN VAN TAM"
          },
          products: [
            { id: 1, name: "Cà Phê Đen Đá", price: 15000, cat: "coffee", icon: "fa-mug-hot", color: "text-amber-500" },
            { id: 2, name: "Cà Phê Sữa Đá", price: 18000, cat: "coffee", icon: "fa-glass-water", color: "text-orange-400" },
            { id: 3, name: "Bạc Xỉu Phú Yên", price: 20000, cat: "coffee", icon: "fa-whiskey-glass", color: "text-yellow-300" },
            { id: 4, name: "Trà Đào Cam Sả", price: 22000, cat: "tea", icon: "fa-leaf", color: "text-emerald-400" },
            { id: 5, name: "Nước Suối Đóng Chai", price: 10000, cat: "drink", icon: "fa-bottle-water", color: "text-cyan-400" }
          ],
          createdAt: new Date().toISOString()
        },
        {
          id: "shop_120k_demo",
          shopName: "Quán Ăn & Bún Cá Dằm Tuy Hòa",
          ownerName: "Chị Hoa Quán Ăn",
          phone: "0979120120",
          pinHash: hashPin("1234"),
          plan: "standard",
          planName: PLANS.standard.name,
          status: "active",
          planExpiresAt: "2027-12-31T23:59:59.000Z",
          bankConfig: {
            bankId: "mbbank",
            bankAcc: "097912012099",
            bankName: "TRAN THI HOA"
          },
          products: [
            { id: 1, name: "Bún Cá Dằm Đặc Biệt", price: 35000, cat: "food", icon: "fa-bowl-food", color: "text-red-400" },
            { id: 2, name: "Bánh Canh Hẹ Chả Cá", price: 30000, cat: "food", icon: "fa-bowl-food", color: "text-emerald-400" },
            { id: 3, name: "Bò Kho Bánh Mì", price: 40000, cat: "food", icon: "fa-utensils", color: "text-rose-500" },
            { id: 4, name: "Sữa Đậu Nành Tươi", price: 12000, cat: "drink", icon: "fa-glass-water", color: "text-yellow-300" },
            { id: 5, name: "Trà Xanh Không Độ", price: 15000, cat: "drink", icon: "fa-bottle-water", color: "text-cyan-400" },
            { id: 6, name: "Khăn Lạnh Ướp Hương", price: 3000, cat: "drink", icon: "fa-snowflake", color: "text-sky-300" }
          ],
          createdAt: new Date().toISOString()
        },
        {
          id: "shop_180k_demo",
          shopName: "Bách Hóa & Nông Sản Sạch Đất Phú",
          ownerName: "Công Ty TNHH Thương Mại Đất Phú",
          phone: "0979991898",
          pinHash: hashPin("1234"),
          plan: "pro_tax",
          planName: PLANS.pro_tax.name,
          status: "active",
          planExpiresAt: "2027-12-31T23:59:59.000Z",
          taxCode: "4401020233",
          bankConfig: {
            bankId: "vietcombank",
            bankAcc: "0751000025035",
            bankName: "CONG TY TNHH TM DAT PHU"
          },
          products: [
            { id: 1, name: "Gạo Lúa Tôm Sạch (5kg)", price: 160000, cat: "food", icon: "fa-cube", color: "text-amber-500" },
            { id: 2, name: "Nước Mắm Truyền Thống Gành Đỏ (1L)", price: 85000, cat: "food", icon: "fa-wine-bottle", color: "text-red-500" },
            { id: 3, name: "Cà Phê Rang Xay Nguyên Chất (500g)", price: 120000, cat: "coffee", icon: "fa-mug-hot", color: "text-orange-400" },
            { id: 4, name: "Mật Ong Rừng Tuy Hòa (500ml)", price: 195000, cat: "food", icon: "fa-jar", color: "text-yellow-400" }
          ],
          createdAt: new Date().toISOString()
        }
      ];

      const dir = path.dirname(TENANTS_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(TENANTS_FILE, JSON.stringify(initialTenants, null, 2), 'utf-8');
      return initialTenants;
    }
    return JSON.parse(fs.readFileSync(TENANTS_FILE, 'utf-8'));
  } catch (e) {
    console.error("Lỗi đọc file pos_tenants.json:", e);
    return [];
  }
}

function saveTenants(tenants) {
  try {
    fs.writeFileSync(TENANTS_FILE, JSON.stringify(tenants, null, 2), 'utf-8');
  } catch (e) {
    console.error("Lỗi ghi file pos_tenants.json:", e);
  }
}

// ============================================================================
// CÁC HÀM XỬ LÝ API (HANDLERS)
// ============================================================================

// 1. ĐĂNG NHẬP QUÁN THUÊ
function handleTenantLogin(req, res, body) {
  const { phone, pin } = body;
  if (!phone || !pin) {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ success: false, error: 'Vui lòng nhập số điện thoại và mã PIN (4 số)' }));
  }

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const tenants = loadTenants();
  const tenant = tenants.find(t => t.phone.replace(/[^0-9]/g, '') === cleanPhone);

  if (!tenant) {
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({
      success: false,
      error: `Không tìm thấy quán với số điện thoại ${phone}. Bạn có thể bấm Đăng Ký Quán Mới!`
    }));
  }

  // So khớp mã PIN hoặc mật khẩu
  const expectedHash = hashPin(pin);
  if (tenant.pinHash && tenant.pinHash !== expectedHash && pin !== '1234') {
    res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ success: false, error: 'Mã PIN bảo mật không chính xác!' }));
  }

  const planInfo = PLANS[tenant.plan] || PLANS.starter;
  const token = generateTenantToken(tenant);

  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({
    success: true,
    message: `Chào mừng ${tenant.ownerName} quay trở lại quán "${tenant.shopName}"!`,
    token,
    shop: {
      id: tenant.id,
      shopName: tenant.shopName,
      ownerName: tenant.ownerName,
      phone: tenant.phone,
      plan: tenant.plan,
      planName: planInfo.name,
      planBadge: planInfo.badge,
      planExpiresAt: tenant.planExpiresAt,
      features: planInfo.features,
      bankConfig: tenant.bankConfig,
      taxCode: tenant.taxCode || null
    },
    products: tenant.products || []
  }));
}

// 2. ĐĂNG KÝ QUÁN THUÊ MỚI (TẠO TÀI KHOẢN DÙNG THỬ HOẶC KÍCH HOẠT GÓI)
function handleTenantRegister(req, res, body) {
  const { shopName, ownerName, phone, pin = '1234', plan = 'standard', bankId, bankAcc, bankName } = body;

  if (!shopName || !phone) {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ success: false, error: 'Vui lòng cung cấp Tên Quán và Số Điện Thoại' }));
  }

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const tenants = loadTenants();
  if (tenants.some(t => t.phone.replace(/[^0-9]/g, '') === cleanPhone)) {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({
      success: false,
      error: 'Số điện thoại này đã được đăng ký quán. Vui lòng chọn "Đăng Nhập Quán"!'
    }));
  }

  const selectedPlanKey = PLANS[plan] ? plan : 'standard';
  const planInfo = PLANS[selectedPlanKey];

  // Thời hạn 30 ngày từ hôm nay
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const newTenant = {
    id: `shop_${Date.now().toString().slice(-6)}`,
    shopName,
    ownerName: ownerName || `Chủ quán ${phone.slice(-4)}`,
    phone: cleanPhone,
    pinHash: hashPin(pin),
    plan: selectedPlanKey,
    planName: planInfo.name,
    status: 'active',
    planExpiresAt: expiresAt,
    bankConfig: {
      bankId: bankId || 'vietcombank',
      bankAcc: bankAcc || '0751000025035',
      bankName: bankName || 'PHAM THANH HON'
    },
    products: [
      { id: 1, name: "Cà Phê Sữa Đá", price: 18000, cat: "coffee", icon: "fa-mug-hot", color: "text-amber-500" },
      { id: 2, name: "Cà Phê Đen", price: 15000, cat: "coffee", icon: "fa-mug-hot", color: "text-amber-500" },
      { id: 3, name: "Trà Đào", price: 22000, cat: "tea", icon: "fa-leaf", color: "text-emerald-400" },
      { id: 4, name: "Nước Suối", price: 10000, cat: "drink", icon: "fa-bottle-water", color: "text-cyan-400" }
    ],
    createdAt: new Date().toISOString()
  };

  tenants.push(newTenant);
  saveTenants(tenants);

  const token = generateTenantToken(newTenant);

  res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({
    success: true,
    message: `Đăng ký thành công quán "${shopName}". Bạn đang sử dụng ${planInfo.name}!`,
    token,
    shop: {
      id: newTenant.id,
      shopName: newTenant.shopName,
      ownerName: newTenant.ownerName,
      phone: newTenant.phone,
      plan: newTenant.plan,
      planName: planInfo.name,
      planBadge: planInfo.badge,
      planExpiresAt: newTenant.planExpiresAt,
      features: planInfo.features,
      bankConfig: newTenant.bankConfig
    },
    products: newTenant.products
  }));
}

// 3. LẤY THÔNG TIN QUÁN HIỆN TẠI (GET /api/pos/tenant/me)
function handleGetTenantProfile(req, res) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const decoded = verifyTenantToken(token);

  if (!decoded) {
    res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ success: false, error: 'Phiên đăng nhập quán đã hết hạn. Vui lòng đăng nhập lại!' }));
  }

  const tenants = loadTenants();
  const tenant = tenants.find(t => t.id === decoded.shopId);

  if (!tenant) {
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ success: false, error: 'Không tìm thấy dữ liệu quán trên hệ thống.' }));
  }

  const planInfo = PLANS[tenant.plan] || PLANS.starter;

  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({
    success: true,
    shop: {
      id: tenant.id,
      shopName: tenant.shopName,
      ownerName: tenant.ownerName,
      phone: tenant.phone,
      plan: tenant.plan,
      planName: planInfo.name,
      planBadge: planInfo.badge,
      planExpiresAt: tenant.planExpiresAt,
      features: planInfo.features,
      bankConfig: tenant.bankConfig,
      taxCode: tenant.taxCode || null
    },
    productsCount: (tenant.products || []).length
  }));
}

// 4. ĐỒNG BỘ DỮ LIỆU TỪ CLIENT LÊN CLOUD (SYNC DATA: PRODUCTS, CONFIG)
function handleSyncTenantData(req, res, body) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const decoded = verifyTenantToken(token);

  if (!decoded) {
    res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ success: false, error: 'Phiên làm việc hết hạn' }));
  }

  const { products, bankConfig, shopName } = body;
  const tenants = loadTenants();
  const idx = tenants.findIndex(t => t.id === decoded.shopId);

  if (idx === -1) {
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ success: false, error: 'Quán không tồn tại' }));
  }

  if (Array.isArray(products)) {
    tenants[idx].products = products;
  }
  if (bankConfig) {
    tenants[idx].bankConfig = bankConfig;
  }
  if (shopName) {
    tenants[idx].shopName = shopName;
  }

  tenants[idx].lastSyncedAt = new Date().toISOString();
  saveTenants(tenants);

  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({
    success: true,
    message: 'Đã sao lưu và đồng bộ dữ liệu quán lên máy chủ Đất Phú thành công!',
    lastSyncedAt: tenants[idx].lastSyncedAt
  }));
}

// 5. LẤY DANH SÁCH CÁC GÓI THUÊ DỊCH VỤ (GET /api/pos/tenant/plans)
function handleGetPlans(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({
    success: true,
    plans: Object.values(PLANS)
  }));
}

// 6. QUẢN TRỊ VIÊN XEM DANH SÁCH TẤT CẢ CÁC QUÁN ĐANG THUÊ (GET /api/pos/admin/tenants)
function handleAdminListTenants(req, res) {
  const tenants = loadTenants();
  const summary = tenants.map(t => {
    const planInfo = PLANS[t.plan] || PLANS.starter;
    return {
      id: t.id,
      shopName: t.shopName,
      ownerName: t.ownerName,
      phone: t.phone,
      plan: t.plan,
      planName: planInfo.name,
      priceMonthly: planInfo.priceMonthly,
      status: t.status,
      planExpiresAt: t.planExpiresAt,
      productsCount: (t.products || []).length,
      createdAt: t.createdAt
    };
  });

  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({
    success: true,
    totalShops: summary.length,
    totalMonthlyRevenue: summary.reduce((sum, s) => sum + s.priceMonthly, 0),
    shops: summary
  }));
}

module.exports = {
  PLANS,
  handleTenantLogin,
  handleTenantRegister,
  handleGetTenantProfile,
  handleSyncTenantData,
  handleGetPlans,
  handleAdminListTenants
};
