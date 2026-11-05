/**
 * ============================================================================
 * ĐẤT PHÚ ECOSYSTEM MAINTENANCE & UPGRADE CONTROLLER
 * Bản quyền: CÔNG TY TNHH THƯƠNG MẠI ĐẤT PHÚ (MST: 4401020233)
 * Trụ sở: Số 21/146 Ngô Gia Tự, TP. Tuy Hòa, Phú Yên
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '..', 'data', 'maintenance_config.json');

// Khởi tạo cấu hình bảo trì mặc định
function loadConfig() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      const initialConfig = {
        system: {
          name: "Hệ Sinh Thái Đất Phú Chợ Phiên",
          company: "CÔNG TY TNHH THƯƠNG MẠI ĐẤT PHÚ",
          mst: "4401020233",
          address: "Số 21/146 Ngô Gia Tự, TP. Tuy Hòa, Phú Yên",
          hotline: "097 999 1898 - 0944 971 257",
          version: "v2.4.0",
          buildNumber: "2026.11.03",
          lastUpgrade: new Date().toISOString()
        },
        maintenance: {
          globalActive: false, // true = Toàn hệ thống bảo trì
          title: "Hệ Thống Đang Nâng Cấp Định Kỳ",
          message: "Đất Phú đang tối ưu hóa máy chủ đám mây Supabase và nâng cấp radar quét thợ. Quý khách vui lòng gọi Hotline cứu hộ khẩn cấp nếu cần trợ giúp tức thì.",
          estimatedCompletion: "30 phút",
          allowAdminBypass: true,
          hotline: "097 999 1898",
          // Trạng thái bảo trì riêng từng phân hệ
          modules: {
            pos: { name: "Ví An Sinh POS & HĐĐT", active: true, underMaintenance: false },
            nearby: { name: "Gọi Thợ 6K & Tiệm Quanh Đây", active: true, underMaintenance: false },
            map3d: { name: "Bản Đồ Số 3D Tuy Hòa", active: true, underMaintenance: false },
            ai: { name: "Trợ Lý Swarm AI Đất Phú", active: true, underMaintenance: false },
            bankWebhook: { name: "Cổng Thanh Toán Napas247", active: true, underMaintenance: false }
          }
        },
        upgradeHistory: [
          {
            version: "v2.4.0",
            title: "Tích Hợp Cổng Xác Thực Đa Kênh RBAC & Hệ Sinh Thái Đất Phú Chợ Phiên",
            date: new Date().toISOString(),
            changes: [
              "Bảo mật ẩn vai trò Quản trị sàn khỏi tầm nhìn công chúng",
              "Tích hợp xác thực OTP SĐT, Email và Zalo 1-chạm",
              "Đồng bộ hóa điều phối thợ K1->K6 tại Tuy Hòa",
              "Kết nối CSDL đám mây Supabase PostGIS"
            ]
          },
          {
            version: "v2.3.0",
            title: "Khởi tạo Bản đồ số 3D Digital Twin Tuy Hòa & Tháp Nghinh Phong",
            date: "2026-11-02T10:00:00.000Z",
            changes: [
              "Dựng mô hình 3D Tháp Nghinh Phong & Khách sạn Đất Phú",
              "Tích hợp bản đồ vệ tinh Google Maps directions",
              "Mô phỏng thợ 6K di chuyển thời gian thực"
            ]
          }
        ]
      };
      const dir = path.dirname(CONFIG_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(initialConfig, null, 2), 'utf-8');
      return initialConfig;
    }
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  } catch (e) {
    return { maintenance: { globalActive: false, modules: {} } };
  }
}

function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (e) {
    console.error("Lỗi lưu cấu hình bảo trì:", e);
  }
}

// 1. LẤY TRẠNG THÁI HỆ THỐNG & BẢO TRÌ (PUBLIC GET)
function handleGetStatus(req, res) {
  const config = loadConfig();
  const uptimeSeconds = Math.floor(process.uptime());

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    system: config.system,
    maintenance: config.maintenance,
    health: {
      uptimeSeconds,
      uptimeFormatted: `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m ${uptimeSeconds % 60}s`,
      memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      nodeVersion: process.version,
      database: "Supabase PostgreSQL (Live)",
      realtimeSSE: "Active",
      status: config.maintenance.globalActive ? "MAINTENANCE" : "OPERATIONAL"
    }
  }));
}

// 2. CẬP NHẬT CHẾ ĐỘ BẢO TRÌ (ADMIN POST)
function handleUpdateMaintenance(req, res, body, sseClients) {
  const config = loadConfig();
  const { globalActive, message, estimatedCompletion, modules } = body;

  if (typeof globalActive === 'boolean') {
    config.maintenance.globalActive = globalActive;
  }
  if (message) config.maintenance.message = message;
  if (estimatedCompletion) config.maintenance.estimatedCompletion = estimatedCompletion;
  if (modules && typeof modules === 'object') {
    config.maintenance.modules = { ...config.maintenance.modules, ...modules };
  }

  saveConfig(config);

  // Phát tín hiệu Realtime SSE tới toàn bộ client
  if (sseClients && sseClients.size > 0) {
    const ssePayload = JSON.stringify({
      type: "SYSTEM_MAINTENANCE_UPDATE",
      globalActive: config.maintenance.globalActive,
      message: config.maintenance.message,
      estimatedCompletion: config.maintenance.estimatedCompletion,
      modules: config.maintenance.modules,
      timestamp: new Date().toISOString()
    });
    for (const client of sseClients) {
      try {
        client.write(`event: MAINTENANCE_EVENT\ndata: ${ssePayload}\n\n`);
      } catch (e) {}
    }
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: "Cập nhật cấu hình bảo trì thành công!",
    maintenance: config.maintenance
  }));
}

// 3. KÍCH HOẠT NÂNG CẤP HỆ THỐNG / OTA PUSH (ADMIN POST)
function handleTriggerUpgrade(req, res, body, sseClients) {
  const config = loadConfig();
  const { newVersion, title, changes = [] } = body;

  const version = newVersion || `v2.${Date.now().toString().slice(-3)}`;
  config.system.version = version;
  config.system.lastUpgrade = new Date().toISOString();

  const historyItem = {
    version,
    title: title || `Bản vá nâng cấp hệ thống ${version}`,
    date: new Date().toISOString(),
    changes: Array.isArray(changes) ? changes : [changes]
  };
  config.upgradeHistory.unshift(historyItem);
  saveConfig(config);

  // Phát thông báo nâng cấp OTA để client tự động refresh/xóa cache
  if (sseClients && sseClients.size > 0) {
    const ssePayload = JSON.stringify({
      type: "SYSTEM_UPGRADE_BROADCAST",
      version,
      title: historyItem.title,
      changes: historyItem.changes,
      forceReload: true,
      timestamp: new Date().toISOString()
    });
    for (const client of sseClients) {
      try {
        client.write(`event: UPGRADE_EVENT\ndata: ${ssePayload}\n\n`);
      } catch (e) {}
    }
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: `Đã phát lệnh nâng cấp phiên bản ${version} tới toàn bộ thiết bị trong hệ sinh thái!`,
    currentVersion: version,
    history: config.upgradeHistory.slice(0, 5)
  }));
}

module.exports = {
  loadConfig,
  handleGetStatus,
  handleUpdateMaintenance,
  handleTriggerUpgrade
};
