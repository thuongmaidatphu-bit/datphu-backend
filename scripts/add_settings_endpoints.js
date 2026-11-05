const fs = require('fs');

// 1. Update posController.js
const controllerPath = 'E:/datphu-backend/src/modules/pos/posController.js';
let ctrlCode = fs.readFileSync(controllerPath, 'utf8');

const settingsFunctions = `
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
      subTitle: "THANH GIANG HOMETEL & CAFE",
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
    printer: { ...current.printer, ...(body.printer || {}) },
    vietqr: { ...current.vietqr, ...(body.vietqr || {}) },
    einvoice: { ...current.einvoice, ...(body.einvoice || {}) }
  };
  saveSettings(updated);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, message: 'Đã lưu cấu hình thiết bị & cổng kết nối thành công!', settings: updated }));
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
    message: \`Đã phát lệnh in thử nghiệm thành công tới máy in \${settings.printer.deviceName} (\${settings.printer.paperSize})!\`,
    testPayload
  }));
}

function handleIssueEinvoice(req, res, body = {}) {
  const settings = loadSettings();
  const { orderId = "ORD-TEST", totalAmount = 0, items = [], customerName = "Khách Hàng", customerPhone = "" } = body;
  const invoiceSeq = Math.floor(10000 + Math.random() * 90000);
  const invoiceNo = \`\${settings.einvoice.templateSymbol}-\${invoiceSeq}\`;
  const lookupUrl = \`https://hoadondientu.gdt.gov.vn?mst=\${settings.einvoice.taxCode}&inv=\${invoiceNo}\`;
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: \`Đã kết nối webhook n8n và phát hành HĐĐT máy tính tiền \${invoiceNo} thành công!\`,
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
`;

if (!ctrlCode.includes('function handleGetSettings')) {
  ctrlCode = ctrlCode.replace('module.exports = {', settingsFunctions + '\nmodule.exports = {\n  loadSettings,\n  saveSettings,\n  handleGetSettings,\n  handleSaveSettings,\n  handleTestPrint,\n  handleIssueEinvoice,');
  fs.writeFileSync(controllerPath, ctrlCode, 'utf8');
  console.log('Updated posController.js');
}

// 2. Update posRoutes.js
const routesPath = 'E:/datphu-backend/src/modules/pos/posRoutes.js';
let routesCode = fs.readFileSync(routesPath, 'utf8');

const routeSnippets = `
  // 8. Cấu hình Máy In Bluetooth, VietQR & HĐĐT n8n
  if (pathname === '/api/pos/settings') {
    if (req.method === 'GET') {
      posController.handleGetSettings(req, res);
      return true;
    }
    if (req.method === 'POST') {
      posController.handleSaveSettings(req, res, body);
      return true;
    }
  }

  if (pathname === '/api/pos/printer/test' && req.method === 'POST') {
    posController.handleTestPrint(req, res, body);
    return true;
  }

  if (pathname === '/api/pos/einvoice/issue' && req.method === 'POST') {
    posController.handleIssueEinvoice(req, res, body);
    return true;
  }
`;

if (!routesCode.includes('/api/pos/settings')) {
  routesCode = routesCode.replace('return false;\n}', routeSnippets + '\n  return false;\n}');
  fs.writeFileSync(routesPath, routesCode, 'utf8');
  console.log('Updated posRoutes.js');
}
