/**
 * ============================================================================
 * KHO TRI THỨC PHÁP LÝ CHUYÊN SÂU & BỘ MÁY RAG (LEGAL KNOWLEDGE RAG ENGINE)
 * Hệ thống Đa tác tử Đất Phú Gen 4
 * Nạp văn bản: NĐ 254/2026/NĐ-CP, TT 94/2024/TT-BTC, NĐ 123/2020, TT 78/2021
 * ============================================================================
 */

// KHO VĂN BẢN PHÁP LUẬT SỐ HÓA THEO CHỦ ĐỀ & ĐIỀU KHOẢN (KNOWLEDGE CHUNKS)
const LEGAL_CHUNKS = [
  {
    id: 'ND254_DOI_TUONG_AP_DUNG',
    doc: 'Nghị định 254/2026/NĐ-CP',
    article: 'Điều 3 & Điều 5',
    title: 'Đối tượng bắt buộc áp dụng Hóa đơn điện tử khởi tạo từ máy tính tiền',
    keywords: ['đối tượng', 'bắt buộc', 'cà phê', 'quán ăn', 'nhà hàng', 'khách sạn', 'tạp hóa', 'thuốc', 'bán lẻ', 'siêu thị', 'trung tâm thương mại', 'vui chơi', 'vé', 'máy tính tiền', '254'],
    content: `Theo Nghị định 254/2026/NĐ-CP, các cơ sở kinh doanh có hoạt động cung cấp hàng hóa, dịch vụ trực tiếp đến người tiêu dùng bắt buộc phải triển khai hóa đơn điện tử khởi tạo từ máy tính tiền có kết nối chuyển dữ liệu với cơ quan thuế.
Nhóm ngành bắt buộc trọng điểm gồm:
1. Kinh doanh ăn uống, nhà hàng, quán cà phê, giải khát, thức ăn nhanh.
2. Dịch vụ bán lẻ hàng hóa tiêu dùng, siêu thị mini, bách hóa tổng hợp, tiệm tạp hóa.
3. Bán lẻ tân dược, thuốc chữa bệnh, vật tư y tế.
4. Dịch vụ lưu trú, khách sạn, nhà nghỉ, homestay.
5. Dịch vụ vui chơi giải trí, chiếu phim, vé tham quan, dịch vụ làm đẹp, cắt tóc, spa, karaoke.`
  },
  {
    id: 'ND254_CO_CHE_CHU_KY_SO',
    doc: 'Nghị định 254/2026/NĐ-CP',
    article: 'Điều 8 Khoản 2',
    title: 'Cơ chế Miễn chữ ký số từng hóa đơn trên máy tính tiền',
    keywords: ['chữ ký số', 'usb token', 'cắm token', 'từng hóa đơn', 'in bill', 'khách lẻ', 'tốc độ', '3 giây', 'mã cơ quan thuế'],
    content: `Hóa đơn điện tử khởi tạo từ máy tính tiền theo Nghị định 254 có điểm cải cách mang tính đột phá:
- KHÔNG BẮT BUỘC PHẢI CÓ CHỮ KÝ SỐ (Digital Signature) của người bán trên từng hóa đơn khi xuất bán lẻ cho khách hàng.
- Hóa đơn sử dụng dải ký tự mã của Cơ quan Thuế cấp sẵn tự động từ đầu ngày hoặc theo phiên giao dịch.
- Hộ kinh doanh và doanh nghiệp chỉ cần cắm Chữ ký số (USB Token EFY-CA) MỘT LẦN vào cuối ngày khi ký bảng tổng hợp dữ liệu hóa đơn điện tử gửi về Tổng cục Thuế, hoặc ủy quyền cho nhà cung cấp giải pháp (Đất Phú) tự động ký số truyền dữ liệu.`
  },
  {
    id: 'ND254_CHE_TAI_XU_PHAT',
    doc: 'Nghị định 254/2026/NĐ-CP & NĐ 125/2020/NĐ-CP',
    article: 'Điều 24 Nghị định 125',
    title: 'Chế tài xử phạt không lập hoặc chậm chuyển dữ liệu hóa đơn máy tính tiền',
    keywords: ['phạt', 'chế tài', 'xử phạt', 'không xuất', 'không lập', 'chậm chuyển', 'trốn thuế', 'kiểm tra'],
    content: `Mức xử phạt vi phạm hành chính đối với hành vi không áp dụng hóa đơn máy tính tiền hoặc không lập hóa đơn khi bán hàng:
1. Không lập hóa đơn khi bán hàng hóa, cung cấp dịch vụ có giá trị từ người tiêu dùng: Phạt tiền từ 10.000.000đ đến 20.000.000đ đối với tổ chức (từ 5.000.000đ đến 10.000.000đ đối với hộ cá nhân kinh doanh).
2. Chuyển dữ liệu hóa đơn điện tử muộn hơn thời hạn quy định: Phạt cảnh cáo hoặc phạt tiền từ 2.000.000đ đến 10.000.000đ tùy theo số ngày chậm nộp.
3. Sử dụng phần mềm bán hàng nhưng không truyền dữ liệu về cơ quan thuế theo chuẩn NĐ 254 bị coi là hành vi che giấu doanh thu.`
  },
  {
    id: 'TT94_THUE_HKD_FNB_BIA_RUOU',
    doc: 'Thông tư 94/2024/TT-BTC & Thông tư 40/2021/TT-BTC',
    article: 'Phụ lục 1 Danh mục ngành nghề tính thuế Hộ kinh doanh',
    title: 'Tỷ lệ phần trăm tính thuế GTGT và TNCN ngành F&B, quán cà phê bán bia rượu',
    keywords: ['tính thuế', 'tỷ lệ thuế', 'thuế suất', 'f&b', 'ăn uống', 'bia', 'rượu', 'nước ngọt', 'đồ ăn', 'cà phê', 'gtgt', 'tncn', 'kê khai', 'khoán'],
    content: `Quy định về tỷ lệ phần trăm tính thuế GTGT và thuế TNCN trên doanh thu đối với Hộ kinh doanh cá thể:
1. Dịch vụ ăn uống thuần túy (chế biến thức ăn, pha chế cà phê, sinh tố):
   - Thuế GTGT: 3% doanh thu.
   - Thuế TNCN: 1.5% doanh thu.
   => Tổng nghĩa vụ thuế: 4.5% trên doanh thu bán ra.
2. Hoạt động bán lẻ hàng hóa nguyên kiện không qua chế biến (bán bia lon, nước ngọt đóng chai, thuốc lá, bao bánh):
   - Thuế GTGT: 1% doanh thu.
   - Thuế TNCN: 0.5% doanh thu.
   => Tổng nghĩa vụ thuế: 1.5% trên doanh thu.
3. QUY TẮC VÀNG CHO QUÁN CÀ PHÊ BÁN KÈM BIA / ĐỒ ĂN:
   Nếu hộ kinh doanh bóc tách được doanh thu từng mục trên phần mềm EasyPOS (mục nào là pha chế, mục nào là bán bia chai nguyên két), thì áp dụng thuế suất 4.5% cho phần pha chế và 1.5% cho phần bán lẻ bia lon. Nếu không bóc tách được, cơ quan thuế sẽ ấn định toàn bộ theo tỷ lệ cao nhất là 4.5%.`
  },
  {
    id: 'ND123_XU_LY_HOA_DON_SAI_SOT',
    doc: 'Nghị định 123/2020/NĐ-CP & Thông tư 78/2021/TT-BTC',
    article: 'Điều 19 Nghị định 123',
    title: 'Quy trình xử lý hóa đơn điện tử máy tính tiền khi phát hiện sai sót (Mẫu 04/SS)',
    keywords: ['sai sót', 'hóa đơn sai', 'mẫu 04', 'thay thế', 'điều chỉnh', 'hủy', 'nhầm giá', 'nhầm tên', '04/ss-hđđt'],
    content: `Quy trình xử lý sai sót đối với Hóa đơn điện tử máy tính tiền:
1. Trường hợp sai tên, địa chỉ người mua nhưng ĐÚNG mã số thuế và ĐÚNG số tiền:
   - Người bán thông báo cho người mua về việc hóa đơn có sai sót, không phải lập lại hóa đơn.
   - Lập Mẫu 04/SS-HĐĐT gửi cơ quan thuế (nếu cần theo yêu cầu quản lý).
2. Trường hợp SAI MÃ SỐ THUẾ, SAI SỐ TIỀN, SAI THUẾ SUẤT, TIỀN THUẾ hoặc HÀNG HÓA không đúng quy cách:
   - Cách 1 (Lập hóa đơn điều chỉnh): Xuất hóa đơn điều chỉnh ghi rõ 'Điều chỉnh tăng/giảm cho hóa đơn ký hiệu... số... ngày...'.
   - Cách 2 (Lập hóa đơn thay thế): Xuất hóa đơn thay thế mới ghi rõ 'Thay thế cho hóa đơn ký hiệu... số... ngày...'.
3. Trường hợp hủy hóa đơn máy tính tiền: Chỉ áp dụng khi người mua trả lại hàng hoặc hủy dịch vụ mà chưa giao hàng hóa.`
  },
  {
    id: 'EFY_CA_CHUNG_THU_SO_PKI',
    doc: 'Quy chuẩn Chữ Ký Số Công Cộng EFY-CA',
    article: 'Nghị định 130/2018/NĐ-CP',
    title: 'Quy chuẩn kỹ thuật Chữ ký số EFY-CA và ứng dụng trong Kê khai Thuế',
    keywords: ['chữ ký số', 'efy', 'token', 'pki', 'sha-256', 'kê khai', 'nộp tờ khai', 'thuedientu', 'hạn dùng', 'gia hạn', '1.150.000'],
    content: `Chữ ký số công cộng EFY-CA được Bộ Thông tin và Truyền thông cấp phép, tích hợp công nghệ mã hóa khóa công khai PKI chuẩn quốc tế (RSA 2048-bit, băm SHA-256):
- Giá trị pháp lý: Tương đương con dấu tròn của doanh nghiệp và chữ ký tay của người đại diện pháp luật.
- Ứng dụng:
  + Kê khai và nộp thuế điện tử trên cổng thuedientu.gdt.gov.vn.
  + Nộp tờ khai môn bài, tờ khai quý/tháng, báo cáo tài chính hàng năm.
  + Ký tờ khai Hải quan điện tử, nộp Bảo hiểm xã hội điện tử (VssID / BHXH Việt Nam).
  + Ký số hợp đồng kinh tế điện tử B2B và hóa đơn GTGT.
- Gói niêm yết Đất Phú: 1.150.000đ / 3 năm (Tặng USB Token bảo hành 1 đổi 1 trong 36 tháng, hỗ trợ cài đặt UltraViewer 24/7).`
  }
];

/**
 * THUẬT TOÁN TÌM KIẾM TRI THỨC NGỮ NGHĨA KẾT HỢP (HYBRID SEMANTIC SEARCH RAG)
 * Xếp hạng văn bản theo mật độ từ khóa và độ khớp ngữ nghĩa
 */
function searchLegalKnowledge(query, topK = 2) {
  if (!query || typeof query !== 'string') return [];
  const lowerQuery = query.toLowerCase();
  
  // Tách từ khóa người dùng
  const words = lowerQuery
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2);

  const scoredChunks = LEGAL_CHUNKS.map(chunk => {
    let score = 0;

    // 1. Khớp từ khóa cốt lõi (Trọng số 4)
    chunk.keywords.forEach(kw => {
      if (lowerQuery.includes(kw)) {
        score += 4;
      }
    });

    // 2. Khớp từng từ đơn trong truy vấn với content và title (Trọng số 1)
    words.forEach(word => {
      if ((chunk.title || '').toLowerCase().includes(word)) score += 2;
      if ((chunk.content || '').toLowerCase().includes(word)) score += 1;
    });

    // 3. Khớp cụ thể số hiệu văn bản (Nghị định 254, Thông tư 94)
    if (lowerQuery.includes('254') && chunk.doc.includes('254')) score += 10;
    if (lowerQuery.includes('94') && chunk.doc.includes('94')) score += 10;
    if (lowerQuery.includes('123') && chunk.doc.includes('123')) score += 10;
    if (lowerQuery.includes('efy') && chunk.id.includes('EFY')) score += 10;

    return { chunk, score };
  });

  // Lọc các kết quả có điểm và sắp xếp giảm dần
  const results = scoredChunks
    .filter(item => item.score > 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(item => item.chunk);

  return results;
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
  LEGAL_CHUNKS,
  searchLegalKnowledge,
  buildRagContext
};
