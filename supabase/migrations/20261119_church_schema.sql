-- ==============================================================================
-- SISTEM INFORMASI GEREJA (CHURCH MANAGEMENT SYSTEM)
-- PostgreSQL / Supabase Migration Schema
-- Multi-Tenant Ready Architecture with Row Level Security (RLS)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. ENUM / DOMAIN TYPES
-- ------------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE member_status AS ENUM ('ACTIVE', 'INACTIVE', 'MOVED', 'DECEASED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE family_relation AS ENUM ('KEPALA_KELUARGA', 'ISTRI', 'ANAK', 'ORANG_TUA', 'FAMILI_LAIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('RECORDED', 'VERIFIED', 'REVERSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE work_program_status AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ONGOING', 'COMPLETED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE diakonia_status AS ENUM ('SUBMITTED', 'VERIFIED', 'APPROVED', 'REJECTED', 'DISTRIBUTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE inventory_condition AS ENUM ('BAIK', 'RUSAK_RINGAN', 'RUSAK_BERAT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE inventory_status AS ENUM ('AVAILABLE', 'BORROWED', 'IN_MAINTENANCE', 'DISPOSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 2. ORGANISASI & PENGGUNA
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS churches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(100),
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL, -- SUPER_ADMIN, PENDETA, SEKRETARIS, BENDAHARA, KETUA_DEPARTEMEN, PENGURUS_DEPARTEMEN
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL, -- view, create, edit, delete, approve, export
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(module, action)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY(role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    member_id UUID, -- Foreign Key to members added later
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    avatar_url TEXT,
    status user_status DEFAULT 'ACTIVE',
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_church ON users(church_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);

-- ------------------------------------------------------------------------------
-- 3. JEMAAT & KELUARGA
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS families (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    family_number VARCHAR(50) UNIQUE NOT NULL, -- KK-2026-0001
    family_name VARCHAR(200) NOT NULL,
    head_member_id UUID, -- Diisi setelah members ada
    spouse_member_id UUID,
    address TEXT,
    phone VARCHAR(50),
    rt_rw VARCHAR(50),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_families_church ON families(church_id);

CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    family_id UUID REFERENCES families(id) ON DELETE SET NULL,
    member_number VARCHAR(50) UNIQUE NOT NULL, -- JMT-2026-0001
    full_name VARCHAR(200) NOT NULL,
    gender VARCHAR(1) NOT NULL CHECK (gender IN ('L', 'P')),
    pob VARCHAR(100),
    dob DATE,
    phone VARCHAR(50),
    email VARCHAR(150),
    address TEXT,
    join_date DATE DEFAULT CURRENT_DATE,
    status member_status DEFAULT 'ACTIVE',
    occupation VARCHAR(100),
    education VARCHAR(100),
    family_relation family_relation DEFAULT 'KEPALA_KELUARGA',
    photo_url TEXT,
    notes TEXT,
    is_confidential_notes BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_members_church ON members(church_id);
CREATE INDEX IF NOT EXISTS idx_members_family ON members(family_id);
CREATE INDEX IF NOT EXISTS idx_members_number ON members(member_number);

-- Update Foreign Key Kepala Keluarga & Pasangan
ALTER TABLE families 
    ADD CONSTRAINT fk_families_head FOREIGN KEY (head_member_id) REFERENCES members(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_families_spouse FOREIGN KEY (spouse_member_id) REFERENCES members(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS member_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    document_type VARCHAR(100) NOT NULL, -- Baptis, Sidi, Nikah, KTP, KK, Sertifikat
    file_url TEXT NOT NULL,
    file_size INTEGER,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by UUID REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_member_documents_member ON member_documents(member_id);

CREATE TABLE IF NOT EXISTS member_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    change_type VARCHAR(100) NOT NULL, -- STATUS_CHANGE, ADDRESS_CHANGE, FAMILY_TRANSFER, EDIT
    old_value TEXT,
    new_value TEXT,
    reason TEXT,
    changed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_member_history_member ON member_history(member_id);

-- ------------------------------------------------------------------------------
-- 4. DEPARTEMEN & KOMISI
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'KOMISI', -- KOMISI, PELAYANAN, BIDANG
    leader_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(church_id, code)
);
CREATE INDEX IF NOT EXISTS idx_departments_church ON departments(church_id);

CREATE TABLE IF NOT EXISTS department_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- Ketua, Wakil Ketua, Sekretaris, Bendahara, Anggota
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_department_positions_dept ON department_positions(department_id);

CREATE TABLE IF NOT EXISTS department_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    position_id UUID REFERENCES department_positions(id) ON DELETE SET NULL,
    joined_at DATE DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(department_id, member_id)
);
CREATE INDEX IF NOT EXISTS idx_dept_members_dept ON department_members(department_id);
CREATE INDEX IF NOT EXISTS idx_dept_members_member ON department_members(member_id);

-- ------------------------------------------------------------------------------
-- 5. KEUANGAN GEREJA
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS financial_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    account_number VARCHAR(100) NOT NULL,
    account_name VARCHAR(200) NOT NULL, -- Kas Utama, Kas Operasional, Rekening BCA
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('CASH', 'BANK')),
    initial_balance NUMERIC(15, 2) DEFAULT 0.00,
    current_balance NUMERIC(15, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fin_accounts_church ON financial_accounts(church_id);

CREATE TABLE IF NOT EXISTS financial_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fin_categories_church ON financial_categories(church_id);

CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    transaction_number VARCHAR(100) UNIQUE NOT NULL, -- TRX-2026-0001
    transaction_date DATE NOT NULL,
    type transaction_type NOT NULL, -- INCOME, EXPENSE, TRANSFER
    category_id UUID REFERENCES financial_categories(id) ON DELETE SET NULL,
    account_id UUID NOT NULL REFERENCES financial_accounts(id) ON DELETE RESTRICT,
    destination_account_id UUID REFERENCES financial_accounts(id) ON DELETE RESTRICT, -- For TRANSFER
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(50) DEFAULT 'CASH', -- CASH, TRANSFER, QRIS, GIRO
    recording_type VARCHAR(50) DEFAULT 'COLLECTIVE', -- COLLECTIVE, INDIVIDUAL
    member_id UUID REFERENCES members(id) ON DELETE SET NULL, -- Only for individual offerings
    offering_type VARCHAR(100), -- PERSEMBAHAN_UMUM, PERPULUHAN, PEMBANGUNAN, MISI, KHUSUS, DONASI, LAINNYA
    recipient_name VARCHAR(200), -- For expenses
    description TEXT,
    receipt_url TEXT,
    is_confidential BOOLEAN DEFAULT FALSE, -- Confidential for individual tithing/offerings
    status transaction_status DEFAULT 'RECORDED',
    reversal_reason TEXT,
    reversed_at TIMESTAMPTZ,
    reversed_by UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fin_trans_church ON financial_transactions(church_id);
CREATE INDEX IF NOT EXISTS idx_fin_trans_date ON financial_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_fin_trans_account ON financial_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_fin_trans_member ON financial_transactions(member_id);

CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    total_budget NUMERIC(15, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'APPROVED',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(church_id, year)
);

CREATE TABLE IF NOT EXISTS budget_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    category_id UUID REFERENCES financial_categories(id) ON DELETE SET NULL,
    allocated_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    realized_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    month INTEGER, -- 1-12 or NULL for annual total
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_budget_details_budget ON budget_details(budget_id);

-- ------------------------------------------------------------------------------
-- 6. PROGRAM KERJA & KEGIATAN GEREJA
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS work_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_audience VARCHAR(200),
    pic_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    period_type VARCHAR(50) DEFAULT 'ANNUAL', -- ANNUAL, MONTHLY
    year INTEGER NOT NULL,
    month INTEGER,
    budget_allocated NUMERIC(15, 2) DEFAULT 0.00,
    budget_spent NUMERIC(15, 2) DEFAULT 0.00,
    status work_program_status DEFAULT 'APPROVED',
    results TEXT,
    documentation_url TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_work_programs_dept ON work_programs(department_id);

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    work_program_id UUID REFERENCES work_programs(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- IBADAH_RAYA, SEKOLAH_MINGGU, PERSEKUTUAN_DOA, LATIHAN_MUSIK, RAPAT, BAKSOS
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    location VARCHAR(255) NOT NULL,
    pic_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    budget NUMERIC(15, 2) DEFAULT 0.00,
    description TEXT,
    status VARCHAR(50) DEFAULT 'SCHEDULED', -- SCHEDULED, ONGOING, COMPLETED, CANCELLED
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_events_church ON events(church_id);
CREATE INDEX IF NOT EXISTS idx_events_time ON events(start_time);

CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    attachment_url TEXT,
    target_audience VARCHAR(50) DEFAULT 'ALL', -- ALL, JEMAAT, PENGURUS, DEPARTEMEN
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    publish_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'PUBLISHED', -- DRAFT, PUBLISHED, ARCHIVED
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_announcements_church ON announcements(church_id);

-- ------------------------------------------------------------------------------
-- 7. DIAKONIA (PELAYANAN SOSIAL & BANTUAN JEMAAT)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS diakonia_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    request_number VARCHAR(100) UNIQUE NOT NULL, -- DIA-2026-0001
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    recipient_name VARCHAR(200) NOT NULL,
    request_date DATE DEFAULT CURRENT_DATE,
    category VARCHAR(100) NOT NULL, -- BANTUAN_DUKA, BANTUAN_KESEHATAN, BANTUAN_PENDIDIKAN, SEMBAKO, LAINNYA
    description TEXT NOT NULL,
    urgency_level VARCHAR(50) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    requested_amount NUMERIC(15, 2) DEFAULT 0.00,
    status diakonia_status DEFAULT 'SUBMITTED',
    verification_notes TEXT,
    approved_by UUID REFERENCES users(id),
    is_confidential BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_diakonia_church ON diakonia_requests(church_id);

CREATE TABLE IF NOT EXISTS diakonia_distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES diakonia_requests(id) ON DELETE CASCADE,
    distribution_date DATE DEFAULT CURRENT_DATE,
    aid_type VARCHAR(50) NOT NULL, -- CASH, GOODS, SERVICES
    amount_value NUMERIC(15, 2) DEFAULT 0.00,
    details TEXT,
    pic_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    documentation_url TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_diakonia_dist_req ON diakonia_distributions(request_id);

-- ------------------------------------------------------------------------------
-- 8. INVENTARIS & ASET GEREJA
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    category_id UUID REFERENCES inventory_categories(id) ON DELETE SET NULL,
    item_code VARCHAR(100) UNIQUE NOT NULL, -- AST-2026-0001
    name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit VARCHAR(50) DEFAULT 'Unit',
    purchase_date DATE,
    purchase_price NUMERIC(15, 2) DEFAULT 0.00,
    condition inventory_condition DEFAULT 'BAIK',
    location VARCHAR(200) NOT NULL, -- Gedung Utama, Ruang Musik, Ruang Sekolah Minggu, Kantor, Gudang
    pic_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    photo_url TEXT,
    status inventory_status DEFAULT 'AVAILABLE',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inventory_church ON inventory_items(church_id);
CREATE INDEX IF NOT EXISTS idx_inventory_code ON inventory_items(item_code);

CREATE TABLE IF NOT EXISTS inventory_loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    borrower_name VARCHAR(200) NOT NULL,
    borrower_phone VARCHAR(50),
    borrow_date DATE DEFAULT CURRENT_DATE,
    expected_return_date DATE,
    actual_return_date DATE,
    quantity INTEGER DEFAULT 1,
    purpose TEXT,
    status VARCHAR(50) DEFAULT 'BORROWED', -- BORROWED, RETURNED, OVERDUE
    notes TEXT,
    recorded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inventory_loans_item ON inventory_loans(item_id);

CREATE TABLE IF NOT EXISTS inventory_maintenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    maintenance_date DATE DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    cost NUMERIC(15, 2) DEFAULT 0.00,
    performed_by VARCHAR(200),
    status VARCHAR(50) DEFAULT 'COMPLETED', -- SCHEDULED, COMPLETED
    notes TEXT,
    recorded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inventory_maint_item ON inventory_maintenance(item_id);

-- ------------------------------------------------------------------------------
-- 9. AUDIT TRAILS & ACTIVITY LOG
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(150),
    action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, REVERSE, APPROVE, LOGIN
    module VARCHAR(100) NOT NULL, -- JEMAAT, KELUARGA, KEUANGAN, DEPARTEMEN, PROGRAM_KERJA, INVENTARIS, DIAKONIA
    record_id VARCHAR(100),
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_church ON audit_logs(church_id);
CREATE INDEX IF NOT EXISTS idx_audit_module ON audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- ------------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) POLICIES FOR SUPABASE / POSTGRESQL
-- ------------------------------------------------------------------------------
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE diakonia_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_current_user_role() 
RETURNS VARCHAR AS $$
    SELECT r.code 
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- RLS Policy: Confidential Financial Transactions (Individual offerings / tithes)
CREATE POLICY financial_confidentiality_policy ON financial_transactions
    FOR ALL
    USING (
        -- Non-confidential transactions can be seen according to standard permissions
        (is_confidential = FALSE AND get_current_user_role() IN ('SUPER_ADMIN', 'PENDETA', 'BENDAHARA'))
        OR
        -- Confidential individual offerings can ONLY be viewed by Super Admin and Bendahara
        (is_confidential = TRUE AND get_current_user_role() IN ('SUPER_ADMIN', 'BENDAHARA'))
    );

-- RLS Policy: Diakonia Social Aid Confidentiality
CREATE POLICY diakonia_confidentiality_policy ON diakonia_requests
    FOR ALL
    USING (
        get_current_user_role() IN ('SUPER_ADMIN', 'PENDETA')
        OR
        -- Diakonia team coordinator can also access
        (get_current_user_role() = 'KETUA_DEPARTEMEN')
    );
