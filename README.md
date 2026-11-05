# ĐẤT PHÚ CORE & VÍ AN SINH - BACKEND ENGINE (2026)

Hệ thống Backend phục vụ cho mô hình **Bầy Đàn AI (AI Swarm)**, **Ví An Sinh Mini-POS**, **Tìm Thợ Kỹ Thuật 6K Quanh Đây** và **Tổng Quản Trị Chủ Sàn**.

---

## 1. Khởi động nhanh (Quick Start)

Hệ thống được thiết kế theo tư duy **Asset-Light 100%**, sử dụng Node.js thuần (Zero-dependency runtime), không bắt buộc phải cài đặt `node_modules` nặng nề.

```bash
cd E:\datphu-backend
node src/server.js
```

Sau khi chạy, máy chủ sẽ lắng nghe tại cổng `http://localhost:5000`.

---

## 2. Các liên kết giao diện trực tiếp (Web UIs)

- **Trang chủ Ví An Sinh (Cashier + Admin + Cứu hộ)**:  
  `http://localhost:5000/` (hoặc `http://localhost:5000/vi_an_sinh_app.html`)
- **Tìm Thợ & Cửa Hàng Quanh Đây (6K Hub)**:  
  `http://localhost:5000/datphu_nearby_hub.html`
- **Tổng Quản Trị Chủ Sàn (Master Dashboard)**:  
  `http://localhost:5000/datphu_platform_owner.html`
- **Chatbox Trợ Lý AI Đất Phú (Swarm Natural Language Assistant)**:  
  `http://localhost:5000/datphu_ai_assistant.html`

---

## 3. Danh mục API Endpoints

### A. Phân Hệ Ví An Sinh Mini-POS
- `GET /api/pos/orders`: Lấy danh sách đơn hàng
- `POST /api/pos/orders`: Tạo đơn hàng mới, sinh chuỗi EMVCo Napas247 VietQR động
- `GET /api/pos/reports/daily`: Báo cáo doanh thu ngày (Tiền mặt vs VietQR)
- `POST /api/pos/webhook/bank`: Webhook nhận IPN ngân hàng (Casso / SePay / VietQR), đối soát số tiền và phát sự kiện "Ting Ting"
- `GET /api/realtime`: Kênh Server-Sent Events (SSE) phát sóng biến động dòng tiền thời gian thực

### B. Phân Hệ Tìm Thợ & Cửa Hàng
- `GET /api/nearby/workers?radius=1`: Lấy danh sách thợ kỹ thuật 6K trong bán kính 1km/3km/5km
- `GET /api/nearby/stores?radius=1`: Lấy danh sách cửa hàng đối tác & Hometel quanh Tuy Hòa
- `POST /api/dispatch`: Tạo lệnh điều phối thợ đến sửa chữa tại chỗ

### C. Phân Hệ Thuế & Hóa Đơn Điện Tử (Thông Tư 40 & NĐ 123)
- `POST /api/tax/calculate`: Tự động tính thuế hộ kinh doanh (1.5% bán lẻ, 4.5% ăn uống)
- `POST /api/tax/einvoice`: Phát hành HĐĐT máy tính tiền truyền dữ liệu Cục Thuế

### D. Phân Hệ Trợ Lý AI
- `POST /api/ai/chat`: Xử lý ngôn ngữ tự nhiên (Tạo đơn bán hàng, Tìm thợ, Hỏi thuế)

### E. Phân Hệ Chủ Sàn
- `GET /api/admin/metrics`: Lấy chỉ số GMV, số điểm bán, số thợ và tỷ lệ vận hành
