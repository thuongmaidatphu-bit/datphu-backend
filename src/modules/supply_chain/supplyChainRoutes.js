/**
 * ============================================================================
 * ĐẤT PHÚ CORE - SUPPLY CHAIN ROUTES (supplyChainRoutes.js)
 * Liên kết các API Nhập kho đầu vào (Inbound) và Bán hàng đầu ra (Outbound & POS)
 * ============================================================================
 */

const supplyChainController = require('./supplyChainController');

async function handle(pathname, req, res, body, sseClients, parsedUrl) {
  // 1. API Nhập kho đầu vào (Inbound)
  if ((pathname === '/api/supply-chain/import' || pathname === '/api/supply/import' || pathname === '/import') && req.method === 'POST') {
    await supplyChainController.importStock(req, res, body, sseClients);
    return true;
  }

  // 2. API Bán hàng đầu ra & trừ tồn kho (Outbound & POS)
  if ((pathname === '/api/supply-chain/sale' || pathname === '/api/supply/sale' || pathname === '/sale') && req.method === 'POST') {
    await supplyChainController.createSaleOrder(req, res, body, sseClients);
    return true;
  }

  return false;
}

module.exports = {
  handle
};
