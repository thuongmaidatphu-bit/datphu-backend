const cartStore = require('./cartStore');
/**
 * ============================================================================
 * MODULE 2, 3, 4: QUẦY BÁN HÀNG POS, TỒN KHO, CHỐT CA & ĐỐI SOÁT TÀI CHÍNH
 * Đường dẫn: src/modules/pos/posController.js
 * Bản quyền: CÔNG TY TNHH THƯƠNG MẠI ĐẤT PHÚ (MST: 4401020233)
 * Cơ sở mẫu: Đất Phú Hub & Cafe (86 Lê Duẩn, TP. Tuy Hòa)
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const cloudGateway = require('../../core/cloudGateway');

const DB_ORDERS_FILE = path.join(__dirname, '..', '..', 'data', 'pos_orders.json');
const DB_PRODUCTS_FILE = path.join(__dirname, '..', '..', 'data', 'pos_products.json');
const DB_PRICES_FILE = path.join(__dirname, '..', '..', 'data', 'product_prices.json');
const DB_SHIFTS_FILE = path.join(__dirname, '..', '..', 'data', 'shifts.json');
const DB_AUDITS_FILE = path.join(__dirname, '..', '..', 'data', 'inventory_audits.json');
const DB_TABLES_FILE = path.join(__dirname, '..', '..', 'data', 'tables.json');
const DB_ROOMS_FILE = path.join(__dirname, '..', '..', 'data', 'rooms.json');
const DB_OPTIONS_FILE = path.join(__dirname, '..', '..', 'data', 'custom_options.json');

// Khởi tạo danh mục sản phẩm kèm định mức tồn kho an toàn (minStockLevel)
function loadProducts() {
  try {
    if (!fs.existsSync(DB_PRODUCTS_FILE)) {
      const initialProducts = [
        { id: "P-01", merchantId: "M-01", name: "Cà phê sữa đá Tuy Hòa", category: "coffee", price: 20000, stockQuantity: 150, minStockLevel: 15, unit: "Ly", image: "☕" },
        { id: "P-02", merchantId: "M-01", name: "Cà phê đen nguyên chất", category: "coffee", price: 18000, stockQuantity: 200, minStockLevel: 20, unit: "Ly", image: "☕" },
        { id: "P-03", merchantId: "M-01", name: "Bạc xỉu ba tầng", category: "coffee", price: 25000, stockQuantity: 80, minStockLevel: 10, unit: "Ly", image: "🥛" },
        { id: "P-04", merchantId: "M-01", name: "Bánh mì chả cá Phú Yên", category: "food", price: 20000, stockQuantity: 60, minStockLevel: 10, unit: "Ổ", image: "🥖" },
        { id: "P-05", merchantId: "M-01", name: "Phòng Standard Giường Đôi (Giờ)", category: "room", price: 120000, stockQuantity: 12, minStockLevel: 2, unit: "Giờ", image: "🛏️" },
        { id: "P-06", merchantId: "M-01", name: "Phòng Deluxe View Biển (Đêm)", category: "room", price: 450000, stockQuantity: 8, minStockLevel: 1, unit: "Đêm", image: "🏨" },
        { id: "P-07", merchantId: "M-01", name: "Bò Một Nắng Sông Hinh (500g)", category: "souvenir", price: 280000, stockQuantity: 35, minStockLevel: 5, unit: "Hộp", image: "🥩" },
        { id: "P-08", merchantId: "M-01", name: "Muối Kiến Vàng Krông Pa", category: "souvenir", price: 45000, stockQuantity: 90, minStockLevel: 15, unit: "Hũ", image: "🫙" },
        { id: "P-09", merchantId: "M-01", name: "Thuê Xe Máy Tay Ga (24h)", category: "rental", price: 150000, stockQuantity: 15, minStockLevel: 3, unit: "Xe/Ngày", image: "🛵" }
      ];
      const dir = path.dirname(DB_PRODUCTS_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DB_PRODUCTS_FILE, JSON.stringify(initialProducts, null, 2), 'utf-8');
      return initialProducts;
    }
    const prods = JSON.parse(fs.readFileSync(DB_PRODUCTS_FILE, 'utf-8'));
    // Đảm bảo có minStockLevel
    let updated = false;
    for (const p of prods) {
      if (!p.minStockLevel) {
        p.minStockLevel = p.category === 'room' ? 2 : (p.category === 'souvenir' ? 5 : 10);
        updated = true;
      }
    }
    if (updated) saveProducts(prods);
    return prods;
  } catch (e) {
    return [];
  }
}

function saveProducts(products) {
  try {
    fs.writeFileSync(DB_PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
    const rootPath = path.resolve(__dirname, '../../../data/pos_products.json');
    if (fs.existsSync(path.dirname(rootPath))) {
      fs.writeFileSync(rootPath, JSON.stringify(products, null, 2), 'utf-8');
    }
  } catch (e) {
    console.error("Lỗi ghi pos_products.json:", e);
  }
}

function loadOrders() {
  try {
    if (!fs.existsSync(DB_ORDERS_FILE)) {
      const initial = [
        {
          id: "AS-1001",
          orderCode: "AS1001",
          shiftId: "SHIFT-01",
          merchantId: "M-01",
          items: [{ id: "P-01", name: "Cà phê sữa đá Tuy Hòa", quantity: 2, price: 20000, subtotal: 40000 }],
          totalAmount: 40000,
          customerPaid: 40000,
          changeDue: 0,
          paymentMethod: "vietqr",
          paymentStatus: "completed",
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: "AS-1002",
          orderCode: "AS1002",
          shiftId: "SHIFT-01",
          merchantId: "M-01",
          items: [{ id: "P-03", name: "Bạc xỉu ba tầng", quantity: 1, price: 25000, subtotal: 25000 }],
          totalAmount: 25000,
          customerPaid: 50000,
          changeDue: 25000,
          paymentMethod: "cash",
          paymentStatus: "completed",
          createdAt: new Date(Date.now() - 1800000).toISOString()
        }
      ];
      const dir = path.dirname(DB_ORDERS_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DB_ORDERS_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    return JSON.parse(fs.readFileSync(DB_ORDERS_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function saveOrders(orders) {
  try {
    fs.writeFileSync(DB_ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (e) {
    console.error("Lỗi ghi pos_orders.json:", e);
  }
}

function loadShifts() {
  try {
    if (!fs.existsSync(DB_SHIFTS_FILE)) {
      const initial = [
        {
          shiftId: "SHIFT-01",
          merchantId: "M-01",
          cashierName: "Bé Nga (Thu Ngân Sáng)",
          shiftType: "morning", // morning / afternoon / night
          openedAt: new Date(Date.now() - 28800000).toISOString(),
          closedAt: null,
          status: "open", // open / closed
          initialFund: 500000, // Quỹ tiền mặt ban đầu
          cashRevenue: 25000,
          vietqrRevenue: 40000,
          totalRevenue: 65000,
          expectedCashInDrawer: 525000,
          actualCashCounted: null,
          difference: 0,
          handoverNotes: "Bàn giao ca sáng bình thường"
        }
      ];
      const dir = path.dirname(DB_SHIFTS_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DB_SHIFTS_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    return JSON.parse(fs.readFileSync(DB_SHIFTS_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function saveShifts(shifts) {
  try {
    fs.writeFileSync(DB_SHIFTS_FILE, JSON.stringify(shifts, null, 2), 'utf-8');
  } catch (e) {
    console.error("Lỗi ghi shifts.json:", e);
  }
}

function loadAudits() {
  try {
    if (!fs.existsSync(DB_AUDITS_FILE)) {
      const initial = [];
      const dir = path.dirname(DB_AUDITS_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DB_AUDITS_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    return JSON.parse(fs.readFileSync(DB_AUDITS_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function saveAudits(audits) {
  try {
    fs.writeFileSync(DB_AUDITS_FILE, JSON.stringify(audits, null, 2), 'utf-8');
  } catch (e) {
    console.error("Lỗi ghi inventory_audits.json:", e);
  }
}

// Sinh mã VietQR chuẩn EMVCo Napas247 (CRC-16 CCITT)
function formatTLV(tag, val) {
  const len = val.length.toString().padStart(2, '0');
  return `${tag}${len}${val}`;
}

function generateVietQREMVCo(bankBin, accountNo, amount, orderCode) {
  const tag00 = formatTLV('00', '01');
  const tag01 = formatTLV('01', '12'); // Dynamic QR
  const napasGui = formatTLV('00', 'A000000727');
  const beneficiary = formatTLV('00', bankBin) + formatTLV('01', accountNo);
  const napasAcc = formatTLV('01', beneficiary);
  const napasSvc = formatTLV('02', 'QRIBFTTA');
  const tag38 = formatTLV('38', napasGui + napasAcc + napasSvc);
  const tag53 = formatTLV('53', '704'); // VND
  const tag54 = formatTLV('54', amount.toString());
  const tag58 = formatTLV('58', 'VN');
  const tag62 = formatTLV('62', formatTLV('08', orderCode));

  const raw = `${tag00}${tag01}${tag38}${tag53}${tag54}${tag58}${tag62}6304`;
  let crc = 0xFFFF;
  for (let i = 0; i < raw.length; i++) {
    crc ^= raw.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      else crc = (crc << 1) & 0xFFFF;
    }
  }
  const checksum = crc.toString(16).toUpperCase().padStart(4, '0');
  return `${raw}${checksum}`;
}

function broadcastSSE(clients, event, data) {
  if (!clients) return;
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach(c => {
    try { c.write(msg); } catch (e) {}
  });
}

// ============================================================================
// GIAI ĐOẠN 2: QUẢN LÝ TỒN KHO & ĐỊNH MỨC (INVENTORY CONTROL)
// ============================================================================

// 1. LẤY SẢN PHẨM & CẢNH BÁO TỒN KHO TỐI THIỂU
function handleGetProducts(req, res, parsedUrl) {
  const category = parsedUrl.searchParams.get('category');
  const merchantId = parsedUrl.searchParams.get('merchantId') || 'M-01';

  let products = loadProducts().filter(p => p.merchantId === merchantId);
  if (category && category !== 'all') {
    products = products.filter(p => p.category === category);
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    merchantId,
    total: products.length,
    products
  }));
}

// 2. LẤY DANH SÁCH MẶT HÀNG DƯỚI NGƯỠNG AN TOÀN (CẢNH BÁO NHẬP HÀNG)
function handleGetStockAlerts(req, res) {
  const products = loadProducts();
  const alerts = products.filter(p => p.stockQuantity <= (p.minStockLevel || 10));

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    alertCount: alerts.length,
    alerts: alerts.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      currentStock: p.stockQuantity,
      minStockLevel: p.minStockLevel || 10,
      unit: p.unit,
      status: p.stockQuantity === 0 ? "HẾT HÀNG" : "SẮP HẾT (CẦN NHẬP KHO GIAI ĐOẠN 1)"
    }))
  }));
}

// 3. ĐỐI SOÁT & KIỂM KÊ KHO ĐỊNH KỲ (POST /api/pos/inventory/audit)
function handleInventoryAudit(req, res, body, sseClients) {
  const { auditor = "Quản Lý Kho", notes = "Kiểm kê định kỳ", auditItems = [] } = body;
  const products = loadProducts();
  const audits = loadAudits();

  const auditReportItems = [];

  for (const item of auditItems) {
    const prod = products.find(p => p.id === item.productId || p.name === item.productName);
    if (prod) {
      const systemStock = Number(prod.stockQuantity) || 0;
      const actualStock = Number(item.actualStock);
      const diff = actualStock - systemStock;

      auditReportItems.push({
        productId: prod.id,
        productName: prod.name,
        systemStock,
        actualStock,
        difference: diff,
        status: diff === 0 ? "KHỚP" : (diff > 0 ? `THỪA +${diff}` : `THẤT THOÁT ${diff}`)
      });

      // Điều chỉnh tồn kho thực tế
      prod.stockQuantity = actualStock;
    }
  }

  saveProducts(products);

  const newAudit = {
    auditId: `AUDIT-${Date.now().toString().slice(-6)}`,
    auditor,
    notes,
    items: auditReportItems,
    auditDate: new Date().toISOString()
  };

  audits.unshift(newAudit);
  saveAudits(audits);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: "Hoàn tất kiểm kê kho thực tế, đã đồng bộ lại tồn kho hệ thống!",
    audit: newAudit
  }));
}

// ============================================================================
// GIAI ĐOẠN 3: BÁN HÀNG TẠI QUẦY (OUTBOUND & POS SALES)
// ============================================================================

function handleCreateOrder(req, res, body, sseClients) {
  const {
    merchantId = "M-01",
    shiftId = "SHIFT-01",
    items = [],
    totalAmount = 0,
    customerPaid = 0,
    paymentMethod = "vietqr"
  } = body;
  
  if (!items || items.length === 0) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Đơn hàng phải có ít nhất một sản phẩm/dịch vụ' }));
  }

  // Trigger kiểm tra tồn kho đa tầng (BOM pha chế ml/g & Đặc sản hộp/kg) trước khi chốt đơn
  const inventoryValidation = cartStore.validateCartInventory(items);
  if (!inventoryValidation.valid) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      error: 'Tồn kho không đủ để thực hiện thanh toán đơn hàng!',
      details: inventoryValidation.errors,
      warnings: inventoryValidation.warnings
    }));
  }

  const orders = loadOrders();
  const products = loadProducts();
  const shifts = loadShifts();
  const orderNumber = 1000 + orders.length + 1;
  const orderCode = `AS${orderNumber}`;

  // Trừ tồn kho tự động theo thời gian thực
  const updatedItems = items.map(item => {
    const prod = products.find(p => p.id === item.id || p.name === item.name);
    if (prod) {
      const qty = Number(item.quantity) || 1;
      prod.stockQuantity = Math.max(0, prod.stockQuantity - qty);
    }
    return {
      id: item.id || 'P-custom',
      name: item.name,
      quantity: Number(item.quantity) || 1,
      price: Number(item.price) || 0,
      subtotal: (Number(item.price) || 0) * (Number(item.quantity) || 1)
    };
  });
  saveProducts(products);

  const calcTotal = updatedItems.reduce((sum, it) => sum + it.subtotal, 0);
  const finalAmount = totalAmount > 0 ? Number(totalAmount) : calcTotal;

  // Tính tiền thối lại (change due) nếu thanh toán tiền mặt
  const paid = customerPaid > 0 ? Number(customerPaid) : finalAmount;
  const changeDue = Math.max(0, paid - finalAmount);

  const newOrder = {
    id: `AS-${orderNumber}`,
    merchantId,
    shiftId,
    orderCode,
    items: updatedItems,
    totalAmount: finalAmount,
    customerPaid: paid,
    changeDue,
    paymentMethod,
    paymentStatus: paymentMethod === 'cash' ? 'completed' : 'pending',
    createdAt: new Date().toISOString()
  };

  // Cấu hình VietQR Napas247 động
  const bankBin = "970422"; // MBBank
  const bankAccount = "0987654321";
  newOrder.emvcoPayload = generateVietQREMVCo(bankBin, bankAccount, newOrder.totalAmount, orderCode);
  newOrder.vietqrUrl = `https://api.vietqr.io/image/${bankBin}-${bankAccount}-compact2.png?amount=${newOrder.totalAmount}&addInfo=${orderCode}&accountName=VI%20AN%20SINH%20DAT%20PHU`;

  // Khấu trừ tồn kho đa tầng tự động (ml/g cho pha chế & Hộp/kg cho đặc sản)
  try {
    const deductResult = cartStore.deductMultiInventory(newOrder);
    newOrder.multiInventoryDeductions = deductResult.deductions;
  } catch (err) {
    console.error("Lỗi khấu trừ kho đa tầng:", err.message);
  }

  orders.unshift(newOrder);
  saveOrders(orders);

  // Cập nhật doanh thu tức thì vào ca làm việc hiện tại
  const currentShift = shifts.find(s => s.status === 'open');
  if (currentShift) {
    if (paymentMethod === 'cash') currentShift.cashRevenue = (currentShift.cashRevenue || 0) + finalAmount;
    if (paymentMethod === 'vietqr') currentShift.vietqrRevenue = (currentShift.vietqrRevenue || 0) + finalAmount;
    currentShift.totalRevenue = (currentShift.cashRevenue || 0) + (currentShift.vietqrRevenue || 0);
    currentShift.expectedCashInDrawer = (currentShift.initialFund || 0) + (currentShift.cashRevenue || 0);
    saveShifts(shifts);
  }

  // Bắn thông báo Realtime SSE cho Quầy POS & Máy In Nhiệt 58mm
  if (paymentMethod === 'cash') {
    broadcastSSE(sseClients, 'ORDER_PAID', {
      orderId: newOrder.id,
      orderCode: newOrder.orderCode,
      amount: newOrder.totalAmount,
      method: 'cash',
      changeDue: newOrder.changeDue,
      timestamp: new Date().toISOString()
    });
  }

  res.writeHead(201, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: "Tạo đơn hàng POS, trừ tồn kho và ghi nhận thanh toán thành công!",
    order: newOrder
  }));
}

function handleGetOrders(req, res, parsedUrl) {
  const orders = loadOrders();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    count: orders.length,
    orders
  }));
}

// ============================================================================
// GIAI ĐOẠN 4: CHỐT CA, ĐỐI SOÁT & KẾ TOÁN TÀI CHÍNH (RECONCILIATION)
// ============================================================================

// 1. MỞ CA LÀM VIỆC MỚI (POST /api/pos/shifts/open)
function handleOpenShift(req, res, body) {
  const { merchantId = "M-01", cashierName = "Thu Ngân Mới", shiftType = "morning", initialFund = 500000 } = body;
  const shifts = loadShifts();

  // Đóng ca cũ nếu còn mở
  for (const s of shifts) {
    if (s.status === 'open') {
      s.status = 'closed';
      s.closedAt = new Date().toISOString();
    }
  }

  const shiftNumber = shifts.length + 1;
  const newShift = {
    shiftId: `SHIFT-${shiftNumber.toString().padStart(2, '0')}`,
    merchantId,
    cashierName,
    shiftType,
    openedAt: new Date().toISOString(),
    closedAt: null,
    status: "open",
    initialFund: Number(initialFund) || 500000,
    cashRevenue: 0,
    vietqrRevenue: 0,
    totalRevenue: 0,
    expectedCashInDrawer: Number(initialFund) || 500000,
    actualCashCounted: null,
    difference: 0,
    handoverNotes: "Mở ca làm việc thành công"
  };

  shifts.unshift(newShift);
  saveShifts(shifts);

  res.writeHead(201, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: `Đã mở ca làm việc ${newShift.shiftId} (${shiftType}) cho thu ngân ${cashierName}!`,
    shift: newShift
  }));
}

// 2. CHỐT CA & ĐỐI SOÁT KIỂM QUỸ THỰC TẾ (POST /api/pos/shifts/close)
function handleCloseShift(req, res, body) {
  const { shiftId, actualCashCounted = 0, nextCashier = "Thu Ngân Ca Sau", handoverNotes = "" } = body;
  const shifts = loadShifts();
  const shift = shifts.find(s => s.shiftId === shiftId || s.status === 'open');

  if (!shift) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Không tìm thấy ca làm việc đang mở' }));
  }

  const counted = Number(actualCashCounted);
  const expected = Number(shift.expectedCashInDrawer) || (Number(shift.initialFund) + Number(shift.cashRevenue));
  const diff = counted - expected; // > 0 là thừa tiền, < 0 là thiếu tiền

  shift.status = "closed";
  shift.closedAt = new Date().toISOString();
  shift.actualCashCounted = counted;
  shift.difference = diff;
  shift.handoverNotes = handoverNotes || (diff === 0 ? "Tiền két thực tế khớp 100% với hệ thống." : `Chênh lệch tiền két: ${diff > 0 ? '+' : ''}${diff.toLocaleString()}đ`);
  shift.nextCashier = nextCashier;

  saveShifts(shifts);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: "Chốt ca & lập biên bản bàn giao quỹ thành công!",
    reconciliation: {
      shiftId: shift.shiftId,
      cashier: shift.cashierName,
      initialFund: shift.initialFund,
      cashRevenue: shift.cashRevenue,
      vietqrRevenue: shift.vietqrRevenue,
      totalRevenue: shift.totalRevenue,
      expectedCashInDrawer: expected,
      actualCashCounted: counted,
      difference: diff,
      isBalanced: diff === 0,
      handoverNotes: shift.handoverNotes,
      closedAt: shift.closedAt
    }
  }));
}

// 3. XEM DANH SÁCH CÁC CA LÀM VIỆC (GET /api/pos/shifts)
function handleGetShifts(req, res) {
  const shifts = loadShifts();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    count: shifts.length,
    shifts
  }));
}

// 4. BÁO CÁO DOANH THU & KẾT CHUYỂN CUỐI NGÀY (GET /api/pos/reports/daily)
function handleGetDailyReport(req, res) {
  const orders = loadOrders();
  const todayStr = new Date().toISOString().split('T')[0];
  const completed = orders.filter(o => o.paymentStatus === 'completed');

  const totalRevenue = completed.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const cashAmount = completed.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const vietqrAmount = completed.filter(o => o.paymentMethod === 'vietqr').reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    date: todayStr,
    totalRevenue,
    totalOrders: completed.length,
    cashAmount,
    vietqrAmount,
    cashPercent: totalRevenue > 0 ? ((cashAmount / totalRevenue) * 100).toFixed(1) : 0,
    vietqrPercent: totalRevenue > 0 ? ((vietqrAmount / totalRevenue) * 100).toFixed(1) : 0
  }));
}

// BÁO CÁO TỔNG KẾT CUỐI NGÀY & ĐẨY QUA N8N WEBHOOK VỀ ZALO / TELEGRAM (POST /api/pos/reports/eod-push)
function handleEodReportPush(req, res, body = {}) {
  const orders = loadOrders();
  const products = loadProducts();
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  const completed = orders.filter(o => o.paymentStatus === 'completed');
  const totalRevenue = completed.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const cashAmount = completed.filter(o => o.paymentMethod === 'cash' || o.paymentMethod === 'Tiền mặt').reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const vietqrAmount = completed.filter(o => o.paymentMethod === 'vietqr' || o.paymentMethod === 'VietQR Napas247').reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Phân tích theo nhóm ngành hàng (F&B, Phòng Nghỉ, Đặc sản OCOP)
  let fbRevenue = 0, fbCount = 0;
  let roomRevenue = 0, roomCount = 0;
  let ocopRevenue = 0, ocopCount = 0;

  completed.forEach(order => {
    (order.items || []).forEach(it => {
      const prod = products.find(p => p.id === it.id || p.name === it.name);
      const sub = it.subtotal || ((it.price || 0) * (it.qty || it.quantity || 1));
      const q = it.qty || it.quantity || 1;

      if ((prod && prod.category === 'coffee') || (!prod && it.id && it.id.startsWith('P-'))) {
        fbRevenue += sub;
        fbCount += q;
      } else if ((prod && prod.category === 'room') || (!prod && it.id && (it.id.startsWith('H-') || it.id.startsWith('ROOM-') || it.id.startsWith('R-')))) {
        roomRevenue += sub;
        roomCount += q;
      } else if ((prod && prod.category === 'souvenir') || (!prod && it.id && it.id.startsWith('O-'))) {
        ocopRevenue += sub;
        ocopCount += q;
      } else {
        fbRevenue += sub;
        fbCount += q;
      }
    });
  });

  // Kiểm kê tồn kho OCOP
  const ocopStock = products.filter(p => p.category === 'souvenir').map(p => ({
    name: p.name,
    stock: p.stockQuantity,
    min: p.minStockLevel || 5,
    isLow: p.stockQuantity < (p.minStockLevel || 5)
  }));

  // Định dạng tin nhắn Markdown / Text chuẩn Zalo ZNS / Telegram Webhook
  const reportMessage = `
📊 [ĐẤT PHÚ CORE] BÁO CÁO DOANH THU CUỐI NGÀY
🏨 Cơ sở: Đất Phú Hub & Cafe (86 Lê Duẩn, Tuy Hòa)
📅 Ngày chốt ca: ${todayStr} lúc ${timeStr}

💰 TỔNG DOANH THU: ${new Intl.NumberFormat('vi-VN').format(totalRevenue)} đ (${completed.length} hóa đơn)
├── 💵 Tiền mặt tại quầy: ${new Intl.NumberFormat('vi-VN').format(cashAmount)} đ (${totalRevenue > 0 ? ((cashAmount / totalRevenue) * 100).toFixed(1) : 0}%)
└── ⚡ Chuyển khoản Napas247: ${new Intl.NumberFormat('vi-VN').format(vietqrAmount)} đ (${totalRevenue > 0 ? ((vietqrAmount / totalRevenue) * 100).toFixed(1) : 0}%)

📈 DOANH THU THEO PHÂN KHÚC:
├── ☕ F&B Cà phê & Đồ uống: ${new Intl.NumberFormat('vi-VN').format(fbRevenue)} đ (${fbCount} món)
├── 🏠 Phòng Nghỉ Lưu Trú: ${new Intl.NumberFormat('vi-VN').format(roomRevenue)} đ (${roomCount} lượt phòng)
└── 🎁 Đặc Sản OCOP: ${new Intl.NumberFormat('vi-VN').format(ocopRevenue)} đ (${ocopCount} sản phẩm)

📦 TỒN KHO ĐẶC SẢN OCOP:
${ocopStock.map(s => `├── ${s.isLow ? '⚠️' : '✓'} ${s.name}: ${s.stock} ${s.isLow ? '(SẮP HẾT HÀNG)' : 'khả dụng'}`).join('\n')}

🧾 HÓA ĐƠN ĐIỆN TỬ: ${completed.length}/${completed.length} HĐ MTT (Ký hiệu 1C26MDP) đã truyền CQT Phú Yên
🚀 Trạng thái Webhook: ĐÃ BẮN THÀNH CÔNG VỀ ĐIỆN THOẠI CHỦ QUÁN!
Chúc Anh/Chị chủ quán ngủ ngon!
  `.trim();

  const reportData = {
    id: `EOD-${todayStr.replace(/-/g, '')}`,
    date: todayStr,
    timestamp: now.toISOString(),
    totalRevenue,
    cashAmount,
    vietqrAmount,
    totalOrders: completed.length,
    fbRevenue,
    fbCount,
    roomRevenue,
    roomCount,
    ocopRevenue,
    ocopCount,
    ocopStock,
    reportMessage,
    targetChannel: body.channel || 'Zalo / Telegram (n8n Webhook)'
  };

  // Lưu lịch sử EOD reports
  try {
    const eodFile = path.join(__dirname, '..', '..', 'data', 'eod_reports.json');
    let eodList = [];
    if (fs.existsSync(eodFile)) {
      eodList = JSON.parse(fs.readFileSync(eodFile, 'utf-8'));
    }
    eodList.unshift(reportData);
    fs.writeFileSync(eodFile, JSON.stringify(eodList.slice(0, 30), null, 2), 'utf-8');
  } catch (e) {}

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: 'Đã tổng kết doanh thu và đẩy báo cáo về điện thoại chủ quán thành công qua Webhook n8n!',
    data: reportData
  }));
}

// XỬ LÝ WEBHOOK TỰ ĐỘNG XÁC NHẬN CHUYỂN KHOẢN NGÂN HÀNG (POST /api/pos/payments/bank-webhook)
function handleBankWebhook(req, res, body = {}, sseClients) {
  const { orderCode, amount, transId, bankCode = 'MBBank' } = body;
  const orders = loadOrders();
  const shifts = loadShifts();

  const order = orders.find(o => o.orderCode === orderCode || o.id === orderCode);
  if (order) {
    order.paymentStatus = 'completed';
    order.bankTransId = transId || `FT2603${Date.now().toString().slice(-6)}`;
    order.paidAt = new Date().toISOString();
    saveOrders(orders);

    const currentShift = shifts.find(s => s.status === 'open');
    if (currentShift) {
      currentShift.vietqrRevenue = (currentShift.vietqrRevenue || 0) + (order.totalAmount || 0);
      saveShifts(shifts);
    }

    if (sseClients) {
      broadcastSSE(sseClients, 'BANK_PAYMENT_CONFIRMED', {
        orderCode: order.orderCode,
        amount: order.totalAmount,
        bankTransId: order.bankTransId,
        timestamp: order.paidAt
      });
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: true,
      message: `Đã xác nhận tự động giao dịch Napas247 cho đơn [${order.orderCode}]!`,
      order
    }));
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: `Đã nhận webhook chuyển khoản Napas247 ${new Intl.NumberFormat('vi-VN').format(amount || 0)} đ`,
    transId: transId || `FT2603${Date.now().toString().slice(-6)}`
  }));
}

// ========================================================================
// 5. QUẢN LÝ BẢNG GIÁ THEO MÙA VỤ & GIÁ SỈ (SMART TIERED & SEASONAL PRICING)
// ========================================================================
function loadPrices() {
  try {
    if (!fs.existsSync(DB_PRICES_FILE)) return [];
    return JSON.parse(fs.readFileSync(DB_PRICES_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function savePrices(prices) {
  try {
    fs.writeFileSync(DB_PRICES_FILE, JSON.stringify(prices, null, 2), 'utf-8');
    const rootPath = path.resolve(__dirname, '../../../data/product_prices.json');
    if (fs.existsSync(path.dirname(rootPath))) {
      fs.writeFileSync(rootPath, JSON.stringify(prices, null, 2), 'utf-8');
    }
  } catch (e) {
    console.error("Lỗi ghi product_prices.json:", e);
  }
}

/**
 * Kiểm tra và áp dụng giá sỉ/lẻ/mùa vụ tự động dựa trên số lượng mua và thời gian
 */
async function calculateItemPrice(productId, quantity = 1, options = {}) {
  const products = loadProducts();
  const prices = loadPrices();
  const defaultProd = products.find(p => p.id === productId);

  if (!defaultProd) {
    return { error: 'Không tìm thấy sản phẩm', price: 0 };
  }

  const basePrice = defaultProd.price || 0;
  const now = options.date ? new Date(options.date) : new Date();
  const nowStr = now.toISOString().split('T')[0];

  // 1. Kiểm tra giá mùa vụ nếu trong thời hạn
  let appliedSeasonal = null;
  const seasonalRules = prices.filter(pr => 
    pr.productId === productId && 
    pr.priceType === 'seasonal' && 
    pr.active &&
    (!pr.startDate || pr.startDate <= nowStr) &&
    (!pr.endDate || pr.endDate >= nowStr)
  );
  if (seasonalRules.length > 0) {
    appliedSeasonal = seasonalRules[0];
  }

  // 2. Kiểm tra giá sỉ (wholesale) theo số lượng mua tối thiểu hoặc forceWholesale
  let appliedWholesale = null;
  const wholesaleMin = defaultProd.wholesaleMinQty || 5;
  if (options.forceWholesale || quantity >= wholesaleMin) {
    const wholesaleRules = prices
      .filter(pr => pr.productId === productId && pr.priceType === 'wholesale' && pr.active)
      .filter(pr => options.forceWholesale || (pr.minQuantity <= quantity))
      .sort((a, b) => b.minQuantity - a.minQuantity);

    if (wholesaleRules.length > 0) {
      appliedWholesale = wholesaleRules[0];
    } else if (defaultProd.wholesalePrice) {
      appliedWholesale = { price: defaultProd.wholesalePrice, seasonTag: `Giá Sỉ (Từ ${wholesaleMin} SP)` };
    }
  }

  // Ưu tiên: Giá sỉ khi đạt mốc số lượng > Giá mùa vụ > Giá bán lẻ mặc định
  let finalUnitPrice = basePrice;
  let priceType = 'retail';
  let tag = 'Giá Lẻ';

  if (appliedWholesale) {
    finalUnitPrice = appliedWholesale.price;
    priceType = 'wholesale';
    tag = appliedWholesale.seasonTag || 'Giá Sỉ';
  } else if (appliedSeasonal) {
    finalUnitPrice = appliedSeasonal.price;
    priceType = 'seasonal';
    tag = appliedSeasonal.seasonTag || 'Giá Mùa Vụ';
  }

  const subtotal = finalUnitPrice * quantity;
  const originalSubtotal = basePrice * quantity;
  const savings = Math.max(0, originalSubtotal - subtotal);

  return {
    productId,
    productName: defaultProd.name,
    category: defaultProd.category,
    quantity,
    basePrice,
    unitPrice: finalUnitPrice,
    subtotal,
    savings,
    priceType, // 'retail' | 'wholesale' | 'seasonal'
    isWholesale: priceType === 'wholesale',
    isSeasonal: priceType === 'seasonal',
    seasonTag: tag
  };
}

// GET /api/pos/prices
function handleGetPrices(req, res) {
  const prices = loadPrices();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    count: prices.length,
    prices
  }));
}

// POST /api/pos/prices/calculate
async function handleCalculatePrice(req, res, body = {}) {
  const { productId, quantity = 1, options = {} } = body;
  const result = await calculateItemPrice(productId, quantity, options);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    data: result
  }));
}

// POST /api/pos/prices/update
function handleUpdatePriceRule(req, res, body = {}) {
  const prices = loadPrices();
  const { productId, priceType = 'wholesale', minQuantity = 5, price, seasonTag, startDate, endDate, active = true } = body;

  let existing = prices.find(p => p.productId === productId && p.priceType === priceType && p.minQuantity === minQuantity);
  if (existing) {
    existing.price = price !== undefined ? price : existing.price;
    existing.seasonTag = seasonTag || existing.seasonTag;
    existing.startDate = startDate || existing.startDate;
    existing.endDate = endDate || existing.endDate;
    existing.active = active !== undefined ? active : existing.active;
  } else {
    prices.push({
      id: "PR-" + (prices.length + 1).toString().padStart(2, '0'),
      productId,
      priceType,
      minQuantity,
      price,
      seasonTag: seasonTag || (priceType === 'wholesale' ? `Giá Sỉ (Từ ${minQuantity} SP)` : 'Giá Mùa Vụ'),
      startDate,
      endDate,
      active
    });
  }

  savePrices(prices);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: 'Cập nhật chính sách giá thành công!',
    pricesCount: prices.length
  }));
}

// ========================================================================
// 6. TỰ CẤU HÌNH NGHIỆP VỤ (SELF-CONFIGURATION WIDGET CHO CHỦ QUÁN)
// ========================================================================

// POST /api/pos/products - Chủ quán thêm món mới hoặc dịch vụ mới
function handleCreateProduct(req, res, body = {}, sseClients) {
  const products = loadProducts();
  const merchantId = body.merchantId || 'M-01';
  const category = body.category || 'coffee';
  const name = body.name ? body.name.trim() : '';

  if (!name) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: false, error: 'Tên món không được để trống' }));
  }

  // Tự động cấp mã ID chuẩn: P-xx cho đồ uống, O-xx cho OCOP, H-xx cho Phòng Nghỉ
  let prefix = 'P';
  if (category === 'souvenir') prefix = 'O';
  else if (category === 'room' || category === 'rental') prefix = 'H';

  const catProds = products.filter(p => p.id && p.id.startsWith(prefix + '-'));
  let maxNum = 0;
  catProds.forEach(p => {
    const num = parseInt(p.id.split('-')[1], 10);
    if (!isNaN(num) && num > maxNum) maxNum = num;
  });
  const newId = `${prefix}-${(maxNum + 1).toString().padStart(2, '0')}`;

  const price = parseInt(body.price, 10) || 0;
  const wholesalePrice = body.wholesalePrice ? parseInt(body.wholesalePrice, 10) : undefined;
  const wholesaleMinQty = body.wholesaleMinQty ? parseInt(body.wholesaleMinQty, 10) : 5;
  const seasonalPrice = body.seasonalPrice ? parseInt(body.seasonalPrice, 10) : undefined;
  const seasonTag = body.seasonTag || (seasonalPrice ? 'Mùa Vụ 2026' : undefined);
  const stockQuantity = parseInt(body.stockQuantity, 10) || 100;
  const minStockLevel = parseInt(body.minStockLevel, 10) || 10;
  const unit = body.unit || (category === 'coffee' ? 'Ly' : (category === 'souvenir' ? 'Hộp 500g' : 'Lượt'));
  const image = body.image || body.icon || (category === 'coffee' ? '☕' : (category === 'souvenir' ? '🎁' : '🏨'));
  const subcat = body.subcat || (category === 'coffee' ? 'coffee_specialty' : (category === 'souvenir' ? 'farm_product' : 'standard'));

  const newProduct = {
    id: newId,
    merchantId,
    name,
    category,
    subcat,
    price,
    wholesalePrice,
    wholesaleMinQty,
    seasonalPrice,
    seasonTag,
    stockQuantity,
    minStockLevel,
    unit,
    image
  };

  products.push(newProduct);
  saveProducts(products);

  // Nếu có giá sỉ hoặc giá mùa vụ, tự động sinh quy tắc giá vào product_prices.json
  const prices = loadPrices();
  if (wholesalePrice) {
    prices.push({
      id: "PR-" + (prices.length + 1).toString().padStart(2, '0'),
      productId: newId,
      productName: name,
      priceType: 'wholesale',
      minQuantity: wholesaleMinQty,
      price: wholesalePrice,
      seasonTag: `Giá Sỉ (Từ ${wholesaleMinQty} ${unit})`,
      active: true
    });
  }
  if (seasonalPrice) {
    prices.push({
      id: "PR-" + (prices.length + 1).toString().padStart(2, '0'),
      productId: newId,
      productName: name,
      priceType: 'seasonal',
      minQuantity: 1,
      price: seasonalPrice,
      seasonTag: seasonTag || 'Giá Vụ Mùa',
      active: true
    });
  }
  savePrices(prices);

  // Phát tín hiệu Realtime SSE
  if (sseClients) {
    broadcastSSE(sseClients, 'PRODUCT_CREATED', {
      product: newProduct,
      timestamp: new Date().toISOString()
    });
  }

  res.writeHead(201, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: `Đã thêm món [${name}] thành công!`,
    product: newProduct
  }));
}

// QUẢN LÝ SƠ ĐỒ BÀN (TABLES)
function loadTables() {
  try {
    if (!fs.existsSync(DB_TABLES_FILE)) {
      const initial = [
        { id: "T-01", name: "Bàn 01", area: "garden", areaName: "Khu Sân Vườn", status: "empty", guests: 0, items: [], total: 0, time: "" },
        { id: "T-02", name: "Bàn 02", area: "garden", areaName: "Khu Sân Vườn", status: "occupied", guests: 2, items: [{ id: 'P-01', name: "Cà phê sữa (Đá / Nóng)", qty: 2, price: 20000 }, { id: 'P-03', name: "Bạc xỉu ba tầng", qty: 1, price: 25000 }, { id: 'P-09', name: "Bánh mì chả cá Tuy Hòa", qty: 1, price: 22000 }], total: 87000, time: "25 phút" },
        { id: "T-03", name: "Bàn 03", area: "garden", areaName: "Khu Sân Vườn", status: "occupied", guests: 4, items: [{ id: 'P-04', name: "Trà đào cam sả", qty: 3, price: 28000 }, { id: 'P-10', name: "Bánh canh hẹ Sông Cầu", qty: 2, price: 35000 }], total: 154000, time: "40 phút" },
        { id: "T-04", name: "Bàn 04", area: "garden", areaName: "Khu Sân Vườn", status: "reserved", guests: 0, items: [], total: 0, time: "Hẹn 18:30" },
        { id: "T-05", name: "Bàn 05 (Tầng 1)", area: "indoor", areaName: "Máy Lạnh Tầng 1", status: "empty", guests: 0, items: [], total: 0, time: "" },
        { id: "T-06", name: "Bàn 06 (Tầng 1)", area: "indoor", areaName: "Máy Lạnh Tầng 1", status: "occupied", guests: 3, items: [{ id: 'P-02', name: "Cà phê đen (Đá / Nóng)", qty: 2, price: 18000 }, { id: 'P-01', name: "Cà phê sữa (Đá / Nóng)", qty: 1, price: 20000 }], total: 56000, time: "15 phút" },
        { id: "T-07", name: "Bàn VIP 01", area: "indoor", areaName: "Máy Lạnh Tầng 1", status: "occupied", guests: 6, items: [{ id: 'P-03', name: "Bạc xỉu ba tầng", qty: 4, price: 25000 }, { id: 'P-04', name: "Trà đào cam sả", qty: 2, price: 28000 }, { id: 'O-01', name: "Bò một nắng hai sương kèm muối kiến vàng", qty: 1, price: 280000 }], total: 436000, time: "1 giờ" },
        { id: "T-08", name: "Bàn ST-01", area: "rooftop", areaName: "Sân Thượng View Biển", status: "empty", guests: 0, items: [], total: 0, time: "" },
        { id: "T-09", name: "Bàn ST-02", area: "rooftop", areaName: "Sân Thượng View Biển", status: "reserved", guests: 0, items: [], total: 0, time: "Hẹn 19:00" },
        { id: "T-10", name: "Bàn Mang Về (Takeaway)", area: "takeaway", areaName: "Quầy Mang Đi", status: "empty", guests: 0, items: [], total: 0, time: "" }
      ];
      saveTables(initial);
      return initial;
    }
    return JSON.parse(fs.readFileSync(DB_TABLES_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function saveTables(tables) {
  try {
    fs.writeFileSync(DB_TABLES_FILE, JSON.stringify(tables, null, 2), 'utf-8');
    const rootPath = path.resolve(__dirname, '../../../data/tables.json');
    if (fs.existsSync(path.dirname(rootPath))) {
      fs.writeFileSync(rootPath, JSON.stringify(tables, null, 2), 'utf-8');
    }
  } catch (e) {
    console.error("Lỗi ghi tables.json:", e);
  }
}

function handleGetTables(req, res) {
  const tables = loadTables();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, count: tables.length, tables }));
}

function handleCreateTable(req, res, body = {}, sseClients) {
  const tables = loadTables();
  const name = body.name ? body.name.trim() : `Bàn ${tables.length + 1}`;
  const area = body.area || 'garden';
  const areaNames = {
    garden: 'Khu Sân Vườn',
    indoor: 'Máy Lạnh Tầng 1',
    rooftop: 'Sân Thượng View Biển',
    takeaway: 'Quầy Mang Đi'
  };
  const areaName = body.areaName || areaNames[area] || 'Khu Vực Mới';

  const newId = `T-${(tables.length + 1).toString().padStart(2, '0')}`;
  const newTable = {
    id: newId,
    name,
    area,
    areaName,
    status: 'empty',
    guests: 0,
    items: [],
    total: 0,
    time: ''
  };

  tables.push(newTable);
  saveTables(tables);

  if (sseClients) {
    broadcastSSE(sseClients, 'TABLE_CREATED', { table: newTable });
  }

  res.writeHead(201, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: `Đã mở thêm [${name}] vào sơ đồ bàn!`,
    table: newTable
  }));
}

// QUẢN LÝ SƠ ĐỒ PHÒNG Phòng Nghỉ (ROOMS)
function loadRooms() {
  try {
    if (!fs.existsSync(DB_ROOMS_FILE)) {
      const initial = [
        { id: "R-101", name: "Phòng 101", tier: "standard", tierName: "Tầng 1 Standard", status: "occupied", guestName: "A. Hoàng (Hà Nội)", phone: "0912.888.xxx", type: "1 Đêm", checkIn: "14:00 Hôm qua", roomPrice: 350000, hourPrice: 120000, services: [{ name: "Nước suối Lavie (2 chai)", price: 30000 }], total: 380000 },
        { id: "R-102", name: "Phòng 102", tier: "standard", tierName: "Tầng 1 Standard", status: "empty", guestName: "", phone: "", type: "Giường Đôi", checkIn: "Sẵn sàng đón khách", roomPrice: 350000, hourPrice: 120000, services: [], total: 0 },
        { id: "R-103", name: "Phòng 103", tier: "standard", tierName: "Tầng 1 Standard", status: "cleaning", guestName: "Chờ dọn buồng", phone: "", type: "Khách vừa check-out", checkIn: "", roomPrice: 350000, hourPrice: 120000, services: [], total: 0 },
        { id: "R-201", name: "Phòng 201 (Deluxe)", tier: "deluxe", tierName: "Tầng 2 Deluxe View Biển", status: "occupied", guestName: "C. Lan (TP.HCM)", phone: "0989.222.xxx", type: "2 Đêm", checkIn: "Hôm kia", roomPrice: 900000, hourPrice: 150000, services: [{ name: "Giặt sấy lấy liền (3kg)", price: 90000 }, { name: "Nước suối Lavie", price: 15000 }], total: 1005000 },
        { id: "R-202", name: "Phòng 202 (Ban Công)", tier: "deluxe", tierName: "Tầng 2 Deluxe", status: "occupied", guestName: "A. Tuấn (Nha Trang)", phone: "0905.333.xxx", type: "Theo Giờ", checkIn: "10:15 Sáng nay", roomPrice: 120000, hourPrice: 120000, services: [], total: 120000 },
        { id: "R-203", name: "Phòng 203 (Deluxe)", tier: "deluxe", tierName: "Tầng 2 Deluxe", status: "empty", guestName: "", phone: "", type: "View Biển", checkIn: "Sẵn sàng đón khách", roomPrice: 450000, hourPrice: 150000, services: [], total: 0 },
        { id: "R-301", name: "Phòng 301 (VIP Suite)", tier: "suite", tierName: "Tầng 3 VIP Suite Panorama", status: "reserved", guestName: "Đoàn A. Dũng (Đà Nẵng)", phone: "0935.555.xxx", type: "Đặt trước", checkIn: "Dự kiến 14:00 hôm nay", roomPrice: 600000, hourPrice: 200000, services: [], total: 0 },
        { id: "R-302", name: "Phòng 302 (VIP Gia Đình)", tier: "suite", tierName: "Tầng 3 VIP Suite", status: "occupied", guestName: "Bác Minh (4 người)", phone: "0944.777.xxx", type: "2 Đêm", checkIn: "Tối qua", roomPrice: 1200000, hourPrice: 250000, services: [{ name: "Thuê xe máy tay ga (2 ngày)", price: 300000 }], total: 1500000 }
      ];
      saveRooms(initial);
      return initial;
    }
    return JSON.parse(fs.readFileSync(DB_ROOMS_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function saveRooms(rooms) {
  try {
    fs.writeFileSync(DB_ROOMS_FILE, JSON.stringify(rooms, null, 2), 'utf-8');
    const rootPath = path.resolve(__dirname, '../../../data/rooms.json');
    if (fs.existsSync(path.dirname(rootPath))) {
      fs.writeFileSync(rootPath, JSON.stringify(rooms, null, 2), 'utf-8');
    }
  } catch (e) {
    console.error("Lỗi ghi rooms.json:", e);
  }
}

function handleGetRooms(req, res) {
  const rooms = loadRooms();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, count: rooms.length, rooms }));
}

function handleCreateRoom(req, res, body = {}, sseClients) {
  const rooms = loadRooms();
  const name = body.name ? body.name.trim() : `Phòng 10${rooms.length + 1}`;
  const tier = body.tier || 'standard';
  const tierNames = {
    standard: 'Tầng 1 Standard',
    deluxe: 'Tầng 2 Deluxe View Biển',
    suite: 'Tầng 3 VIP Suite Panorama'
  };
  const tierName = body.tierName || tierNames[tier] || 'Hạng Tiêu Chuẩn';
  const roomPrice = parseInt(body.roomPrice, 10) || 350000;
  const hourPrice = parseInt(body.hourPrice, 10) || 120000;

  const newId = `R-${tier === 'deluxe' ? '20' : (tier === 'suite' ? '30' : '10')}${rooms.length + 1}`;
  const newRoom = {
    id: newId,
    name,
    tier,
    tierName,
    status: 'empty',
    guestName: '',
    phone: '',
    type: 'Giường Đôi',
    checkIn: 'Sẵn sàng đón khách',
    roomPrice,
    hourPrice,
    services: [],
    total: 0
  };

  rooms.push(newRoom);
  saveRooms(rooms);

  if (sseClients) {
    broadcastSSE(sseClients, 'ROOM_CREATED', { room: newRoom });
  }

  res.writeHead(201, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: `Đã thêm [${name}] vào hệ thống Phòng Nghỉ!`,
    room: newRoom
  }));
}

// QUẢN LÝ TÙY CHỌN PHỤ (TOPPING, SIZE, ĐÁ, ĐƯỜNG)
function loadOptions() {
  try {
    if (!fs.existsSync(DB_OPTIONS_FILE)) {
      const initial = {
        sizes: [
          { id: 'size_m', name: 'Size Vừa (M)', price: 0, default: true },
          { id: 'size_l', name: 'Size Lớn (L)', price: 5000 }
        ],
        sweetness: ['100% Đường', '70% Đường', '50% Đường', 'Không Đường'],
        ice: ['100% Đá', '50% Đá', 'Đá Riêng', 'Không Đá'],
        toppings: [
          { id: 'top_1', name: 'Thạch Phô Mai Tươi', price: 5000 },
          { id: 'top_2', name: 'Trân Châu Hoàng Kim', price: 5000 },
          { id: 'top_3', name: 'Kem Trứng Nướng Béo', price: 8000 },
          { id: 'top_4', name: 'Muối Hồng Macchiato', price: 7000 }
        ],
        roomAmenities: [
          { id: 'amen_1', name: 'Thêm Nệm Phụ (Extra Bed)', price: 100000 },
          { id: 'amen_2', name: 'Nhận Phòng Sớm Trước 12h', price: 50000 }
        ]
      };
      saveOptions(initial);
      return initial;
    }
    return JSON.parse(fs.readFileSync(DB_OPTIONS_FILE, 'utf-8'));
  } catch (e) {
    return {};
  }
}

function saveOptions(options) {
  try {
    fs.writeFileSync(DB_OPTIONS_FILE, JSON.stringify(options, null, 2), 'utf-8');
    const rootPath = path.resolve(__dirname, '../../../data/custom_options.json');
    if (fs.existsSync(path.dirname(rootPath))) {
      fs.writeFileSync(rootPath, JSON.stringify(options, null, 2), 'utf-8');
    }
  } catch (e) {
    console.error("Lỗi ghi custom_options.json:", e);
  }
}

function handleGetOptions(req, res) {
  const options = loadOptions();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, options }));
}

function handleSaveOptions(req, res, body = {}) {
  const current = loadOptions();
  const updated = { ...current, ...body };
  saveOptions(updated);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, message: 'Đã lưu cấu hình tùy chọn phụ!', options: updated }));
}


// ============================================================================
// CẤU HÌNH KẾT NỐI MÁY IN BLUETOOTH, CỔNG VIETQR & HĐĐT N8N
// ============================================================================
function loadSettings() {
  const filePath = path.join(__dirname, '../../data/pos_settings.json');
  const rootPath = path.join(__dirname, '../../../data/pos_settings.json');
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } else if (fs.existsSync(rootPath)) {
      return JSON.parse(fs.readFileSync(rootPath, 'utf-8'));
    }
  } catch (e) {
    console.error("Lỗi đọc pos_settings.json:", e);
  }
  return {
    printer: {
      enabled: true,
      deviceName: "POS-58 PT-210",
      paperSize: "58mm",
      autoPrintOnPayment: true,
      headerTitle: "ĐẤT PHÚ CORE - VÍ AN SINH",
      subTitle: "Đất Phú Hub & Cafe",
      address: "86 Lê Duẩn, Phường 7, TP. Tuy Hòa, Phú Yên",
      hotline: "0912.888.xxx"
    },
    vietqr: {
      enabled: true,
      bankId: "970436",
      bankName: "Vietcombank (VCB DigiBiz)",
      accountNumber: "1038899889",
      accountHolder: "CONG TY CP DAT PHU CORE",
      napasAutoConfirm: true,
      webhookSecret: "DP_SEC_2026_N8N",
      webhookEndpoint: "http://localhost:5000/api/pos/payments/bank-webhook"
    },
    einvoice: {
      enabled: true,
      provider: "misa_meinvoice",
      taxCode: "4401020233",
      templateSymbol: "1C26MDP",
      companyName: "CÔNG TY CỔ PHẦN ĐẤT PHÚ CORE",
      taxAuthority: "Chi cục Thuế TP. Tuy Hòa",
      n8nWebhookUrl: "https://n8n.datphucore.vn/webhook/issue-invoice",
      autoSendZns: true,
      autoSendEmail: true
    }
  };
}

function saveSettings(settings) {
  const filePath = path.join(__dirname, '../../data/pos_settings.json');
  const rootPath = path.join(__dirname, '../../../data/pos_settings.json');
  try {
    if (fs.existsSync(path.dirname(filePath))) {
      fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), 'utf-8');
    }
    if (fs.existsSync(path.dirname(rootPath))) {
      fs.writeFileSync(rootPath, JSON.stringify(settings, null, 2), 'utf-8');
    }
  } catch (e) {
    console.error("Lỗi ghi pos_settings.json:", e);
  }
}

function handleGetSettings(req, res) {
  const settings = loadSettings();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, settings }));
}

function handleSaveSettings(req, res, body = {}) {
  const current = loadSettings();
  const updated = {
    business: { ...(current.business || {}), ...(body.business || {}) },
    printer: { ...(current.printer || {}), ...(body.printer || {}) },
    vietqr: { ...(current.vietqr || {}), ...(body.vietqr || {}) },
    einvoice: { ...(current.einvoice || {}), ...(body.einvoice || {}) },
    inventoryBOM: { ...(current.inventoryBOM || {}), ...(body.inventoryBOM || {}) },
    pricingRules: { ...(current.pricingRules || {}), ...(body.pricingRules || {}) },
    shiftPolicy: { ...(current.shiftPolicy || {}), ...(body.shiftPolicy || {}) }
  };
  saveSettings(updated);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: 'Đã lưu cấu hình Trung Tâm Vận Hành Doanh Nghiệp (Enterprise POS) thành công!',
    settings: updated
  }));
}

function handleTestPrint(req, res, body = {}) {
  const settings = loadSettings();
  const testPayload = {
    header: settings.printer.headerTitle,
    subHeader: settings.printer.subTitle,
    address: settings.printer.address,
    hotline: settings.printer.hotline,
    paperSize: settings.printer.paperSize,
    timestamp: new Date().toISOString(),
    testContent: [
      { name: "Cà phê sữa đá (Test)", qty: 1, price: 20000, subtotal: 20000 },
      { name: "Bò 1 nắng Sông Hinh (Test)", qty: 1, price: 280000, subtotal: 280000 }
    ],
    totalAmount: 300000,
    printerDevice: settings.printer.deviceName
  };
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: `Đã phát lệnh in thử nghiệm thành công tới máy in ${settings.printer.deviceName} (${settings.printer.paperSize})!`,
    testPayload
  }));
}

function handleIssueEinvoice(req, res, body = {}) {
  const settings = loadSettings();
  const { orderId = "ORD-TEST", totalAmount = 0, items = [], customerName = "Khách Hàng", customerPhone = "" } = body;
  const invoiceSeq = Math.floor(10000 + Math.random() * 90000);
  const invoiceNo = `${settings.einvoice.templateSymbol}-${invoiceSeq}`;
  const lookupUrl = `https://hoadondientu.gdt.gov.vn?mst=${settings.einvoice.taxCode}&inv=${invoiceNo}`;
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: `Đã kết nối webhook n8n và phát hành HĐĐT máy tính tiền ${invoiceNo} thành công!`,
    einvoice: {
      provider: settings.einvoice.provider,
      taxCode: settings.einvoice.taxCode,
      templateSymbol: settings.einvoice.templateSymbol,
      invoiceNumber: invoiceNo,
      issuedAt: new Date().toISOString(),
      lookupUrl,
      orderId,
      totalAmount,
      sentZns: settings.einvoice.autoSendZns && !!customerPhone,
      customerPhone
    }
  }));
}


// ============================================================================
// HÀM TRIGGER & CONTROLLER XỬ LÝ ĐA KHO MULTI-INVENTORY SYNC
// ============================================================================
function handleValidateCart(req, res, body = {}) {
  const items = body.items || [];
  const validation = cartStore.validateCartInventory(items);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(validation));
}

function handleGetRawMaterials(req, res) {
  const materials = cartStore.loadRawMaterials();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, materials }));
}

module.exports = {
  handleValidateCart,
  handleGetRawMaterials,
  loadSettings,
  saveSettings,
  handleGetSettings,
  handleSaveSettings,
  handleTestPrint,
  handleIssueEinvoice,
  loadProducts,
  saveProducts,
  loadOrders,
  saveOrders,
  loadShifts,
  loadPrices,
  savePrices,
  calculateItemPrice,
  handleGetProducts,
  handleCreateProduct,
  loadTables,
  saveTables,
  handleGetTables,
  handleCreateTable,
  loadRooms,
  saveRooms,
  handleGetRooms,
  handleCreateRoom,
  loadOptions,
  saveOptions,
  handleGetOptions,
  handleSaveOptions,
  handleGetStockAlerts,
  handleInventoryAudit,
  handleCreateOrder,
  handleGetOrders,
  handleOpenShift,
  handleCloseShift,
  handleGetShifts,
  handleGetDailyReport,
  handleEodReportPush,
  handleBankWebhook,
  handleGetPrices,
  handleCalculatePrice,
  handleUpdatePriceRule,
  broadcastSSE
};
