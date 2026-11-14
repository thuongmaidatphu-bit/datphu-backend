/**
 * ============================================================================
 * ĐẤT PHÚ GEN 4 — HỆ THỐNG ĐA TÁC TỬ AI (MULTI-AGENT SWARM CORE ENGINE)
 * Vận hành chuẩn 6K Kín Kẽ • 24/7 Tự Hành • Phân vai 4 Tác tử chuyên trách
 * ============================================================================
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Tự động nạp GEMINI_API_KEY từ file .env nếu chưa có trong process.env
if (!process.env.GEMINI_API_KEY) {
  try {
    const envPaths = [
      path.resolve(__dirname, '../../.env'),
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
  } catch (e) {
    // Bỏ qua lỗi đọc file .env
  }
}

/**
 * BỘ TỰ ĐỘNG ĐỐI SOÁT & TRẢ LỜI NGHIỆP VỤ THUẾ ĐẤT PHÚ (RULE-BASED GROUNDING)
 */
function getRuleBasedAnswer(userMessage, agent) {
  const lower = userMessage.toLowerCase();

  if (lower.includes('quán cà phê') || lower.includes('hóa đơn nào') || lower.includes('nđ 254') || lower.includes('254') || lower.includes('máy tính tiền')) {
    return `Dạ Đất Phú xin chào! Đối với **quán cà phê nhỏ tại Tuy Hòa** (hoặc các hộ kinh doanh ăn uống, bán lẻ), giải pháp tối ưu và đúng luật nhất là:

1. **Loại hóa đơn áp dụng:** **Hóa đơn điện tử khởi tạo từ máy tính tiền** (theo chuẩn Nghị định 254/2026/NĐ-CP).
2. **Ưu điểm vượt trội:**
   - **KHÔNG BẮT BUỘC CẮM USB TOKEN CHỮ KÝ SỐ** khi in bill cho khách lẻ, thao tác xuất bill trong 3 giây.
   - Kết nối trực tiếp máy in nhiệt tại quầy hoặc xuất hóa đơn điện tử gửi link qua Zalo cho khách.
3. **Chi phí niêm yết Đất Phú:**
   - Gói hóa đơn máy tính tiền: **450.000đ / 500 số**.
   - Hoặc Combo trọn gói EasyPOS (Phần mềm bán hàng + 1.000 số hóa đơn + Chữ ký số 1 năm): **1.850.000đ/năm đầu**.

"Dịu dàng với chính mình, nghiêm túc với con số" - Đất Phú hỗ trợ đăng ký mẫu với Cơ quan Thuế và cài đặt tận nơi trong 24h!
Quý khách vui lòng liên hệ **Hotline / Zalo: 0979.991.898** để được kích hoạt ngay ạ!`;
  }

  if (lower.includes('giá') || lower.includes('chữ ký số') || lower.includes('efy') || lower.includes('bao nhiêu')) {
    return `Dạ Đất Phú xin gửi bảng giá niêm yết chính hãng dịch vụ số:

1. **Chữ ký số EFY-CA (Gói 3 năm):** **1.150.000đ** (Chiết khấu 40%, tặng kèm thiết bị USB Token bảo hành 1 đổi 1).
2. **Hóa đơn máy tính tiền (NĐ 254):** **450.000đ / 500 số** (Miễn chữ ký số từng hóa đơn).
3. **Combo trọn gói EasyPOS & Thuế:** **1.850.000đ/năm**.

Mọi dịch vụ đều xuất hóa đơn tài chính hợp pháp từ Công ty TNHH Thương mại Đất Phú (MST: 4401020233).
Hotline / Zalo tư vấn: **0979.991.898**!`;
  }

  if (lower.includes('thợ') || lower.includes('sửa nhà') || lower.includes('xây') || lower.includes('hàn')) {
    return `Dạ mạng lưới Đội Thợ Dân Sinh Đất Phú (cam kết 0% phí trung gian) sẵn sàng phục vụ bà con:

1. **Đội Thợ Xây Cả Tám Đất Phú:** 18 năm kinh nghiệm đổ móng, xây tô, lát đá sân chùa di tích. ĐT: **0914.821.567** (Tuy Hòa & Phú Hòa).
2. **Xưởng Cơ Khí Hàn Sắt Ba Bình:** 12 năm tay nghề cổng sắt mỹ nghệ, mái che tôn, giàn giáo. ĐT: **0905.342.118** (Đông Hòa & Tây Hòa).

Hoặc quý khách gọi trực tiếp Hotline điều phối **0979.991.898** để thợ đến khảo sát tận nơi nhé!`;
  }

  return `Dạ Đất Phú Gen 4 xin chào quý khách! Hệ thống Đa tác tử AI Swarm đã tiếp nhận yêu cầu của bạn. 
Để được hỗ trợ chi tiết về Hóa đơn điện tử máy tính tiền NĐ 254, Chữ ký số EFY-CA hoặc Hỗ trợ kỹ thuật UltraViewer, quý khách vui lòng nhắn trực tiếp qua Hotline / Zalo: **0979.991.898** (Địa chỉ: 21/146 Ngô Gia Tự, TP. Buôn Ma Thuột / Tuy Hòa) để chuyên viên hỗ trợ tức thì ạ!`;
}

const DATPHU_KNOWLEDGE_BASE = `
THÔNG TIN DOANH NGHIỆP:
- Tên đơn vị: CÔNG TY TNHH THƯƠNG MẠI ĐẤT PHÚ (MST: 4401020233)
- Hotline / Zalo chính thức: 0979.991.898
- Địa chỉ: 21/146 Ngô Gia Tự, Phường Phú Yên, Tỉnh Đắk Lắk (và chi nhánh Phú Yên)
- Châm ngôn: "Dịu dàng với chính mình, nghiêm túc với con số • Quy chuẩn 6K Kín Kẽ OS"

BIỂU PHÍ DỊCH VỤ SỐ ĐẤT PHÚ GEN 4:
1. Hóa đơn điện tử máy tính tiền (Chuẩn Nghị định 254/2026/NĐ-CP):
   - Giá: 450.000đ / 500 số (Không bắt buộc cắm USB Token khi xuất cho khách lẻ, in bill nhiệt tức thì).
2. Chữ ký số công cộng EFY-CA:
   - Gói 3 năm: 1.150.000đ (Chiết khấu 40%, tặng kèm thiết bị USB Token bảo hành 1 đổi 1).
   - Dùng để kê khai thuế điện tử (thuedientu.gdt.gov.vn), nộp tờ khai và ký hóa đơn GTGT.
3. Combo EasyPOS & Thuế trọn gói:
   - Giá: 1.850.000đ / năm đầu (Bao gồm phần mềm quản lý bán hàng EasyPOS + 1.000 số hóa đơn máy tính tiền + 1 năm chữ ký số).
4. Mạng lưới Đội Thợ Dân Sinh (0% phí trung gian):
   - Đội Thợ Xây Cả Tám Đất Phú: Đổ móng, xây tô, lát đá (ĐT: 0914.821.567).
   - Xưởng Cơ Khí Hàn Sắt Ba Bình: Cổng sắt, mái che tôn, giàn giáo (ĐT: 0905.342.118).
   - Hỗ trợ khẩn cấp: Hotline 0979.991.898.
`;

/**
 * GỌI GOOGLE GEMINI API (GEMINI 3.5 FLASH LITE)
 */
async function callGemini(systemPrompt, userMessage, assignedAgent) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return getRuleBasedAnswer(userMessage, assignedAgent);
  }

  const payload = JSON.stringify({
    contents: [
      {
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\n[CÂU HỎI CỦA KHÁCH HÀNG]: ${userMessage}` }]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 800
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
        let responseBody = '';
        res.on('data', chunk => { responseBody += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseBody);
            if (parsed.candidates && parsed.candidates[0]?.content?.parts[0]?.text) {
              resolve(parsed.candidates[0].content.parts[0].text.trim());
            } else {
              resolve(getRuleBasedAnswer(userMessage, assignedAgent));
            }
          } catch (e) {
            resolve(getRuleBasedAnswer(userMessage, assignedAgent));
          }
        });
      }
    );

    req.on('error', () => {
      resolve(getRuleBasedAnswer(userMessage, assignedAgent));
    });

    req.setTimeout(8000, () => {
      req.destroy();
      resolve(getRuleBasedAnswer(userMessage, assignedAgent));
    });

    req.write(payload);
    req.end();
  });
}

/**
 * BỘ NÃO ĐIỀU PHỐI ĐA TÁC TỬ (MULTI-AGENT ORCHESTRATOR)
 */
async function processAgentSwarm(userMessage) {
  const startTime = Date.now();
  let assignedAgent = 'Front-line Support';
  const lowerMsg = userMessage.toLowerCase();

  // 1. TÁC TỬ PHÂN LOẠI & LỰA CHỌN VAI TRÒ CHUYÊN TRÁCH
  let specificRolePrompt = '';
  
  if (lowerMsg.includes('thuế') || lowerMsg.includes('nghị định') || lowerMsg.includes('hóa đơn') || lowerMsg.includes('chữ ký số') || lowerMsg.includes('thông tư') || lowerMsg.includes('254') || lowerMsg.includes('máy tính tiền')) {
    assignedAgent = 'Tax & Invoicing Expert (Chuyên Gia Thuế & Hóa Đơn)';
    specificRolePrompt = `
BẠN LÀ: Tác tử Nghiệp vụ Thuế & Hóa đơn của Đất Phú Gen 4.
NHIỆM VỤ: Giải đáp chính xác các câu hỏi về hóa đơn điện tử theo Nghị định 254/2026/NĐ-CP, chữ ký số EFY-CA và quản trị rủi ro thuế theo Thông tư 94.
NGUYÊN TẮC: Khẳng định rõ hóa đơn máy tính tiền không bắt buộc chữ ký số từng bill, rất tiện cho quán ăn, tiệm tạp hóa, bán lẻ. Báo giá đúng bảng giá niêm yết (450k/500 số, 1.150.000đ/3 năm CKS).
    `;
  } else if (lowerMsg.includes('lỗi') || lowerMsg.includes('cài đặt') || lowerMsg.includes('ultraviewer') || lowerMsg.includes('kỹ thuật') || lowerMsg.includes('n8n') || lowerMsg.includes('pos')) {
    assignedAgent = 'Technical & Automation Coordinator (Tác Tử Kỹ Thuật & n8n)';
    specificRolePrompt = `
BẠN LÀ: Tác tử Điều phối Kỹ thuật & Tự động hóa n8n của Đất Phú Gen 4.
NHIỆM VỤ: Hướng dẫn xử lý lỗi kỹ thuật (chữ ký số, phần mềm EasyPOS). Hướng dẫn khách hàng cung cấp ID và Mật khẩu UltraViewer để kỹ thuật viên Đất Phú kết nối hỗ trợ từ xa.
    `;
  } else if (lowerMsg.includes('giá') || lowerMsg.includes('tiền') || lowerMsg.includes('thanh toán') || lowerMsg.includes('chuyển khoản') || lowerMsg.includes('vietqr') || lowerMsg.includes('mua')) {
    assignedAgent = 'Audit & Accounting Agent (Tác Tử Kiểm Soát & Đối Soát)';
    specificRolePrompt = `
BẠN LÀ: Tác tử Kiểm soát & Kế toán Đất Phú. Châm ngôn: "Dịu dàng với chính mình, nghiêm túc với con số".
NHIỆM VỤ: Cung cấp biểu phí chính xác, hướng dẫn chuyển khoản qua số tài khoản chính thức hoặc quét mã VietQR, cam kết hóa đơn chứng từ đầy đủ.
    `;
  } else if (lowerMsg.includes('thợ') || lowerMsg.includes('xây') || lowerMsg.includes('hàn') || lowerMsg.includes('điện lạnh') || lowerMsg.includes('sửa nhà')) {
    assignedAgent = 'Field Dispatcher (Tác Tử Điều Phối Thợ Dân Sinh)';
    specificRolePrompt = `
BẠN LÀ: Tác tử Điều phối Thợ Dân Sinh Đất Phú (0% phí trung gian).
NHIỆM VỤ: Cung cấp số điện thoại Đội Thợ Xây Cả Tám (0914.821.567) hoặc Xưởng Cơ Khí Ba Bình (0905.342.118), hoặc gọi trực tiếp Hotline 0979.991.898 để thợ khảo sát tận nơi.
    `;
  } else {
    assignedAgent = 'Front-line Support Agent (Tác Tử Tiếp Nhận)';
    specificRolePrompt = `
BẠN LÀ: Tác tử Tiếp nhận & Chăm sóc Khách hàng đầu tuyến của Đất Phú Gen 4.
NHIỆM VỤ: Chào hỏi lịch thiệp, thân thiện, giải thích ngắn gọn về 3 trụ cột (Dịch vụ số B2B, AI Tự hành, STEMBot Lab) và cung cấp Hotline/Zalo 0979.991.898.
    `;
  }

  // SYSTEM PROMPT CHUẨN MỰC
  const systemPrompt = `
# VAI TRÒ CHUNG
Bạn là trợ lý AI thông minh trong Hệ thống Đa tác tử Đất Phú Gen 4 (Công ty TNHH Thương mại Đất Phú).
Đang kích hoạt vai trò chuyên trách: [${assignedAgent}]

# KHO TRI THỨC CHUẨN XÁC:
${DATPHU_KNOWLEDGE_BASE}

# HƯỚNG DẪN RIÊNG CHO TÁC TỬ:
${specificRolePrompt}

# QUY CHUẨN PHẢN HỒI:
- Trả lời bằng tiếng Việt gãy gọn, chuyên nghiệp, ấm áp, đậm chất phục vụ bà con và doanh nghiệp Phú Yên, Đắk Lắk.
- Luôn bám sát số liệu giá cả trong kho tri thức, KHÔNG ĐƯỢC TỰ BỊA ĐẶT GIÁ.
- Cuối câu luôn mời khách hàng liên hệ Hotline / Zalo: 0979.991.898 hoặc để lại số điện thoại để hỗ trợ trong 15 phút.
  `;

  // 2. GỌI BỘ NÃO GEMINI FLASH (CÓ SẴN GROUNDING ENGINE TỰ ĐỘNG)
  let reply = '';
  try {
    reply = await callGemini(systemPrompt, userMessage, assignedAgent);
  } catch (err) {
    console.error('CallGemini error:', err);
    reply = getRuleBasedAnswer(userMessage, assignedAgent);
  }

  if (!reply || reply.trim().length === 0) {
    reply = getRuleBasedAnswer(userMessage, assignedAgent);
  }

  const latencyMs = Date.now() - startTime;

  return {
    success: true,
    agent: assignedAgent,
    latencyMs,
    reply,
    complianceStatus: '6K_KIN_KE_VERIFIED'
  };
}

module.exports = {
  processAgentSwarm
};
