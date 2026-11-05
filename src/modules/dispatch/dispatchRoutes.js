/**
 * ============================================================================
 * MODULE 3: DISPATCH ROUTES
 * Đường dẫn: src/modules/dispatch/dispatchRoutes.js
 * ============================================================================
 */

const dispatchController = require('./dispatchController');

async function handle(pathname, req, res, body, sseClients, parsedUrl) {
  // 1. Lấy danh sách thợ kỹ thuật quanh đây
  if (pathname === '/api/nearby/workers' && req.method === 'GET') {
    dispatchController.handleGetWorkers(req, res, parsedUrl);
    return true;
  }

  // 2. Lấy danh sách cửa hàng tiện ích
  if (pathname === '/api/nearby/stores' && req.method === 'GET') {
    dispatchController.handleGetStores(req, res, parsedUrl);
    return true;
  }

  // 3. Tiếp nhận yêu cầu gọi thợ khẩn cấp
  if ((pathname === '/api/dispatch/create' || pathname === '/api/dispatch') && req.method === 'POST') {
    dispatchController.handleCreateDispatch(req, res, body, sseClients);
    return true;
  }

  // 4. Thợ nhận ca điều phối
  if (pathname === '/api/dispatch/accept' && req.method === 'POST') {
    dispatchController.handleAcceptDispatch(req, res, body, sseClients);
    return true;
  }

  // 5. Nghiệm thu & hoàn tất ca thợ
  if (pathname === '/api/dispatch/complete' && req.method === 'POST') {
    dispatchController.handleCompleteDispatch(req, res, body, sseClients);
    return true;
  }

  // 6. Lịch sử các ca điều phối
  if ((pathname === '/api/dispatch/logs' || pathname === '/api/dispatch') && req.method === 'GET') {
    dispatchController.handleGetDispatchLogs(req, res);
    return true;
  }

  return false;
}

module.exports = {
  handle
};
