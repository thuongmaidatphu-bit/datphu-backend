/**
 * ============================================================================
 * MODULE: LỊCH THIÊN VĂN SINH KẾ (ASTRONOMICAL & CIVIC CALENDAR ROUTES)
 * Đường dẫn: src/modules/calendar/calendarRoutes.js
 * ============================================================================
 */

'use strict';

const calendarController = require('./calendarController');

/**
 * Điều phối các đường dẫn API /api/calendar/*, /api/jobs/*, /api/memorial/*
 */
async function handle(pathname, req, res, body, sseClients, parsedUrl) {
  // Trích xuất query params từ parsedUrl
  const query = {};
  if (parsedUrl && parsedUrl.searchParams) {
    parsedUrl.searchParams.forEach((val, key) => {
      query[key] = val;
    });
  }

  // 1. API: Hôm nay (Bloc ngày đại, âm lịch, tiết khí, con nước, thời tiết vệ tinh)
  // GET /api/calendar/today?region=tuy_hoa
  if (pathname === '/api/calendar/today' && req.method === 'GET') {
    await calendarController.getToday(req, res, query);
    return true;
  }

  // 2. API: Lưới hàng tháng (Lưới 28-31 ngày, số âm lịch to rõ, con nước rong/kém)
  // GET /api/calendar/month?month=11&year=2026
  if (pathname === '/api/calendar/month' && req.method === 'GET') {
    await calendarController.getMonth(req, res, query);
    return true;
  }

  // 3. API: Tổng quan hàng năm (12 tháng, đánh dấu mùng 1 Tết, tháng nhuận)
  // GET /api/calendar/year?year=2026
  if (pathname === '/api/calendar/year' && req.method === 'GET') {
    await calendarController.getYear(req, res, query);
    return true;
  }

  // 4. API: Chuyển đổi hai chiều Dương Lịch <-> Âm Lịch
  if (pathname === '/api/calendar/convert' && req.method === 'GET') {
    await calendarController.convert(req, res, query);
    return true;
  }

  // 5. API: Kiểm tra trạng thái các tiến trình tự động (Sentinel Jobs)
  // GET /api/jobs/status
  if (pathname === '/api/jobs/status' && req.method === 'GET') {
    await calendarController.getJobsStatus(req, res);
    return true;
  }

  // 6. API: Kích hoạt thủ công tiến trình (flood hoặc memorial)
  // POST /api/jobs/trigger?job=flood
  if (pathname === '/api/jobs/trigger' && (req.method === 'POST' || req.method === 'GET')) {
    await calendarController.triggerJob(req, res, query, sseClients);
    return true;
  }

  // 7. API: Sổ Giỗ Gia Tộc - Lấy danh sách & Đăng ký ngày giỗ mới
  // GET /api/memorial/records
  // POST /api/memorial/records
  if (pathname === '/api/memorial/records') {
    if (req.method === 'GET') {
      await calendarController.getMemorialRecords(req, res);
      return true;
    }
    if (req.method === 'POST') {
      await calendarController.createMemorialRecord(req, res, body);
      return true;
    }
  }

  return false;
}

module.exports = {
  handle
};
