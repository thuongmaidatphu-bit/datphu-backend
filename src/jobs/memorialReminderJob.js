/**
 * ============================================================================
 * TIẾN TRÌNH TỰ ĐỘNG 2: QUÉT SỔ GIỖ CHẠP & NHẮC VIỆC HIẾU KÍNH
 * Đường dẫn: src/jobs/memorialReminderJob.js
 * ============================================================================
 * Nhiệm vụ:
 * 1. Đọc Sổ Giỗ Gia Tộc tại src/data/memorial_records.json.
 * 2. Ứng dụng giải thuật Meeus để tính chính xác ngày Âm lịch hôm nay và 3 ngày tới.
 * 3. Tự động thông báo:
 *    - Nhắc trước 3 ngày: Giúp gia đình, con cháu sắp xếp đồ lễ, họp họ chu đáo.
 *    - Nhắc đúng ngày chính giỗ: Kính chúc ngày giỗ trang nghiêm, tròn đạo hiếu.
 * 4. Phát sóng Realtime SSE và lưu nhật ký thông báo hiếu sự.
 * ============================================================================
 */

'use strict';

const fs = require('fs');
const path = require('path');
const meeusEngine = require('../modules/calendar/meeusEngine');

const RECORDS_FILE = path.join(__dirname, '../data/memorial_records.json');
const LOGS_FILE = path.join(__dirname, '../data/memorial_notification_logs.json');

function loadRecords() {
  try {
    if (!fs.existsSync(RECORDS_FILE)) return [];
    return JSON.parse(fs.readFileSync(RECORDS_FILE, 'utf8') || '[]');
  } catch (e) {
    console.error("[MemorialJob] Lỗi đọc sổ giỗ:", e.message);
    return [];
  }
}

function saveLog(record) {
  try {
    let logs = [];
    if (fs.existsSync(LOGS_FILE)) {
      logs = JSON.parse(fs.readFileSync(LOGS_FILE, 'utf8') || '[]');
    }
    logs.unshift(record);
    if (logs.length > 200) logs = logs.slice(0, 200);
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2), 'utf8');
  } catch (err) {
    console.error("[MemorialJob] Lỗi ghi log việc hiếu:", err.message);
  }
}

/**
 * Thực hiện 1 lượt quét sổ giỗ cho ngày chỉ định (mặc định hôm nay)
 */
async function runScan(targetDate = new Date(), sseClients = null) {
  const timestamp = new Date().toISOString();
  const records = loadRecords();

  // 1. Tính âm lịch hôm nay
  const td = targetDate.getDate();
  const tm = targetDate.getMonth() + 1;
  const ty = targetDate.getFullYear();
  const todayLunar = meeusEngine.solarToLunar(td, tm, ty);

  // 2. Tính âm lịch 3 ngày tới (Nhắc chuẩn bị trước)
  const in3DaysDate = new Date(targetDate.getTime() + (3 * 24 * 60 * 60 * 1000));
  const in3DaysLunar = meeusEngine.solarToLunar(
    in3DaysDate.getDate(),
    in3DaysDate.getMonth() + 1,
    in3DaysDate.getFullYear()
  );

  console.log(`[MemorialJob] Quét sổ giỗ: Hôm nay Âm lịch MÙNG ${todayLunar.day}/${todayLunar.month} (3 ngày tới: ${in3DaysLunar.day}/${in3DaysLunar.month})...`);

  const matchedToday = [];
  const matchedUpcoming = [];

  records.forEach(rec => {
    // Khớp ngày Chính Giỗ
    if (rec.lunarDay === todayLunar.day && rec.lunarMonth === todayLunar.month) {
      matchedToday.push({
        ...rec,
        type: "CHINH_GIO_HOM_NAY",
        message: `Hôm nay (Mùng ${todayLunar.day} Tháng ${todayLunar.month} Âm lịch) là ngày Chính Giỗ của ${rec.deceasedName} (${rec.relation}). Kính chúc ${rec.familyHead} và toàn thể ${rec.lineage} ngày giỗ trang nghiêm, ấm cúng và tròn đạo hiếu!`
      });
    }

    // Khớp ngày Nhắc Trước 3 ngày
    if (rec.lunarDay === in3DaysLunar.day && rec.lunarMonth === in3DaysLunar.month) {
      matchedUpcoming.push({
        ...rec,
        type: "NHAC_TRUOC_3_NGAY",
        message: `Kính nhắc ${rec.familyHead}: Còn 3 ngày nữa (Mùng ${in3DaysLunar.day} Tháng ${in3DaysLunar.month} Âm lịch) là ngày Giỗ của ${rec.deceasedName} (${rec.relation}) thuộc ${rec.lineage}. Kính nhắc gia đình sớm chuẩn bị đồ lễ và tề tựu con cháu chu toàn.`
      });
    }
  });

  const totalNotifications = matchedToday.length + matchedUpcoming.length;

  const scanResult = {
    scanId: `MEM_${Date.now()}`,
    timestamp,
    solarDate: `${td}/${tm}/${ty}`,
    lunarDate: `Mùng ${todayLunar.day} Tháng ${todayLunar.month} Năm ${todayLunar.year}`,
    totalRecordsChecked: records.length,
    totalMatched: totalNotifications,
    matchedToday,
    matchedUpcoming
  };

  saveLog(scanResult);

  // Phát Realtime SSE tới các máy đang mở ứng dụng
  if (sseClients && sseClients.size > 0 && totalNotifications > 0) {
    const ssePayload = JSON.stringify({
      type: "MEMORIAL_REMINDER",
      totalMatched: totalNotifications,
      matchedToday,
      matchedUpcoming,
      timestamp
    });

    sseClients.forEach(client => {
      try {
        client.write(`event: MEMORIAL_REMINDER\ndata: ${ssePayload}\n\n`);
      } catch (e) {
        // Bỏ qua client đã ngắt kết nối
      }
    });
    console.log(`[MemorialJob] 🕊️ ĐÃ PHÁT THÔNG BÁO VIỆC HIẾU TỚI ${sseClients.size} THIẾT BỊ!`);
  }

  console.log(`[MemorialJob] Hoàn tất quét sổ giỗ: ${matchedToday.length} giỗ chính hôm nay, ${matchedUpcoming.length} giỗ nhắc trước 3 ngày.`);
  return scanResult;
}

/**
 * Khởi động tiến trình tự động (Chạy định kỳ kiểm tra giờ lúc 5:00 AM)
 */
function start(scheduleHour = 5, sseClients = null) {
  console.log(`[MemorialJob] Khởi động tiến trình tự động quét sổ giỗ (Lịch trình: ${scheduleHour}:00 sáng mỗi ngày)...`);

  // Chạy ngay lần đầu sau 5 giây để cập nhật dữ liệu khởi động
  setTimeout(() => runScan(new Date(), sseClients), 5000);

  let lastRunDay = -1;

  // Kiểm tra mỗi 10 phút một lần để bắt đúng thời điểm 5h sáng
  const timer = setInterval(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDate();

    if (currentHour === scheduleHour && lastRunDay !== currentDay) {
      lastRunDay = currentDay;
      console.log(`[MemorialJob] Đến giờ hẹn ${scheduleHour}:00 AM - Tiến hành quét sổ giỗ chạp...`);
      runScan(now, sseClients);
    }
  }, 10 * 60 * 1000);

  return timer;
}

module.exports = {
  loadRecords,
  runScan,
  start
};
