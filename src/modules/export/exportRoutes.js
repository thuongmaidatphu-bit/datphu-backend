/**
 * ============================================================================
 * ĐẤT PHÚ CORE - EXPORT REPORT ROUTES (exportRoutes.js)
 * Định nghĩa API tải file Excel (.xlsx) và PDF báo cáo doanh thu
 * ============================================================================
 */

const exportController = require('./exportController');

async function handle(pathname, req, res, body, sseClients, parsedUrl) {
  // 1. API tải file Excel báo cáo doanh thu (.xlsx)
  if (pathname === '/api/export/excel' || pathname === '/excel') {
    await exportController.exportExcelReport(req, res, body);
    return true;
  }

  // 2. API tải file PDF báo cáo doanh thu (.pdf)
  if (pathname === '/api/export/pdf' || pathname === '/pdf') {
    await exportController.exportPdfReport(req, res, body);
    return true;
  }

  return false;
}

module.exports = {
  handle
};
