import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Timestamp = bigint;
export interface Tenant {
    id: TenantId;
    exitReason?: string;
    name: string;
    checkInDate: Timestamp;
    idProof: string;
    isActive: boolean;
    advancePaid: bigint;
    bedId: BedId;
    phone: string;
    monthlyRent: bigint;
    roomId: RoomId;
    riskLevel: RiskLevel;
}
export interface UpdateRoomArgs {
    id: RoomId;
    floor: bigint;
    isAC: boolean;
    number: string;
    capacity: bigint;
}
export type GuestLogId = bigint;
export interface ToggleMealArgs {
    date: Timestamp;
    chargePerDay: bigint;
    tenantId: TenantId;
    isEating: boolean;
}
export type RoomId = bigint;
export interface Room {
    id: RoomId;
    floor: bigint;
    isAC: boolean;
    number: string;
    capacity: bigint;
}
export interface MicroCharge {
    id: MicroChargeId;
    description: string;
    tenantId: TenantId;
    addedAt: Timestamp;
    amount: bigint;
    addedToRent: boolean;
}
export interface GuestLog {
    id: GuestLogId;
    checkIn: Timestamp;
    guestName: string;
    tenantId: TenantId;
    checkOut: Timestamp;
    extraCharge: bigint;
}
export type MealRecordId = bigint;
export type StaffTaskId = bigint;
export interface StaffTask {
    id: StaffTaskId;
    status: TaskStatus;
    title: string;
    assignedTo: string;
    dueDate: Timestamp;
}
export interface AddTenantArgs {
    name: string;
    checkInDate: Timestamp;
    idProof: string;
    advancePaid: bigint;
    bedId: BedId;
    phone: string;
    monthlyRent: bigint;
    roomId: RoomId;
    riskLevel: RiskLevel;
}
export type MicroChargeId = bigint;
export interface AddParcelArgs {
    description: string;
    tenantId: TenantId;
}
export interface MealRecord {
    id: MealRecordId;
    date: Timestamp;
    chargePerDay: bigint;
    tenantId: TenantId;
    isEating: boolean;
}
export interface AddPaymentArgs {
    status: PaymentStatus;
    method?: PaymentMethod;
    month: bigint;
    year: bigint;
    tenantId: TenantId;
    paidDate?: Timestamp;
    amount: bigint;
}
export interface AddStaffTaskArgs {
    title: string;
    assignedTo: string;
    dueDate: Timestamp;
}
export interface Parcel {
    id: ParcelId;
    description: string;
    isCollected: boolean;
    tenantId: TenantId;
    receivedAt: Timestamp;
}
export type TenantId = bigint;
export type BedId = bigint;
export interface AddRoomArgs {
    floor: bigint;
    isAC: boolean;
    number: string;
    capacity: bigint;
}
export interface UpdateTenantArgs {
    id: TenantId;
    exitReason?: string;
    name: string;
    checkInDate: Timestamp;
    idProof: string;
    isActive: boolean;
    advancePaid: bigint;
    bedId: BedId;
    phone: string;
    monthlyRent: bigint;
    roomId: RoomId;
    riskLevel: RiskLevel;
}
export interface AddExpenseArgs {
    month: bigint;
    year: bigint;
    splitType: SplitType;
    notes: string;
    category: ExpenseCategory;
    amount: bigint;
}
export type ParcelId = bigint;
export interface Payment {
    id: PaymentId;
    status: PaymentStatus;
    method?: PaymentMethod;
    month: bigint;
    year: bigint;
    tenantId: TenantId;
    paidDate?: Timestamp;
    amount: bigint;
}
export interface Expense {
    id: ExpenseId;
    month: bigint;
    year: bigint;
    splitType: SplitType;
    notes: string;
    category: ExpenseCategory;
    amount: bigint;
}
export interface DashboardStats {
    pendingPayments: bigint;
    totalExpensesThisMonth: bigint;
    occupiedBeds: bigint;
    totalBeds: bigint;
    totalTenants: bigint;
    activeTenants: bigint;
    highRiskTenants: bigint;
    overduePayments: bigint;
    openComplaints: bigint;
    paidPayments: bigint;
    totalRooms: bigint;
}
export interface AddGuestLogArgs {
    checkIn: Timestamp;
    guestName: string;
    tenantId: TenantId;
    checkOut: Timestamp;
    extraCharge: bigint;
}
export interface AddMicroChargeArgs {
    description: string;
    tenantId: TenantId;
    amount: bigint;
}
export type PaymentId = bigint;
export interface Complaint {
    id: ComplaintId;
    status: ComplaintStatus;
    createdAt: Timestamp;
    description: string;
    tenantId: TenantId;
    category: ComplaintCategory;
}
export type ExpenseId = bigint;
export type ComplaintId = bigint;
export interface Bed {
    id: BedId;
    bedLabel: string;
    tenantId?: TenantId;
    isOccupied: boolean;
    roomId: RoomId;
}
export interface AddComplaintArgs {
    description: string;
    tenantId: TenantId;
    category: ComplaintCategory;
}
export enum ComplaintCategory {
    cleaning = "cleaning",
    other = "other",
    electricity = "electricity",
    water = "water"
}
export enum ComplaintStatus {
    resolved = "resolved",
    open = "open"
}
export enum ExpenseCategory {
    other = "other",
    electricity = "electricity",
    generator = "generator",
    maintenance = "maintenance"
}
export enum PaymentMethod {
    upi = "upi",
    cash = "cash"
}
export enum PaymentStatus {
    pending = "pending",
    paid = "paid",
    overdue = "overdue"
}
export enum RiskLevel {
    low = "low",
    high = "high",
    medium = "medium"
}
export enum SplitType {
    equal = "equal",
    weighted = "weighted"
}
export enum TaskStatus {
    pending = "pending",
    done = "done"
}
export interface backendInterface {
    addComplaint(args: AddComplaintArgs): Promise<Complaint>;
    addExpense(args: AddExpenseArgs): Promise<Expense>;
    addGuestLog(args: AddGuestLogArgs): Promise<GuestLog>;
    addMicroCharge(args: AddMicroChargeArgs): Promise<MicroCharge>;
    addParcel(args: AddParcelArgs): Promise<Parcel>;
    addPayment(args: AddPaymentArgs): Promise<Payment>;
    addRoom(args: AddRoomArgs): Promise<Room>;
    addStaffTask(args: AddStaffTaskArgs): Promise<StaffTask>;
    addTenant(args: AddTenantArgs): Promise<Tenant>;
    assignBed(bedId: BedId, tenantId: TenantId | null): Promise<boolean>;
    calculateMonthlyMessCharge(tenantId: TenantId, month: bigint, year: bigint): Promise<bigint>;
    collectParcel(id: ParcelId): Promise<boolean>;
    computeRiskLevel(id: TenantId, latePaymentCount: bigint, complaintCount: bigint): Promise<boolean>;
    deleteTenant(id: TenantId, exitReason: string | null): Promise<boolean>;
    freeBed(bedId: BedId): Promise<boolean>;
    generateMonthlyPayments(month: bigint, year: bigint): Promise<Array<Payment>>;
    getBeds(): Promise<Array<Bed>>;
    getComplaints(): Promise<Array<Complaint>>;
    getComplaintsByTenant(tenantId: TenantId): Promise<Array<Complaint>>;
    getDashboardStats(): Promise<DashboardStats>;
    getExpenses(): Promise<Array<Expense>>;
    getExpensesByMonth(month: bigint, year: bigint): Promise<Array<Expense>>;
    getGuestLogs(): Promise<Array<GuestLog>>;
    getGuestLogsByTenant(tenantId: TenantId): Promise<Array<GuestLog>>;
    getInactiveTenants(): Promise<Array<Tenant>>;
    getMealRecords(): Promise<Array<MealRecord>>;
    getMealRecordsByTenant(tenantId: TenantId): Promise<Array<MealRecord>>;
    getMicroCharges(): Promise<Array<MicroCharge>>;
    getOpenComplaints(): Promise<Array<Complaint>>;
    getParcels(): Promise<Array<Parcel>>;
    getPayments(): Promise<Array<Payment>>;
    getPaymentsByMonth(month: bigint, year: bigint): Promise<Array<Payment>>;
    getPaymentsByTenant(tenantId: TenantId): Promise<Array<Payment>>;
    getPendingMicroCharges(): Promise<Array<MicroCharge>>;
    getPendingTasks(): Promise<Array<StaffTask>>;
    getRooms(): Promise<Array<Room>>;
    getStaffTasks(): Promise<Array<StaffTask>>;
    getTenants(): Promise<Array<Tenant>>;
    getUncollectedParcels(): Promise<Array<Parcel>>;
    getWhatsAppConfigured(): Promise<boolean>;
    markChargeAddedToRent(id: MicroChargeId): Promise<boolean>;
    sendWhatsAppReminder(tenantPhone: string, tenantName: string, amount: bigint, month: string): Promise<{
        ok: boolean;
        message: string;
    }>;
    setWhatsAppConfig(phoneNumberId: string, accessToken: string): Promise<boolean>;
    toggleMeal(args: ToggleMealArgs): Promise<MealRecord>;
    updateComplaintStatus(id: ComplaintId, status: ComplaintStatus): Promise<boolean>;
    updatePaymentStatus(id: PaymentId, status: PaymentStatus, method: PaymentMethod | null, paidDate: Timestamp | null): Promise<boolean>;
    updateRiskLevel(id: TenantId, riskLevel: RiskLevel): Promise<boolean>;
    updateRoom(args: UpdateRoomArgs): Promise<boolean>;
    updateTaskStatus(id: StaffTaskId, status: TaskStatus): Promise<boolean>;
    updateTenant(args: UpdateTenantArgs): Promise<boolean>;
}
