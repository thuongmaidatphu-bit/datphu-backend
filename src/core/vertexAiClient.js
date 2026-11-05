/**
 * ============================================================================
 * ĐẤT PHÚ AI ENGINE INITIALIZER
 * Trung Tâm Xử Lý Ngôn Ngữ & Trí Tuệ Nhân Tạo Hệ Sinh Thái Đất Phú
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const CONFIG_PATH = path.resolve(__dirname, '../../ai-config.json');
const KEY_PATHS = [
  path.resolve(__dirname, '../../service-account-key.json'),
  path.resolve(__dirname, '../../../service-account-key.json'),
  'E:/datphu-backend/service-account-key.json'
];

let genAIClient = null;
let vertexClient = null;

let aiStatus = {
  connected: false,
  provider: null,
  model: 'Đất Phú AI Pro',
  projectId: 'datphu',
  serviceAccount: 'datphu-core@datphu.vn',
  apiKeyMasked: null,
  message: 'Chưa khởi tạo'
};

function initAI() {
  // 1. Khởi tạo từ cấu hình bảo mật nội bộ Đất Phú
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      if (cfg.apiKey && cfg.apiKey.startsWith('AIza')) {
        genAIClient = new GoogleGenerativeAI(cfg.apiKey);
        const masked = cfg.apiKey.substring(0, 6) + '••••••••' + cfg.apiKey.substring(cfg.apiKey.length - 4);
        
        aiStatus = {
          connected: true,
          provider: 'datphu_ai_core',
          model: 'Đất Phú AI Core',
          projectId: 'datphu',
          apiKeyMasked: masked,
          message: 'Đã kích hoạt Trợ Lý AI Đất Phú thành công!'
        };
        console.log(`[Đất Phú AI Engine] Kích hoạt Trí Tuệ Nhân Tạo Đất Phú thành công!`);
        return;
      }
    } catch (e) {
      console.warn('[Đất Phú AI Config Warning]:', e.message);
    }
  }

  // 2. Dự phòng qua Service Account
  for (const p of KEY_PATHS) {
    if (fs.existsSync(p)) {
      try {
        const { VertexAI } = require('@google-cloud/vertexai');
        const raw = fs.readFileSync(p, 'utf8');
        const keyData = JSON.parse(raw);
        process.env.GOOGLE_APPLICATION_CREDENTIALS = p;

        vertexClient = new VertexAI({
          project: keyData.project_id,
          location: 'us-central1'
        });

        aiStatus = {
          connected: true,
          provider: 'datphu_ai_core',
          model: 'Đất Phú AI Core',
          projectId: 'datphu',
          message: 'Đã kích hoạt Trợ Lý AI Đất Phú thành công!'
        };
        console.log(`[Đất Phú AI Engine] Đã kết nối Đất Phú AI Core`);
        return;
      } catch (err) {
        console.warn('[Đất Phú AI Init Warning]:', err.message);
      }
    }
  }

  aiStatus = {
    connected: false,
    provider: null,
    message: 'Chưa cấu hình khóa kích hoạt AI Đất Phú.'
  };
}

// Khởi chạy ngay khi load
initAI();

function getAIStatus() {
  if (!aiStatus.connected) {
    initAI();
  }
  return aiStatus;
}

function getGenAI() {
  if (!genAIClient && !vertexClient) {
    initAI();
  }
  return { genAIClient, vertexClient, status: aiStatus };
}

module.exports = {
  initAI,
  getAIStatus,
  getVertexStatus: getAIStatus,
  getGenAI,
  getVertexClient: () => vertexClient
};
