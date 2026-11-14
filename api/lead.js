/**
 * CỔNG TIẾP NHẬN TƯ VẤN DỊCH VỤ SỐ & ĐĂNG KÝ GEN 4
 * Lưu trữ lead và bắn thông báo tức thì
 */
const fs = require('fs');
const path = require('path');

const LEADS_FILE = path.join(__dirname, '..', 'data', 'consultation_leads.json');

async function extractBody(req, existingBody) {
  if (existingBody && typeof existingBody === 'object') return existingBody;
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch (e) { return {}; }
  }
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch (e) { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

module.exports = async (req, res, optionalBody) => {
  // Bật CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  if (req.method === 'POST') {
    try {
      const data = await extractBody(req, optionalBody);
      const phone = (data.phone || '').trim();
      const name = (data.name || '').trim();
      const service = (data.service || 'Tư vấn chung Gen 4').trim();
      const note = (data.note || '').trim();

      if (!phone) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: false, message: 'Vui lòng cung cấp số điện thoại hoặc Zalo!' }));
      }

      const newLead = {
        id: 'LEAD_' + Date.now(),
        phone,
        name: name || 'Khách hàng quan tâm',
        service,
        note,
        createdAt: new Date().toISOString(),
        ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || ''
      };

      // Lưu vào file JSON
      try {
        let list = [];
        if (fs.existsSync(LEADS_FILE)) {
          const content = fs.readFileSync(LEADS_FILE, 'utf8');
          list = JSON.parse(content || '[]');
        }
        list.unshift(newLead);
        if (list.length > 500) list = list.slice(0, 500);
        fs.writeFileSync(LEADS_FILE, JSON.stringify(list, null, 2), 'utf8');
      } catch (err) {
        console.warn('Lỗi ghi file leads (bỏ qua nếu chạy Serverless readonly):', err.message);
      }

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({
        success: true,
        message: 'Đăng ký thành công! Chuyên viên Đất Phú sẽ liên hệ tư vấn trong vòng 15 phút.',
        leadId: newLead.id
      }));

    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: false, message: 'Lỗi máy chủ khi xử lý đăng ký' }));
    }
  }

  // GET: Xem danh sách lead (nội bộ)
  try {
    let list = [];
    if (fs.existsSync(LEADS_FILE)) {
      list = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8') || '[]');
    }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ total: list.length, leads: list }));
  } catch (e) {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ total: 0, leads: [] }));
  }
};
