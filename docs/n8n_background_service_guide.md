# Hướng Dẫn Vận Hành n8n Chạy Ngầm (Xử Lý Nghiệp Vụ Xã Hội Phức Tạp)

## 1. Triết Lý Vận Hành: "Tách Rời POS và Nghiệp Vụ Xã Hội Phức Tạp"
Trong thực tế kinh doanh F&B và dịch vụ tại Việt Nam:
* Nhân viên phục vụ và thu ngân **không thể và không nên** thao tác trên phần mềm phức tạp. Họ chỉ cần 1 màn hình: **Chạm món ➔ Bấm Thu Tiền ➔ In Bill / QR**.
* Những tình huống phức tạp của xã hội:
  * Khách quen ăn chịu (ghi sổ nợ).
  * Khách trả tiền mặt nhưng chủ quán đang đi vắng, sợ nhân viên không vào sổ.
  * Xuất hóa đơn điện tử từng đơn theo quy định Thuế (Nghị định 123 / Thông tư 78).
  * Đồng bộ Google Sheets cho kế toán đối soát cuối ngày.
  * Nhắn tin chăm sóc khách hàng qua Zalo OA.

👉 **Giải pháp kiến trúc:** **Đất Phú POS chỉ làm nhiệm vụ bắn tín hiệu ngầm (Fire-and-forget Webhook)**. Toàn bộ logic phức tạp được giao cho **n8n chạy ngầm** xử lý tự động ở hậu trường.

---

## 2. Cách Khởi Động n8n Chạy Ngầm Trên Windows

Trong thư mục `scripts/` của dự án đã chuẩn bị sẵn các công cụ:

### Cách A: Chạy Ngầm 100% Không Hiện Cửa Sổ (Khuyên Dùng Hàng Ngày)
1. Bấm đúp vào file: [`scripts/start_n8n_background.vbs`](file:///C:/Users/Admin/Documents/GitHub/datphu-backend/scripts/start_n8n_background.vbs)
2. Một hộp thoại xác nhận n8n đã kích hoạt ngầm tại cổng `5678`.
3. n8n sẽ âm thầm chạy ở hậu trường Windows mà không có bất kỳ cửa sổ CMD nào làm vướng mắt.
4. Khi cần tắt n8n: Bấm đúp vào file [`scripts/stop_n8n.bat`](file:///C:/Users/Admin/Documents/GitHub/datphu-backend/scripts/stop_n8n.bat).

### Cách B: Chạy Bằng Docker (Nếu Máy Có Docker Desktop)
1. Mở terminal tại thư mục gốc dự án.
2. Gõ lệnh:
   ```bash
   docker compose up -d
   ```
3. n8n sẽ chạy dưới dạng container độc lập vĩnh viễn, tự khởi động lại khi máy bật.

### Cách C: Cài Đặt Khởi Động Cùng Windows (Tự Động Bật Mỗi Sáng)
1. Nhấn tổ hợp phím `Windows + R`, gõ `shell:startup` rồi Enter.
2. Tạo 1 Shortcut trỏ tới file `scripts/start_n8n_background.vbs` và thả vào thư mục Startup này.
3. Từ nay mỗi khi mở máy tính thu ngân, n8n sẽ tự động chạy ngầm sẵn sàng hứng dữ liệu.

---

## 3. Cách Kết Nối n8n Với Đất Phú POS

1. Mở n8n tại: `http://localhost:5678`
2. Nhấn **Import from File** và chọn file: [`public/datphu_n8n_workflow_template.json`](file:///C:/Users/Admin/Documents/GitHub/datphu-backend/public/datphu_n8n_workflow_template.json)
3. Điền Token Telegram Bot của bạn hoặc Link Google Sheets.
4. Bấm **Activate** workflow.
5. Trên điện thoại / máy tính:
   * Trên **Mini POS**: Bấm vào tiêu đề quán ➔ Cài đặt ➔ n8n Webhook: `http://localhost:5678/webhook/datphu-pos` (hoặc link n8n cloud nếu chạy ngoài internet).
   * Trên **Speed POS**: Bấm nút `n8n` trên header ➔ Điền link webhook ➔ Bấm **Lưu Cấu Hình**.
