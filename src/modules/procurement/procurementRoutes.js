/**
 * ============================================================================
 * GIAI ĐOẠN 1: THU MUA & NHÀ CUNG CẤP ROUTES
 * Đường dẫn: src/modules/procurement/procurementRoutes.js
 * ============================================================================
 */

const procurementController = require('./procurementController');

async function handle(pathname, req, res, body, sseClients, parsedUrl) {
  // 1. Quản lý nhà cung cấp
  if (pathname === '/api/procurement/suppliers') {
    if (req.method === 'GET') {
      procurementController.handleGetSuppliers(req, res);
      return true;
    }
    if (req.method === 'POST') {
      procurementController.handleCreateSupplier(req, res, body);
      return true;
    }
  }

  // 2. Nhập kho & cộng tồn kho
  if (pathname === '/api/procurement/inbound') {
    if (req.method === 'GET') {
      procurementController.handleGetInboundHistory(req, res);
      return true;
    }
    if (req.method === 'POST') {
      procurementController.handleCreateInboundOrder(req, res, body, sseClients);
      return true;
    }
  }

  // 3. Tải và lưu trữ chứng từ HĐĐT đầu vào (XML/PDF) lên Supabase Storage
  if (pathname === '/api/procurement/inbound/invoice' && req.method === 'POST') {
    procurementController.handleUploadInboundInvoice(req, res, body);
    return true;
  }

  return false;
}

module.exports = {
  handle
};
