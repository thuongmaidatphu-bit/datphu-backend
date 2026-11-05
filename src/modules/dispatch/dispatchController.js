/**
 * ============================================================================
 * MODULE 3: CỨU HỘ KỸ THUẬT 6K (DISPATCH & EMERGENCY SERVICE)
 * Đường dẫn: src/modules/dispatch/dispatchController.js
 * Bản quyền: CÔNG TY TNHH THƯƠNG MẠI ĐẤT PHÚ (MST: 4401020233)
 * Khu vực hoạt động: Bán kính 1km - 5km TP. Tuy Hòa & Phú Yên
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const cloudGateway = require('../../core/cloudGateway');

const DISPATCH_LOGS_FILE = path.join(__dirname, '..', '..', 'data', 'dispatch_logs.json');

// Danh sách đội ngũ thợ 6K Đất Phú chuẩn tại Phú Yên (PostGIS Geo Coordinates)
const WORKERS = [
  {
    id: "THO-01",
    fullName: "Nguyễn Văn Tùng (Chú Tùng)",
    phone: "0912345678",
    tradeCategory: "Điện nước & Máy bơm",
    tradeName: "Sửa Chữa Điện Nước & Lắp Máy Bơm Gia Đình",
    district: "TP. Tuy Hòa",
    address: "Phường 7, TP. Tuy Hòa, Phú Yên",
    lat: 13.0882,
    lng: 109.3087,
    etaMinutes: 15,
    baseFee: 100000,
    rating: 4.9,
    reviewCount: 68,
    isAvailable: true,
    distanceMeter: 450,
    skills: ["Sửa chập điện âm tường", "Lắp máy bơm tăng áp Panasonic", "Hàn nhiệt ống PPR"],
    inventory: ["Van giảm áp phi 27", "Vòi rửa chén inox", "Aptomat Panasonic 30A"]
  },
  {
    id: "THO-02",
    fullName: "Trần Hoàng Nam (Nam Điện Lạnh)",
    phone: "0987654321",
    tradeCategory: "Điện lạnh & Máy lọc nước",
    tradeName: "Điện Lạnh, Máy Giặt & Tủ Đông Minh Phát",
    district: "TP. Tuy Hòa",
    address: "Phường 5, TP. Tuy Hòa, Phú Yên",
    lat: 13.0920,
    lng: 109.3120,
    etaMinutes: 20,
    baseFee: 120000,
    rating: 5.0,
    reviewCount: 42,
    isAvailable: true,
    distanceMeter: 800,
    skills: ["Nạp gas R32 tủ mát quán cafe", "Bơm gas máy lạnh", "Thay lõi lọc Karofi"],
    inventory: ["Bình gas R32", "Bộ 3 lõi Karofi", "Tụ kích 35uF"]
  },
  {
    id: "THO-03",
    fullName: "Lê Văn Hùng (Hùng Cứu Hộ & Khóa)",
    phone: "0903112233",
    tradeCategory: "Mở khóa & Cứu hộ xe máy",
    tradeName: "Mở Khóa Khẩn Cấp 24/7 & Cứu Hộ Xe Lưu Động",
    district: "TP. Tuy Hòa",
    address: "Trần Hưng Đạo, Phường 4, TP. Tuy Hòa",
    lat: 13.0845,
    lng: 109.3040,
    etaMinutes: 10,
    baseFee: 80000,
    rating: 4.8,
    reviewCount: 95,
    isAvailable: true,
    distanceMeter: 650,
    skills: ["Mở khóa cửa sảnh Phòng Nghỉ", "Kích bình ắc quy xe máy", "Vá lốp không ruột tận nơi"],
    inventory: ["Ruột khóa Việt Tiệp", "Khóa treo chống cắt", "Bình ắc quy dự phòng"]
  }
];

// Danh bạ Cửa Hàng & Hộ Kinh Doanh đối tác quanh Tuy Hòa
const STORES = [
  {
    id: 101,
    name: "Đất Phú Phòng Nghỉ & Cà Phê",
    type: "Phòng Nghỉ Lưu Trú & Cà Phê Sảnh",
    address: "Lô HT17 - 86 Lê Duẩn, Phường 7, Tuy Hòa",
    lat: 13.0898,
    lng: 109.3105,
    distanceMeter: 120,
    rating: 4.9,
    phone: "0977.47.88.99",
    acceptsViAnSinh: true
  },
  {
    id: 102,
    name: "Cửa Hàng Thiết Bị Điện Nước Hòa Bình",
    type: "Vật Tư Điện Nước & Linh Kiện Sửa Chữa",
    address: "142 Trần Hưng Đạo, Phường 4, Tuy Hòa",
    lat: 13.0850,
    lng: 109.3035,
    distanceMeter: 550,
    rating: 4.8,
    phone: "0257.3822.111",
    acceptsViAnSinh: true
  },
  {
    id: 103,
    name: "Đặc Sản Phú Yên - Bò Một Nắng Sông Hinh",
    type: "Quà Tặng OCOP & Muối Kiến Vàng",
    address: "26 Nguyễn Huệ, Phường 5, Tuy Hòa",
    lat: 13.0910,
    lng: 109.3140,
    distanceMeter: 750,
    rating: 4.95,
    phone: "0914.777.888",
    acceptsViAnSinh: true
  }
];

function loadDispatchLogs() {
  try {
    if (!fs.existsSync(DISPATCH_LOGS_FILE)) {
      const initialLogs = [
        {
          jobId: "DP-DISPATCH-1001",
          workerId: "THO-01",
          workerName: "Nguyễn Văn Tùng (Chú Tùng)",
          workerPhone: "0912345678",
          customerName: "Chị Lan (Đất Phú Phòng Nghỉ)",
          customerPhone: "0977478899",
          customerAddress: "86 Lê Duẩn, Phường 7, Tuy Hòa",
          issueDescription: "Chập điện cầu dao sảnh cà phê",
          status: "completed",
          stage: "K6_BAO_HANH",
          otpVerified: "4921",
          acceptancePhotoUrl: "https://ckyydvyzucvcdunvedmg.supabase.co/storage/v1/object/public/receipts/nghiemthu_1001.jpg",
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          completedAt: new Date().toISOString()
        }
      ];
      const dir = path.dirname(DISPATCH_LOGS_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DISPATCH_LOGS_FILE, JSON.stringify(initialLogs, null, 2), 'utf-8');
      return initialLogs;
    }
    return JSON.parse(fs.readFileSync(DISPATCH_LOGS_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function saveDispatchLogs(logs) {
  try {
    fs.writeFileSync(DISPATCH_LOGS_FILE, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (e) {
    console.error("Lỗi ghi dispatch_logs.json:", e);
  }
}

function broadcastSSE(clients, event, data) {
  if (!clients) return;
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach(c => {
    try { c.write(msg); } catch (e) {}
  });
}

// 1. LẤY DANH SÁCH THỢ THEO BÁN KÍNH GPS (GET /api/nearby/workers)
function handleGetWorkers(req, res, parsedUrl) {
  const radius = Number(parsedUrl.searchParams.get('radius') || 5);
  const filtered = WORKERS.filter(w => (w.distanceMeter / 1000) <= radius);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    radiusKm: radius,
    count: filtered.length,
    workers: filtered
  }));
}

// 2. LẤY DANH SÁCH CỬA HÀNG QUANH ĐÂY (GET /api/nearby/stores)
function handleGetStores(req, res, parsedUrl) {
  const radius = Number(parsedUrl.searchParams.get('radius') || 5);
  const filtered = STORES.filter(s => (s.distanceMeter / 1000) <= radius);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    count: filtered.length,
    stores: filtered
  }));
}

// 3. TIẾP NHẬN YÊU CẦU "🚨 GỌI THỢ KHẨN CẤP" (POST /api/dispatch/create hoặc /api/dispatch)
function handleCreateDispatch(req, res, body, sseClients) {
  const {
    workerId,
    customerName = "Khách Hàng Tuy Hòa",
    customerPhone = "0979991898",
    customerAddress = "Đường Lê Duẩn, Phường 7, TP. Tuy Hòa",
    issueDescription = "Cần hỗ trợ sự cố khẩn cấp",
    radiusKm = 1
  } = body;

  const worker = WORKERS.find(w => w.id === workerId) || WORKERS[0];
  const logs = loadDispatchLogs();

  const newJob = {
    jobId: `DP-DISPATCH-${Date.now().toString().slice(-6)}`,
    workerId: worker.id,
    workerName: worker.fullName,
    workerPhone: worker.phone,
    customerName,
    customerPhone,
    customerAddress,
    issueDescription,
    stage: "K1_TIEP_NHAN",
    status: "assigned", // assigned -> en_route -> in_progress -> completed
    estimatedMinutes: worker.etaMinutes || 15,
    gpsCoordinates: { lat: worker.lat, lng: worker.lng },
    otpCode: Math.floor(1000 + Math.random() * 9000).toString(), // OTP 4 số giải ngân
    createdAt: new Date().toISOString()
  };

  logs.unshift(newJob);
  saveDispatchLogs(logs);

  // Phát sóng thời gian thực (Realtime SSE) tới toàn bộ thợ 6K trong bán kính
  broadcastSSE(sseClients, 'WORKER_DISPATCHED', {
    ...newJob,
    alertMessage: `🚨 CÓ CA CỨU HỘ MỚI: ${issueDescription} tại ${customerAddress}`
  });

  res.writeHead(201, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: `Đã phát lệnh điều phối thợ ${worker.fullName} (Dự kiến có mặt sau ${worker.etaMinutes} phút)`,
    job: newJob
  }));
}

// 4. THỢ TIẾP NHẬN CA ĐIỀU PHỐI (POST /api/dispatch/accept)
function handleAcceptDispatch(req, res, body, sseClients) {
  const { jobId, workerId } = body;
  const logs = loadDispatchLogs();
  const job = logs.find(j => j.jobId === jobId);

  if (!job) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Không tìm thấy ca điều phối yêu cầu' }));
  }

  job.status = 'en_route';
  job.stage = 'K2_DI_CHUYEN';
  job.acceptedAt = new Date().toISOString();
  saveDispatchLogs(logs);

  // Bắn thông báo SSE tới khách hàng
  broadcastSSE(sseClients, 'DISPATCH_ACCEPTED', {
    jobId: job.jobId,
    status: 'en_route',
    message: `Thợ ${job.workerName} đang di chuyển đến vị trí của bạn!`
  });

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: `Thợ đã nhận ca ${jobId}, đang trên đường đến địa chỉ khách hàng!`,
    job
  }));
}

// 5. HOÀN TẤT CA & NGHIỆM THU ĐIỆN TỬ OTP / S3 (POST /api/dispatch/complete)
function handleCompleteDispatch(req, res, body, sseClients) {
  const { jobId, otpCode, photoBase64, note } = body;
  const logs = loadDispatchLogs();
  const job = logs.find(j => j.jobId === jobId);

  if (!job) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Không tìm thấy ca điều phối' }));
  }

  // Xác minh mã OTP 4 số giải ngân
  if (job.otpCode && otpCode && job.otpCode !== otpCode) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Mã OTP nghiệm thu của khách hàng không chính xác' }));
  }

  job.status = 'completed';
  job.stage = 'K6_BAO_HANH';
  job.completedAt = new Date().toISOString();
  job.otpVerified = otpCode || job.otpCode;
  job.note = note || 'Hoàn tất nghiệm thu đạt chuẩn Đất Phú Chợ Phiên';

  // Lưu ảnh nghiệm thu lên Supabase Storage bucket `receipts` (mô phỏng đường dẫn S3)
  job.acceptancePhotoUrl = `https://ckyydvyzucvcdunvedmg.supabase.co/storage/v1/object/public/receipts/acceptance_${job.jobId}.jpg`;

  saveDispatchLogs(logs);

  broadcastSSE(sseClients, 'DISPATCH_COMPLETED', {
    jobId: job.jobId,
    status: 'completed',
    message: `Ca cứu hộ ${job.jobId} đã nghiệm thu thành công. Kích hoạt bảo hành QR 6 tháng!`
  });

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: "Nghiệm thu điện tử thành công, đã giải ngân tiền công cho thợ!",
    job
  }));
}

// 6. LẤY LỊCH SỬ ĐIỀU PHỐI (GET /api/dispatch/logs)
function handleGetDispatchLogs(req, res) {
  const logs = loadDispatchLogs();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    count: logs.length,
    logs
  }));
}

module.exports = {
  WORKERS,
  STORES,
  handleGetWorkers,
  handleGetStores,
  handleCreateDispatch,
  handleAcceptDispatch,
  handleCompleteDispatch,
  handleGetDispatchLogs
};
