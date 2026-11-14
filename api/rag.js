/**
 * ============================================================================
 * CỔNG QUẢN LÝ KHO TRI THỨC PHÁP LÝ RAG & BÓC TÁCH TỰ ĐỘNG BẰNG AI
 * Endpoint: /api/rag
 * Hỗ trợ bóc tách File PDF, Word (Docx), TXT và kích hoạt hàng loạt
 * ============================================================================
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { getAllChunks, upsertChunk, deleteChunk, searchLegalKnowledge } = require('../src/agents/legalKnowledgeRAG');

// Tự động nạp GEMINI_API_KEY từ file .env nếu chưa có trong process.env
if (!process.env.GEMINI_API_KEY) {
  try {
    const envPaths = [
      path.resolve(__dirname, '../.env'),
      path.resolve(process.cwd(), '.env'),
      'e:/datphu-backend/.env'
    ];
    for (const ep of envPaths) {
      if (fs.existsSync(ep)) {
        const lines = fs.readFileSync(ep, 'utf8').split('\n');
        for (const line of lines) {
          const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
          if (match && !process.env[match[1]]) {
            process.env[match[1]] = (match[2] || '').trim().replace(/^["']|["']$/g, '');
          }
        }
        break;
      }
    }
  } catch (e) {}
}

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
 * GỌI GEMINI ĐỂ PHÂN TÍCH & BÓC TÁCH FILE HOẶC VĂN BẢN THÀNH NHIỀU KHỐI RAG
 */
async function aiParseFileToChunks({ fileName, mimeType, base64Data, textContent }) {
  const apiKey = process.env.GEMINI_API_KEY;
  const defaultDocName = fileName ? fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ') : 'Văn bản quy phạm mới';

  if (!apiKey) {
    // Trích xuất cơ bản không có API key
    const text = textContent || 'Nội dung file ' + defaultDocName;
    return [
      {
        doc: defaultDocName,
        article: 'Điều khoản tổng quát',
        title: 'Quy định pháp lý & nghiệp vụ',
        keywords: ['pháp luật', 'thuế', 'hóa đơn', 'đất phú'],
        content: text.substring(0, 1500)
      }
    ];
  }

  const promptText = `Bạn là chuyên gia pháp lý và giám đốc tuân thủ thuế của Hệ sinh thái Đất Phú Gen 4.
Hãy đọc toàn bộ tài liệu sau (tên tài liệu: "${defaultDocName}") và phân tích, chia nhỏ thành các KHỐI TRI THỨC RAG (Knowledge Chunks) độc lập.
Mỗi khối tri thức phải giải quyết một chủ đề cụ thể (Ví dụ: Đối tượng áp dụng, Cơ chế chữ ký số, Tỷ lệ tính thuế %, Quy trình xử lý sai sót, Mức xử phạt vi phạm...).

YÊU CẦU ĐẦU RA:
Trả về DUY NHẤT một mảng JSON thuần túy (không kèm giải thích, không dùng markdown thừa) theo cấu trúc:
[
  {
    "doc": "${defaultDocName}",
    "article": "Điều khoản cụ thể (VD: Điều 3 Khoản 1)",
    "title": "Tiêu đề súc tích của chủ đề này (dưới 80 ký tự)",
    "keywords": ["từ khóa 1", "từ khóa 2", "từ khóa 3", "từ khóa 4"],
    "content": "Tóm tắt đầy đủ, mạch lạc các quy tắc, số liệu, tỷ lệ % hoặc hướng dẫn thực thi để AI trả lời khách hàng"
  }
]
`;

  const parts = [];
  if (base64Data && mimeType === 'application/pdf') {
    // Gửi trực tiếp PDF qua inlineData của Gemini
    parts.push({
      inlineData: {
        mimeType: 'application/pdf',
        data: base64Data
      }
    });
    parts.push({ text: promptText });
  } else {
    // Gửi văn bản trích xuất
    parts.push({
      text: `${promptText}\n\n[TOÀN VĂN NỘI DUNG TÀI LIỆU]:\n${(textContent || '').substring(0, 30000)}`
    });
  }

  const payload = JSON.stringify({
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.15,
      maxOutputTokens: 2500
    }
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
            const jsonArray = JSON.parse(text);
            if (Array.isArray(jsonArray)) {
              resolve(jsonArray);
            } else if (typeof jsonArray === 'object') {
              resolve([jsonArray]);
            } else {
              resolve([]);
            }
          } catch (e) {
            console.warn('Lỗi phân tích JSON từ Gemini:', e.message);
            resolve([
              {
                doc: defaultDocName,
                article: 'Mục 1',
                title: 'Nội dung quy chuẩn bóc tách',
                keywords: ['nghiệp vụ', 'pháp luật', 'thuế'],
                content: (textContent || '').substring(0, 1500) || 'Đã nạp file ' + defaultDocName
              }
            ]);
          }
        });
      }
    );

    req.on('error', (err) => {
      console.error('Gemini request error:', err.message);
      resolve([]);
    });

    req.setTimeout(25000, () => {
      req.destroy();
      resolve([]);
    });

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

  // 3. POST: Các thao tác xử lý tri thức
  if (req.method === 'POST') {
    const body = await extractBody(req, optionalBody);

    // 3.1 Bóc tách File (PDF, Word, Text) hoặc văn bản thô thành nhiều Chunks
    if (action === 'parse-file' || action === 'ai-extract') {
      const textContent = (body.text || body.textContent || '').trim();
      const base64Data = (body.base64Data || '').trim();
      const fileName = (body.fileName || '').trim();
      const mimeType = (body.mimeType || 'text/plain').trim();

      if (!textContent && !base64Data) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: false, message: 'Vui lòng cung cấp nội dung file hoặc văn bản thô!' }));
      }

      const chunks = await aiParseFileToChunks({ fileName, mimeType, base64Data, textContent });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({
        success: chunks.length > 0,
        count: chunks.length,
        chunks
      }));
    }

    // 3.2 Kích hoạt HÀNG LOẠT (Batch Ingestion) các khối tri thức sau khi xem trước
    if (action === 'batch-upsert') {
      const pin = body.pin || req.headers['x-admin-pin'] || '';
      if (!ADMIN_PINS.includes(pin)) {
        res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: false, message: 'Mã PIN quản trị không đúng! Vui lòng nhập mã Hotline 0979991898.' }));
      }

      const chunksToInsert = Array.isArray(body.chunks) ? body.chunks : [];
      if (chunksToInsert.length === 0) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: false, message: 'Danh sách khối tri thức cần nạp đang trống!' }));
      }

      let count = 0;
      chunksToInsert.forEach(chunk => {
        if (chunk && chunk.title && chunk.content) {
          upsertChunk(chunk);
          count++;
        }
      });

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({
        success: true,
        addedCount: count,
        message: `Đã kích hoạt thành công ${count} khối tri thức mới vào Kho RAG 24/7!`
      }));
    }

    // 3.3 Thử nghiệm tìm kiếm RAG
    if (action === 'search') {
      const query = (body.query || '').trim();
      const results = searchLegalKnowledge(query, 3);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: true, count: results.length, results }));
    }

    // 3.4 Thêm / Cập nhật từng khối tri thức thủ công
    const pin = body.pin || req.headers['x-admin-pin'] || '';
    if (!ADMIN_PINS.includes(pin)) {
      res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: false, message: 'Mã PIN quản trị không đúng! Vui lòng nhập mã Hotline 0979991898.' }));
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
