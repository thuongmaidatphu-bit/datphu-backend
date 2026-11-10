-- ==============================================================================
-- SCHEMA SUPABASE: LỊCH ÂM & HÀNH HƯƠNG ĐẤT PHÚ
-- Bảng quản lý Sổ Giỗ Chạp Gia Tộc, Tự Viện Yêu Thích & Khóa Tu Bát Quan Trai
-- ==============================================================================

-- 1. BẢNG SỔ GIỖ CHẠP GIA TỘC (FAMILY MEMORIALS)
CREATE TABLE IF NOT EXISTS public.family_memorials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    relationship TEXT NOT NULL,           -- Cụ Tổ, Ông Nội, Bà Nội, Cha, Mẹ, v.v.
    lunar_day INT NOT NULL CHECK (lunar_day BETWEEN 1 AND 30),
    lunar_month INT NOT NULL CHECK (lunar_month BETWEEN 1 AND 12),
    lunar_year_pass INT,                  -- Năm mất âm lịch (tùy chọn)
    burial_place TEXT,                    -- Nơi an táng (nghĩa trang, quê quán)
    notes TEXT,                           -- Dặn dò cúng giỗ, món chay thanh tịnh
    reminder_days_before INT DEFAULT 3,   -- Nhắc trước 3 ngày
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index tăng tốc truy vấn theo người dùng
CREATE INDEX IF NOT EXISTS idx_memorials_user ON public.family_memorials(user_id);

-- RLS: Người dùng chỉ đọc/ghi sổ giỗ của chính gia đình mình
ALTER TABLE public.family_memorials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own family memorials"
ON public.family_memorials FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. BẢNG DANH SÁCH TỰ VIỆN YÊU THÍCH (TEMPLE BOOKMARKS)
CREATE TABLE IF NOT EXISTS public.temple_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    temple_id TEXT NOT NULL,              -- tu-quang, bao-lam, thanh-luong, v.v.
    temple_name TEXT NOT NULL,
    notes TEXT,                           -- Cảm nhận, ghi chú riêng của Phật tử
    visited_at TIMESTAMPTZ,               -- Lần ghé thăm gần nhất
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_temple_bookmarks_user ON public.temple_bookmarks(user_id);

ALTER TABLE public.temple_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their temple bookmarks"
ON public.temple_bookmarks FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. BẢNG ĐĂNG KÝ NHẮC KHÓA TU BÁT QUAN TRAI (RETREAT REMINDERS)
CREATE TABLE IF NOT EXISTS public.buddhist_retreat_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    temple_id TEXT NOT NULL,
    retreat_type TEXT DEFAULT 'Bát Quan Trai',
    schedule_description TEXT,            -- Ví dụ: Ngày 14 Âm lịch hàng tháng
    phone_reminder TEXT,                  -- Số điện thoại nhận tin nhắn nhắc (cho mẹ)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.buddhist_retreat_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage retreat reminders"
ON public.buddhist_retreat_reminders FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
