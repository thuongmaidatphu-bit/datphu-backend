/**
 * ============================================================================
 * HỆ THỐNG TRÍ NHỚ ĐA PHIÊN & QUẢN LÝ HỒ SƠ HỘI THOẠI (PERSISTENT MEMORY)
 * Hệ thống Đa tác tử Đất Phú Gen 4
 * Lưu trữ: In-memory Map + File data/swarm_sessions.json (hoặc Upstash Redis)
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const SESSIONS_FILE = path.join(__dirname, '..', '..', 'data', 'swarm_sessions.json');
const memoryCache = new Map();

// Tự động tải các phiên từ file lên RAM khi khởi động
function loadSessionsFromFile() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8') || '{}');
      Object.keys(data).forEach(id => {
        memoryCache.set(id, data[id]);
      });
    }
  } catch (e) {
    console.warn('Lỗi đọc swarm_sessions.json:', e.message);
  }
}

loadSessionsFromFile();

// Lưu danh sách phiên xuống đĩa
function persistSessions() {
  try {
    const obj = {};
    memoryCache.forEach((val, key) => {
      obj[key] = val;
    });
    // Giới hạn lưu tối đa 300 phiên gần nhất
    const keys = Object.keys(obj);
    if (keys.length > 300) {
      const toDelete = keys.slice(0, keys.length - 300);
      toDelete.forEach(k => delete obj[k]);
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(obj, null, 2), 'utf8');
  } catch (e) {
    // Bỏ qua lỗi ghi đĩa trên môi trường serverless readonly
  }
}

/**
 * TRÍCH XUẤT THỰC THỂ KHÁCH HÀNG TỰ ĐỘNG (ENTITY EXTRACTION)
 */
function extractCustomerProfile(message, existingProfile = {}) {
  const profile = { ...existingProfile };
  const lower = message.toLowerCase();

  // 1. Trích xuất số điện thoại (10 số bắt đầu bằng 03, 05, 07, 08, 09)
  const phoneMatch = message.match(/(0[35789]\d{8})/);
  if (phoneMatch) {
    profile.phone = phoneMatch[1];
  }

  // 2. Trích xuất tên xưng hô ("Tôi tên là Hùng", "mình tên Nam", "em tên Mai")
  const nameMatch = message.match(/(?:tôi tên là|mình tên là|em tên là|tôi tên|mình tên|anh|chị)\s+([A-ZÀ-Ỹa-zà-ỹ]{2,15})/i);
  if (nameMatch && !profile.name) {
    const rawName = nameMatch[1].trim();
    // Bỏ qua các đại từ thông dụng
    if (!['là', 'ở', 'tại', 'cần', 'muốn'].includes(rawName.toLowerCase())) {
      profile.name = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    }
  }

  // 3. Trích xuất loại hình kinh doanh
  if (lower.includes('cà phê') || lower.includes('cafe')) profile.businessType = 'Quán Cà Phê / Giải Khát';
  else if (lower.includes('quán ăn') || lower.includes('nhà hàng') || lower.includes('f&b')) profile.businessType = 'Nhà Hàng / Quán Ăn';
  else if (lower.includes('tạp hóa') || lower.includes('bán lẻ') || lower.includes('siêu thị')) profile.businessType = 'Tiệm Tạp Hóa / Bán Lẻ';
  else if (lower.includes('khách sạn') || lower.includes('homestay') || lower.includes('nhà nghỉ')) profile.businessType = 'Khách Sạn / Lưu Trú';
  else if (lower.includes('thuốc') || lower.includes('dược')) profile.businessType = 'Nhà Thuốc / Tân Dược';
  else if (lower.includes('thợ') || lower.includes('xây') || lower.includes('sửa nhà')) profile.businessType = 'Dịch Vụ Xây Dựng / Cơ Khí';

  // 4. Trích xuất địa danh Phú Yên / Tây Nguyên
  if (lower.includes('tuy hòa')) profile.location = 'Tuy Hòa';
  else if (lower.includes('sông cầu')) profile.location = 'Sông Cầu';
  else if (lower.includes('đông hòa')) profile.location = 'Đông Hòa';
  else if (lower.includes('tây hòa')) profile.location = 'Tây Hòa';
  else if (lower.includes('phú hòa')) profile.location = 'Phú Hòa';
  else if (lower.includes('buôn ma thuột') || lower.includes('bmt')) profile.location = 'Buôn Ma Thuột';
  else if (lower.includes('đắk lắk')) profile.location = 'Đắk Lắk';
  else if (lower.includes('phú yên')) profile.location = 'Phú Yên';

  return profile;
}

/**
 * LẤY HOẶC KHỞI TẠO PHIÊN HỘI THOẠI
 */
function getOrCreateSession(sessionId, incomingClientHistory = null) {
  const sid = sessionId || ('dp_session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
  
  let session = memoryCache.get(sid);
  if (!session) {
    session = {
      sessionId: sid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customerProfile: {},
      turns: [] // [{ role: 'user', content: '...' }, { role: 'model', content: '...', agent: '...' }]
    };
    memoryCache.set(sid, session);
  }

  // Hợp nhất lịch sử nếu client gửi lên (dành cho môi trường Stateless Serverless)
  if (Array.isArray(incomingClientHistory) && incomingClientHistory.length > 0 && session.turns.length === 0) {
    session.turns = incomingClientHistory.slice(-10); // Giữ tối đa 10 lượt
  }

  return session;
}

/**
 * GHI NHẬN LƯỢT HỘI THOẠI MỚI VÀO BỘ NHỚ
 */
function recordTurn(sessionId, userMessage, assistantReply, agentName) {
  const session = getOrCreateSession(sessionId);
  session.updatedAt = new Date().toISOString();

  // Cập nhật thông tin khách hàng
  session.customerProfile = extractCustomerProfile(userMessage, session.customerProfile);

  // Thêm lượt chat
  session.turns.push({
    role: 'user',
    content: userMessage,
    timestamp: Date.now()
  });

  session.turns.push({
    role: 'model',
    content: assistantReply,
    agent: agentName,
    timestamp: Date.now()
  });

  // Giữ lại 12 lượt chat gần nhất để kiểm soát token
  if (session.turns.length > 12) {
    session.turns = session.turns.slice(-12);
  }

  memoryCache.set(sessionId, session);
  persistSessions();

  return session;
}

/**
 * TẠO BỐI CẢNH HỘI THOẠI ĐỂ GỬI CHO GEMINI (MULTI-TURN CONTENTS)
 */
function buildGeminiContents(systemPrompt, session, currentMessage) {
  const contents = [];

  // Lời chỉ dẫn ngữ cảnh khách hàng cũ nếu có
  let profileNotice = '';
  const p = session.customerProfile || {};
  if (p.name || p.phone || p.businessType || p.location) {
    profileNotice = `\n[HỒ SƠ KHÁCH HÀNG ĐANG TRÒ CHUYỆN]:\n`;
    if (p.name) profileNotice += `- Tên khách: ${p.name}\n`;
    if (p.phone) profileNotice += `- Số điện thoại/Zalo: ${p.phone}\n`;
    if (p.businessType) profileNotice += `- Ngành nghề kinh doanh: ${p.businessType}\n`;
    if (p.location) profileNotice += `- Địa bàn: ${p.location}\n`;
    profileNotice += `=> CHỈ THỊ: Khách đã quen biết hệ thống, hãy chào hỏi thân tình (VD: "Chào anh/chị ${p.name || ''}"), ghi nhớ ngữ cảnh những câu đã hỏi phía trước để trả lời tiếp mạch câu chuyện một cách liền mạch, không hỏi lại những gì khách đã cung cấp!\n`;
  }

  // 1. Turn đầu tiên chứa System Instruction + Profile
  const initialSystemPrompt = `${systemPrompt}${profileNotice}`;

  // 2. Chuyển đổi các turn lịch sử trước đó (tối đa 6 turn gần nhất)
  const historyTurns = (session.turns || []).slice(-6);
  
  if (historyTurns.length === 0) {
    // Phiên mới hoàn toàn
    contents.push({
      role: 'user',
      parts: [{ text: `${initialSystemPrompt}\n\n[CÂU HỎI HIỆN TẠI]: ${currentMessage}` }]
    });
  } else {
    // Có lịch sử: Ghép turn đầu tiên với System Prompt
    historyTurns.forEach((turn, idx) => {
      if (idx === 0) {
        if (turn.role === 'user') {
          contents.push({
            role: 'user',
            parts: [{ text: `${initialSystemPrompt}\n\n[LỊCH SỬ HỘI THOẠI TRƯỚC]:\nKhách: ${turn.content}` }]
          });
        } else {
          contents.push({
            role: 'model',
            parts: [{ text: turn.content }]
          });
        }
      } else {
        contents.push({
          role: turn.role === 'user' ? 'user' : 'model',
          parts: [{ text: turn.content }]
        });
      }
    });

    // Thêm câu hỏi hiện tại
    contents.push({
      role: 'user',
      parts: [{ text: `[CÂU HỎI TIẾP THEO CỦA KHÁCH]: ${currentMessage}` }]
    });
  }

  return { contents, profile: session.customerProfile };
}

module.exports = {
  getOrCreateSession,
  recordTurn,
  buildGeminiContents,
  extractCustomerProfile
};
