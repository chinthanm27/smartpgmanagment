import Common "common";

module {
  public type Complaint = {
    id : Common.ComplaintId;
    tenantId : Common.TenantId;
    category : Common.ComplaintCategory;
    description : Text;
    status : Common.ComplaintStatus;
    createdAt : Common.Timestamp;
  };

  public type Expense = {
    id : Common.ExpenseId;
    category : Common.ExpenseCategory;
    amount : Nat;
    month : Nat;
    year : Nat;
    notes : Text;
    splitType : Common.SplitType;
  };

  public type MealRecord = {
    id : Common.MealRecordId;
    tenantId : Common.TenantId;
    date : Common.Timestamp;
    isEating : Bool;
    chargePerDay : Nat;
  };

  public type StaffTask = {
    id : Common.StaffTaskId;
    title : Text;
    assignedTo : Text;
    status : Common.TaskStatus;
    dueDate : Common.Timestamp;
  };

  public type Parcel = {
    id : Common.ParcelId;
    tenantId : Common.TenantId;
    description : Text;
    receivedAt : Common.Timestamp;
    isCollected : Bool;
  };

  public type MicroCharge = {
    id : Common.MicroChargeId;
    tenantId : Common.TenantId;
    description : Text;
    amount : Nat;
    addedAt : Common.Timestamp;
    addedToRent : Bool;
  };

  public type GuestLog = {
    id : Common.GuestLogId;
    tenantId : Common.TenantId;
    guestName : Text;
    checkIn : Common.Timestamp;
    checkOut : Common.Timestamp;
    extraCharge : Nat;
  };

  public type AddComplaintArgs = {
    tenantId : Common.TenantId;
    category : Common.ComplaintCategory;
    description : Text;
  };

  public type AddExpenseArgs = {
    category : Common.ExpenseCategory;
    amount : Nat;
    month : Nat;
    year : Nat;
    notes : Text;
    splitType : Common.SplitType;
  };

  public type ToggleMealArgs = {
    tenantId : Common.TenantId;
    date : Common.Timestamp;
    isEating : Bool;
    chargePerDay : Nat;
  };

  public type AddStaffTaskArgs = {
    title : Text;
    assignedTo : Text;
    dueDate : Common.Timestamp;
  };

  public type AddParcelArgs = {
    tenantId : Common.TenantId;
    description : Text;
  };

  public type AddMicroChargeArgs = {
    tenantId : Common.TenantId;
    description : Text;
    amount : Nat;
  };

  public type AddGuestLogArgs = {
    tenantId : Common.TenantId;
    guestName : Text;
    checkIn : Common.Timestamp;
    checkOut : Common.Timestamp;
    extraCharge : Nat;
  };

  public type DashboardStats = {
    totalTenants : Nat;
    activeTenants : Nat;
    totalRooms : Nat;
    occupiedBeds : Nat;
    totalBeds : Nat;
    pendingPayments : Nat;
    overduePayments : Nat;
    paidPayments : Nat;
    openComplaints : Nat;
    totalExpensesThisMonth : Nat;
    highRiskTenants : Nat;
  };
};
