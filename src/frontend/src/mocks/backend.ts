import type { backendInterface } from "../backend";
import {
  ComplaintCategory,
  ComplaintStatus,
  ExpenseCategory,
  PaymentMethod,
  PaymentStatus,
  RiskLevel,
  SplitType,
  TaskStatus,
} from "../backend";

const now = BigInt(Date.now()) * BigInt(1_000_000);
const oneMonthAgo = now - BigInt(30) * BigInt(24 * 60 * 60) * BigInt(1_000_000_000);
const twoMonthsAgo = now - BigInt(60) * BigInt(24 * 60 * 60) * BigInt(1_000_000_000);
const threeMonthsAgo = now - BigInt(90) * BigInt(24 * 60 * 60) * BigInt(1_000_000_000);

// WhatsApp mock state (in-memory for dev mode)
let _whatsAppConfigured = false;
let _whatsAppPhoneId = "";
let _whatsAppToken = "";

export const mockBackend: backendInterface = {
  getDashboardStats: async () => ({
    pendingPayments: BigInt(3),
    totalExpensesThisMonth: BigInt(12500),
    occupiedBeds: BigInt(8),
    totalBeds: BigInt(12),
    totalTenants: BigInt(10),
    activeTenants: BigInt(8),
    highRiskTenants: BigInt(1),
    overduePayments: BigInt(2),
    openComplaints: BigInt(2),
    paidPayments: BigInt(5),
    totalRooms: BigInt(4),
  }),

  getTenants: async () => [
    {
      id: BigInt(1),
      name: "Rajan Kumar",
      phone: "9876543210",
      idProof: "AADHAR-1234",
      roomId: BigInt(1),
      bedId: BigInt(1),
      monthlyRent: BigInt(8000),
      advancePaid: BigInt(16000),
      checkInDate: oneMonthAgo,
      isActive: true,
      riskLevel: RiskLevel.low,
    },
    {
      id: BigInt(2),
      name: "Priya Nair",
      phone: "9988776655",
      idProof: "PAN-ABCD1234",
      roomId: BigInt(1),
      bedId: BigInt(2),
      monthlyRent: BigInt(8000),
      advancePaid: BigInt(8000),
      checkInDate: oneMonthAgo,
      isActive: true,
      riskLevel: RiskLevel.medium,
    },
    {
      id: BigInt(3),
      name: "Suresh Babu",
      phone: "9112233445",
      idProof: "AADHAR-5678",
      roomId: BigInt(2),
      bedId: BigInt(3),
      monthlyRent: BigInt(10000),
      advancePaid: BigInt(20000),
      checkInDate: oneMonthAgo,
      isActive: true,
      riskLevel: RiskLevel.high,
    },
    {
      id: BigInt(4),
      name: "Anjali Singh",
      phone: "9554433221",
      idProof: "AADHAR-9012",
      roomId: BigInt(2),
      bedId: BigInt(4),
      monthlyRent: BigInt(10000),
      advancePaid: BigInt(10000),
      checkInDate: oneMonthAgo,
      isActive: true,
      riskLevel: RiskLevel.low,
    },
    {
      id: BigInt(5),
      name: "Mohammed Irfan",
      phone: "9665544330",
      idProof: "DL-KA123456",
      roomId: BigInt(3),
      bedId: BigInt(5),
      monthlyRent: BigInt(7500),
      advancePaid: BigInt(15000),
      checkInDate: oneMonthAgo,
      isActive: true,
      riskLevel: RiskLevel.low,
    },
  ],

  getPayments: async () => {
    const d = new Date();
    const curMonth = BigInt(d.getMonth() + 1);
    const curYear = BigInt(d.getFullYear());
    const prevMonth = BigInt(d.getMonth() === 0 ? 12 : d.getMonth());
    const prevYear = BigInt(d.getMonth() === 0 ? d.getFullYear() - 1 : d.getFullYear());
    const prev2Month = BigInt(d.getMonth() <= 1 ? 12 - (1 - d.getMonth()) : d.getMonth() - 1);
    const prev2Year = BigInt(d.getMonth() <= 1 ? d.getFullYear() - 1 : d.getFullYear());

    return [
      // Current month
      { id: BigInt(1), tenantId: BigInt(1), amount: BigInt(8000), month: curMonth, year: curYear, status: PaymentStatus.paid, method: PaymentMethod.upi, paidDate: now },
      { id: BigInt(2), tenantId: BigInt(2), amount: BigInt(8000), month: curMonth, year: curYear, status: PaymentStatus.pending },
      { id: BigInt(3), tenantId: BigInt(3), amount: BigInt(10000), month: curMonth, year: curYear, status: PaymentStatus.overdue },
      { id: BigInt(4), tenantId: BigInt(4), amount: BigInt(10000), month: curMonth, year: curYear, status: PaymentStatus.paid, method: PaymentMethod.cash, paidDate: now },
      { id: BigInt(5), tenantId: BigInt(5), amount: BigInt(7500), month: curMonth, year: curYear, status: PaymentStatus.pending },
      // Previous month
      { id: BigInt(6), tenantId: BigInt(1), amount: BigInt(8000), month: prevMonth, year: prevYear, status: PaymentStatus.paid, method: PaymentMethod.upi, paidDate: oneMonthAgo },
      { id: BigInt(7), tenantId: BigInt(2), amount: BigInt(8000), month: prevMonth, year: prevYear, status: PaymentStatus.paid, method: PaymentMethod.cash, paidDate: oneMonthAgo },
      { id: BigInt(8), tenantId: BigInt(3), amount: BigInt(10000), month: prevMonth, year: prevYear, status: PaymentStatus.overdue },
      { id: BigInt(9), tenantId: BigInt(4), amount: BigInt(10000), month: prevMonth, year: prevYear, status: PaymentStatus.paid, method: PaymentMethod.upi, paidDate: oneMonthAgo },
      { id: BigInt(10), tenantId: BigInt(5), amount: BigInt(7500), month: prevMonth, year: prevYear, status: PaymentStatus.paid, method: PaymentMethod.upi, paidDate: oneMonthAgo },
      // 2 months ago
      { id: BigInt(11), tenantId: BigInt(1), amount: BigInt(8000), month: prev2Month, year: prev2Year, status: PaymentStatus.paid, method: PaymentMethod.upi, paidDate: twoMonthsAgo },
      { id: BigInt(12), tenantId: BigInt(2), amount: BigInt(8000), month: prev2Month, year: prev2Year, status: PaymentStatus.paid, method: PaymentMethod.cash, paidDate: twoMonthsAgo },
      { id: BigInt(13), tenantId: BigInt(3), amount: BigInt(10000), month: prev2Month, year: prev2Year, status: PaymentStatus.paid, method: PaymentMethod.upi, paidDate: twoMonthsAgo },
      { id: BigInt(14), tenantId: BigInt(4), amount: BigInt(10000), month: prev2Month, year: prev2Year, status: PaymentStatus.paid, method: PaymentMethod.upi, paidDate: twoMonthsAgo },
      { id: BigInt(15), tenantId: BigInt(5), amount: BigInt(7500), month: prev2Month, year: prev2Year, status: PaymentStatus.paid, method: PaymentMethod.cash, paidDate: threeMonthsAgo },
    ];
  },

  getPaymentsByMonth: async (_month, _year) => {
    const d = new Date();
    const curMonth = BigInt(d.getMonth() + 1);
    const curYear = BigInt(d.getFullYear());
    if (_month === curMonth && _year === curYear) {
      return [
        { id: BigInt(1), tenantId: BigInt(1), amount: BigInt(8000), month: curMonth, year: curYear, status: PaymentStatus.paid, method: PaymentMethod.upi, paidDate: now },
        { id: BigInt(2), tenantId: BigInt(2), amount: BigInt(8000), month: curMonth, year: curYear, status: PaymentStatus.pending },
        { id: BigInt(3), tenantId: BigInt(3), amount: BigInt(10000), month: curMonth, year: curYear, status: PaymentStatus.overdue },
        { id: BigInt(4), tenantId: BigInt(4), amount: BigInt(10000), month: curMonth, year: curYear, status: PaymentStatus.paid, method: PaymentMethod.cash, paidDate: now },
        { id: BigInt(5), tenantId: BigInt(5), amount: BigInt(7500), month: curMonth, year: curYear, status: PaymentStatus.pending },
      ];
    }
    return [];
  },

  getPaymentsByTenant: async (tenantId) => [
    { id: BigInt(1), tenantId, amount: BigInt(8000), month: BigInt(4), year: BigInt(2026), status: PaymentStatus.paid, method: PaymentMethod.upi, paidDate: now },
    { id: BigInt(6), tenantId, amount: BigInt(8000), month: BigInt(3), year: BigInt(2026), status: PaymentStatus.paid, method: PaymentMethod.upi, paidDate: oneMonthAgo },
    { id: BigInt(11), tenantId, amount: BigInt(8000), month: BigInt(2), year: BigInt(2026), status: PaymentStatus.paid, method: PaymentMethod.upi, paidDate: twoMonthsAgo },
  ],

  getComplaints: async () => [
    { id: BigInt(1), tenantId: BigInt(2), category: ComplaintCategory.electricity, description: "Light in room 101 is not working", status: ComplaintStatus.open, createdAt: now },
    { id: BigInt(2), tenantId: BigInt(4), category: ComplaintCategory.water, description: "Water supply issue in bathroom", status: ComplaintStatus.open, createdAt: now },
  ],

  getOpenComplaints: async () => [
    { id: BigInt(1), tenantId: BigInt(2), category: ComplaintCategory.electricity, description: "Light in room 101 is not working", status: ComplaintStatus.open, createdAt: now },
  ],

  getComplaintsByTenant: async (_tenantId) => [],

  getRooms: async () => [
    { id: BigInt(1), number: "101", floor: BigInt(1), isAC: false, capacity: BigInt(3) },
    { id: BigInt(2), number: "102", floor: BigInt(1), isAC: true, capacity: BigInt(3) },
    { id: BigInt(3), number: "201", floor: BigInt(2), isAC: false, capacity: BigInt(3) },
    { id: BigInt(4), number: "202", floor: BigInt(2), isAC: true, capacity: BigInt(3) },
  ],

  getBeds: async () => [
    { id: BigInt(1), bedLabel: "A", roomId: BigInt(1), isOccupied: true, tenantId: BigInt(1) },
    { id: BigInt(2), bedLabel: "B", roomId: BigInt(1), isOccupied: true, tenantId: BigInt(2) },
    { id: BigInt(3), bedLabel: "A", roomId: BigInt(2), isOccupied: true, tenantId: BigInt(3) },
    { id: BigInt(4), bedLabel: "B", roomId: BigInt(2), isOccupied: true, tenantId: BigInt(4) },
    { id: BigInt(5), bedLabel: "A", roomId: BigInt(3), isOccupied: true, tenantId: BigInt(5) },
    { id: BigInt(6), bedLabel: "B", roomId: BigInt(3), isOccupied: false },
    { id: BigInt(7), bedLabel: "A", roomId: BigInt(4), isOccupied: false },
    { id: BigInt(8), bedLabel: "B", roomId: BigInt(4), isOccupied: false },
  ],

  getExpenses: async () => {
    const d = new Date();
    const curMonth = BigInt(d.getMonth() + 1);
    const curYear = BigInt(d.getFullYear());
    const prevMonth = BigInt(d.getMonth() === 0 ? 12 : d.getMonth());
    const prevYear = BigInt(d.getMonth() === 0 ? d.getFullYear() - 1 : d.getFullYear());
    const prev2Month = BigInt(d.getMonth() <= 1 ? 12 - (1 - d.getMonth()) : d.getMonth() - 1);
    const prev2Year = BigInt(d.getMonth() <= 1 ? d.getFullYear() - 1 : d.getFullYear());

    return [
      { id: BigInt(1), category: ExpenseCategory.electricity, amount: BigInt(8500), month: curMonth, year: curYear, splitType: SplitType.weighted, notes: "Monthly EB bill" },
      { id: BigInt(2), category: ExpenseCategory.maintenance, amount: BigInt(2000), month: curMonth, year: curYear, splitType: SplitType.equal, notes: "Plumbing repair" },
      { id: BigInt(3), category: ExpenseCategory.generator, amount: BigInt(2000), month: curMonth, year: curYear, splitType: SplitType.equal, notes: "Generator fuel" },
      { id: BigInt(4), category: ExpenseCategory.electricity, amount: BigInt(7800), month: prevMonth, year: prevYear, splitType: SplitType.weighted, notes: "Monthly EB bill" },
      { id: BigInt(5), category: ExpenseCategory.maintenance, amount: BigInt(3500), month: prevMonth, year: prevYear, splitType: SplitType.equal, notes: "AC servicing" },
      { id: BigInt(6), category: ExpenseCategory.electricity, amount: BigInt(9200), month: prev2Month, year: prev2Year, splitType: SplitType.weighted, notes: "Monthly EB bill" },
      { id: BigInt(7), category: ExpenseCategory.generator, amount: BigInt(1800), month: prev2Month, year: prev2Year, splitType: SplitType.equal, notes: "Generator fuel" },
    ];
  },

  getExpensesByMonth: async (_month, _year) => [],

  getMealRecords: async () => [],
  getMealRecordsByTenant: async (_tenantId) => [],

  getStaffTasks: async () => [
    { id: BigInt(1), title: "Clean common area", assignedTo: "Cleaning Staff", dueDate: now, status: TaskStatus.pending },
    { id: BigInt(2), title: "Fix broken light - Room 101", assignedTo: "Electrician", dueDate: now, status: TaskStatus.pending },
  ],

  getPendingTasks: async () => [
    { id: BigInt(1), title: "Clean common area", assignedTo: "Cleaning Staff", dueDate: now, status: TaskStatus.pending },
  ],

  getParcels: async () => [
    { id: BigInt(1), tenantId: BigInt(1), description: "Amazon package", isCollected: false, receivedAt: now },
    { id: BigInt(2), tenantId: BigInt(3), description: "Flipkart delivery", isCollected: true, receivedAt: oneMonthAgo },
  ],

  getUncollectedParcels: async () => [
    { id: BigInt(1), tenantId: BigInt(1), description: "Amazon package", isCollected: false, receivedAt: now },
  ],

  getMicroCharges: async () => [],
  getPendingMicroCharges: async () => [],
  getGuestLogs: async () => [],
  getGuestLogsByTenant: async (_tenantId) => [],
  getInactiveTenants: async () => [],

  addTenant: async (args) => ({ id: BigInt(99), ...args, isActive: true, riskLevel: args.riskLevel }),
  updateTenant: async (_args) => true,
  deleteTenant: async (_id, _exitReason) => true,
  addRoom: async (args) => ({ id: BigInt(99), ...args }),
  updateRoom: async (_args) => true,
  addPayment: async (args) => ({ id: BigInt(99), ...args }),
  updatePaymentStatus: async (_id, _status, _method, _paidDate) => true,
  generateMonthlyPayments: async (_month, _year) => [],

  addComplaint: async (args) => ({ id: BigInt(99), ...args, status: ComplaintStatus.open, createdAt: now }),
  updateComplaintStatus: async (_id, _status) => true,

  addExpense: async (args) => ({ id: BigInt(99), ...args }),

  toggleMeal: async (args) => ({ id: BigInt(99), ...args }),
  calculateMonthlyMessCharge: async (_tenantId, _month, _year) => BigInt(0),

  addStaffTask: async (args) => ({ id: BigInt(99), ...args, status: TaskStatus.pending }),
  updateTaskStatus: async (_id, _status) => true,

  addParcel: async (args) => ({ id: BigInt(99), ...args, isCollected: false, receivedAt: now }),
  collectParcel: async (_id) => true,

  addMicroCharge: async (args) => ({ id: BigInt(99), ...args, addedAt: now, addedToRent: false }),
  markChargeAddedToRent: async (_id) => true,

  addGuestLog: async (args) => ({ id: BigInt(99), ...args }),

  assignBed: async (_bedId, _tenantId) => true,
  freeBed: async (_bedId) => true,
  computeRiskLevel: async (_id, _latePaymentCount, _complaintCount) => true,
  updateRiskLevel: async (_id, _riskLevel) => true,

  // ─── WhatsApp Methods ───────────────────────────────────────────────
  getWhatsAppConfigured: async () => _whatsAppConfigured,

  setWhatsAppConfig: async (phoneNumberId, accessToken) => {
    _whatsAppPhoneId = phoneNumberId;
    _whatsAppToken = accessToken;
    _whatsAppConfigured = true;
    return true;
  },

  sendWhatsAppReminder: async (tenantPhone, tenantName, amount, month) => {
    if (!_whatsAppConfigured) {
      return { ok: false, message: "WhatsApp not configured. Please set up your API credentials first." };
    }
    // Simulate delay
    await new Promise((r) => setTimeout(r, 800));
    console.log(`[Mock WhatsApp] Sending reminder to ${tenantName} (${tenantPhone}): ₹${Number(amount)} for ${month}. Phone ID: ${_whatsAppPhoneId}`);
    return {
      ok: true,
      message: `Reminder sent to ${tenantName} at ${tenantPhone}`,
    };
  },
};
