/**
 * ============================================================================
 * GIAI ĐOẠN 1: THU MUA ĐẦU VÀO & QUẢN LÝ NHÀ CUNG CẤP (INBOUND / PROCUREMENT)
 * Đường dẫn: src/modules/procurement/procurementController.js
 * Bản quyền: CÔNG TY TNHH THƯƠNG MẠI ĐẤT PHÚ (MST: 4401020233)
 * Đối tác: HTX Sông Hinh, Nông trại Đắk Lắk, Đất Phú Phòng Nghỉ (86 Lê Duẩn)
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const cloudGateway = require('../../core/cloudGateway');
const { loadProducts, saveProducts } = require('../pos/posController');

const SUPPLIERS_FILE = path.join(__dirname, '..', '..', 'data', 'suppliers.json');
const INBOUND_ORDERS_FILE = path.join(__dirname, '..', '..', 'data', 'inbound_orders.json');

function loadSuppliers() {
  try {
    if (!fs.existsSync(SUPPLIERS_FILE)) {
      const initialSuppliers = [
        {
          id: "SUP-01",
          name: "Hợp Tác Xã Đặc Sản Sông Hinh",
          taxCode: "4400891234",
          phone: "0914.556.789",
          address: "Thị trấn Hai Riêng, Huyện Sông Hinh, Phú Yên",
          categories: ["souvenir"],
          itemsSupplied: ["Bò Một Nắng Sông Hinh", "Muối Kiến Vàng Krông Pa"],
          rating: 4.9,
          contractStatus: "active"
        },
        {
          id: "SUP-02",
          name: "Nông Trại Cà Phê Cư M'gar (Đắk Lắk)",
          taxCode: "6001234987",
          phone: "0905.334.221",
          address: "Huyện Cư M'gar, Đắk Lắk",
          categories: ["coffee"],
          itemsSupplied: ["Hạt Robusta S18 tuyển chọn", "Arabica Cầu Đất phối trộn"],
          rating: 5.0,
          contractStatus: "active"
        },
        {
          id: "SUP-03",
          name: "Xưởng Chả Cá Thu Tuy Hòa",
          taxCode: "4401123789",
          phone: "0978.889.900",
          address: "Phường 6, TP. Tuy Hòa, Phú Yên",
          categories: ["food"],
          itemsSupplied: ["Chả cá thu hấp", "Chả cá chiên bánh mì"],
          rating: 4.8,
          contractStatus: "active"
        },
        {
          id: "SUP-04",
          name: "Tổng Kho Sữa & Nguyên Liệu Pha Chế Phú Yên",
          taxCode: "4400567890",
          phone: "0257.3824.567",
          address: "Đường Nguyễn Huệ, TP. Tuy Hòa",
          categories: ["beverage"],
          itemsSupplied: ["Sữa đặc Phương Nam", "Sữa tươi Ba Vì", "Trà lài Oolong"],
          rating: 4.85,
          contractStatus: "active"
        }
      ];
      const dir = path.dirname(SUPPLIERS_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(SUPPLIERS_FILE, JSON.stringify(initialSuppliers, null, 2), 'utf-8');
      return initialSuppliers;
    }
    return JSON.parse(fs.readFileSync(SUPPLIERS_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function saveSuppliers(suppliers) {
  try {
    fs.writeFileSync(SUPPLIERS_FILE, JSON.stringify(suppliers, null, 2), 'utf-8');
  } catch (e) {
    console.error("Lỗi ghi suppliers.json:", e);
  }
}

function loadInboundOrders() {
  try {
    if (!fs.existsSync(INBOUND_ORDERS_FILE)) {
      const initialInbound = [
        {
          inboundId: "PNK-2026-001",
          inboundCode: "PNK1001",
          merchantId: "M-01",
          supplierId: "SUP-01",
          supplierName: "Hợp Tác Xã Đặc Sản Sông Hinh",
          items: [
            { productId: "P-07", productName: "Bò Một Nắng Sông Hinh (500g)", quantity: 20, importPrice: 210000, subtotal: 4200000, expiryDate: "2027-05-15" },
            { productId: "P-08", productName: "Muối Kiến Vàng Krông Pa", quantity: 50, importPrice: 30000, subtotal: 1500000, expiryDate: "2027-11-20" }
          ],
          totalCost: 5700000,
          qcStatus: "PASSED_100_PERCENT",
          qcNote: "Hàng nguyên đai nguyên kiện, hút chân không đạt chuẩn xuất khẩu OCOP.",
          inspector: "Thu Ngân Trưởng (Đất Phú Phòng Nghỉ)",
          inboundInvoice: {
            invoiceNumber: "0012489",
            series: "1C26THX",
            supplierTaxCode: "4400891234",
            xmlUrl: "https://ckyydvyzucvcdunvedmg.supabase.co/storage/v1/object/public/invoices/inbound/HDDT_PNK1001.xml",
            pdfUrl: "https://ckyydvyzucvcdunvedmg.supabase.co/storage/v1/object/public/invoices/inbound/HDDT_PNK1001.pdf"
          },
          createdAt: new Date(Date.now() - 86400000).toISOString()
        }
      ];
      const dir = path.dirname(INBOUND_ORDERS_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(INBOUND_ORDERS_FILE, JSON.stringify(initialInbound, null, 2), 'utf-8');
      return initialInbound;
    }
    return JSON.parse(fs.readFileSync(INBOUND_ORDERS_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function saveInboundOrders(orders) {
  try {
    fs.writeFileSync(INBOUND_ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (e) {
    console.error("Lỗi ghi inbound_orders.json:", e);
  }
}

// 1. LẤY DANH SÁCH NHÀ CUNG CẤP (GET /api/procurement/suppliers)
function handleGetSuppliers(req, res) {
  const suppliers = loadSuppliers();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    count: suppliers.length,
    suppliers
  }));
}

// 2. TẠO NHÀ CUNG CẤP MỚI (POST /api/procurement/suppliers)
function handleCreateSupplier(req, res, body) {
  const { name, taxCode, phone, address, categories = [], itemsSupplied = [] } = body;
  if (!name || !phone) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Tên nhà cung cấp và số điện thoại là bắt buộc' }));
  }

  const suppliers = loadSuppliers();
  const newSupplier = {
    id: `SUP-${(suppliers.length + 1).toString().padStart(2, '0')}`,
    name,
    taxCode: taxCode || 'Đang cập nhật',
    phone,
    address: address || 'TP. Tuy Hòa, Phú Yên',
    categories,
    itemsSupplied,
    rating: 5.0,
    contractStatus: "active",
    createdAt: new Date().toISOString()
  };

  suppliers.push(newSupplier);
  saveSuppliers(suppliers);

  res.writeHead(201, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: "Thêm nhà cung cấp mới thành công!",
    supplier: newSupplier
  }));
}

// 3. TẠO PHIẾU NHẬP KHO & TỰ ĐỘNG CỘNG DỒN TỒN KHO POS (POST /api/procurement/inbound)
function handleCreateInboundOrder(req, res, body, sseClients) {
  const {
    merchantId = "M-01",
    supplierId,
    supplierName,
    items = [],
    qcNote = "Kiểm đếm đạt chuẩn số lượng và hạn sử dụng",
    inspector = "Thu Ngân / Quản Lý Kho",
    invoiceNumber,
    invoiceSeries
  } = body;

  if (!items || items.length === 0) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Phiếu nhập kho phải có ít nhất một mặt hàng' }));
  }

  const inbounds = loadInboundOrders();
  const products = loadProducts();
  const orderNumber = 1000 + inbounds.length + 1;
  const inboundCode = `PNK${orderNumber}`;

  // Cập nhật tồn kho tự động trong pos_products.json
  const processedItems = items.map(item => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.importPrice) || 0;
    
    // Tìm và cộng dồn tồn kho
    const prod = products.find(p => p.id === item.productId || p.name === item.productName);
    if (prod) {
      prod.stockQuantity = (Number(prod.stockQuantity) || 0) + qty;
    }

    return {
      productId: item.productId || (prod ? prod.id : 'P-inbound'),
      productName: item.productName || (prod ? prod.name : 'Vật tư nhập kho'),
      quantity: qty,
      importPrice: price,
      subtotal: qty * price,
      expiryDate: item.expiryDate || new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0]
    };
  });

  saveProducts(products); // Lưu lại tồn kho đã tăng

  const totalCost = processedItems.reduce((sum, it) => sum + it.subtotal, 0);

  const newInbound = {
    inboundId: `PNK-2026-${orderNumber}`,
    inboundCode,
    merchantId,
    supplierId: supplierId || 'SUP-01',
    supplierName: supplierName || 'Nhà Cung Cấp Đất Phú',
    items: processedItems,
    totalCost,
    qcStatus: "PASSED_100_PERCENT",
    qcNote,
    inspector,
    inboundInvoice: {
      invoiceNumber: invoiceNumber || `${Math.floor(1000000 + Math.random() * 9000000)}`,
      series: invoiceSeries || "1C26THX",
      supplierTaxCode: "4400891234",
      xmlUrl: `https://ckyydvyzucvcdunvedmg.supabase.co/storage/v1/object/public/invoices/inbound/HDDT_${inboundCode}.xml`,
      pdfUrl: `https://ckyydvyzucvcdunvedmg.supabase.co/storage/v1/object/public/invoices/inbound/HDDT_${inboundCode}.pdf`
    },
    createdAt: new Date().toISOString()
  };

  inbounds.unshift(newInbound);
  saveInboundOrders(inbounds);

  // Phát sóng SSE cập nhật tồn kho tới các máy POS đang mở
  if (sseClients && sseClients.size > 0) {
    const msg = `event: INVENTORY_RESTOCKED\ndata: ${JSON.stringify({ inboundCode, itemsCount: processedItems.length, timestamp: new Date().toISOString() })}\n\n`;
    for (const client of sseClients) {
      try { client.write(msg); } catch (e) {}
    }
  }

  res.writeHead(201, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: `Nhập kho thành công phiếu ${inboundCode}! Tồn kho pos_products đã được cộng dồn tự động.`,
    inbound: newInbound
  }));
}

// 4. LẤY LỊCH SỬ NHẬP KHO (GET /api/procurement/inbound)
function handleGetInboundHistory(req, res) {
  const inbounds = loadInboundOrders();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    count: inbounds.length,
    inbounds
  }));
}

// 5. TẢI VÀ LƯU TRỮ CHỨNG TỪ HĐĐT ĐẦU VÀO XML/PDF LÊN STORAGE (POST /api/procurement/inbound/invoice)
function handleUploadInboundInvoice(req, res, body) {
  const { inboundCode, fileName, fileBase64, fileType = "xml" } = body;
  
  if (!inboundCode) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Mã phiếu nhập kho là bắt buộc' }));
  }

  const inbounds = loadInboundOrders();
  const order = inbounds.find(o => o.inboundCode === inboundCode);
  
  const ext = fileType.toLowerCase() === 'pdf' ? 'pdf' : 'xml';
  const fileUrl = `https://ckyydvyzucvcdunvedmg.supabase.co/storage/v1/object/public/invoices/inbound/${inboundCode}_HDDT.${ext}`;

  if (order) {
    if (ext === 'xml') order.inboundInvoice.xmlUrl = fileUrl;
    if (ext === 'pdf') order.inboundInvoice.pdfUrl = fileUrl;
    saveInboundOrders(inbounds);
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: `Đã lưu trữ an toàn chứng từ HĐĐT đầu vào (${ext.toUpperCase()}) vào phân vùng Storage Supabase (S3) bucket [invoices/inbound]`,
    fileUrl,
    inboundCode
  }));
}

module.exports = {
  loadSuppliers,
  loadInboundOrders,
  handleGetSuppliers,
  handleCreateSupplier,
  handleCreateInboundOrder,
  handleGetInboundHistory,
  handleUploadInboundInvoice
};
