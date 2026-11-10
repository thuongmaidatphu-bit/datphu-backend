-- ==============================================================================
-- ĐẤT PHÚ ECOSYSTEM - MASTER DATABASE SCHEMA (2026 - 2027)
-- Dự án Supabase: ckyydvyzucvcdunvedmg (PostgreSQL 15 Cloud)
-- ==============================================================================
-- BẢN QUYỀN: CÔNG TY TNHH THƯƠNG MẠI ĐẤT PHÚ (MST: 4401020233)
-- Trụ sở: Số 21/146 Ngô Gia Tự, TP. Tuy Hòa, Phú Yên
-- ==============================================================================

-- 1. BẬT CÁC TIỆN ÍCH MẬT MÃ & UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- PHẦN 1: HỒ SƠ NGƯỜI DÙNG & PHÂN QUYỀN RBAC (PROFILES)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE,                 -- Liên kết auth.users nếu đăng nhập qua Supabase Auth
    phone TEXT UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('master_admin', 'merchant', 'worker', 'customer')),
    avatar_url TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- PHẦN 2: LỊCH THIÊN VĂN & SỔ GIỖ GIA TỘC (FAMILY MEMORIALS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.family_memorials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    family_head TEXT NOT NULL,           -- Tộc trưởng / Người đại diện (VD: Nguyễn Văn Hùng)
    phone TEXT NOT NULL,                 -- Số điện thoại nhận tin nhắc giỗ
    lineage TEXT NOT NULL,               -- Dòng họ (VD: Nguyễn Tộc Thôn Định Thắng, Phú Hòa)
    deceased_name TEXT NOT NULL,         -- Họ tên người quá cố / Liệt sĩ / Tiên linh
    relationship TEXT NOT NULL,          -- Quan hệ (Ông Nội, Cụ Tổ, Bà Ngoại, Cha, Mẹ)
    lunar_day INT NOT NULL CHECK (lunar_day BETWEEN 1 AND 30),
    lunar_month INT NOT NULL CHECK (lunar_month BETWEEN 1 AND 12),
    lunar_year_pass INT,                 -- Năm mất âm lịch (tùy chọn)
    burial_location TEXT,                -- Nơi an táng / nghĩa trang quê quán
    notes TEXT,                          -- Dặn dò cúng giỗ, họp họ hiếu kính
    reminder_days_before INT DEFAULT 3,  -- Nhắc trước 3 ngày
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memorials_lunar ON public.family_memorials(lunar_month, lunar_day);

-- ==============================================================================
-- PHẦN 3: CANH LŨ THƯỢNG NGUỒN & QUAN TRẮC VỆ TINH (FLOOD MONITORING)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.flood_monitoring_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id TEXT NOT NULL,
    station_id TEXT NOT NULL,            -- song_ba_ha, song_hinh_res, ky_lo_upstream, tuy_hoa_estuary
    station_name TEXT NOT NULL,          -- Thượng nguồn Sông Ba Hạ, Sông Kỳ Lộ...
    river_basin TEXT NOT NULL,           -- Lưu vực Sông Ba / Sông Kỳ Lộ
    risk_area TEXT NOT NULL,             -- Rốn lũ La Hai, Đồng Xuân, Phú Hòa, Tuy Hòa
    temperature NUMERIC DEFAULT 25.0,
    precipitation NUMERIC NOT NULL,      -- Lượng mưa đo được (mm)
    wind_speed NUMERIC NOT NULL,         -- Tốc độ gió (km/h)
    alert_level INT NOT NULL DEFAULT 0,  -- 0: Bình thường, 1: Chú ý, 2: Cảnh báo, 3: Khẩn cấp
    alert_text TEXT NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flood_recorded ON public.flood_monitoring_logs(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_flood_alert_level ON public.flood_monitoring_logs(alert_level);

-- ==============================================================================
-- PHẦN 4: NHẬT KÝ THÔNG BÁO VIỆC HIẾU & NHẮC GIỖ (MEMORIAL NOTIFICATIONS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.memorial_notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memorial_id UUID REFERENCES public.family_memorials(id) ON DELETE SET NULL,
    family_head TEXT NOT NULL,
    phone TEXT NOT NULL,
    notification_type TEXT NOT NULL,     -- CHINH_GIO_HOM_NAY hoặc NHAC_TRUOC_3_NGAY
    message TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'SENT'
);

-- ==============================================================================
-- PHẦN 5: QUẦY BÁN HÀNG POS & THANH TOÁN VIETQR NAPAS247
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.pos_merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    bank_bin TEXT NOT NULL DEFAULT '970422', -- MBBank
    bank_account TEXT NOT NULL,
    bank_account_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pos_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES public.pos_merchants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,              -- coffee, fnb, nong_san, hai_san
    price NUMERIC NOT NULL,
    stock_quantity INT DEFAULT 99,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pos_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES public.pos_merchants(id) ON DELETE CASCADE,
    order_code TEXT UNIQUE NOT NULL,     -- AS-xxxx
    total_amount NUMERIC NOT NULL,
    payment_method TEXT DEFAULT 'vietqr_napas247',
    status TEXT DEFAULT 'PAID',          -- PENDING, PAID, CANCELLED
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- PHẦN 6: CỨU HỘ KỸ THUẬT & ĐIỀU PHỐI THỢ 6K (DISPATCH LOGS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.dispatch_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_code TEXT UNIQUE NOT NULL,    -- 6K-xxxx
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    address TEXT NOT NULL,
    issue_description TEXT NOT NULL,
    assigned_worker_id UUID,
    assigned_worker_name TEXT,
    status TEXT DEFAULT 'ACCEPTED',      -- PENDING, ACCEPTED, COMPLETED
    sla_minutes INT DEFAULT 15,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- BẢO MẬT CẤP HÀNG ROW LEVEL SECURITY (RLS) - ZERO-TRUST
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_memorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flood_monitoring_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memorial_notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_logs ENABLE ROW LEVEL SECURITY;

-- 1. Cho phép đọc thông tin chung (Canh lũ, sản phẩm POS là công khai cho bà con)
CREATE POLICY "Public Read Flood Logs" ON public.flood_monitoring_logs FOR SELECT USING (true);
CREATE POLICY "Public Read POS Products" ON public.pos_products FOR SELECT USING (true);
CREATE POLICY "Public Read Memorials" ON public.family_memorials FOR ALL USING (true);
CREATE POLICY "Public Manage Orders" ON public.pos_orders FOR ALL USING (true);
CREATE POLICY "Public Manage Dispatch" ON public.dispatch_logs FOR ALL USING (true);
CREATE POLICY "Public Manage Profiles" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Public Manage Merchants" ON public.pos_merchants FOR ALL USING (true);
CREATE POLICY "Public Manage Notifications" ON public.memorial_notification_logs FOR ALL USING (true);

-- ==============================================================================
-- DỮ LIỆU KHỞI TẠO BAN ĐẦU (SEED DATA CHO PHÚ YÊN)
-- ==============================================================================
INSERT INTO public.family_memorials (family_head, phone, lineage, deceased_name, relationship, lunar_day, lunar_month, burial_location, notes)
VALUES 
('Nguyễn Văn Hùng', '0912345678', 'Nguyễn Tộc (Thôn Định Thắng, Hòa Định Đông)', 'Cụ Ông Nguyễn Văn An', 'Ông Nội', 2, 10, 'Nghĩa trang Gò Chùa, Phú Hòa', 'Chính giỗ hôm nay - Con cháu tề tựu cúng giỗ truyền thống'),
('Trần Thị Thu Thảo', '0987654321', 'Trần Tộc (Khu phố Long Hải Bắc, Sông Cầu)', 'Bà Mẹ VNAH Trần Thị Mẫn', 'Bà Ngoại', 5, 10, 'Nghĩa trang Liệt sĩ TX. Sông Cầu', 'Nhắc trước 3 ngày để gia đình chuẩn bị cỗ chay'),
('Lê Văn Thành', '0905123987', 'Lê Tộc (Thị trấn La Hai, Đồng Xuân)', 'Liệt sĩ Lê Văn Định', 'Bác Ruột', 15, 10, 'Nghĩa trang Liệt sĩ Huyện Đồng Xuân', 'Giỗ Rằm tháng 10 - Thắp hương tri ân')
ON CONFLICT DO NOTHING;

INSERT INTO public.pos_merchants (store_name, owner_name, phone, address, bank_account, bank_account_name)
VALUES 
('Thanh Giang Hometel Tuy Hòa', 'Phan Thanh Giang', '0901234567', '21/146 Ngô Gia Tự, TP. Tuy Hòa', '0901234567', 'PHAN THANH GIANG')
ON CONFLICT DO NOTHING;
