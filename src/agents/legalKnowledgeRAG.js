/**
 * ============================================================================
 * KHO TRI THỨC PHÁP LÝ CHUYÊN SÂU & BỘ MÁY RAG (LEGAL KNOWLEDGE RAG ENGINE V2.0)
 * Hệ thống Đa tác tử Đất Phú Gen 4
 * Nâng cấp: Query Expansion, Chuẩn hóa Tiếng Việt Không Dấu, Từ điển Đồng Nghĩa,
 * Trích xuất Số Hiệu Văn Bản Regex, và Tái Xếp Hạng (Re-ranking) Chống Ảo Giác
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const KNOWLEDGE_FILE = path.join(__dirname, '..', '..', 'data', 'legal_knowledge_base.json');

// HÀM CHUẨN HÓA BỎ DẤU TIẾNG VIỆT ĐỂ BẮT CHÍNH XÁC MỌI KIỂU GÕ CỦA NGƯỜI DÙNG
function removeVietnameseAccents(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

// BỘ TỪ ĐIỂN ĐỒNG NGHĨA & MỞ RỘNG TRUY VẤN CHUYÊN NGÀNH (SYNONYM & DOMAIN EXPANSION)
const DOMAIN_SYNONYMS = [
  {
    triggers: ['quan an', 'quan com', 'an uong', 'f&b', 'nha hang', 'bun', 'pho', 'ca phe', 'giai khat', 'an vat', 'com binh dan'],
    boostKeywords: ['dich vu an uong', 'f&b', 'gtgt 3%', 'tncn 1.5%', 'nguong 1 ty', 'may tinh tien', '254', 'mien mon bai']
  },
  {
    triggers: ['tap hoa', 'bach hoa', 'sieu thi mini', 'ban le', 'cua hang nho'],
    boostKeywords: ['ban le hang hoa', 'gtgt 1%', 'tncn 0.5%', 'nguong 1 ty', 'may tinh tien', 'mien mon bai']
  },
  {
    triggers: ['chuyen khoan', 'ngan hang', 'sinh trac hoc', 'faceid', 'khuon mat', 'vneid', 'dinh danh', 'rua tien', '500 trieu', '10 trieu', '20 trieu'],
    boostKeywords: ['sinh trac hoc', 'vneid', 'quy dinh chuyen khoan', 'khau tru thue', '500 trieu', 'nguong 5 trieu', 'nguong 20 trieu']
  },
  {
    triggers: ['giam thue', 'giam 30%', 'nghi quyet 43', 'nq 43', '10 ty', 'phu luc giam thue', 'ho kinh doanh duoi 10 ty'],
    boostKeywords: ['nghi quyet 43', 'giam 30% thue tncn', 'nam 2026', 'nam 2027', '6 buoc ke khai', 'dich vu cong']
  },
  {
    triggers: ['bao cao lao dong', 'su dung lao dong', 'thay doi lao dong', 'so noi vu', '01/pli', 'thong tu 08', 'hop dong lao dong dien tu', 'truoc 05/12'],
    boostKeywords: ['bao cao su dung lao dong', '6 thang cuoi nam', '34 tinh thanh', 'nghi dinh 145', 'thong tu 08/2026/tt-bnv', 'so noi vu', '10-20 trieu']
  },
  {
    triggers: ['chi viec rieng', 'tien rieng', 'tien ca nhan', 'tien cong ty', 'tach bach', '138', '421', 'muon tien', 'rut tien'],
    boostKeywords: ['chi viec rieng', 'tach bach dong tien', 'tai khoan 138', 'tai khoan 421', 'phap nhan doc lap', 'vcb digibiz']
  },
  {
    triggers: ['khau tru', '5 trieu', 'nam trieu', '144', '01/gtgt', '01/cnkd', 'hoa don dau vao', 'khong dung tien mat'],
    boostKeywords: ['dieu kien khau tru', 'nghi dinh 144', '5 trieu', 'khong dung tien mat', '01/gtgt', '01/cnkd']
  },
  {
    triggers: ['chu ky so', 'usb token', 'token', 'efy', 'pki', 'chu ky dien tu'],
    boostKeywords: ['chu ky so efy-ca', 'usb token', 'pki', '1.150.000', 'thuedientu']
  },
  {
    triggers: ['masahiro hara', 'ma qr', 'qr code', 'quick response', 'vietqr', 'denso', 'toyota'],
    boostKeywords: ['masahiro hara', 'ma qr', 'quick response', 'vietqr', 'denso']
  }
];

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
 * THUẬT TOÁN TÌM KIẾM TRI THỨC NGỮ NGHĨA KẾT HỢP NÂNG CẤP V2.0 (HYBRID SEMANTIC SEARCH + RERANK)
 */
function searchLegalKnowledge(query, topK = 3) {
  if (!query || typeof query !== 'string') return [];
  const lowerQuery = query.toLowerCase().trim();
  const normalizedQuery = removeVietnameseAccents(lowerQuery);
  
  // Tách các từ đơn có nghĩa (bỏ qua từ quá ngắn 1 ký tự)
  const queryWords = lowerQuery
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2);

  const normalizedWords = normalizedQuery
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2);

  // Mở rộng truy vấn dựa trên từ điển chuyên ngành
  const activeBoostKeywords = [];
  for (const group of DOMAIN_SYNONYMS) {
    const hasTrigger = group.triggers.some(t => {
      const normTrigger = removeVietnameseAccents(t);
      return lowerQuery.includes(t) || normalizedQuery.includes(normTrigger);
    });
    if (hasTrigger) {
      activeBoostKeywords.push(...group.boostKeywords);
    }
  }

  // Trích xuất số hiệu văn bản cụ thể bằng regex (Nghị định 254, Thông tư 08, NQ 43...)
  const docNumbers = (lowerQuery.match(/\b\d{1,4}\b/g) || []);
  const legalFormCodes = (lowerQuery.match(/\b0[1-5]\/[a-z]{2,5}\b/g) || []);

  const chunks = getAllChunks();

  const scoredChunks = chunks.map(chunk => {
    let score = 0;
    const chunkDocLower = (chunk.doc || '').toLowerCase();
    const chunkArticleLower = (chunk.article || '').toLowerCase();
    const chunkTitleLower = (chunk.title || '').toLowerCase();
    const chunkContentLower = (chunk.content || '').toLowerCase();

    const chunkDocNorm = removeVietnameseAccents(chunkDocLower);
    const chunkTitleNorm = removeVietnameseAccents(chunkTitleLower);
    const chunkContentNorm = removeVietnameseAccents(chunkContentLower);

    // 1. Khớp từ khóa cốt lõi định nghĩa sẵn trong Chunk (Trọng số cao: 5 điểm/khớp)
    (chunk.keywords || []).forEach(kw => {
      const lowerKw = String(kw).toLowerCase();
      const normKw = removeVietnameseAccents(lowerKw);
      if (lowerQuery.includes(lowerKw) || normalizedQuery.includes(normKw)) {
        score += 5;
      }
    });

    // 2. Khớp từ khóa mở rộng chuyên ngành (Query Expansion Boost: 3 điểm/khớp)
    activeBoostKeywords.forEach(bkw => {
      const lowerBkw = bkw.toLowerCase();
      const normBkw = removeVietnameseAccents(lowerBkw);
      if (chunkTitleLower.includes(lowerBkw) || chunkTitleNorm.includes(normBkw)) {
        score += 3;
      } else if (chunkContentLower.includes(lowerBkw) || chunkContentNorm.includes(normBkw)) {
        score += 2;
      }
    });

    // 3. Khớp từ vựng chính xác trong Tiêu đề (Title) và Nội dung (Content)
    queryWords.forEach(word => {
      if (chunkTitleLower.includes(word)) score += 2;
      if (chunkContentLower.includes(word)) score += 1;
    });

    // Khớp không dấu (phục vụ người gõ không dấu trên điện thoại)
    normalizedWords.forEach(nword => {
      if (chunkTitleNorm.includes(nword)) score += 1.5;
      if (chunkContentNorm.includes(nword)) score += 0.8;
    });

    // 4. Khớp số hiệu văn bản (Nghị định, Thông tư, Nghị quyết) — Trọng số quyết định: +12 điểm
    docNumbers.forEach(num => {
      if (num.length >= 2) {
        if (chunkDocLower.includes(num)) score += 12;
        if (chunkTitleLower.includes(num)) score += 8;
        if (chunkContentLower.includes(num)) score += 4;
      }
    });

    // 5. Khớp mã biểu mẫu (Mẫu 01/CNKD, 01/PLI, 04/SS...) — Trọng số tuyệt đối: +15 điểm
    legalFormCodes.forEach(code => {
      if (chunkTitleLower.includes(code) || chunkContentLower.includes(code)) {
        score += 15;
      }
    });

    return { chunk, score };
  });

  // Tái xếp hạng (Re-ranking): Lọc ngưỡng tối thiểu score >= 5 để loại trừ kết quả rác
  return scoredChunks
    .filter(item => item.score >= 5)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(item => item.chunk);
}

/**
 * ĐÓNG GÓI BỐI CẢNH TRI THỨC PHÁP LÝ RAG V2.0 ĐỂ BƠM VÀO SYSTEM PROMPT
 * Bổ sung hướng dẫn trích dẫn và chống ảo giác nghiêm ngặt
 */
function buildRagContext(query) {
  const chunks = searchLegalKnowledge(query, 3);
  if (chunks.length === 0) return '';

  let contextText = '\n\n=== [KHO TRI THỨC PHÁP LÝ RAG CHUYÊN SÂU CHUẨN 6K KÍN KẼ — ĐẤT PHÚ GEN 4 (V2.0)] ===\n';
  contextText += 'NGUYÊN TẮC BẮT BUỘC CHO TRỢ LÝ AI:\n';
  contextText += '1. Chỉ trả lời và tính toán dựa trên các điều khoản, văn bản và số liệu trong danh sách tài liệu bên dưới.\n';
  contextText += '2. Bắt buộc trích dẫn rõ tên văn bản (Ví dụ: "Căn cứ theo Nghị định... Điều...").\n';
  contextText += '3. Không tự ý bịa đặt hoặc suy diễn các mốc phạt hành chính hoặc tỷ lệ phần trăm nếu không có trong dữ liệu.\n\n';

  chunks.forEach((c, idx) => {
    contextText += `--- TÀI LIỆU ${idx + 1} ---\n`;
    contextText += `VĂN BẢN: ${c.doc}\n`;
    contextText += `ĐIỀU KHOẢN: ${c.article}\n`;
    contextText += `TIÊU ĐỀ NGHIỆP VỤ: ${c.title}\n`;
    contextText += `NỘI DUNG VĂN BẢN QUY PHẠM:\n${c.content}\n\n`;
  });

  contextText += '=== [KẾT THÚC DỮ LIỆU RAG V2.0 — HÃY TRẢ LỜI ĐẦY ĐỦ, CHÍNH XÁC VÀ DỊU DÀNG VỚI KHÁCH HÀNG] ===\n';
  return contextText;
}

module.exports = {
  getAllChunks,
  upsertChunk,
  deleteChunk,
  searchLegalKnowledge,
  buildRagContext,
  removeVietnameseAccents
};
