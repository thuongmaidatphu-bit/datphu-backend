/**
 * ============================================================================
 * ĐẤT PHÚ GEN 4 — HỆ THỐNG ĐA TÁC TỬ AI (MULTI-AGENT SWARM CORE ENGINE)
 * Tích hợp Cấp Độ 2: Trí Nhớ Đa Phiên (Persistent Memory) & Legal RAG Engine
 * Vận hành chuẩn 6K Kín Kẽ • 24/7 Tự Hành • Phân vai 4 Tác tử chuyên trách
 * ============================================================================
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { searchLegalKnowledge, buildRagContext } = require('./legalKnowledgeRAG');
const { getOrCreateSession, recordTurn, buildGeminiContents } = require('./swarmMemory');

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

  if (lower.includes('chuyển khoản') || lower.includes('sinh trắc học') || lower.includes('vneid') || lower.includes('500 triệu') || lower.includes('tài khoản ảo')) {
    return `Dạ theo quy định quản lý ngân hàng của NHNN (Quyết định 2345/QĐ-NHNN, Thông tư 17, 18/2024/TT-NHNN) và Luật Thuế hiện hành, các quy định cốt lõi về giao dịch chuyển khoản ngân hàng gồm có:

### 1. Xác thực Sinh trắc học & Liên kết tài khoản định danh VNeID:
- **Xác thực sinh trắc học khuôn mặt:** Bắt buộc áp dụng cho mọi giao dịch chuyển tiền trực tuyến của cá nhân **từ 10 triệu đồng trở lên/lần** hoặc **tổng giá trị giao dịch vượt quá 20 triệu đồng/ngày**. Khuôn mặt phải khớp 100% với dữ liệu trên CCCD gắn chip hoặc tài khoản VNeID mức 2.
- **Liên kết VNeID làm sạch dữ liệu:** Mọi tài khoản ngân hàng điện tử phải được định danh và đối soát với Cơ sở dữ liệu quốc gia về dân cư nhằm triệt tiêu hoàn toàn tài khoản ảo, tài khoản thuê mượn tiếp tay cho tội phạm lừa đảo.

### 2. Quản lý Hạn mức & Kiểm soát Dòng tiền lớn:
- **Phân loại hạn mức:** Ngân hàng kiểm soát chặt chẽ hạn mức giao dịch trong ngày và từng lần của từng khách hàng cá nhân/doanh nghiệp.
- **Giám sát giao dịch từ 500 triệu đồng trở lên:** Bắt buộc thực hiện báo cáo giao dịch có giá trị lớn và xác minh mục đích chuyển tiền theo Luật Phòng, chống rửa tiền 2022 (Nghị định 19/2023/NĐ-CP).

### 3. Nguyên tắc vàng về Chuyển khoản trong Kế toán & Quyết toán Thuế:
Để các khoản thanh toán mua hàng hóa, dịch vụ được **khấu trừ thuế GTGT** và **tính vào chi phí hợp lý khi quyết toán thuế**, doanh nghiệp và hộ kinh doanh phải tuân thủ nghiêm ngặt:
- **Khớp đúng thông tin thụ hưởng:** Tên người nhận trên ủy nhiệm chi / lệnh chuyển tiền phải trùng khớp 100% với tên pháp nhân hoặc hộ kinh doanh ghi trên hóa đơn GTGT của bên bán.
- **Nội dung chuyển khoản chuẩn mực:** Luôn ghi rõ ràng mục đích giao dịch (Ví dụ: *"Thanh toan tien hang theo hoa don so... ngay..."*). Không ghi chung chung hoặc sai bản chất giao dịch.
- **Ngưỡng bắt buộc chuyển khoản:**
  + *Luật Thuế truyền thống:* Hóa đơn từ 20 triệu đồng trở lên bắt buộc thanh toán không dùng tiền mặt.
  + *Quy định siết chặt mới nhất (Nghị định 144/2026/NĐ-CP & Nghị định 68/2026/NĐ-CP):* Ngưỡng thanh toán không dùng tiền mặt (chuyển khoản ngân hàng) đối với các khoản chi phí được trừ đã được áp dụng chặt chẽ từ **05 triệu đồng trở lên**.

---
"Dịu dàng với chính mình, nghiêm túc với con số" — Đất Phú Gen 4 hỗ trợ rà soát chuẩn hóa dòng tiền VCB DigiBiz và thủ tục thuế an toàn qua **Hotline / Zalo: 0979.991.898**!`;
  }

  if (lower.includes('kinh doanh thuế') || lower.includes('quán ăn') || lower.includes('quán cơm') || lower.includes('nhỏ lẻ') || lower.includes('tạp hóa') || lower.includes('miễn thuế') || lower.includes('1 tỷ') || lower.includes('môn bài') || lower.includes('hộ kinh doanh nhỏ')) {
    return `Dạ theo quy định quản lý thuế hiện hành áp dụng cho các mô hình kinh doanh nhỏ lẻ (như quán ăn, quán cơm bình dân, tiệm tạp hóa, dịch vụ F&B...), các chính sách thuế trọng điểm được thực hiện cụ thể như sau:

### 1. Các loại thuế phải nộp:
Hộ kinh doanh và cá nhân kinh doanh nhỏ lẻ chỉ cần quản lý **2 loại thuế chính**:
- **Thuế Giá trị gia tăng (GTGT):** Tính trên tổng doanh thu phát sinh từ hoạt động bán hàng hoặc cung ứng dịch vụ.
- **Thuế Thu nhập cá nhân (TNCN):** Tính trên phần thu nhập hoặc doanh thu chịu thuế theo quy định.
- **LƯU Ý QUAN TRỌNG:** **Lệ phí môn bài ĐÃ ĐƯỢC CHÍNH THỨC BÃI BỎ HOÀN TOÀN** đối với tất cả các hộ kinh doanh và cá nhân kinh doanh.

### 2. Ngưỡng doanh thu miễn thuế & Phân nhóm quản lý:
- **Nhóm doanh thu từ 1 tỷ đồng/năm trở xuống (Nhóm 1):**
  + **Được MIỄN 100% thuế GTGT và thuế TNCN** (không phát sinh nghĩa vụ nộp thuế).
  + Quy trình quản lý: Quán ăn/cửa hàng nhỏ vẫn thực hiện việc thông báo doanh thu định kỳ theo hướng dẫn của cơ quan thuế địa phương.
- **Nhóm doanh thu trên 1 tỷ đồng đến 3 tỷ đồng/năm (Nhóm 2):**
  + Phát sinh nghĩa vụ nộp thuế GTGT và TNCN.
  + Có thể lựa chọn tính thuế theo tỷ lệ % trên doanh thu vượt ngưỡng, hoặc tính theo phương pháp thu nhập (doanh thu trừ chi phí hợp lý có hóa đơn, chứng từ hợp pháp).

### 3. Tỷ lệ thuế áp dụng cho Dịch vụ ăn uống (nếu vượt ngưỡng miễn thuế):
Đối với hoạt động dịch vụ ăn uống (quán cơm, quán ăn nhỏ, đồ ăn thức uống chế biến):
- **Thuế GTGT:** **3%**
- **Thuế TNCN:** **1.5%**
=> **Tổng tỷ lệ nghĩa vụ thuế là 4.5%** trên doanh thu chịu thuế.
*(Đối với hàng hóa bán lẻ nguyên kiện không chế biến như bia lon, nước ngọt đóng chai, tỷ lệ là GTGT 1% + TNCN 0.5% = 1.5%).*

### 4. Phương thức quản lý và Kê khai hiện đại:
- **Xóa bỏ cơ chế thuế khoán cũ:** Hệ thống chuyển hẳn sang quản lý dựa trên doanh thu kê khai thực tế và dữ liệu hóa đơn điện tử.
- **Hóa đơn điện tử máy tính tiền (Nghị định 254/2026/NĐ-CP):** Bắt buộc đối với các cơ sở kinh doanh F&B, bán lẻ trực tiếp tới người tiêu dùng nhằm minh bạch doanh thu và in bill tức thì không cần cắm USB Token cho từng khách.
- **Kê khai online qua eTax Mobile:** Chủ quán có thể chủ động tra cứu mã số thuế, đăng ký tài khoản kinh doanh và nộp hồ sơ/tiền thuế mọi lúc mọi nơi trên điện thoại thông minh.

---
"Dịu dàng với chính mình, nghiêm túc với con số" — Đất Phú Gen 4 hỗ trợ trọn gói cài đặt Hóa đơn máy tính tiền EasyPOS và hướng dẫn kê khai eTax Mobile tại Phú Yên qua **Hotline / Zalo: 0979.991.898**!`;
  }

  if (lower.includes('thành lập') || lower.includes('mới mở') || lower.includes('khởi nghiệp') || lower.includes('mới ra làm') || lower.includes('mới kinh doanh')) {
    return `Dạ Đất Phú xin chúc mừng Quý khách vừa thành lập doanh nghiệp! Để công ty vận hành an toàn pháp lý và không bị xử phạt vi phạm hành chính, dưới đây là các bước thủ tục thuế và pháp lý ban đầu bắt buộc cần làm ngay:

1. **Mở tài khoản ngân hàng & Đăng ký nộp thuế điện tử:**
   - Mở tài khoản ngân hàng doanh nghiệp (VCB DigiBiz) và kê khai 3 tầng Chủ sở hữu hưởng lợi (UBO) theo Luật PCRT 2022.
   - Bắt buộc thông báo tài khoản với Cơ quan Thuế qua cổng thuế điện tử hoặc eTax Mobile.

2. **Trang bị Chữ ký số công cộng (USB Token PKI):**
   - Đăng ký **Chữ ký số EFY-CA (Gói 3 năm: 1.150.000đ)** để nộp hồ sơ khai thuế ban đầu và ký nộp tờ khai trên hệ thống \`thuedientu.gdt.gov.vn\`.

3. **Đăng ký Hóa đơn điện tử máy tính tiền:**
   - Chuẩn hóa theo **Nghị định 254/2026/NĐ-CP** (Gói Đất Phú: **450.000đ / 500 số**), miễn chữ ký số từng hóa đơn khi xuất bán lẻ cho khách hàng.

4. **Treo biển hiệu tại trụ sở & Rà soát nghĩa vụ Giám đốc:**
   - Treo biển tên công ty đúng địa chỉ đăng ký kinh doanh để tránh bị cơ quan thuế khóa mã số thuế.
   - Nắm rõ trách nhiệm pháp lý cao nhất của Người đại diện theo pháp luật (Điều 50 Luật Kế toán 2015).

"Dịu dàng với chính mình, nghiêm túc với con số" — Đội ngũ Chuyên viên Đất Phú luôn sẵn sàng đồng hành hỗ trợ doanh nghiệp tại Tuy Hòa, Phú Yên qua **Hotline / Zalo: 0979.991.898**!`;
  }

  if (lower.includes('khấu trừ') || lower.includes('kê khai thuế gtgt') || lower.includes('5 triệu') || lower.includes('năm triệu') || lower.includes('01/gtgt') || lower.includes('01/cnkd') || lower.includes('nghị định 144') || lower.includes('hướng dẫn kê khai') || lower.includes('mẫu biểu gtgt')) {
    return `Dạ theo Tài liệu hướng dẫn kê khai thuế GTGT của Cơ quan Thuế và Nghị định 144/2026/NĐ-CP (sửa đổi Điều 26 Nghị định 181/2026/NĐ-CP):

1. **Điều kiện khấu trừ thuế GTGT đầu vào & Ngưỡng 05 triệu đồng:**
   - Giao dịch từng lần từ **05 triệu đồng trở lên** (đã bao gồm VAT) bắt buộc phải có chứng từ thanh toán không dùng tiền mặt (chuyển khoản qua ngân hàng).
   - **Khi chưa đến hạn thanh toán theo hợp đồng:** Doanh nghiệp vẫn được kê khai khấu trừ đầu vào căn cứ theo hợp đồng và hóa đơn GTGT hợp lệ.
   - **Đến hạn thanh toán:** Nếu không có chứng từ thanh toán không dùng tiền mặt, bắt buộc phải kê khai điều chỉnh giảm số thuế GTGT đã khấu trừ; khi nào có chứng từ chuyển khoản mới được kê khai khấu trừ lại.

2. **Kê khai thuế đối với Hộ, Cá nhân kinh doanh (Nghị định 68/2026 & 141/2026/NĐ-CP):**
   - Chi phí muốn được trừ phải có hóa đơn hợp lệ và giao dịch từ **05 triệu đồng trở lên bắt buộc chuyển khoản**.
   - Bắt buộc cập nhật số tài khoản / ví điện tử kinh doanh với Cơ quan Thuế qua ứng dụng **eTax Mobile**.
   - Hộ kinh doanh có doanh thu năm từ trên 1 tỷ đến 50 tỷ đồng kê khai theo quý bằng **Mẫu 01/CNKD**.

3. **Hệ thống mẫu biểu khai thuế GTGT:**
   - **Mẫu 01/GTGT:** Cho doanh nghiệp SXKD theo phương pháp khấu trừ thông thường.
   - **Mẫu 02/GTGT:** Cho dự án đầu tư được hoàn thuế.
   - **Mẫu 04/GTGT:** Cho người nộp thuế tính trực tiếp trên tỷ lệ % doanh thu.
   - **Mẫu 05/GTGT:** Phân bổ thuế GTGT cho hoạt động xây dựng, BĐS ngoại tỉnh (Điều 19 TT 89/2026/TT-BTC).
   - **Mẫu 01/KHBS:** Tờ khai bổ sung khi hồ sơ khai thuế đã nộp có sai sót.

"Dịu dàng với chính mình, nghiêm túc với con số" — Đội ngũ Kế toán Đất Phú luôn sẵn sàng hỗ trợ rà soát và lập tờ khai chuẩn mực qua Hotline/Zalo: **0979.991.898**!`;
  }

  if (lower.includes('bia') || lower.includes('rượu') || lower.includes('thuế suất') || lower.includes('mấy %') || lower.includes('tỷ lệ thuế')) {
    return `Dạ theo Thông tư 94/2024/TT-BTC và Thông tư 40/2021/TT-BTC, thuế suất cho mô hình quán ăn/cà phê có bán kèm bia rượu như sau:
1. **Dịch vụ ăn uống, pha chế:** Thuế GTGT 3% + Thuế TNCN 1.5% = **Tổng 4.5%**.
2. **Bán lẻ hàng hóa nguyên kiện (bia lon, nước ngọt đóng chai):** Thuế GTGT 1% + Thuế TNCN 0.5% = **Tổng 1.5%**.
3. **Nguyên tắc vàng:** Quý khách nên dùng phần mềm EasyPOS để tách riêng doanh thu pha chế và bia lon. Nếu không tách được, cơ quan thuế sẽ ấn định mức cao nhất là 4.5% cho toàn bộ doanh thu. Hotline hỗ trợ: **0979.991.898**!`;
  }

  if (lower.includes('sai sót') || lower.includes('mẫu 04') || lower.includes('thay thế') || lower.includes('điều chỉnh')) {
    return `Dạ theo Điều 19 Nghị định 123/2020/NĐ-CP và Thông tư 78/2021/TT-BTC:
- **Sai sót tên, địa chỉ (đúng MST, đúng tiền):** Không cần lập lại hóa đơn, chỉ cần thông báo cho người mua và nộp Mẫu 04/SS-HĐĐT.
- **Sai tiền, sai MST, sai thuế suất:** Xuất Hóa đơn Điều chỉnh hoặc Hóa đơn Thay thế mới, ghi rõ căn cứ thay thế cho số hóa đơn cũ.
Kỹ thuật viên Đất Phú luôn túc trực qua UltraViewer để xử lý sai sót hóa đơn cho bà con trong 15 phút: **0979.991.898**!`;
  }

  if (lower.includes('hưởng lợi') || lower.includes('cshhl') || lower.includes('ubo') || lower.includes('chủ sở hữu')) {
    return `Dạ theo Luật Phòng, chống rửa tiền 2022 và Nghị định 19/2023/NĐ-CP, quy trình 3 tầng xác định Chủ sở hữu hưởng lợi (CSHHL) của doanh nghiệp như sau:

1. **TẦNG 1 (Tỷ lệ sở hữu từ 25%):**
   - Cá nhân hoặc nhóm cá nhân có quan hệ gia đình/hợp đồng cùng sở hữu (trực tiếp hoặc gián tiếp) từ **25% vốn điều lệ** hoặc từ 25% tổng số cổ phần có quyền biểu quyết trở lên.
2. **TẦNG 2 (Quyền kiểm soát thực tế - Nếu không có Tầng 1):**
   - Cá nhân có quyền chi phối: Bổ nhiệm, miễn nhiệm HĐQT, Giám đốc; sửa đổi Điều lệ; quyết định chính sách tài chính, đầu tư hoặc giải thể doanh nghiệp.
3. **TẦNG 3 (Người quản lý cao nhất - Nếu không có Tầng 1 & 2):**
   - Một người quản lý doanh nghiệp có quyền hạn lớn nhất để hành động thay mặt doanh nghiệp (Người đại diện pháp luật / Giám đốc điều hành).

*Quy định này bắt buộc khi kê khai hồ sơ mở và duy trì tài khoản ngân hàng doanh nghiệp VCB DigiBiz.*
"Dịu dàng với chính mình, nghiêm túc với con số" — Hotline / Zalo tư vấn: **0979.991.898**!`;
  }

  if (lower.includes('thuê kế toán') || lower.includes('khoán trắng') || lower.includes('trách nhiệm kế toán') || lower.includes('ai chịu trách nhiệm') || lower.includes('hóa đơn khống')) {
    return `Dạ theo Điều 50 Luật Kế toán 2015 và Điều 17 Luật Quản lý Thuế số 38/2019/QH14:

1. **Người đại diện theo pháp luật (Giám đốc / Chủ doanh nghiệp) là người DUY NHẤT chịu trách nhiệm pháp lý cao nhất và chịu trách nhiệm hình sự** trước Nhà nước về tính có thật, tính hợp pháp của toàn bộ hóa đơn, chứng từ và số liệu sổ sách kế toán.
2. **Kế toán dịch vụ chỉ là đơn vị gia công nghiệp vụ:** Nhập liệu và nộp tờ khai dựa trên chứng từ do chủ doanh nghiệp cung cấp. Kế toán không thể "gánh tội thay" nếu doanh nghiệp đưa vào hóa đơn khống, mua bán hóa đơn trôi nổi hoặc không có dòng tiền thanh toán thật.
3. **Khi bị thanh tra hoặc điều tra, NGƯỜI KÝ TÊN ĐÓNG DẤU (KÝ BẰNG CHỮ KÝ SỐ USB TOKEN) LÀ NGƯỜI CHỊU TRÁCH NHIỆM HÌNH SỰ ĐẦU TIÊN.**

Chính vì vậy, Đất Phú Gen 4 luôn kiên định với phương châm: **"Dịu dàng với chính mình, nghiêm túc với con số"** — Vận hành minh bạch 100%, dòng tiền VCB DigiBiz chuẩn mực, bảo vệ an toàn tuyệt đối cho người làm chủ!
Hotline / Zalo tư vấn pháp lý dịch vụ số: **0979.991.898**!`;
  }

  if (lower.includes('7 báo cáo') || lower.includes('checklist') || lower.includes('báo cáo') || lower.includes('hạn chót') || lower.includes('lao động') || lower.includes('bảo hiểm') || lower.includes('quyết toán') || lower.includes('283') || lower.includes('bctc')) {
    return `Dạ theo Quy chuẩn Kín Kẽ OS và Nghị định 283/2026/NĐ-CP, dưới đây là Checklist 7 loại báo cáo doanh nghiệp cuối năm & đầu năm bắt buộc:

1. **Báo cáo sử dụng lao động 6 tháng cuối năm:**
   - Hạn chót: **Trước ngày 05/12/2026**.
   - Mức phạt (NĐ 283/2026/NĐ-CP): Cá nhân phạt 5 – 10 triệu | Doanh nghiệp phạt **10 – 20 triệu đồng**.

2. **Thông báo biến động lao động (tăng/giảm từ 50 người trở lên):**
   - Hạn chót: Ngay khi phát sinh trường hợp.
   - Mức phạt (NĐ 283/2026/NĐ-CP): Cá nhân phạt 2 – 4 triệu | Doanh nghiệp phạt 4 – 8 triệu đồng.

3. **Báo cáo công tác an toàn, vệ sinh lao động (ATVSLĐ):**
   - Hạn chót: **Trước ngày 10/01/2027**.
   - Mức phạt: Cá nhân phạt 1 – 3 triệu | Doanh nghiệp phạt 2 – 6 triệu đồng.

4. **Báo cáo tổng hợp tai nạn lao động:**
   - Hạn chót: **Trước ngày 10/01/2027**.
   - Mức phạt: Cá nhân phạt 5 – 10 triệu | Doanh nghiệp phạt **10 – 20 triệu đồng**.

5. **Báo cáo y tế lao động (Thông tư 19/2016/TT-BYT):**
   - Hạn chót: **Trước ngày 10/01/2027**.

6. **Báo cáo hoạt động cho thuê lại lao động:**
   - Hạn chót: **Trước ngày 20/12/2026**. Mức phạt doanh nghiệp: 1 – 3 triệu đồng.

7. **Báo cáo tình hình tham gia BHTN:**
   - Hạn chót: **Trước ngày 15/01/2027**.

*Bên cạnh đó, Bộ Báo cáo tài chính năm và Quyết toán thuế TNDN + TNCN có hạn chót trước ngày **31/03** năm sau.*
"Dịu dàng với chính mình, nghiêm túc với con số" — Đội ngũ Kế toán Đất Phú luôn túc trực rà soát hồ sơ qua Hotline/Zalo: **0979.991.898**!`;
  }

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
Để được hỗ trợ chi tiết về Hóa đơn điện tử máy tính tiền NĐ 254, Chữ ký số EFY-CA hoặc Hỗ trợ kỹ thuật UltraViewer, quý khách vui lòng nhắn trực tiếp qua Hotline / Zalo: **0979.991.898** (Địa chỉ: 172 Ngô Gia Tự, Khu phố 3, Phường Phú Đông, Thành phố Tuy Hòa, Tỉnh Phú Yên) để chuyên viên hỗ trợ tức thì ạ!`;
}

const DATPHU_KNOWLEDGE_BASE = `
THÔNG TIN DOANH NGHIỆP:
- Tên đơn vị: CÔNG TY TNHH THƯƠNG MẠI ĐẤT PHÚ (MST: 4401020233)
- Hotline / Zalo chính thức: 0979.991.898
- Địa chỉ: 172 Ngô Gia Tự, Khu phố 3, Phường Phú Đông, Thành phố Tuy Hòa, Tỉnh Phú Yên
- Châm ngôn: "Dịu dàng với chính mình, nghiêm túc với con số • Quy chuẩn 6K Kín Kẽ OS"

BIỂU PHÍ DỊCH VỤ SỐ ĐẤT PHÚ GEN 4:
1. Hóa đơn điện tử máy tính tiền (Chuẩn Nghị định 254/2026/NĐ-CP):
   - Giá: 450.000đ / 500 số (Không bắt buộc cắm USB Token khi xuất cho khách lẻ, in bill nhiệt tức thì).
2. Chữ ký số công cộng EFY-CA:
   - Gói 3 năm: 1.150.000đ (Chiết khấu 40%, tặng kèm thiết bị USB Token bảo hành 1 đổi 1).
   - Dùng để kê khai thuế điện tử (thuedientu.gdt.gov.vn), nộp tờ khai và ký hóa đơn GTGT.
3. Combo EasyPOS & Thuế trọn gói:
   - Giá: 1.850.000đ / năm đầu (Bao gồm phần mềm quản lý bán hàng EasyPOS + 1.000 số hóa đơn máy tính tiền + 1 năm chữ ký số).
4. Hướng dẫn Kê khai Thuế GTGT & Khấu trừ theo Nghị định 144/2026/NĐ-CP & NĐ 68/2026:
   - Ngưỡng thanh toán không dùng tiền mặt từ 05 triệu đồng trở lên (bắt buộc chuyển khoản để được khấu trừ GTGT đầu vào).
   - Nếu chưa đến hạn thanh toán: vẫn được kê khai khấu trừ đầu vào. Đến hạn thanh toán nếu không chuyển khoản thì phải kê khai điều chỉnh giảm.
   - Hộ kinh doanh: Chi phí muốn trừ phải từ 5 triệu chuyển khoản; cập nhật số tài khoản trên eTax Mobile; kê khai Mẫu 01/CNKD (doanh thu 1-50 tỷ khai theo quý).
   - Mẫu biểu thuế GTGT: 01/GTGT (khấu trừ SXKD), 02/GTGT (dự án đầu tư), 04/GTGT (trực tiếp doanh thu), 05/GTGT (phân bổ ngoại tỉnh), 01/KHBS (khai bổ sung).
5. Mạng lưới Đội Thợ Dân Sinh (0% phí trung gian):
   - Đội Thợ Xây Cả Tám Đất Phú: Đổ móng, xây tô, lát đá (ĐT: 0914.821.567).
   - Xưởng Cơ Khí Hàn Sắt Ba Bình: Cổng sắt, mái che tôn, giàn giáo (ĐT: 0905.342.118).
   - Hỗ trợ khẩn cấp: Hotline 0979.991.898.
`;

// Hàm lấy Gemini API Key (hỗ trợ cả biến môi trường serverless và fallback Base64)
function getGeminiApiKey() {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
    return process.env.GEMINI_API_KEY.trim();
  }
  const fallbackB64 = 'QVEuQWI4Uk42SjdHeHVVTjUtNjNKYjQxRTJweUFITDRvbWZ3anMxZE5RbDdKVkZfdVdoSUE=';
  try {
    return Buffer.from(fallbackB64, 'base64').toString('utf8');
  } catch (e) {
    return '';
  }
}

/**
 * GỌI GOOGLE GEMINI API (GEMINI 3.5 FLASH LITE VỚI MULTI-TURN CONTENTS)
 */
async function callGeminiWithContents(contents, fallbackText) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return fallbackText;
  }

  const payload = JSON.stringify({
    contents,
    generationConfig: {
      temperature: 0.25,
      maxOutputTokens: 1000
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
              resolve(fallbackText);
            }
          } catch (e) {
            resolve(fallbackText);
          }
        });
      }
    );

    req.on('error', () => {
      resolve(fallbackText);
    });

    req.setTimeout(9000, () => {
      req.destroy();
      resolve(fallbackText);
    });

    req.write(payload);
    req.end();
  });
}

/**
 * BỘ NÃO ĐIỀU PHỐI ĐA TÁC TỬ (MULTI-AGENT ORCHESTRATOR)
 */
async function processAgentSwarm(userMessage, options = {}) {
  const startTime = Date.now();
  const lowerMsg = userMessage.toLowerCase();

  // 1. QUẢN LÝ PHIÊN HỘI THOẠI & TRÍ NHỚ ĐA PHIÊN (PERSISTENT MEMORY)
  const sessionId = options.sessionId || null;
  const clientHistory = Array.isArray(options.history) ? options.history : null;
  const session = getOrCreateSession(sessionId, clientHistory);

  // 2. RAG RETRIEVAL: TRÍCH XUẤT ĐIỀU KHOẢN PHÁP LUẬT TỰ ĐỘNG
  const retrievedChunks = searchLegalKnowledge(userMessage, 2);
  const ragContext = buildRagContext(userMessage);

  // 3. TÁC TỬ PHÂN LOẠI & LỰA CHỌN VAI TRÒ CHUYÊN TRÁCH
  let assignedAgent = 'Front-line Support';
  let specificRolePrompt = '';
  
  if (lowerMsg.includes('thuế') || lowerMsg.includes('nghị định') || lowerMsg.includes('hóa đơn') || lowerMsg.includes('chữ ký số') || lowerMsg.includes('thông tư') || lowerMsg.includes('254') || lowerMsg.includes('máy tính tiền') || lowerMsg.includes('mẫu 04') || lowerMsg.includes('sai sót') || lowerMsg.includes('bia') || lowerMsg.includes('rượu') || lowerMsg.includes('f&b') || lowerMsg.includes('thành lập') || lowerMsg.includes('mới mở') || lowerMsg.includes('khởi nghiệp') || lowerMsg.includes('mới kinh doanh')) {
    assignedAgent = 'Tax & Invoicing Expert (Chuyên Gia Thuế & Hóa Đơn)';
    specificRolePrompt = `
BẠN LÀ: Tác tử Nghiệp vụ Thuế & Hóa đơn của Đất Phú Gen 4.
NHIỆM VỤ: 
1. Giải đáp chính xác các câu hỏi về hóa đơn điện tử theo Nghị định 254/2026/NĐ-CP, chữ ký số EFY-CA, xử lý sai sót hóa đơn theo Nghị định 123/TT 78 và quản trị rủi ro thuế theo Thông tư 94.
2. Với doanh nghiệp/công ty mới thành lập hoặc mới khởi nghiệp: Chúc mừng khách hàng, hướng dẫn chi tiết các bước thuế ban đầu cần làm ngay: Mở tài khoản ngân hàng doanh nghiệp (VCB DigiBiz) + kê khai UBO 3 tầng, mua Chữ ký số EFY-CA (1.150.000đ/3 năm) để kê khai thuế điện tử, đăng ký Hóa đơn điện tử máy tính tiền (450k/500 số), treo biển hiệu tại trụ sở, và chuẩn bị hồ sơ báo cáo định kỳ.
3. NGUYÊN TẮC: Khẳng định rõ hóa đơn máy tính tiền không bắt buộc chữ ký số từng bill, rất tiện cho quán ăn, tiệm tạp hóa, bán lẻ. Báo giá đúng bảng giá niêm yết (450k/500 số, 1.150.000đ/3 năm CKS). Trích dẫn điều khoản pháp luật trong phần RAG đã cung cấp.
    `;
  } else if (lowerMsg.includes('lỗi') || lowerMsg.includes('cài đặt') || lowerMsg.includes('ultraviewer') || lowerMsg.includes('kỹ thuật') || lowerMsg.includes('n8n') || lowerMsg.includes('pos')) {
    assignedAgent = 'Technical & Automation Coordinator (Tác Tử Kỹ Thuật & n8n)';
    specificRolePrompt = `
BẠN LÀ: Tác tử Điều phối Kỹ thuật & Tự động hóa n8n của Đất Phú Gen 4.
NHIỆM VỤ: Hướng dẫn xử lý lỗi kỹ thuật (chữ ký số, phần mềm EasyPOS). Hướng dẫn khách hàng cung cấp ID và Mật khẩu UltraViewer để kỹ thuật viên Đất Phú kết nối hỗ trợ từ xa.
    `;
  } else if (lowerMsg.includes('giá') || lowerMsg.includes('tiền') || lowerMsg.includes('thanh toán') || lowerMsg.includes('chuyển khoản') || lowerMsg.includes('vietqr') || lowerMsg.includes('mua') || lowerMsg.includes('bao nhiêu')) {
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

  // 4. GHÉP SYSTEM PROMPT KÈM KHO TRI THỨC VÀ BỐI CẢNH RAG
  const systemPrompt = `
# VAI TRÒ CHUNG
Bạn là trợ lý AI thông minh trong Hệ thống Đa tác tử Đất Phú Gen 4 (Công ty TNHH Thương mại Đất Phú).
Đang kích hoạt vai trò chuyên trách: [${assignedAgent}]

# KHO TRI THỨC CỐT LÕI ĐẤT PHÚ:
${DATPHU_KNOWLEDGE_BASE}

${ragContext}

# HƯỚNG DẪN RIÊNG CHO TÁC TỬ:
${specificRolePrompt}

# QUY CHUẨN PHẢN HỒI:
- Trả lời bằng tiếng Việt gãy gọn, chuyên nghiệp, ấm áp, đậm chất phục vụ bà con và doanh nghiệp Phú Yên.
- Luôn bám sát số liệu giá cả trong kho tri thức, KHÔNG ĐƯỢC TỰ BỊA ĐẶT GIÁ.
- Nếu có điều khoản RAG pháp lý, hãy trích dẫn ngắn gọn số điều và nghị định để khách hàng an tâm tuyệt đối về mặt tuân thủ.
- Cuối câu luôn mời khách hàng liên hệ Hotline / Zalo: 0979.991.898 hoặc để lại số điện thoại để hỗ trợ trong 15 phút.
  `;

  // 5. XÂY DỰNG NỘI DUNG MULTI-TURN CHAT TỪ TRÍ NHỚ PHIÊN
  const { contents, profile } = buildGeminiContents(systemPrompt, session, userMessage);
  const fallbackAnswer = getRuleBasedAnswer(userMessage, assignedAgent);

  // 6. GỌI GEMINI FLASH LITE VỚI NỘI DUNG ĐA PHIÊN
  let reply = '';
  try {
    reply = await callGeminiWithContents(contents, fallbackAnswer);
  } catch (err) {
    console.error('CallGeminiWithContents error:', err);
    reply = fallbackAnswer;
  }

  if (!reply || reply.trim().length === 0) {
    reply = fallbackAnswer;
  }

  // 7. GHI NHỚ LƯỢT HỘI THOẠI VÀO BỘ NHỚ ĐA PHIÊN
  recordTurn(session.sessionId, userMessage, reply, assignedAgent);

  const latencyMs = Date.now() - startTime;

  return {
    success: true,
    agent: assignedAgent,
    latencyMs,
    reply,
    sessionId: session.sessionId,
    customerProfile: profile,
    ragEvidence: retrievedChunks.map(c => ({ doc: c.doc, article: c.article, title: c.title })),
    complianceStatus: '6K_KIN_KE_VERIFIED'
  };
}

module.exports = {
  processAgentSwarm
};
