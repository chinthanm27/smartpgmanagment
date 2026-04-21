import List "mo:core/List";
import Common "../types/common";
import Ops "../types/operations";
import OpsLib "../lib/operations";
import TenantTypes "../types/tenant";
import PropertyTypes "../types/property";
import PaymentTypes "../types/payment";

mixin (
  complaints : List.List<Ops.Complaint>,
  expenses : List.List<Ops.Expense>,
  mealRecords : List.List<Ops.MealRecord>,
  staffTasks : List.List<Ops.StaffTask>,
  parcels : List.List<Ops.Parcel>,
  microCharges : List.List<Ops.MicroCharge>,
  guestLogs : List.List<Ops.GuestLog>,
  tenants : List.List<TenantTypes.Tenant>,
  rooms : List.List<PropertyTypes.Room>,
  beds : List.List<PropertyTypes.Bed>,
  payments : List.List<PaymentTypes.Payment>,
  nextComplaintId : { var val : Nat },
  nextExpenseId : { var val : Nat },
  nextMealRecordId : { var val : Nat },
  nextStaffTaskId : { var val : Nat },
  nextParcelId : { var val : Nat },
  nextMicroChargeId : { var val : Nat },
  nextGuestLogId : { var val : Nat },
) {
  // ── Complaints ──────────────────────────────────────────────────────────────

  public shared func addComplaint(args : Ops.AddComplaintArgs) : async Ops.Complaint {
    let complaint = OpsLib.addComplaint(complaints, nextComplaintId.val, args);
    nextComplaintId.val += 1;
    complaint;
  };

  public shared func updateComplaintStatus(id : Common.ComplaintId, status : Common.ComplaintStatus) : async Bool {
    OpsLib.updateComplaintStatus(complaints, id, status);
  };

  public query func getComplaints() : async [Ops.Complaint] {
    OpsLib.getComplaints(complaints);
  };

  public query func getComplaintsByTenant(tenantId : Common.TenantId) : async [Ops.Complaint] {
    OpsLib.getComplaintsByTenant(complaints, tenantId);
  };

  public query func getOpenComplaints() : async [Ops.Complaint] {
    OpsLib.getOpenComplaints(complaints);
  };

  // ── Expenses ─────────────────────────────────────────────────────────────────

  public shared func addExpense(args : Ops.AddExpenseArgs) : async Ops.Expense {
    let expense = OpsLib.addExpense(expenses, nextExpenseId.val, args);
    nextExpenseId.val += 1;
    expense;
  };

  public query func getExpenses() : async [Ops.Expense] {
    OpsLib.getExpenses(expenses);
  };

  public query func getExpensesByMonth(month : Nat, year : Nat) : async [Ops.Expense] {
    OpsLib.getExpensesByMonth(expenses, month, year);
  };

  // ── Meals ─────────────────────────────────────────────────────────────────────

  public shared func toggleMeal(args : Ops.ToggleMealArgs) : async Ops.MealRecord {
    let record = OpsLib.toggleMeal(mealRecords, nextMealRecordId.val, args);
    // Only bump id if a new record was created (id matches nextMealRecordId)
    if (record.id == nextMealRecordId.val) {
      nextMealRecordId.val += 1;
    };
    record;
  };

  public query func getMealRecords() : async [Ops.MealRecord] {
    OpsLib.getMealRecords(mealRecords);
  };

  public query func getMealRecordsByTenant(tenantId : Common.TenantId) : async [Ops.MealRecord] {
    OpsLib.getMealRecordsByTenant(mealRecords, tenantId);
  };

  public query func calculateMonthlyMessCharge(tenantId : Common.TenantId, month : Nat, year : Nat) : async Nat {
    OpsLib.calculateMonthlyMessCharge(mealRecords, tenantId, month, year);
  };

  // ── Staff Tasks ───────────────────────────────────────────────────────────────

  public shared func addStaffTask(args : Ops.AddStaffTaskArgs) : async Ops.StaffTask {
    let task = OpsLib.addStaffTask(staffTasks, nextStaffTaskId.val, args);
    nextStaffTaskId.val += 1;
    task;
  };

  public shared func updateTaskStatus(id : Common.StaffTaskId, status : Common.TaskStatus) : async Bool {
    OpsLib.updateTaskStatus(staffTasks, id, status);
  };

  public query func getStaffTasks() : async [Ops.StaffTask] {
    OpsLib.getStaffTasks(staffTasks);
  };

  public query func getPendingTasks() : async [Ops.StaffTask] {
    OpsLib.getPendingTasks(staffTasks);
  };

  // ── Parcels ───────────────────────────────────────────────────────────────────

  public shared func addParcel(args : Ops.AddParcelArgs) : async Ops.Parcel {
    let parcel = OpsLib.addParcel(parcels, nextParcelId.val, args);
    nextParcelId.val += 1;
    parcel;
  };

  public shared func collectParcel(id : Common.ParcelId) : async Bool {
    OpsLib.collectParcel(parcels, id);
  };

  public query func getParcels() : async [Ops.Parcel] {
    OpsLib.getParcels(parcels);
  };

  public query func getUncollectedParcels() : async [Ops.Parcel] {
    OpsLib.getUncollectedParcels(parcels);
  };

  // ── Micro-charges ─────────────────────────────────────────────────────────────

  public shared func addMicroCharge(args : Ops.AddMicroChargeArgs) : async Ops.MicroCharge {
    let charge = OpsLib.addMicroCharge(microCharges, nextMicroChargeId.val, args);
    nextMicroChargeId.val += 1;
    charge;
  };

  public shared func markChargeAddedToRent(id : Common.MicroChargeId) : async Bool {
    OpsLib.markChargeAddedToRent(microCharges, id);
  };

  public query func getMicroCharges() : async [Ops.MicroCharge] {
    OpsLib.getMicroCharges(microCharges);
  };

  public query func getPendingMicroCharges() : async [Ops.MicroCharge] {
    OpsLib.getPendingMicroCharges(microCharges);
  };

  // ── Guest Logs ────────────────────────────────────────────────────────────────

  public shared func addGuestLog(args : Ops.AddGuestLogArgs) : async Ops.GuestLog {
    let log = OpsLib.addGuestLog(guestLogs, nextGuestLogId.val, args);
    nextGuestLogId.val += 1;
    log;
  };

  public query func getGuestLogs() : async [Ops.GuestLog] {
    OpsLib.getGuestLogs(guestLogs);
  };

  public query func getGuestLogsByTenant(tenantId : Common.TenantId) : async [Ops.GuestLog] {
    OpsLib.getGuestLogsByTenant(guestLogs, tenantId);
  };

  // ── Dashboard ─────────────────────────────────────────────────────────────────

  public query func getDashboardStats() : async Ops.DashboardStats {
    OpsLib.getDashboardStats(tenants, rooms, beds, payments, complaints, expenses);
  };
};
