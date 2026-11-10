/**
 * ============================================================================
 * VERCEL SERVERLESS FUNCTION: CỔNG AI MINH TRIẾT NHÂN LOẠI & DÂN SINH ĐẤT PHÚ
 * Kết nối Google Gemini Flash Lite với cơ chế Bộ Đệm Cache bảo vệ 100% token
 * ============================================================================
 */
const https = require('https');

// Bộ đệm trong bộ nhớ (Cache 4 tiếng mỗi vùng để bảo toàn token miễn phí)
const wisdomCache = new Map();

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  const parsed = new URL(req.url, 'http://localhost');
  const location = parsed.searchParams.get('location') || 'Tuy Hòa, Phú Yên';
  const weather = parsed.searchParams.get('weather') || 'Trời đêm thanh mát';
  const lunar = parsed.searchParams.get('lunar') || 'Tháng 10 Âm Lịch';
  const hour = new Date().getHours();
  const dateKey = new Date().toISOString().split('T')[0];
  const timeSlot = Math.floor(hour / 4); // Cập nhật lại sau mỗi 4 tiếng
  const cacheKey = `${dateKey}_${location}_${timeSlot}`;

  // 1. Kiểm tra Cache để đạt tốc độ 5ms và 0 tốn thêm token
  if (wisdomCache.has(cacheKey)) {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ success: true, cached: true, wisdom: wisdomCache.get(cacheKey) }));
  }

  const apiKey = process.env.GEMINI_API_KEY || Buffer.from('QVEuQWI4Uk42SjdHeHVVTjUtNjNKYjQxRTJweUFITDRvbWZ3anMxZE5RbDdKVkZfdVdoSUE=', 'base64').toString('utf8');

  // 2. Prompt chắt lọc tinh hoa minh triết nhân loại & đượm tình quê hương xứ Nẫu
  const prompt = `Bạn là Trí tuệ Minh triết Dân gian của vùng Đất Phú (Phú Yên) và tinh hoa nhân loại.
Thời điểm: Lúc ${hour}h, ngày Âm lịch: ${lunar}, tại ${location}, thời tiết: ${weather}.
Hãy viết đúng 1 câu đúc kết minh triết hoặc lời chúc ngắn (tối đa 20 từ), đượm tình nghĩa quê hương và đạo lý con người, chân thành mà chạm đến trái tim người đọc.
Chỉ trả về đúng 1 câu văn, tuyệt đối không thêm dấu ngoặc kép, không thêm lời dẫn, không giải thích.`;

  const postData = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 60
    }
  });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`;

  const request = https.request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }, (geminiRes) => {
    let data = '';
    geminiRes.on('data', chunk => data += chunk);
    geminiRes.on('end', () => {
      try {
        const json = JSON.parse(data);
        let text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim()?.replace(/^["']|["']$/g, '');
        if (text) {
          wisdomCache.set(cacheKey, text);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ success: true, cached: false, wisdom: text }));
        }
      } catch (e) {}

      // Fallback khi cần
      const fallback = (hour >= 18 || hour < 6)
        ? "Tuy Hòa đã lên đèn, bình yên ở lại, chúc bạn một buổi tối ấm áp và dịu êm."
        : "Trời êm biển lặng • Đất Phú an bình • Thuận buồm xuôi gió.";
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, fallback: true, wisdom: fallback }));
    });
  });

  request.on('error', () => {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, fallback: true, wisdom: "Trời êm biển lặng • Đất Phú an bình" }));
  });

  request.write(postData);
  request.end();
};
