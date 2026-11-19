export type RoleCode = 
  | 'SUPER_ADMIN'
  | 'PENDETA'
  | 'SEKRETARIS'
  | 'BENDAHARA'
  | 'KETUA_DEPARTEMEN'
  | 'PENGURUS_DEPARTEMEN';

export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type MemberStatus = 'ACTIVE' | 'INACTIVE' | 'MOVED' | 'DECEASED';
export type Gender = 'L' | 'P';
export type FamilyRelation = 'KEPALA_KELUARGA' | 'ISTRI' | 'ANAK' | 'ORANG_TUA' | 'FAMILI_LAIN';
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type TransactionStatus = 'RECORDED' | 'VERIFIED' | 'REVERSED';
export type RecordingType = 'COLLECTIVE' | 'INDIVIDUAL';
export type OfferingType = 
  | 'PERSEMBAHAN_UMUM'
  | 'PERPULUHAN'
  | 'PEMBANGUNAN'
  | 'MISI'
  | 'KHUSUS'
  | 'DONASI'
  | 'LAINNYA';

export type WorkProgramStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
export type DiakoniaStatus = 'SUBMITTED' | 'VERIFIED' | 'APPROVED' | 'REJECTED' | 'DISTRIBUTED';
export type InventoryCondition = 'BAIK' | 'RUSAK_RINGAN' | 'RUSAK_BERAT';
export type InventoryStatus = 'AVAILABLE' | 'BORROWED' | 'IN_MAINTENANCE' | 'DISPOSED';
export type LoanStatus = 'BORROWED' | 'RETURNED' | 'OVERDUE';

export interface Church {
  id: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  church_id: string;
  role_id: string;
  role_code: RoleCode;
  role_name: string;
  department_id?: string; // For Ketua / Pengurus Departemen
  department_name?: string;
  member_id?: string;
  username: string;
  email: string;
  password?: string;
  full_name: string;
  avatar_url?: string;
  status: UserStatus;
  last_login_at?: string;
}

export interface Member {
  id: string;
  church_id: string;
  family_id?: string;
  family_number?: string;
  family_name?: string;
  member_number: string; // e.g., JMT-2026-0001
  full_name: string;
  gender: Gender;
  pob: string;
  dob: string;
  phone: string;
  email: string;
  address: string;
  join_date: string;
  status: MemberStatus;
  occupation?: string;
  education?: string;
  family_relation: FamilyRelation;
  photo_url?: string;
  notes?: string;
  is_confidential_notes?: boolean;
  departments?: MemberDepartmentBrief[];
  created_at: string;
  updated_at: string;
}

export interface MemberDepartmentBrief {
  department_id: string;
  department_name: string;
  position_name: string;
  joined_at: string;
  status: string;
}

export interface Family {
  id: string;
  church_id: string;
  family_number: string; // e.g., KK-2026-0001
  family_name: string;
  head_member_id?: string;
  head_member_name?: string;
  spouse_member_id?: string;
  spouse_member_name?: string;
  address: string;
  phone: string;
  rt_rw?: string;
  city: string;
  postal_code?: string;
  status: 'ACTIVE' | 'ARCHIVED';
  members_count?: number;
  members?: Member[];
  created_at: string;
  updated_at: string;
}

export interface MemberDocument {
  id: string;
  member_id: string;
  title: string;
  document_type: string;
  file_url: string;
  file_size?: number;
  uploaded_at: string;
}

export interface MemberHistory {
  id: string;
  member_id: string;
  change_type: string;
  old_value: string;
  new_value: string;
  reason?: string;
  changed_by: string;
  created_at: string;
}

export interface Department {
  id: string;
  church_id: string;
  code: string;
  name: string;
  description: string;
  category: 'KOMISI' | 'PELAYANAN' | 'BIDANG';
  leader_member_id?: string;
  leader_member_name?: string;
  members_count?: number;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

export interface DepartmentPosition {
  id: string;
  department_id: string;
  name: string;
  order_index: number;
}

export interface DepartmentMember {
  id: string;
  department_id: string;
  department_name?: string;
  member_id: string;
  member_name?: string;
  member_number?: string;
  position_id?: string;
  position_name?: string;
  joined_at: string;
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string;
}

export interface FinancialAccount {
  id: string;
  church_id: string;
  account_number: string;
  account_name: string;
  account_type: 'CASH' | 'BANK';
  initial_balance: number;
  current_balance: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface FinancialCategory {
  id: string;
  church_id: string;
  code: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  is_system?: boolean;
}

export interface FinancialTransaction {
  id: string;
  church_id: string;
  transaction_number: string; // TRX-2026-0001
  transaction_date: string;
  type: TransactionType;
  category_id?: string;
  category_name?: string;
  account_id: string;
  account_name?: string;
  destination_account_id?: string;
  destination_account_name?: string;
  amount: number;
  payment_method: 'CASH' | 'TRANSFER' | 'QRIS' | 'GIRO';
  recording_type: RecordingType;
  member_id?: string;
  member_name?: string;
  member_number?: string;
  offering_type?: OfferingType;
  recipient_name?: string;
  description: string;
  receipt_url?: string;
  is_confidential: boolean;
  status: TransactionStatus;
  reversal_reason?: string;
  reversed_at?: string;
  reversed_by?: string;
  created_by: string;
  created_by_name?: string;
  created_at: string;
}

export interface Budget {
  id: string;
  church_id: string;
  year: number;
  title: string;
  total_budget: number;
  status: 'DRAFT' | 'APPROVED' | 'ACTIVE' | 'CLOSED';
  created_at: string;
  details?: BudgetDetail[];
}

export interface BudgetDetail {
  id: string;
  budget_id: string;
  department_id?: string;
  department_name?: string;
  category_id?: string;
  category_name?: string;
  allocated_amount: number;
  realized_amount: number;
  month?: number;
}

export interface WorkProgram {
  id: string;
  church_id: string;
  department_id: string;
  department_name?: string;
  title: string;
  description: string;
  target_audience: string;
  pic_member_id?: string;
  pic_member_name?: string;
  period_type: 'ANNUAL' | 'MONTHLY';
  year: number;
  month?: number;
  budget_allocated: number;
  budget_spent: number;
  status: WorkProgramStatus;
  results?: string;
  documentation_url?: string;
  created_by: string;
  created_at: string;
}

export interface ChurchEvent {
  id: string;
  church_id: string;
  work_program_id?: string;
  department_id?: string;
  department_name?: string;
  title: string;
  category: string;
  start_time: string;
  end_time?: string;
  location: string;
  pic_member_id?: string;
  pic_member_name?: string;
  budget: number;
  description: string;
  status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
}

export interface DiakoniaRequest {
  id: string;
  church_id: string;
  request_number: string; // DIA-2026-0001
  member_id?: string;
  recipient_name: string;
  request_date: string;
  category: string;
  description: string;
  urgency_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requested_amount: number;
  status: DiakoniaStatus;
  verification_notes?: string;
  approved_by?: string;
  approved_by_name?: string;
  is_confidential: boolean;
  created_by: string;
  created_at: string;
  distributions?: DiakoniaDistribution[];
}

export interface DiakoniaDistribution {
  id: string;
  request_id: string;
  distribution_date: string;
  aid_type: 'CASH' | 'GOODS' | 'SERVICES';
  amount_value: number;
  details: string;
  pic_member_id?: string;
  pic_member_name?: string;
  documentation_url?: string;
  created_at: string;
}

export interface InventoryCategory {
  id: string;
  church_id: string;
  code: string;
  name: string;
}

export interface InventoryItem {
  id: string;
  church_id: string;
  category_id?: string;
  category_name?: string;
  item_code: string; // AST-2026-0001
  name: string;
  quantity: number;
  unit: string;
  purchase_date: string;
  purchase_price: number;
  condition: InventoryCondition;
  location: string;
  pic_member_id?: string;
  pic_member_name?: string;
  photo_url?: string;
  status: InventoryStatus;
  created_at: string;
}

export interface InventoryLoan {
  id: string;
  item_id: string;
  item_name?: string;
  item_code?: string;
  borrower_name: string;
  borrower_phone?: string;
  borrow_date: string;
  expected_return_date: string;
  actual_return_date?: string;
  quantity: number;
  purpose: string;
  status: LoanStatus;
  notes?: string;
  created_at: string;
}

export interface InventoryMaintenance {
  id: string;
  item_id: string;
  item_name?: string;
  maintenance_date: string;
  description: string;
  cost: number;
  performed_by: string;
  status: 'SCHEDULED' | 'COMPLETED';
  notes?: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  church_id: string;
  title: string;
  content: string;
  attachment_url?: string;
  target_audience: 'ALL' | 'JEMAAT' | 'PENGURUS' | 'DEPARTEMEN';
  department_id?: string;
  department_name?: string;
  publish_date: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  created_by_name?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  church_id: string;
  user_id?: string;
  user_name: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'REVERSE' | 'APPROVE' | 'LOGIN' | 'LOGOUT' | 'EXPORT';
  module: string;
  record_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}
