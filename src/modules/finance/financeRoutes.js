/**
 * ============================================================================
 * ĐẤT PHÚ CORE - FINANCE & MONTHLY P&L ROUTES (financeRoutes.js)
 * Bản quyền: CÔNG TY TNHH THƯƠNG MẠI ĐẤT PHÚ (MST: 4401020233)
 * ============================================================================
 */

const financeController = require('./financeController');

async function handleFinanceRoutes(req, res, pathname, body = {}) {
  // 1. GET /api/finance/monthly-pnl - Lấy số liệu P&L chuẩn hóa tháng
  if (pathname === '/api/finance/monthly-pnl' && req.method === 'GET') {
    await financeController.handleGetMonthlyPnL(req, res);
    return true;
  }

  // 2. POST /api/finance/monthly-pnl - Tính toán P&L tùy chỉnh theo số liệu nhập
  if (pathname === '/api/finance/monthly-pnl' && req.method === 'POST') {
    await financeController.handleCalculateCustomPnL(req, res, body);
    return true;
  }

  // 3. GET/POST /api/finance/export/excel - Xuất file Excel (.xlsx) P&L
  if (pathname === '/api/finance/export/excel') {
    await financeController.handleExportPnLExcel(req, res, body);
    return true;
  }

  // 4. GET/POST /api/finance/export/pdf - Xuất file PDF (.pdf) P&L
  if (pathname === '/api/finance/export/pdf') {
    await financeController.handleExportPnLPDF(req, res, body);
    return true;
  }

  return false;
}

module.exports = handleFinanceRoutes;
