/**
 * ============================================================================
 * ĐẤT PHÚ CORE (2026 - 2027) - ROUTES CHO MODULE 6K KÍN KẼ OS
 * Đường dẫn: src/modules/core6k/core6kRoutes.js
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const core6kController = require('./core6kController');

const PUBLIC_DIR = path.join(__dirname, '..', '..', '..', 'public');

async function handle(pathname, req, res, body, sseClients, parsedUrl) {
  // 1. Báo cáo tổng quan 6 nhóm bảng cốt lõi & kiến trúc 4 tầng
  if (pathname === '/api/v1/core6k/overview' && req.method === 'GET') {
    core6kController.handleGetOverview(req, res);
    return true;
  }

  // 2. Tra cứu đội Thợ 6K Tuy Hòa + Tồn kho vật tư trên xe + Redis Geospatial
  if (pathname === '/api/v1/core6k/workers' && req.method === 'GET') {
    core6kController.handleListWorkers6k(req, res, parsedUrl);
    return true;
  }

  // 2B. Yêu cầu mã OTP 4 chữ số qua Zalo ZNS & Kiểm tra chống Spam IP (Kín Kẽ OS)
  if (pathname === '/api/v1/sos/request-otp' && req.method === 'POST') {
    core6kController.handleRequestZaloOtp(req, res, body);
    return true;
  }

  // 3. Lệnh Cứu Hộ / Gọi Thợ Đã Xác Thực OTP (Từ Cổng 20KB hoặc Cổng Dân Sinh)
  if (pathname === '/api/v1/sos/dispatch' && req.method === 'POST') {
    core6kController.handleSosDispatch15m(req, res, body, sseClients);
    return true;
  }

  // 4. Chuyển giai đoạn kiểm toán K1 -> K6 kèm băm chuỗi SHA-256
  if (pathname === '/api/v1/core6k/stage' && req.method === 'POST') {
    core6kController.handleUpdateK6Stage(req, res, body, sseClients);
    return true;
  }

  // 5. Webhook đối soát VietQR Napas247 -> Sổ cái bút toán kép -> HĐĐT -> Bảo hành số K6
  if (pathname === '/api/v1/core6k/vietqr-webhook' && req.method === 'POST') {
    core6kController.handleVietQrNapasWebhook(req, res, body, sseClients);
    return true;
  }

  // 6. Điều phối Trạm Chung Tay Cộng Đồng 6K (CT-01)
  if (pathname === '/api/v1/community/relief' && req.method === 'POST') {
    core6kController.handleCommunityReliefAction(req, res, body, sseClients);
    return true;
  }

  // 7. Quy trình Đặt lịch hẹn trước (Booking Flow K1 -> K6)
  if (pathname === '/api/v1/booking/create' && req.method === 'POST') {
    core6kController.handleCreateScheduledBooking(req, res, body, sseClients);
    return true;
  }

  if (pathname === '/api/v1/booking/remind' && req.method === 'POST') {
    core6kController.handleSendBookingReminder2h(req, res, body, sseClients);
    return true;
  }

  if (pathname === '/api/v1/booking/complete' && req.method === 'POST') {
    core6kController.handleCompleteBookingFlow(req, res, body, sseClients);
    return true;
  }

  // 8. Cơ chế "Thợ tự công bố giá - Sàn không can thiệp giá" & Báo giá động tại hiện trường
  if (pathname === '/api/v1/worker/rate-card' && req.method === 'POST') {
    core6kController.handleWorkerUpdateRateCard(req, res, body, sseClients);
    return true;
  }

  if (pathname === '/api/v1/worker/field-quote' && req.method === 'POST') {
    core6kController.handleWorkerSubmitFieldQuote(req, res, body, sseClients);
    return true;
  }

  // 7. Đường dẫn ngắn gọn tới 2 Phân hệ Giao diện tách biệt:
  //    - /cuu-ho hoặc /sos -> Cổng Cứu Hộ Siêu Tốc 20KB (cuu_ho_20kb.html)
  //    - /dan-sinh         -> Cổng Dân Sinh Tổng Thể (cong_dan_sinh.html)
  if ((pathname === '/cuu-ho' || pathname === '/sos') && req.method === 'GET') {
    const file = path.join(PUBLIC_DIR, 'cuu_ho_20kb.html');
    if (fs.existsSync(file)) {
      const stat = fs.statSync(file);
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'X-DatPhu-Portal': 'SOS-20KB-ULTRA-LIGHT',
        'X-Payload-Bytes': String(stat.size)
      });
      fs.createReadStream(file).pipe(res);
      return true;
    }
  }

  if ((pathname === '/dan-sinh' || pathname === '/khach') && req.method === 'GET') {
    const file = path.join(PUBLIC_DIR, 'cong_dan_sinh.html');
    if (fs.existsSync(file)) {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'X-DatPhu-Portal': 'CONG-DAN-SINH-KHACH-HANG'
      });
      fs.createReadStream(file).pipe(res);
      return true;
    }
  }

  if (pathname === '/tho' && req.method === 'GET') {
    const file = path.join(PUBLIC_DIR, 'app_tho_6k.html');
    if (fs.existsSync(file)) {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'X-DatPhu-Portal': 'APP-THO-6K'
      });
      fs.createReadStream(file).pipe(res);
      return true;
    }
  }

  if (pathname === '/quay' && req.method === 'GET') {
    const file = path.join(PUBLIC_DIR, 'app_quay_so.html');
    if (fs.existsSync(file)) {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'X-DatPhu-Portal': 'APP-QUAY-VAT-TU'
      });
      fs.createReadStream(file).pipe(res);
      return true;
    }
  }

  if ((pathname === '/tim-quanh-day' || pathname === '/quanh-day') && req.method === 'GET') {
    const file = path.join(PUBLIC_DIR, 'datphu_nearby_hub.html');
    if (fs.existsSync(file)) {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'X-DatPhu-Portal': 'NEARBY-WORKER-HUB'
      });
      fs.createReadStream(file).pipe(res);
      return true;
    }
  }

  return false;
}

module.exports = {
  handle
};
