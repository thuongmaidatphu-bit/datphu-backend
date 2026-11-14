/**
 * ============================================================================
 * CỔNG QUẢN LÝ KHO TRI THỨC PHÁP LÝ RAG & BÓC TÁCH TỰ ĐỘNG BẰNG AI
 * Endpoint: /api/rag
 * ============================================================================
 */

const https = require('https');
const { getAllChunks, upsertChunk, deleteChunk, searchLegalKnowledge } = require('../src/agents/legalKnowledgeRAG');

const ADMIN_PINS = ['0979991898', '4401020233', 'datphu2026'];

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

/**
 * GỌI GEMINI ĐỂ BÓC TÁCH VĂN BẢN THÔ THÀNH KHỐI RAG CHUẨN
 */
async function aiExtractChunkFromText(rawText) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Phân tích thô dự phòng
    const lines = rawText.split('\n').filter(Boolean);
    return {
      doc: lines[0] || 'Văn bản quy phạm mới',
      article: 'Điều khoản chung',
      title: (lines[1] || 'Quy định thuế & hóa đơn').substring(0, 80),
      keywords: ['thuế', 'hóa đơn', 'đất phú', 'nghị định'],
      content: rawText
    };
  }

  const prompt = `Bạn là trợ lý pháp lý chuyên nghiệp của Công ty Đất Phú. 
Hãy đọc đoạn văn bản quy phạm pháp luật/nghiệp vụ sau và bóc tách thành đối tượng JSON chuẩn để nạp vào hệ thống RAG:
{
  "doc": "Tên văn bản (VD: Nghị định 254/2026/NĐ-CP hoặc Thông tư 94/2024/TT-BTC)",
  "article": "Điều khoản cụ thể (VD: Điều 5 Khoản 2)",
  "title": "Tiêu đề tóm tắt chủ đề (dưới 80 ký tự)",
  "keywords": ["từ khóa 1", "từ khóa 2", "từ khóa 3", "từ khóa 4"],
  "content": "Nội dung tóm tắt súc tích, chính xác các điểm mấu chốt để trả lời khách hàng"
}

CHÚ Ý: Chỉ trả về duy nhất chuỗi JSON hợp lệ, không giải thích gì thêm!

VĂN BẢN CẦN BÓC TÁCH:
${rawText}`;

  const payload = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 800 }
  });

  return new Promise((resolve) => {
    const req = https.request(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        rejectUnauthorized: false,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      (res) => {
        let resBody = '';
        res.on('data', c => { resBody += c; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(resBody);
            let text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const jsonResult = JSON.parse(text);
            resolve(jsonResult);
          } catch (e) {
            resolve({
              doc: 'Văn bản pháp luật',
              article: 'Quy chuẩn',
              title: 'Quy định mới bóc tách',
              keywords: ['pháp luật', 'thuế', 'hóa đơn'],
              content: rawText
            });
          }
        });
      }
    );
    req.on('error', () => resolve({ content: rawText }));
    req.setTimeout(8000, () => { req.destroy(); resolve({ content: rawText }); });
    req.write(payload);
    req.end();
  });
}

module.exports = async (req, res, optionalBody) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Pin');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  const reqUrl = new URL(req.url || '', 'http://localhost');
  const action = reqUrl.searchParams.get('action') || '';

  // 1. GET: Lấy danh sách toàn bộ các khối tri thức hiện có
  if (req.method === 'GET') {
    const chunks = getAllChunks();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({
      success: true,
      total: chunks.length,
      chunks
    }));
  }

  // 2. DELETE: Xóa 1 khối tri thức
  if (req.method === 'DELETE') {
    const id = reqUrl.searchParams.get('id') || '';
    const pin = reqUrl.searchParams.get('pin') || req.headers['x-admin-pin'] || '';

    if (!ADMIN_PINS.includes(pin)) {
      res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: false, message: 'Mã PIN quản trị không chính xác (Mặc định: 0979991898)' }));
    }

    const ok = deleteChunk(id);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ success: ok, message: ok ? 'Đã xóa khối tri thức' : 'Không tìm thấy mã tri thức' }));
  }

  // 3. POST: Thêm mới, thử nghiệm tìm kiếm hoặc bóc tách AI
  if (req.method === 'POST') {
    const body = await extractBody(req, optionalBody);

    // 3.1 Bóc tách tự động bằng AI từ văn bản thô
    if (action === 'ai-extract') {
      const rawText = (body.text || '').trim();
      if (!rawText) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: false, message: 'Vui lòng cung cấp nội dung văn bản thô cần bóc tách!' }));
      }

      const extracted = await aiExtractChunkFromText(rawText);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: true, extracted }));
    }

    // 3.2 Thử nghiệm tìm kiếm RAG
    if (action === 'search') {
      const query = (body.query || '').trim();
      const results = searchLegalKnowledge(query, 3);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: true, count: results.length, results }));
    }

    // 3.3 Thêm / Cập nhật khối tri thức (Cần kiểm tra PIN)
    const pin = body.pin || req.headers['x-admin-pin'] || '';
    if (!ADMIN_PINS.includes(pin)) {
      res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: false, message: 'Mã PIN quản trị không đúng! Vui lòng nhập mã Hotline 0979991898 hoặc MST công ty.' }));
    }

    if (!body.title || !body.content) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: false, message: 'Vui lòng điền đầy đủ Tiêu đề và Nội dung tri thức!' }));
    }

    const saved = upsertChunk(body);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({
      success: true,
      message: 'Đã nạp thành công khối tri thức mới vào Hệ thống RAG!',
      chunk: saved
    }));
  }

  res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: 'Phương thức không được hỗ trợ' }));
};
