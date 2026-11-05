// CSDL Thợ Kỹ Thuật 6K Đất Phú chuẩn tại Phú Yên
const WORKERS = [
  {
    id: "THO-01",
    fullName: "Nguyễn Văn Tùng (Chú Tùng)",
    phone: "0912345678",
    tradeCategory: "Điện nước & Máy bơm",
    tradeName: "Sửa Chữa Điện Nước & Lắp Máy Bơm Gia Đình",
    district: "TP. Tuy Hòa",
    address: "Phường 7, TP. Tuy Hòa, Phú Yên",
    etaMinutes: 15,
    baseFee: 100000,
    rating: 4.9,
    reviewCount: 68,
    isAvailable: true,
    distanceMeter: 450,
    skills: ["Sửa chập điện âm tường", "Lắp máy bơm tăng áp Panasonic", "Thông tắc PPR"],
    inventory: ["Van giảm áp phi 27", "Vòi rửa chén inox", "Aptomat Panasonic 30A"]
  },
  {
    id: "THO-02",
    fullName: "Trần Quốc Hưng",
    phone: "0987654321",
    tradeCategory: "Điện lạnh & Máy lọc nước",
    tradeName: "Điện Lạnh, Máy Giặt & Tủ Đông Minh Phát",
    district: "TP. Tuy Hòa",
    address: "Phường 5, TP. Tuy Hòa, Phú Yên",
    etaMinutes: 20,
    baseFee: 120000,
    rating: 5.0,
    reviewCount: 42,
    isAvailable: true,
    distanceMeter: 800,
    skills: ["Nạp gas R32 tủ mát quán cafe", "Bơm gas máy lạnh", "Lõi lọc Karofi"],
    inventory: ["Bình gas R32", "Bộ 3 lõi Karofi", "Tụ kích 35uF"]
  },
  {
    id: "THO-03",
    fullName: "Lê Văn Long (Long Khóa)",
    phone: "0903112233",
    tradeCategory: "Mở khóa khẩn cấp",
    tradeName: "Mở Khóa Khẩn Cấp 24/7 & Lắp Khóa Vân Tay",
    district: "TP. Tuy Hòa",
    address: "Trần Hưng Đạo, Phường 4, TP. Tuy Hòa",
    etaMinutes: 10,
    baseFee: 80000,
    rating: 4.8,
    reviewCount: 95,
    isAvailable: true,
    distanceMeter: 650,
    skills: ["Mở khóa cửa sảnh Phòng Nghỉ", "Khóa vân tay thông minh", "Khóa chống trộm"],
    inventory: ["Ruột khóa Việt Tiệp", "Khóa treo chống cắt"]
  }
];

// CSDL Cửa Hàng & Đối Tác Ví An Sinh quanh Tuy Hòa
const STORES = [
  {
    id: 101,
    name: "Đất Phú Phòng Nghỉ & Cà Phê",
    type: "Phòng Nghỉ Lưu Trú & Cà Phê Sảnh",
    address: "Lô HT17 - 86 Lê Duẩn, Phường 7, Tuy Hòa",
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
    distanceMeter: 750,
    rating: 4.95,
    phone: "0914.777.888",
    acceptsViAnSinh: true
  }
];

let dispatchJobs = [];

function handleGetWorkers(req, res, parsedUrl) {
  const radius = Number(parsedUrl.searchParams.get('radius') || 5); // km
  const filtered = WORKERS.filter(w => (w.distanceMeter / 1000) <= radius);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    count: filtered.length,
    workers: filtered
  }));
}

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

function handleDispatchWorker(req, res, body, sseClients) {
  const { workerId, customerName, customerPhone, customerAddress, issueDescription } = body;
  const worker = WORKERS.find(w => w.id === workerId) || WORKERS[0];

  const job = {
    jobId: `DP-DISPATCH-${Date.now()}`,
    workerId: worker.id,
    workerName: worker.fullName,
    workerPhone: worker.phone,
    customerName,
    customerPhone,
    customerAddress,
    issueDescription,
    status: 'assigned',
    estimatedMinutes: worker.etaMinutes,
    createdAt: new Date().toISOString()
  };

  dispatchJobs.unshift(job);

  // Bắn thông báo SSE cho toàn sàn
  const { broadcastSSE } = require('./posController');
  broadcastSSE(sseClients, 'WORKER_DISPATCHED', job);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: `Đã điều phối ${worker.fullName} đến xử lý sự cố`,
    job
  }));
}

module.exports = {
  handleGetWorkers,
  handleGetStores,
  handleDispatchWorker
};
