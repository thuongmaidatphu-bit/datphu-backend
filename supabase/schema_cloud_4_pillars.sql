-- ============================================================================
-- ĐẤT PHÚ CORE & VÍ AN SINH - 4 CỔNG CHÍNH LƯU TRỮ ĐÁM MÂY SUPABASE CLOUD
-- Dự án: ckyydvyzucvcdunvedmg (PostgreSQL 15 Cloud)
-- 1. DATABASE | 2. AUTHENTICATION | 3. STORAGE | 4. REALTIME
-- ============================================================================

-- BẬT CÁC EXTENSION CẦN THIẾT
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CỔNG 1: DATABASE (CƠ SỞ DỮ LIỆU ĐÁM MÂY)
-- ============================================================================

-- 1.1 Bảng Hồ Sơ Người Dùng & Phân Quyền RBAC (Liên kết auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    phone TEXT,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('master_admin', 'merchant', 'worker', 'customer')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 Bảng Hộ Kinh Doanh / Điểm Bán Ví An Sinh
CREATE TABLE IF NOT EXISTS public.pos_merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    store_name TEXT NOT NULL,
    business_type TEXT NOT NULL DEFAULT 'fnb', -- fnb, retail, accommodation (Hometel)
    address TEXT NOT NULL,
    tax_code TEXT,
    bank_bin TEXT NOT NULL DEFAULT '970422', -- MBBank
    bank_account TEXT NOT NULL,
    bank_account_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 Bảng Danh Mục Món / Sản Phẩm & Tồn Kho Cơ Bản
CREATE TABLE IF NOT EXISTS public.pos_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES public.pos_merchants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- coffee, room, souvenir, rental
    price NUMERIC NOT NULL,
    stock_quantity INT DEFAULT 99,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.4 Bảng Đơn Hàng & Dòng Tiền Napas247
CREATE TABLE IF NOT EXISTS public.pos_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES public.pos_merchants(id) ON DELETE CASCADE,
    order_code TEXT UNIQUE NOT NULL, -- AS-xxxx
    total_amount NUMERIC NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'vietqr', 'debt')),
    payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
    einvoice_status TEXT NOT NULL CHECK (einvoice_status IN ('not_issued', 'issued', 'batch_pending')) DEFAULT 'not_issued',
    einvoice_code TEXT,
    transaction_id TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.5 Bảng Chi Tiết Món Trong Đơn
CREATE TABLE IF NOT EXISTS public.pos_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.pos_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.pos_products(id),
    product_name TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC NOT NULL,
    total_price NUMERIC NOT NULL
);

-- 1.6 Bảng Thợ Kỹ Thuật 6K Tuy Hòa
CREATE TABLE IF NOT EXISTS public.workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id),
    worker_code TEXT UNIQUE NOT NULL, -- THO-01, THO-02...
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    trade_category TEXT NOT NULL, -- Điện nước, Điện lạnh, Mở khóa, IT
    base_fee NUMERIC NOT NULL DEFAULT 100000,
    rating NUMERIC DEFAULT 5.0,
    review_count INT DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    current_lat NUMERIC,
    current_lng NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.7 Bảng Điều Phối Cứu Hộ Tại Chỗ
CREATE TABLE IF NOT EXISTS public.dispatch_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispatch_code TEXT UNIQUE NOT NULL,
    worker_id UUID REFERENCES public.workers(id),
    merchant_id UUID REFERENCES public.pos_merchants(id),
    issue_description TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled')) DEFAULT 'assigned',
    final_fee NUMERIC,
    platform_fee NUMERIC,
    evidence_image_before TEXT,
    evidence_image_after TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CỔNG 2: AUTHENTICATION & ROW-LEVEL SECURITY (RLS)
-- ============================================================================

-- Bật Row Level Security trên các bảng chính
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_logs ENABLE ROW LEVEL SECURITY;

-- Chính sách: Chủ Sàn (master_admin) được xem và sửa toàn bộ
CREATE POLICY "Master admin xem toàn bộ profiles" ON public.profiles
    FOR ALL USING (auth.jwt() ->> 'role' = 'master_admin');

-- Chính sách: Hộ kinh doanh chỉ xem và quản lý đơn của chính mình
CREATE POLICY "Merchant quản lý đơn hàng của quán mình" ON public.pos_orders
    FOR ALL USING (
        merchant_id IN (
            SELECT id FROM public.pos_merchants WHERE profile_id = auth.uid()
        )
    );

-- ============================================================================
-- CỔNG 3: STORAGE (KHO LƯU TRỮ TẬP TIN & HÌNH ẢNH ĐÁM MÂY)
-- ============================================================================

-- Tạo 4 Buckets lưu trữ đám mây S3-compatible của Supabase
INSERT INTO storage.buckets (id, name, public) VALUES 
('avatars', 'avatars', true),
('products', 'products', true),
('invoices', 'invoices', false),
('evidence', 'evidence', false)
ON CONFLICT (id) DO NOTHING;

-- Cho phép xem công khai ảnh đại diện và sản phẩm
CREATE POLICY "Xem công khai ảnh sản phẩm" ON storage.objects
    FOR SELECT USING (bucket_id IN ('avatars', 'products'));

-- Cho phép tải ảnh lên khi đã đăng nhập
CREATE POLICY "Người dùng tải file lên bucket của mình" ON storage.objects
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- CỔNG 4: REALTIME (KÊNH PHÁT SÓNG SỰ KIỆN THỜI GIAN THỰC ĐÁM MÂY)
-- ============================================================================

-- Kích hoạt Realtime Replication cho bảng Đơn Hàng & Điều Phối Thợ
-- Cho phép quầy POS nhận thông báo "Ting Ting" và Thợ nhận ca ngay tức khắc
ALTER PUBLICATION supabase_realtime ADD TABLE public.pos_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dispatch_logs;
