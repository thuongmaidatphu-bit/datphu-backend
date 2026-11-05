const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'data', 'pos_orders.json');

// Khởi tạo file lưu trữ orders nếu chưa có
function getOrders() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = [
        { id: "AS-1001", orderCode: "AS1001", totalAmount: 40000, paymentMethod: "vietqr", paymentStatus: "completed", createdAt: new Date().toISOString() },
        { id: "AS-1002", orderCode: "AS1002", totalAmount: 25000, paymentMethod: "cash", paymentStatus: "completed", createdAt: new Date().toISOString() }
      ];
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function saveOrders(orders) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (e) {
    console.error("Lỗi ghi orders:", e);
  }
}

// Sinh chuỗi VietQR chuẩn EMVCo Napas247 (CRC-16 CCITT)
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
  
  // Tính CRC16-CCITT thuần
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

// Handler tạo đơn hàng mới
function handleCreateOrder(req, res, body, sseClients) {
  const { merchantId = "M-01", items = [], totalAmount = 0, paymentMethod = "vietqr" } = body;
  
  const orders = getOrders();
  const orderNumber = 1000 + orders.length + 1;
  const orderCode = `AS${orderNumber}`;
  
  const newOrder = {
    id: `AS-${orderNumber}`,
    merchantId,
    orderCode,
    items,
    totalAmount: Number(totalAmount),
    paymentMethod,
    paymentStatus: paymentMethod === 'cash' ? 'completed' : 'pending',
    createdAt: new Date().toISOString()
  };

  // Sinh chuỗi Napas247 VietQR
  const bankBin = "970422"; // MBBank
  const bankAccount = "0987654321";
  newOrder.emvcoPayload = generateVietQREMVCo(bankBin, bankAccount, newOrder.totalAmount, orderCode);
  newOrder.vietqrUrl = `https://api.vietqr.io/image/${bankBin}-${bankAccount}-compact2.png?amount=${newOrder.totalAmount}&addInfo=${orderCode}&accountName=VI%20AN%20SINH%20DAT%20PHU`;

  orders.unshift(newOrder);
  saveOrders(orders);

  // Phát sóng realtime nếu là tiền mặt hoàn tất
  if (paymentMethod === 'cash') {
    broadcastSSE(sseClients, 'ORDER_PAID', {
      orderId: newOrder.id,
      orderCode: newOrder.orderCode,
      amount: newOrder.totalAmount,
      method: 'cash'
    });
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, order: newOrder }));
}

// Handler báo cáo doanh thu ngày
function handleGetDailyReport(req, res) {
  const orders = getOrders();
  const completed = orders.filter(o => o.paymentStatus === 'completed');

  const totalRevenue = completed.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const cashAmount = completed.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const vietqrAmount = completed.filter(o => o.paymentMethod === 'vietqr').reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    date: new Date().toISOString().split('T')[0],
    totalRevenue,
    totalOrders: completed.length,
    cashAmount,
    vietqrAmount,
    cashPercent: totalRevenue > 0 ? ((cashAmount / totalRevenue) * 100).toFixed(1) : 0,
    vietqrPercent: totalRevenue > 0 ? ((vietqrAmount / totalRevenue) * 100).toFixed(1) : 0
  }));
}

function broadcastSSE(clients, event, data) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach(c => {
    try { c.write(msg); } catch (e) {}
  });
}

module.exports = {
  getOrders,
  saveOrders,
  handleCreateOrder,
  handleGetDailyReport,
  broadcastSSE
};
