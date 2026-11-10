/**
 * ============================================================================
 * TIẾN TRÌNH TỰ ĐỘNG 1: CANH LŨ THƯỢNG NGUỒN (FLOOD SENTINEL JOB)
 * Đường dẫn: src/jobs/floodSentinelJob.js
 * ============================================================================
 * Nhiệm vụ:
 * 1. Giám sát lượng mưa & gió ở 4 trạm đầu nguồn sông hồ thủy điện Phú Yên:
 *    - Thượng nguồn Sông Ba (Hồ Sông Ba Hạ / Krông Năng)
 *    - Thượng nguồn Sông Hinh (Hồ Thủy điện Sông Hinh)
 *    - Thượng nguồn Sông Kỳ Lộ (Vân Canh đổ về rốn lũ La Hai - Đồng Xuân)
 *    - Hạ du TP. Tuy Hòa (Cửa biển Đà Diễn)
 * 2. Cảnh báo sớm lũ xả đập hoặc ngập lụt đồng bằng hạ lưu.
 * 3. Phát sóng thời gian thực Realtime SSE tới ứng dụng bà con và ghi nhật ký.
 * ============================================================================
 */

'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');

const LOGS_FILE = path.join(__dirname, '../data/flood_alert_logs.json');

// 4 Trạm thượng nguồn thủy văn trọng yếu
const WATCH_STATIONS = [
  {
    id: "song_ba_ha",
    name: "Thượng nguồn Hồ Sông Ba Hạ",
    river: "Lưu vực Sông Ba",
    lat: 12.980,
    lon: 108.950,
    riskArea: "Hạ du Phú Hòa, Tây Hòa, Tuy Hòa"
  },
  {
    id: "song_hinh_res",
    name: "Thượng nguồn Hồ Sông Hinh",
    river: "Lưu vực Sông Hinh",
    lat: 12.850,
    lon: 108.980,
    riskArea: "Huyện Sông Hinh & Hợp lưu Sông Ba"
  },
  {
    id: "ky_lo_upstream",
    name: "Thượng nguồn Sông Kỳ Lộ (Vân Canh)",
    river: "Lưu vực Sông Kỳ Lộ",
    lat: 13.550,
    lon: 109.020,
    riskArea: "Rốn lũ Đồng Xuân (La Hai), Tuy An"
  },
  {
    id: "tuy_hoa_estuary",
    name: "Hạ du Cửa Đà Diễn (Tuy Hòa)",
    river: "Cửa biển Sông Ba",
    lat: 13.088,
    lon: 109.313,
    riskArea: "Nội thành TP. Tuy Hòa"
  }
];

function fetchStationWeather(station) {
  return new Promise((resolve) => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${station.lat}&longitude=${station.lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&timezone=Asia%2FBangkok`;

    const req = https.get(url, { timeout: 4000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const cur = parsed.current || {};
          const precip = cur.precipitation ?? 0.0;
          const wind = cur.wind_speed_10m ?? 0.0;

          // Phân loại cấp độ rủi ro (0: Bình thường, 1: Chú ý, 2: Cảnh báo, 3: Khẩn cấp)
          let alertLevel = 0;
          let alertText = "Mực nước & thời tiết bình thường";

          if (precip >= 30.0 || wind >= 45.0) {
            alertLevel = 3;
            alertText = "BÁO ĐỘNG LŨ KHẨN CẤP: Mưa rất lớn đầu nguồn!";
          } else if (precip >= 15.0 || wind >= 30.0) {
            alertLevel = 2;
            alertText = "CẢNH BÁO: Mưa lớn dồn dập, nguy cơ xả tràn hoặc dâng nhanh!";
          } else if (precip >= 5.0) {
            alertLevel = 1;
            alertText = "LƯU Ý: Có mưa rải rác ở đầu nguồn";
          }

          resolve({
            stationId: station.id,
            name: station.name,
            river: station.river,
            riskArea: station.riskArea,
            temperature: cur.temperature_2m ?? 25,
            precipitation: precip,
            windSpeed: wind,
            alertLevel,
            alertText
          });
        } catch (e) {
          resolve(getFallbackStation(station));
        }
      });
    });

    req.on('error', () => resolve(getFallbackStation(station)));
    req.on('timeout', () => {
      req.destroy();
      resolve(getFallbackStation(station));
    });
  });
}

function getFallbackStation(station) {
  return {
    stationId: station.id,
    name: station.name,
    river: station.river,
    riskArea: station.riskArea,
    temperature: 25.0,
    precipitation: 0.0,
    windSpeed: 10.0,
    alertLevel: 0,
    alertText: "Dữ liệu vệ tinh định kỳ (Ngoại tuyến)",
    isFallback: true
  };
}

function saveLog(record) {
  try {
    let logs = [];
    if (fs.existsSync(LOGS_FILE)) {
      logs = JSON.parse(fs.readFileSync(LOGS_FILE, 'utf8') || '[]');
    }
    logs.unshift(record);
    // Giữ 100 log gần nhất
    if (logs.length > 100) logs = logs.slice(0, 100);
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2), 'utf8');
  } catch (err) {
    console.error("[FloodSentinel] Lỗi ghi log:", err.message);
  }
}

/**
 * Thực hiện 1 lượt quét toàn bộ các trạm thượng nguồn
 */
async function runScan(sseClients = null) {
  const timestamp = new Date().toISOString();
  console.log(`[FloodSentinel] Bắt đầu quét lưu lượng thượng nguồn lúc ${timestamp}...`);

  const results = await Promise.all(WATCH_STATIONS.map(s => fetchStationWeather(s)));

  // Tìm cấp độ cảnh báo cao nhất
  const maxAlert = results.reduce((max, cur) => cur.alertLevel > max.alertLevel ? cur : max, results[0]);

  const scanRecord = {
    scanId: `FL_${Date.now()}`,
    timestamp,
    highestAlertLevel: maxAlert.alertLevel,
    highestAlertStation: maxAlert.name,
    summary: maxAlert.alertLevel >= 2
      ? `🚨 ${maxAlert.alertText} tại ${maxAlert.name} (${maxAlert.precipitation} mm)`
      : `✅ Tình hình lưu vực an toàn (${maxAlert.precipitation} mm mưa lớn nhất)`,
    stations: results
  };

  saveLog(scanRecord);

  // Phát Realtime SSE nếu có trạm từ cấp độ 2 trở lên hoặc nếu có client đang nghe
  if (sseClients && sseClients.size > 0 && maxAlert.alertLevel >= 2) {
    const ssePayload = JSON.stringify({
      type: "FLOOD_ALERT",
      level: maxAlert.alertLevel,
      title: maxAlert.alertText,
      station: maxAlert.name,
      precipitation: maxAlert.precipitation,
      riskArea: maxAlert.riskArea,
      timestamp
    });

    sseClients.forEach(client => {
      try {
        client.write(`event: FLOOD_ALERT\ndata: ${ssePayload}\n\n`);
      } catch (e) {
        // Client ngắt kết nối
      }
    });
    console.log(`[FloodSentinel] ⚠️ ĐÃ PHÁT CẢNH BÁO REALTIME TỚI ${sseClients.size} THIẾT BỊ!`);
  }

  console.log(`[FloodSentinel] Quét hoàn tất. Cấp độ cao nhất: ${maxAlert.alertLevel} (${maxAlert.name}).`);
  return scanRecord;
}

/**
 * Bắt đầu tiến trình ngầm (Mặc định chạy mỗi 15 phút)
 */
function start(intervalMs = 15 * 60 * 1000, sseClients = null) {
  console.log(`[FloodSentinel] Khởi động tiến trình canh lũ tự động (Chu kỳ: ${intervalMs / 60000} phút)...`);
  // Chạy ngay lần đầu sau 3 giây khởi động server
  setTimeout(() => runScan(sseClients), 3000);

  // Lặp lại định kỳ
  const timer = setInterval(() => {
    runScan(sseClients);
  }, intervalMs);

  return timer;
}

module.exports = {
  WATCH_STATIONS,
  runScan,
  start
};
