/**
 * ============================================================================
 * TRẠM ĐIỀU PHỐI TIẾN TRÌNH TỰ ĐỘNG (BACKGROUND JOBS SENTINEL HUB)
 * Đường dẫn: src/jobs/index.js
 * ============================================================================
 */

'use strict';

const floodSentinelJob = require('./floodSentinelJob');
const memorialReminderJob = require('./memorialReminderJob');

let timers = {
  flood: null,
  memorial: null
};

/**
 * Khởi động tất cả các tiến trình chạy ngầm
 * @param {Set} sseClients Danh sách kết nối Realtime SSE
 */
function startAll(sseClients = null) {
  console.log('[JobsSentinel] ⚙️ Đang kích hoạt các tiến trình tự động Đất Phú...');

  // 1. Canh lũ thượng nguồn: chạy định kỳ mỗi 15 phút
  timers.flood = floodSentinelJob.start(15 * 60 * 1000, sseClients);

  // 2. Quét sổ giỗ chạp & hiếu sự: chạy lúc 5:00 AM mỗi sáng
  timers.memorial = memorialReminderJob.start(5, sseClients);

  console.log('[JobsSentinel] ✅ Đã kích hoạt thành công 2 tiến trình: Flood Sentinel & Memorial Reminder.');
  return timers;
}

/**
 * Kích hoạt thủ công theo yêu cầu (Manual trigger)
 */
async function triggerJob(jobName, sseClients = null) {
  if (jobName === 'flood') {
    return await floodSentinelJob.runScan(sseClients);
  } else if (jobName === 'memorial') {
    return await memorialReminderJob.runScan(new Date(), sseClients);
  } else {
    throw new Error(`Tiến trình không tồn tại: ${jobName}`);
  }
}

module.exports = {
  floodSentinelJob,
  memorialReminderJob,
  startAll,
  triggerJob
};
