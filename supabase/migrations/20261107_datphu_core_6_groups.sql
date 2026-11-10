-- ============================================================================
-- ĐẤT PHÚ CORE (2026 - 2027) - SUPABASE CLOUD SQL MIGRATION
-- Mô hình dữ liệu chuẩn hóa 6 Nhóm Bảng Cốt Lõi (6K Kín Kẽ OS)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- NHÓM 1: THỢ 6K TUY HÒA & TỒN KHO VẬT TƯ LƯU ĐỘNG TRÊN XE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.workers_6k (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_code VARCHAR(20) UNIQUE NOT NULL, -- 'THO-01' .. 'THO-05'
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    cccd_hash VARCHAR(64) NOT NULL,
    tax_code VARCHAR(20),
    primary_trade VARCHAR(50) NOT NULL,      -- 'DIEN_NUOC', 'DIEN_LANH', 'MO_KHOA', 'DEN_NLMT', 'CHONG_THAM'
    trade_label VARCHAR(120) NOT NULL,
    operating_ward VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE'
        CHECK (status IN ('AVAILABLE', 'ON_CALL', 'BUSY_K3', 'OFFLINE')),
    rating_avg NUMERIC(3,2) DEFAULT 5.00,
    completed_jobs_count INT DEFAULT 0,
    experience_years INT DEFAULT 5,
    portfolio_bio TEXT,
    self_published_inspection_fee NUMERIC(14,2) NOT NULL DEFAULT 0,
    self_published_inspection_note VARCHAR(255) DEFAULT '0đ (Thợ tự công bố)',
    base_fee NUMERIC(14,2) NOT NULL DEFAULT 100000,
    self_published_rate_card JSONB DEFAULT '[]'::jsonb, -- Biểu phí cá nhân do chính Thợ tự niêm yết (Sàn không can thiệp giá)
    pricing_updated_at TIMESTAMPTZ DEFAULT now(),
    last_lat DOUBLE PRECISION NOT NULL,
    last_lng DOUBLE PRECISION NOT NULL,
    bank_bin VARCHAR(10) DEFAULT '970422',
    bank_account_no VARCHAR(30),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.worker_vehicle_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES public.workers_6k(id) ON DELETE CASCADE,
    sku_code VARCHAR(40) NOT NULL,
    item_name VARCHAR(150) NOT NULL,
    qty_on_vehicle NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (qty_on_vehicle >= 0),
    qty_reserved NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (qty_reserved >= 0),
    unit VARCHAR(20) NOT NULL,
    unit_price NUMERIC(14,2) NOT NULL,
    last_restocked_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (worker_id, sku_code)
);

-- ============================================================================
-- NHÓM 2: QUẦY SỐ ĐỊA PHƯƠNG & DANH MỤC VẬT TƯ CHÍNH HÃNG
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.digital_booths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booth_code VARCHAR(20) UNIQUE NOT NULL,  -- 'QUAY-TH-01'
    booth_name VARCHAR(150) NOT NULL,
    business_license_no VARCHAR(50),
    tax_code VARCHAR(20) NOT NULL,
    owner_name VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    einvoice_provider VARCHAR(30) DEFAULT 'VNPT_INVOICE',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.booth_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booth_id UUID NOT NULL REFERENCES public.digital_booths(id) ON DELETE CASCADE,
    sku_code VARCHAR(40) UNIQUE NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    listed_price NUMERIC(14,2) NOT NULL CHECK (listed_price >= 0),
    vat_rate NUMERIC(4,2) NOT NULL DEFAULT 8.00,
    stock_qty NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
    warranty_months INT NOT NULL DEFAULT 12,
    is_emergency_part BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- NHÓM 3: ĐIỀU PHỐI CỨU HỘ 15 PHÚT & NHẬT KÝ KIỂM TOÁN 6K
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.dispatch_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_code VARCHAR(20) UNIQUE NOT NULL, -- 'YC-2001'
    urgency_level VARCHAR(20) NOT NULL DEFAULT 'SOS_15M'
        CHECK (urgency_level IN ('SOS_15M', 'STANDARD', 'SCHEDULED')),
    customer_name VARCHAR(120) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_address TEXT NOT NULL,
    customer_lat DOUBLE PRECISION,
    customer_lng DOUBLE PRECISION,
    issue_description TEXT NOT NULL,
    assigned_worker_id UUID REFERENCES public.workers_6k(id),
    current_k_stage VARCHAR(5) NOT NULL DEFAULT 'K1'
        CHECK (current_k_stage IN ('K1', 'K2', 'K3', 'K4', 'K5', 'K6')),
    sla_deadline_at TIMESTAMPTZ NOT NULL,
    worker_arrived_at TIMESTAMPTZ,
    labor_fee NUMERIC(14,2) NOT NULL DEFAULT 0,
    parts_fee NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(14,2) GENERATED ALWAYS AS (labor_fee + parts_fee) STORED,
    source_channel VARCHAR(20) NOT NULL DEFAULT 'PORTAL_20KB',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.k6_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_code VARCHAR(20) NOT NULL,
    from_stage VARCHAR(5),
    to_stage VARCHAR(5) NOT NULL CHECK (to_stage IN ('K1', 'K2', 'K3', 'K4', 'K5', 'K6')),
    actor_role VARCHAR(30) NOT NULL,
    actor_id VARCHAR(64),
    evidence_urls TEXT[] DEFAULT '{}',
    gps_lat DOUBLE PRECISION,
    gps_lng DOUBLE PRECISION,
    note TEXT,
    prev_hash VARCHAR(64),
    record_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- NHÓM 4: ĐƠN HÀNG SÀN DÂN SINH & SỔ BẢO HÀNH SỐ K6
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.orders_dp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code VARCHAR(20) UNIQUE NOT NULL,  -- 'DP-1001'
    booking_status VARCHAR(20) NOT NULL DEFAULT 'scheduled'
        CHECK (booking_status IN ('scheduled', 'reminded_2h', 'in_progress', 'completed', 'cancelled')),
    service_title VARCHAR(200),
    booking_date DATE,
    booking_slot VARCHAR(50),                -- VD: 'Sáng (08:30 - 10:00)'
    reminder_2h_sent BOOLEAN DEFAULT false,
    customer_type VARCHAR(20) NOT NULL DEFAULT 'HOUSEHOLD'
        CHECK (customer_type IN ('HOUSEHOLD', 'B2B_CONTRACT')),
    payment_method VARCHAR(20) NOT NULL DEFAULT 'VIETQR'
        CHECK (payment_method IN ('VIETQR', 'B2B_DEBT')),
    booth_id UUID NOT NULL REFERENCES public.digital_booths(id),
    dispatch_ticket_id UUID REFERENCES public.dispatch_tickets(id),
    customer_name VARCHAR(120) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_tax_code VARCHAR(20),
    shipping_address TEXT NOT NULL,
    current_k_stage VARCHAR(5) NOT NULL DEFAULT 'K1'
        CHECK (current_k_stage IN ('K1', 'K2', 'K3', 'K4', 'K5', 'K6')),
    subtotal_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    vat_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    installation_fee NUMERIC(14,2) NOT NULL DEFAULT 0,
    grand_total NUMERIC(14,2) NOT NULL DEFAULT 0,
    payment_status VARCHAR(30) NOT NULL DEFAULT 'UNPAID'
        CHECK (payment_status IN ('UNPAID', 'PAID_VIETQR', 'B2B_CONTRACT_RECORDED', 'REFUNDED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders_dp(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.booth_products(id),
    fulfilled_from VARCHAR(20) NOT NULL DEFAULT 'BOOTH'
        CHECK (fulfilled_from IN ('BOOTH', 'WORKER_VEHICLE')),
    qty NUMERIC(10,2) NOT NULL CHECK (qty > 0),
    unit_price NUMERIC(14,2) NOT NULL,
    vat_rate NUMERIC(4,2) NOT NULL,
    line_total NUMERIC(14,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.digital_warranties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warranty_code VARCHAR(30) UNIQUE NOT NULL,
    order_id UUID REFERENCES public.orders_dp(id),
    ticket_id UUID REFERENCES public.dispatch_tickets(id),
    worker_id UUID REFERENCES public.workers_6k(id),
    customer_phone VARCHAR(20) NOT NULL,
    serial_or_scope TEXT NOT NULL,
    activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLAIMED', 'EXPIRED'))
);

-- ============================================================================
-- NHÓM 5: SỔ CÁI TÀI CHÍNH BÚT TOÁN KÉP, VIETQR NAPAS247 & HÓA ĐƠN ĐIỆN TỬ
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.financial_ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tx_group_id UUID NOT NULL,
    reference_code VARCHAR(20) NOT NULL,
    account_type VARCHAR(40) NOT NULL
        CHECK (account_type IN (
            'ESCROW_BANK_NAPAS',
            'B2B_ACCOUNTS_RECEIVABLE',
            'WORKER_PAYABLE',
            'BOOTH_PAYABLE',
            'TAX_WITHHOLDING_RESERVE',
            'PLATFORM_FEE_REVENUE',
            'COMMUNITY_RELIEF_FUND'
        )),
    account_owner_id VARCHAR(64),
    debit_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (debit_amount >= 0),
    credit_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (credit_amount >= 0),
    currency CHAR(3) NOT NULL DEFAULT 'VND',
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vietqr_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_code VARCHAR(20) NOT NULL,
    qr_trace_id VARCHAR(36) UNIQUE NOT NULL,
    bank_bin VARCHAR(10) NOT NULL DEFAULT '970422',
    virtual_account_no VARCHAR(35) NOT NULL,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    napas_ft_code VARCHAR(50) UNIQUE,
    webhook_payload JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'SUCCESS', 'EXPIRED', 'MISMATCH')),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.einvoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_code VARCHAR(20) UNIQUE NOT NULL,
    seller_booth_code VARCHAR(20),
    invoice_template_code VARCHAR(20) NOT NULL DEFAULT '1C26MTT',
    invoice_number VARCHAR(20),
    tax_authority_code VARCHAR(64),
    total_before_vat NUMERIC(14,2) NOT NULL,
    total_vat NUMERIC(14,2) NOT NULL,
    total_payment NUMERIC(14,2) NOT NULL,
    xml_storage_path TEXT,
    pdf_lookup_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ISSUED'
        CHECK (status IN ('ISSUING', 'ISSUED', 'TAX_ACCEPTED', 'ERROR')),
    issued_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- NHÓM 6: TRẠM CHUNG TAY CỘNG ĐỒNG 6K (CT-01)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.community_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_code VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    beneficiary_household VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_tasks_pledges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.community_campaigns(id) ON DELETE CASCADE,
    target_code VARCHAR(20) NOT NULL,
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('LABOR_SHIFT', 'MATERIAL_PLEDGE')),
    title VARCHAR(150) NOT NULL,
    required_qty NUMERIC(10,2) NOT NULL DEFAULT 1,
    fulfilled_qty NUMERIC(10,2) NOT NULL DEFAULT 0,
    contributors JSONB NOT NULL DEFAULT '[]'::jsonb,
    UNIQUE (campaign_id, target_code)
);

-- BẬT RLS & REALTIME CHO CÁC BẢNG TRỌNG YẾU
ALTER TABLE public.dispatch_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders_dp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.k6_audit_logs ENABLE ROW LEVEL SECURITY;
