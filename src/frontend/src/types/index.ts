// Re-export backend types
export type {
  Tenant,
  Room,
  Bed,
  Payment,
  Complaint,
  Expense,
  MealRecord,
  StaffTask,
  Parcel,
  MicroCharge,
  GuestLog,
  DashboardStats,
  TenantId,
  RoomId,
  BedId,
  PaymentId,
  ComplaintId,
  ExpenseId,
  MealRecordId,
  StaffTaskId,
  ParcelId,
  MicroChargeId,
  GuestLogId,
  Timestamp,
  AddTenantArgs,
  UpdateTenantArgs,
  AddRoomArgs,
  UpdateRoomArgs,
  AddPaymentArgs,
  AddComplaintArgs,
  AddExpenseArgs,
  AddStaffTaskArgs,
  AddParcelArgs,
  AddGuestLogArgs,
  AddMicroChargeArgs,
  ToggleMealArgs,
} from "../backend";

export {
  RiskLevel,
  PaymentStatus,
  PaymentMethod,
  ComplaintCategory,
  ComplaintStatus,
  SplitType,
  TaskStatus,
  ExpenseCategory,
} from "../backend";

// UI-only types
export type NavItem = {
  label: string;
  path: string;
  icon: string;
};
