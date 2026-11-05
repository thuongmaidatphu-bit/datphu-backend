/**
 * ============================================================================
 * MODULE 1: AUTH ROUTES
 * Đường dẫn: src/modules/auth/authRoutes.js
 * Bản quyền: CÔNG TY TNHH THƯƠNG MẠI ĐẤT PHÚ
 * ============================================================================
 */

const authController = require('./authController');

async function handle(pathname, req, res, body, sseClients, parsedUrl) {
  // 1. Gửi OTP qua SĐT / Zalo
  if (pathname === '/api/auth/send-otp' && req.method === 'POST') {
    authController.handleSendOtp(req, res, body);
    return true;
  }

  // 2. Xác minh OTP & Đăng nhập
  if (pathname === '/api/auth/verify-otp' && req.method === 'POST') {
    authController.handleVerifyOtp(req, res, body);
    return true;
  }

  // 3. Đăng ký tài khoản (hỗ trợ cả đường dẫn chuẩn và alias)
  if ((pathname === '/api/auth/register' || pathname === '/api/auth/register-email') && req.method === 'POST') {
    authController.handleRegister(req, res, body);
    return true;
  }

  // 4. Đăng nhập tài khoản (hỗ trợ cả đường dẫn chuẩn và alias)
  if ((pathname === '/api/auth/login' || pathname === '/api/auth/login-email') && req.method === 'POST') {
    authController.handleLogin(req, res, body);
    return true;
  }

  // 5. Đăng nhập Zalo 1 chạm
  if (pathname === '/api/auth/zalo' && req.method === 'POST') {
    authController.handleZaloLogin(req, res, body);
    return true;
  }

  // 6. Zalo OAuth Callback
  if (pathname === '/api/auth/zalo-callback') {
    if (req.method === 'GET') {
      authController.handleZaloCallback(req, res, parsedUrl.searchParams);
      return true;
    }
    if (req.method === 'POST') {
      authController.handleZaloLogin(req, res, body);
      return true;
    }
  }

  // 7. Lấy thông tin tài khoản hiện tại từ Token
  if (pathname === '/api/auth/me' && req.method === 'GET') {
    authController.handleGetMe(req, res);
    return true;
  }

  return false;
}

module.exports = {
  handle
};
