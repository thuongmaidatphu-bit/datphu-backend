# HỒ SƠ THIẾT KẾ KỸ THUẬT DỰ ÁN: ĐẤT PHÚ CORE (2026 – 2027)

> **Mã hồ sơ:** `DP-CORE-SPEC-2026-V1`  
> **Đơn vị chủ quản:** CÔNG TY TNHH THƯƠNG MẠI ĐẤT PHÚ (MST: 4401020233)  
> **Trụ sở:** Số 21/146 Ngô Gia Tự, TP. Tuy Hòa, Tỉnh Phú Yên  
> **Triết lý vận hành:** **6K Kín Kẽ OS** — Giải phóng lao động, Minh bạch thương mại, An toàn pháp lý.

---

## 1. TỔNG QUAN & SỨ MỆNH ĐẤT PHÚ
1. **Giải phóng lao động:** Trao quyền tự chủ cho đội ngũ **Thợ 6K Tuy Hòa** (Điện nước, Điện lạnh, Mở khóa, Đèn NLMT, Xây dựng/Chống thấm) và các Quầy số địa phương; điều phối theo bán kính gần nhất kèm tồn kho vật tư lưu động trên xe; giải ngân tức thời sau nghiệm thu.
2. **Minh bạch thương mại:** Niêm yết công khai 100% giá nhân công và vật tư chính hãng; kiểm toán 6 giai đoạn (`K1` Định vị ➔ `K2` Báo giá ➔ `K3` Thi công ➔ `K4` Nghiệm thu ➔ `K5` Thanh toán VietQR & HĐĐT ➔ `K6` Bảo hành số) bằng chuỗi băm bất biến (SHA-256 Hash-Chain).
3. **An toàn pháp lý:** Hạch toán qua **Sổ cái tài chính bút toán kép (Double-Entry Ledger)**, đối soát tự động **VietQR Napas247** và phát hành **Hóa đơn điện tử khởi tạo từ máy tính tiền** (NĐ 123/2020/NĐ-CP, NĐ 70/2025/NĐ-CP & TT 40/2021/TT-BTC).

---

## 2. KIẾN TRÚC KỸ THUẬT 4 TẦNG
- **Tầng 1 – Client Layer:**
  - **Cổng Dân Sinh (`/cong_dan_sinh.html` | `/khach`):** Mua sắm vật tư Quầy số, đặt lịch Thợ 6K theo khung giờ, tra cứu Bảo hành số.
  - **Cổng Cứu Hộ Linh Hoạt & Phản Hồi Nhanh 20KB (`/cuu_ho_20kb.html` | `/cuu-ho`):** Siêu nhẹ `<= 20KB`, phân loại rõ **2 mức độ (Khẩn cấp 20–45 phút & Đặt lịch hẹn trước theo khung giờ)**, áp dụng cơ chế **Quản trị kỳ vọng khách hàng** (*"Ghi nhận yêu cầu cứu hộ ➔ Thợ 6K khu vực Tuy Hòa sẽ gọi điện xác nhận thời gian có mặt ngay lập tức"*).
- **Tầng 2 – Application Layer (Node.js Runtime):**
  - `src/modules/core6k/` & `src/controllers/aiController.js`: Máy trạng thái kiểm toán `K1 ➔ K6`, kịch bản AI/Chatbot phản hồi quản trị kỳ vọng khách hàng, sinh mã EMVCo VietQR Napas247 động (tự động đổi TK Thợ hoặc TK Công ty Đất Phú), hạch toán Sổ cái bút toán kép và phát hành HĐĐT tự động.
- **Tầng 3 – High-Speed Cache & Realtime Layer (Redis Engine):**
  - `src/core/redisCacheLayer.js`: Geospatial Indexing (`GEOADD`, `GEOSEARCH`), khóa phân tán chống trùng lệnh (`Redlock`), bộ đếm SLA 15 phút tự động leo thang (`SLA 15m Timer`), và kênh phát sóng SSE thời gian thực.
- **Tầng 4 – Persistent Cloud Layer (Supabase Cloud):**
  - `supabase/migrations/20261107_datphu_core_6_groups.sql`: PostgreSQL + PostGIS lưu trữ 6 nhóm bảng cốt lõi, Row-Level Security (RLS), Supabase Storage & Realtime CDC.

---

## 3. MÔ HÌNH DỮ LIỆU: 6 NHÓM BẢNG CỐT LÕI
1. **Nhóm 1 – Thợ 6K Tuy Hòa & Tồn kho lưu động:** `workers_6k`, `worker_vehicle_inventory`
2. **Nhóm 2 – Quầy số & Danh mục Vật tư:** `digital_booths`, `booth_products`
3. **Nhóm 3 – Điều phối Cứu hộ & Kiểm toán 6K:** `dispatch_tickets`, `k6_audit_logs`
4. **Nhóm 4 – Đơn hàng Thương mại & Bảo hành số:** `orders_dp`, `order_items`, `digital_warranties`
5. **Nhóm 5 – Sổ cái Tài chính, VietQR & HĐĐT:** `financial_ledger_entries`, `vietqr_transactions`, `einvoices`
6. **Nhóm 6 – Trạm Chung Tay Cộng Đồng 6K:** `community_campaigns`, `community_tasks_pledges`

---

## 4. DANH MỤC API GIAI ĐOẠN 1 (ĐẤT PHÚ CORE V1)
- `GET /api/v1/core6k/overview`: Tổng quan thời gian thực toàn sàn (GMV, Đơn DP-xxxx, Phiếu YC-xxxx, Đội thợ 6K, Quầy số, Chiến dịch CT-01, Sổ cái).
- `GET /api/v1/core6k/workers`: Tra cứu Thợ 6K Tuy Hòa theo nghề + khoảng cách GPS + tồn kho vật tư trên xe (`Redis GEOSEARCH`).
- `GET /api/v1/core6k/booths`: Danh sách Quầy số và vật tư chính hãng niêm yết.
- `POST /api/v1/sos/dispatch`: Phát lệnh Cứu Hộ Siêu Tốc SLA 15 phút (Chấm điểm $S_{\text{dispatch}}$, khóa `Redlock`, tạo phiếu `YC-xxxx` ở giai đoạn `K1`).
- `POST /api/v1/core6k/stage`: Chuyển giai đoạn kiểm toán `K1 ➔ K6` kèm băm chuỗi kiểm toán `SHA-256` (`k6_audit_logs`).
- `POST /api/v1/core6k/vietqr-webhook`: Webhook thanh toán **VietQR Napas247**, tự động ghi **Sổ cái bút toán kép (5 tài khoản)**, phát hành **Hóa đơn điện tử máy tính tiền** và kích hoạt **Bảo hành số K6**.
- `POST /api/v1/community/relief`: Điều phối Trạm Chung Tay Cộng Đồng `CT-01` (Thợ nhận ca công `CA-xx` / Quầy số góp vật tư `VT-xx`).
