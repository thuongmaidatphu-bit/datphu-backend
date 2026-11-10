/**
 * ============================================================================
 * ĐẤT PHÚ CALENDAR CONTROLLER
 * ============================================================================
 * Tiếp nhận HTTP Request, xác thực tham số, gọi CalendarService và trả JSON
 * ============================================================================
 */

'use strict';

const fs = require('fs');
const path = require('path');
const calendarService = require('./calendarService');

const MEMORIAL_FILE = path.join(__dirname, '../../data/memorial_records.json');
const FLOOD_LOGS = path.join(__dirname, '../../data/flood_alert_logs.json');
const MEMORIAL_LOGS = path.join(__dirname, '../../data/memorial_notification_logs.json');

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-cache'
  });
  res.end(JSON.stringify(data));
}

exports.getToday = async (req, res, query) => {
  try {
    const region = query.region || 'tuy_hoa';
    const date = query.date || null; // format YYYY-MM-DD nếu muốn xem ngày khác
    const data = await calendarService.getTodayData(region, date);
    sendJson(res, 200, {
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    sendJson(res, 500, {
      success: false,
      error: error.message
    });
  }
};

exports.getMonth = async (req, res, query) => {
  try {
    const now = new Date();
    const month = query.month || (now.getMonth() + 1);
    const year = query.year || now.getFullYear();
    const data = calendarService.getMonthData(month, year);
    sendJson(res, 200, {
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    sendJson(res, 500, {
      success: false,
      error: error.message
    });
  }
};

exports.getYear = async (req, res, query) => {
  try {
    const now = new Date();
    const year = query.year || now.getFullYear();
    const data = calendarService.getYearOverview(year);
    sendJson(res, 200, {
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    sendJson(res, 500, {
      success: false,
      error: error.message
    });
  }
};

exports.convert = async (req, res, query) => {
  try {
    const { type, day, month, year, isLeap } = query;
    if (!day || !month || !year) {
      return sendJson(res, 400, {
        success: false,
        error: "Thiếu tham số day, month, year"
      });
    }
    const result = calendarService.convertDate({ type, day, month, year, isLeap });
    sendJson(res, result.success ? 200 : 400, result);
  } catch (error) {
    sendJson(res, 500, {
      success: false,
      error: error.message
    });
  }
};

// ============================================================================
// CÁC HÀM XỬ LÝ TIẾN TRÌNH & SỔ GIỖ GIA TỘC
// ============================================================================

exports.getJobsStatus = async (req, res) => {
  try {
    let floodLogs = [];
    let memorialLogs = [];
    if (fs.existsSync(FLOOD_LOGS)) {
      floodLogs = JSON.parse(fs.readFileSync(FLOOD_LOGS, 'utf8') || '[]');
    }
    if (fs.existsSync(MEMORIAL_LOGS)) {
      memorialLogs = JSON.parse(fs.readFileSync(MEMORIAL_LOGS, 'utf8') || '[]');
    }

    sendJson(res, 200, {
      success: true,
      data: {
        floodSentinel: {
          status: "RUNNING",
          interval: "15 phút",
          latestScan: floodLogs[0] || null,
          totalScansRecorded: floodLogs.length
        },
        memorialReminder: {
          status: "RUNNING",
          schedule: "5:00 AM Hàng ngày",
          latestScan: memorialLogs[0] || null,
          totalScansRecorded: memorialLogs.length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    sendJson(res, 500, { success: false, error: error.message });
  }
};

exports.triggerJob = async (req, res, query, sseClients) => {
  try {
    const jobsHub = require('../../jobs');
    const jobName = query.job || 'flood';
    const result = await jobsHub.triggerJob(jobName, sseClients);
    sendJson(res, 200, {
      success: true,
      message: `Đã kích hoạt thành công tiến trình: ${jobName}`,
      result
    });
  } catch (error) {
    sendJson(res, 500, { success: false, error: error.message });
  }
};

exports.getMemorialRecords = async (req, res) => {
  try {
    let records = [];
    if (fs.existsSync(MEMORIAL_FILE)) {
      records = JSON.parse(fs.readFileSync(MEMORIAL_FILE, 'utf8') || '[]');
    }
    sendJson(res, 200, {
      success: true,
      total: records.length,
      data: records
    });
  } catch (error) {
    sendJson(res, 500, { success: false, error: error.message });
  }
};

exports.createMemorialRecord = async (req, res, body) => {
  try {
    const { familyHead, phone, lineage, deceasedName, relation, lunarDay, lunarMonth, notes } = body;
    if (!familyHead || !deceasedName || !lunarDay || !lunarMonth) {
      return sendJson(res, 400, {
        success: false,
        error: "Vui lòng nhập đầy đủ: người đại diện, người quá cố, ngày và tháng âm lịch"
      });
    }

    let records = [];
    if (fs.existsSync(MEMORIAL_FILE)) {
      records = JSON.parse(fs.readFileSync(MEMORIAL_FILE, 'utf8') || '[]');
    }

    const newRecord = {
      id: `MEM_${Date.now()}`,
      familyHead,
      phone: phone || "",
      lineage: lineage || "Gia tộc Phú Yên",
      deceasedName,
      relation: relation || "Người thân",
      lunarDay: parseInt(lunarDay, 10),
      lunarMonth: parseInt(lunarMonth, 10),
      notes: notes || "",
      remindDaysBefore: 3,
      createdAt: new Date().toISOString()
    };

    records.push(newRecord);
    fs.writeFileSync(MEMORIAL_FILE, JSON.stringify(records, null, 2), 'utf8');

    sendJson(res, 201, {
      success: true,
      message: "Đã thêm việc hiếu kính vào Sổ Giỗ thành công!",
      data: newRecord
    });
  } catch (error) {
    sendJson(res, 500, { success: false, error: error.message });
  }
};
