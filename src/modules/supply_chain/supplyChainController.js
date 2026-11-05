/**
 * ============================================================================
 * ĐẤT PHÚ CORE - SUPPLY CHAIN & POS CONTROLLER (supplyChainController.js)
 * Quản lý toàn bộ chuỗi từ Nhập kho đầu vào đến Bán hàng đầu ra
 * Bản quyền: CÔNG TY TNHH THƯƠNG MẠI ĐẤT PHÚ (MST: 4401020233)
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const cloudGateway = require('../../core/cloudGateway');
const { loadProducts, saveProducts, loadOrders, saveOrders, broadcastSSE } = require('../pos/posController');

const INVENTORY_IMPORTS_FILE = path.join(__dirname, '..', '..', 'data', 'inventory_imports.json');
const ORDER_ITEMS_FILE = path.join(__dirname, '..', '..', 'data', 'pos_order_items.json');

function loadInventoryImports() {
  try {
    if (!fs.existsSync(INVENTORY_IMPORTS_FILE)) {
      const initial = [];
      const dir = path.dirname(INVENTORY_IMPORTS_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(INVENTORY_IMPORTS_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    return JSON.parse(fs.readFileSync(INVENTORY_IMPORTS_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function saveInventoryImports(imports) {
  try {
    fs.writeFileSync(INVENTORY_IMPORTS_FILE, JSON.stringify(imports, null, 2), 'utf-8');
  } catch (e) {
    console.error("Lỗi ghi inventory_imports.json:", e);
  }
}

function loadOrderItems() {
  try {
    if (!fs.existsSync(ORDER_ITEMS_FILE)) {
      const initial = [];
      const dir = path.dirname(ORDER_ITEMS_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(ORDER_ITEMS_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    return JSON.parse(fs.readFileSync(ORDER_ITEMS_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function saveOrderItems(items) {
  try {
    fs.writeFileSync(ORDER_ITEMS_FILE, JSON.stringify(items, null, 2), 'utf-8');
  } catch (e) {
    console.error("Lỗi ghi pos_order_items.json:", e);
  }
}

/**
 * ============================================================================
 * PHẦN 1: NGHIỆP VỤ NHẬP KHO ĐẦU VÀO (INBOUND PROCUREMENT)
 * ============================================================================
 */
async function importStock(req, res, body, sseClients) {
  try {
    const { merchant_id = "M-01", supplier_name = "Nhà Cung Cấp Đất Phú", items = [] } = body;
    // items: [{ product_id, import_qty, import_price }]

    if (!merchant_id || !items || items.length === 0) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, message: 'Thiếu thông tin nhập kho hoặc danh sách hàng trống.' }));
    }

    const imports = loadInventoryImports();
    const products = loadProducts();
    const importId = `IMP-${Date.now().toString().slice(-6)}`;

    // 1. Ghi nhận phiếu nhập kho chung vào inventory_imports
    const importHeader = {
      id: importId,
      merchant_id,
      supplier_name,
      itemsCount: items.length,
      created_at: new Date().toISOString()
    };
    imports.unshift(importHeader);
    saveInventoryImports(imports);

    // Đồng bộ đồng thời lên Supabase Database (nếu kết nối đám mây khả dụng)
    cloudGateway.database.insert('inventory_imports', {
      merchant_id,
      supplier_name,
      created_at: new Date().toISOString()
    }).catch(err => console.log('[Cloud Sync] Lỗi Supabase inventory_imports:', err.message));

    // 2. Duyệt qua từng sản phẩm để cộng dồn số lượng vào kho (pos_products)
    const updatedProductsList = [];
    for (const item of items) {
      const prodId = item.product_id || item.id;
      const qty = Number(item.import_qty || item.quantity) || 1;

      // Tìm sản phẩm trong pos_products
      const prod = products.find(p => p.id === prodId || p.name === item.name);
      if (prod) {
        const currentStock = Number(prod.stock_qty || prod.stockQuantity) || 0;
        const newStock = currentStock + qty;
        prod.stock_qty = newStock;
        prod.stockQuantity = newStock;
        updatedProductsList.push({ product_id: prod.id, name: prod.name, oldStock: currentStock, newStock });

        // Cập nhật lên CSDL Supabase PostgREST
        cloudGateway.database.update('pos_products', 'id', prod.id, { stock_qty: newStock })
          .catch(() => {});
      }
    }

    saveProducts(products);

    // Bắn tín hiệu Realtime SSE tới toàn hệ thống
    if (sseClients && sseClients.size > 0) {
      const sseMsg = `event: INVENTORY_RESTOCKED\ndata: ${JSON.stringify({ import_id: importHeader.id, itemsCount: items.length, timestamp: new Date().toISOString() })}\n\n`;
      for (const client of sseClients) {
        try { client.write(sseMsg); } catch (e) {}
      }
    }

    res.writeHead(201, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: true,
      message: 'Nhập kho đầu vào thành công, số lượng tồn kho đã được cộng dồn!',
      import_id: importHeader.id,
      updatedProducts: updatedProductsList
    }));
  } catch (err) {
    console.error('Lỗi nhập kho:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: false, message: 'Lỗi hệ thống khi xử lý nhập kho: ' + err.message }));
  }
}

/**
 * ============================================================================
 * PHẦN 2: NGHIỆP VỤ BÁN HÀNG ĐẦU RA & TRỪ KHO (OUTBOUND & POS)
 * ============================================================================
 */
async function createSaleOrder(req, res, body, sseClients) {
  try {
    const { merchant_id = "M-01", items = [], payment_method = "cash", total_amount = 0 } = body;
    // items: [{ product_id, quantity, unit_price }]

    if (!merchant_id || !items || items.length === 0) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, message: 'Giỏ hàng trống hoặc thiếu thông tin đơn hàng.' }));
    }

    const products = loadProducts();
    const orders = loadOrders();
    const allOrderItems = loadOrderItems();

    // 1. Kiểm tra tồn kho trước khi bán (Đảm bảo đủ hàng mới cho xuất kho)
    for (const item of items) {
      const prodId = item.product_id || item.id;
      const qty = Number(item.quantity) || 1;
      const prod = products.find(p => p.id === prodId || p.name === item.name);

      const availableStock = prod ? (Number(prod.stock_qty !== undefined ? prod.stock_qty : prod.stockQuantity) || 0) : 0;
      if (!prod || availableStock < qty) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: false,
          message: `Sản phẩm [${prod ? prod.name : prodId}] không đủ số lượng trong kho! (Tồn hiện tại: ${availableStock}, yêu cầu: ${qty})`
        }));
      }
    }

    // 2. Tạo đơn hàng đầu ra trong pos_orders
    const orderNumber = 1000 + orders.length + 1;
    const orderId = `ORD-${orderNumber}`;
    const orderCode = `AS${orderNumber}`;

    const newOrder = {
      id: orderId,
      orderCode,
      merchant_id,
      merchantId: merchant_id,
      total_amount: Number(total_amount) || 0,
      totalAmount: Number(total_amount) || 0,
      payment_method: payment_method || 'cash',
      paymentMethod: payment_method || 'cash',
      status: 'completed',
      paymentStatus: 'completed',
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    orders.unshift(newOrder);
    saveOrders(orders);

    // Đồng bộ lên Supabase Database pos_orders
    cloudGateway.database.insert('pos_orders', {
      merchant_id,
      total_amount: newOrder.total_amount,
      payment_method: newOrder.payment_method,
      status: 'completed'
    }).catch(err => console.log('[Cloud Sync] Lỗi Supabase pos_orders:', err.message));

    // 3. Ghi chi tiết đơn hàng và TỰ ĐỘNG TRỪ TỒN KHO đầu ra
    const orderItemsRecord = [];
    for (const item of items) {
      const prodId = item.product_id || item.id;
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unit_price || item.price) || 0;

      // Lưu chi tiết vào pos_order_items
      const orderItem = {
        order_id: orderId,
        product_id: prodId,
        quantity: qty,
        unit_price: price
      };
      allOrderItems.unshift(orderItem);
      orderItemsRecord.push(orderItem);

      // Trừ trực tiếp tồn kho trong pos_products
      const prod = products.find(p => p.id === prodId || p.name === item.name);
      if (prod) {
        const cur = Number(prod.stock_qty !== undefined ? prod.stock_qty : prod.stockQuantity) || 0;
        const updated = Math.max(0, cur - qty);
        prod.stock_qty = updated;
        prod.stockQuantity = updated;

        // Cập nhật CSDL Supabase
        cloudGateway.database.update('pos_products', 'id', prod.id, { stock_qty: updated })
          .catch(() => {});
      }
    }

    saveProducts(products);
    saveOrderItems(allOrderItems);

    // Bắn thông báo Realtime SSE
    if (sseClients && sseClients.size > 0) {
      broadcastSSE(sseClients, 'ORDER_PAID', {
        orderId: newOrder.id,
        orderCode: newOrder.orderCode,
        amount: newOrder.total_amount,
        method: newOrder.payment_method,
        timestamp: new Date().toISOString()
      });
    }

    res.writeHead(201, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: true,
      message: 'Bán hàng thành công, hệ thống đã tự động xuất kho và ghi nhận doanh thu!',
      order_id: orderId,
      orderCode,
      total_amount: newOrder.total_amount,
      items: orderItemsRecord
    }));
  } catch (err) {
    console.error('Lỗi bán hàng:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: false, message: 'Lỗi hệ thống khi xử lý đơn hàng đầu ra: ' + err.message }));
  }
}

module.exports = {
  importStock,
  createSaleOrder
};
