/**
 * ============================================================================
 * MODULE 4: TAX & INVOICE ROUTES
 * Đường dẫn: src/modules/tax_invoice/taxRoutes.js
 * ============================================================================
 */

const taxController = require('./taxController');

async function handle(pathname, req, res, body, sseClients, parsedUrl) {
  // 1. Danh sách hóa đơn điện tử đầu vào & đầu ra
  if (pathname === '/api/tax/invoices' && req.method === 'GET') {
    taxController.handleListInvoices(req, res, parsedUrl);
    return true;
  }

  // 2. Báo cáo đối soát thuế cuối ngày
  if (pathname === '/api/tax/report' && req.method === 'GET') {
    taxController.handleGetTaxReport(req, res);
    return true;
  }

  // 3. Tính toán nghĩa vụ thuế theo Thông tư 40
  if (pathname === '/api/tax/calculate' && req.method === 'POST') {
    taxController.handleCalculateTax(req, res, body);
    return true;
  }

  // 4. Phát hành hóa đơn điện tử máy tính tiền NĐ 123
  if (pathname === '/api/tax/einvoice' && req.method === 'POST') {
    taxController.handleIssueEInvoice(req, res, body);
    return true;
  }

  return false;
}

module.exports = {
  handle
};
