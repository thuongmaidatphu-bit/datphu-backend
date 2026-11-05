/**
 * ============================================================================
 * MODULE 2, 3, 4: POS, INVENTORY & RECONCILIATION ROUTES
 * Đường dẫn: src/modules/pos/posRoutes.js
 * ============================================================================
 */

const posController = require('./posController');

async function handle(pathname, req, res, body, sseClients, parsedUrl) {
  // 1. Danh mục sản phẩm & tồn kho
  if (pathname === '/api/pos/products') {
    if (req.method === 'GET') {
      posController.handleGetProducts(req, res, parsedUrl);
      return true;
    }
    if (req.method === 'POST') {
      posController.handleCreateProduct(req, res, body, sseClients);
      return true;
    }
  }

  // 1b. Quản lý Sơ đồ Bàn quán (Tables)
  if (pathname === '/api/pos/tables') {
    if (req.method === 'GET') {
      posController.handleGetTables(req, res);
      return true;
    }
    if (req.method === 'POST') {
      posController.handleCreateTable(req, res, body, sseClients);
      return true;
    }
  }

  // 1c. Quản lý Sơ đồ Phòng Hometel (Rooms)
  if (pathname === '/api/pos/rooms') {
    if (req.method === 'GET') {
      posController.handleGetRooms(req, res);
      return true;
    }
    if (req.method === 'POST') {
      posController.handleCreateRoom(req, res, body, sseClients);
      return true;
    }
  }

  // 1d. Quản lý Tùy chọn phụ (Toppings, Ice, Sugar, Size)
  if (pathname === '/api/pos/options') {
    if (req.method === 'GET') {
      posController.handleGetOptions(req, res);
      return true;
    }
    if (req.method === 'POST') {
      posController.handleSaveOptions(req, res, body);
      return true;
    }
  }

  // 2. Cảnh báo tồn kho tối thiểu (Giai đoạn 2)
  if (pathname === '/api/pos/inventory/alerts' && req.method === 'GET') {
    posController.handleGetStockAlerts(req, res);
    return true;
  }

  // 3. Kiểm kê định kỳ & đối soát tồn kho thực tế (Giai đoạn 2)
  if (pathname === '/api/pos/inventory/audit' && req.method === 'POST') {
    posController.handleInventoryAudit(req, res, body, sseClients);
    return true;
  }

  // 4. Danh sách đơn hàng & tạo đơn hàng mới (Giai đoạn 3)
  if (pathname === '/api/pos/orders') {
    if (req.method === 'GET') {
      posController.handleGetOrders(req, res, parsedUrl);
      return true;
    }
    if (req.method === 'POST') {
      posController.handleCreateOrder(req, res, body, sseClients);
      return true;
    }
  }

  // 5. Quản lý ca làm việc & chốt ca kiểm quỹ (Giai đoạn 4)
  if (pathname === '/api/pos/shifts') {
    if (req.method === 'GET') {
      posController.handleGetShifts(req, res);
      return true;
    }
  }

  if (pathname === '/api/pos/shifts/open' && req.method === 'POST') {
    posController.handleOpenShift(req, res, body);
    return true;
  }

  if (pathname === '/api/pos/shifts/close' && req.method === 'POST') {
    posController.handleCloseShift(req, res, body);
    return true;
  }

  // 6. Báo cáo doanh thu bán lẻ hàng ngày & Chốt ca đẩy n8n Webhook
  if (pathname === '/api/pos/reports/daily' && req.method === 'GET') {
    posController.handleGetDailyReport(req, res);
    return true;
  }

  if (pathname === '/api/pos/reports/eod-push' && req.method === 'POST') {
    posController.handleEodReportPush(req, res, body);
    return true;
  }

  // 6b. Webhook Ngân hàng tự động Napas247 VietQR
  if (pathname === '/api/pos/payments/bank-webhook' && req.method === 'POST') {
    posController.handleBankWebhook(req, res, body, sseClients);
    return true;
  }

  // 7. Quản lý Bảng Giá Linh Hoạt & Giá Sỉ (Smart Tiered & Seasonal Pricing)
  if (pathname === '/api/pos/prices' && req.method === 'GET') {
    posController.handleGetPrices(req, res);
    return true;
  }

  if (pathname === '/api/pos/prices/calculate' && req.method === 'POST') {
    await posController.handleCalculatePrice(req, res, body);
    return true;
  }

  if (pathname === '/api/pos/prices/update' && req.method === 'POST') {
    posController.handleUpdatePriceRule(req, res, body);
    return true;
  }

  
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

  
  // 9. Multi-Inventory Sync & Cart Validation
  if (pathname === '/api/pos/inventory/validate-cart' && req.method === 'POST') {
    posController.handleValidateCart(req, res, body);
    return true;
  }

  if (pathname === '/api/pos/inventory/raw-materials' && req.method === 'GET') {
    posController.handleGetRawMaterials(req, res);
    return true;
  }

  return false;
}

module.exports = {
  handle
};
