/**
 * CỔNG TIẾP NHẬN TƯ VẤN DỊCH VỤ SỐ & ĐĂNG KÝ GEN 4
 * Lưu trữ lead và bắn thông báo tức thì
 */
const fs = require('fs');
const path = require('path');

const LEADS_FILE = path.join(__dirname, '..', 'data', 'consultation_leads.json');

module.exports = async (req, res) => {
  // Bật CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
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
          ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || ''
        };

        // Lưu vào file JSON
        try {
          let list = [];
          if (fs.existsSync(LEADS_FILE)) {
            list = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8') || '[]');
          }
          list.unshift(newLead);
          fs.writeFileSync(LEADS_FILE, JSON.stringify(list.slice(0, 500), null, 2), 'utf8');
        } catch (e) {
          console.error('Error saving lead to file:', e);
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ 
          success: true, 
          message: 'Đăng ký thành công! Chuyên viên Đất Phú sẽ liên hệ tư vấn trong 15 phút.',
          leadId: newLead.id
        }));

      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: false, message: 'Lỗi xử lý dữ liệu: ' + err.message }));
      }
    });
    return;
  }

  // GET: Xem danh sách lead (dành cho nội bộ)
  try {
    let list = [];
    if (fs.existsSync(LEADS_FILE)) {
      list = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8') || '[]');
    }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ count: list.length, leads: list }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ count: 0, leads: [], error: err.message }));
  }
};
