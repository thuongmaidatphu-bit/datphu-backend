/**
 * ============================================================================
 * KHO TRI THỨC PHÁP LÝ CHUYÊN SÂU & BỘ MÁY RAG (LEGAL KNOWLEDGE RAG ENGINE)
 * Hệ thống Đa tác tử Đất Phú Gen 4
 * Nạp động từ data/legal_knowledge_base.json & hỗ trợ Quản trị viên cập nhật
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const KNOWLEDGE_FILE = path.join(__dirname, '..', '..', 'data', 'legal_knowledge_base.json');

// MẢNG DỰ PHÒNG CỐ ĐỊNH NẾU FILE KHÔNG TỒN TẠI
const FALLBACK_CHUNKS = [
  {
    id: 'ND254_DOI_TUONG_AP_DUNG',
    doc: 'Nghị định 254/2026/NĐ-CP',
    article: 'Điều 3 & Điều 5',
    title: 'Đối tượng bắt buộc áp dụng Hóa đơn điện tử khởi tạo từ máy tính tiền',
    keywords: ['đối tượng', 'bắt buộc', 'cà phê', 'quán ăn', 'nhà hàng', 'khách sạn', 'tạp hóa', 'thuốc', 'bán lẻ', 'siêu thị', 'trung tâm thương mại', 'vui chơi', 'vé', 'máy tính tiền', '254'],
    content: `Theo Nghị định 254/2026/NĐ-CP, các cơ sở kinh doanh có hoạt động cung cấp hàng hóa, dịch vụ trực tiếp đến người tiêu dùng bắt buộc phải triển khai hóa đơn điện tử khởi tạo từ máy tính tiền có kết nối chuyển dữ liệu với cơ quan thuế. Nhóm ngành bắt buộc trọng điểm gồm F&B, lưu trú, bán lẻ thuốc, tạp hóa và giải trí.`
  }
];

let cachedChunks = null;
let lastLoadTime = 0;

/**
 * ĐỌC TOÀN BỘ DANH SÁCH KHỐI TRI THỨC
 */
function getAllChunks() {
  const now = Date.now();
  // Cache trong 5 giây để tránh đọc đĩa liên tục
  if (cachedChunks && (now - lastLoadTime < 5000)) {
    return cachedChunks;
  }

  try {
    if (fs.existsSync(KNOWLEDGE_FILE)) {
      const raw = fs.readFileSync(KNOWLEDGE_FILE, 'utf8');
      cachedChunks = JSON.parse(raw || '[]');
      lastLoadTime = now;
      return cachedChunks;
    }
  } catch (err) {
    console.warn('Lỗi đọc legal_knowledge_base.json:', err.message);
  }

  cachedChunks = FALLBACK_CHUNKS;
  return cachedChunks;
}

/**
 * LƯU TOÀN BỘ KHỐI TRI THỨC XUỐNG FILE
 */
function saveAllChunks(chunks) {
  try {
    fs.writeFileSync(KNOWLEDGE_FILE, JSON.stringify(chunks, null, 2), 'utf8');
    cachedChunks = chunks;
    lastLoadTime = Date.now();
    return true;
  } catch (err) {
    console.error('Lỗi ghi legal_knowledge_base.json:', err.message);
    return false;
  }
}

/**
 * THÊM HOẶC CẬP NHẬT 1 KHỐI TRI THỨC
 */
function upsertChunk(chunk) {
  const chunks = getAllChunks();
  const id = (chunk.id || '').trim() || ('CHUNK_' + Date.now());
  const existingIdx = chunks.findIndex(c => c.id === id);

  const formattedKeywords = Array.isArray(chunk.keywords) 
    ? chunk.keywords.map(k => String(k).trim().toLowerCase()).filter(Boolean)
    : (chunk.keywords || '').split(',').map(k => k.trim().toLowerCase()).filter(Boolean);

  const newChunk = {
    id,
    doc: (chunk.doc || 'Văn bản Đất Phú').trim(),
    article: (chunk.article || 'Quy chuẩn').trim(),
    title: (chunk.title || 'Chủ đề nghiệp vụ').trim(),
    keywords: formattedKeywords,
    content: (chunk.content || '').trim(),
    updatedAt: new Date().toISOString()
  };

  if (existingIdx >= 0) {
    chunks[existingIdx] = { ...chunks[existingIdx], ...newChunk };
  } else {
    chunks.unshift(newChunk);
  }

  saveAllChunks(chunks);
  return newChunk;
}

/**
 * XÓA 1 KHỐI TRI THỨC THEO ID
 */
function deleteChunk(id) {
  const chunks = getAllChunks();
  const filtered = chunks.filter(c => c.id !== id);
  if (filtered.length !== chunks.length) {
    saveAllChunks(filtered);
    return true;
  }
  return false;
}

/**
 * THUẬT TOÁN TÌM KIẾM TRI THỨC NGỮ NGHĨA KẾT HỢP (HYBRID SEMANTIC SEARCH RAG)
 */
function searchLegalKnowledge(query, topK = 2) {
  if (!query || typeof query !== 'string') return [];
  const lowerQuery = query.toLowerCase();
  
  const words = lowerQuery
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2);

  const chunks = getAllChunks();

  const scoredChunks = chunks.map(chunk => {
    let score = 0;

    // 1. Khớp từ khóa cốt lõi (Trọng số 4)
    (chunk.keywords || []).forEach(kw => {
      if (lowerQuery.includes(kw)) {
        score += 4;
      }
    });

    // 2. Khớp từng từ đơn trong truy vấn với content và title (Trọng số 1 và 2)
    words.forEach(word => {
      if ((chunk.title || '').toLowerCase().includes(word)) score += 2;
      if ((chunk.content || '').toLowerCase().includes(word)) score += 1;
    });

    // 3. Khớp cụ thể số hiệu văn bản (Nghị định 254, Thông tư 94, NĐ 123)
    if (lowerQuery.includes('254') && (chunk.doc || '').includes('254')) score += 10;
    if (lowerQuery.includes('94') && (chunk.doc || '').includes('94')) score += 10;
    if (lowerQuery.includes('123') && (chunk.doc || '').includes('123')) score += 10;
    if (lowerQuery.includes('efy') && ((chunk.id || '').includes('EFY') || (chunk.title || '').includes('EFY'))) score += 10;

    return { chunk, score };
  });

  return scoredChunks
    .filter(item => item.score > 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(item => item.chunk);
}

/**
 * ĐÓNG GÓI BỐI CẢNH TRI THỨC PHÁP LÝ RAG ĐỂ BƠM VÀO SYSTEM PROMPT
 */
function buildRagContext(query) {
  const chunks = searchLegalKnowledge(query, 2);
  if (chunks.length === 0) return '';

  let contextText = '\n\n=== [KHO TRI THỨC PHÁP LÝ CHUYÊN SÂU TRÍCH XUẤT TỰ ĐỘNG - RAG ENGINE] ===\n';
  chunks.forEach((c, idx) => {
    contextText += `\n[TÀI LIỆU ${idx + 1}]: ${c.doc} - ${c.article}\n`;
    contextText += `CHỦ ĐỀ: ${c.title}\n`;
    contextText += `NỘI DUNG VĂN BẢN QUY PHẠM:\n${c.content}\n`;
  });
  contextText += '=== [HẾT TRÍCH XUẤT RAG - HÃY VẬN DỤNG CÁC ĐIỀU KHOẢN TRÊN ĐỂ TRẢ LỜI CHÍNH XÁC] ===\n';
  return contextText;
}

module.exports = {
  getAllChunks,
  upsertChunk,
  deleteChunk,
  searchLegalKnowledge,
  buildRagContext
};
