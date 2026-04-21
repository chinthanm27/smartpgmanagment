import Time "mo:core/Time";
import List "mo:core/List";
import Common "../types/common";
import Ops "../types/operations";
import TenantTypes "../types/tenant";
import PropertyTypes "../types/property";
import PaymentTypes "../types/payment";

module {
  // ── Complaints ──────────────────────────────────────────────────────────────

  public func addComplaint(
    complaints : List.List<Ops.Complaint>,
    nextId : Nat,
    args : Ops.AddComplaintArgs,
  ) : Ops.Complaint {
    let complaint : Ops.Complaint = {
      id = nextId;
      tenantId = args.tenantId;
      category = args.category;
      description = args.description;
      status = #open;
      createdAt = Time.now();
    };
    complaints.add(complaint);
    complaint;
  };

  public func updateComplaintStatus(
    complaints : List.List<Ops.Complaint>,
    id : Common.ComplaintId,
    status : Common.ComplaintStatus,
  ) : Bool {
    var found = false;
    complaints.mapInPlace(func(c) {
      if (c.id == id) {
        found := true;
        { c with status = status };
      } else { c };
    });
    found;
  };

  public func getComplaints(complaints : List.List<Ops.Complaint>) : [Ops.Complaint] {
    complaints.toArray();
  };

  public func getComplaintsByTenant(
    complaints : List.List<Ops.Complaint>,
    tenantId : Common.TenantId,
  ) : [Ops.Complaint] {
    complaints.filter(func(c) { c.tenantId == tenantId }).toArray();
  };

  public func getOpenComplaints(complaints : List.List<Ops.Complaint>) : [Ops.Complaint] {
    complaints.filter(func(c) { c.status == #open }).toArray();
  };

  // ── Expenses ─────────────────────────────────────────────────────────────────

  public func addExpense(
    expenses : List.List<Ops.Expense>,
    nextId : Nat,
    args : Ops.AddExpenseArgs,
  ) : Ops.Expense {
    let expense : Ops.Expense = {
      id = nextId;
      category = args.category;
      amount = args.amount;
      month = args.month;
      year = args.year;
      notes = args.notes;
      splitType = args.splitType;
    };
    expenses.add(expense);
    expense;
  };

  public func getExpenses(expenses : List.List<Ops.Expense>) : [Ops.Expense] {
    expenses.toArray();
  };

  public func getExpensesByMonth(
    expenses : List.List<Ops.Expense>,
    month : Nat,
    year : Nat,
  ) : [Ops.Expense] {
    expenses.filter(func(e) { e.month == month and e.year == year }).toArray();
  };

  // ── Meals ────────────────────────────────────────────────────────────────────

  public func toggleMeal(
    mealRecords : List.List<Ops.MealRecord>,
    nextId : Nat,
    args : Ops.ToggleMealArgs,
  ) : Ops.MealRecord {
    // Check for an existing record for same tenant+date
    let existing = mealRecords.find(func(m) {
      m.tenantId == args.tenantId and m.date == args.date
    });
    switch (existing) {
      case (?rec) {
        // Flip isEating in place
        mealRecords.mapInPlace(func(m) {
          if (m.tenantId == args.tenantId and m.date == args.date) {
            { m with isEating = not m.isEating };
          } else { m };
        });
        // Return the updated record
        switch (mealRecords.find(func(m) { m.tenantId == args.tenantId and m.date == args.date })) {
          case (?updated) { updated };
          case null { { rec with isEating = not rec.isEating } };
        };
      };
      case null {
        // New record
        let record : Ops.MealRecord = {
          id = nextId;
          tenantId = args.tenantId;
          date = args.date;
          isEating = args.isEating;
          chargePerDay = args.chargePerDay;
        };
        mealRecords.add(record);
        record;
      };
    };
  };

  public func getMealRecords(mealRecords : List.List<Ops.MealRecord>) : [Ops.MealRecord] {
    mealRecords.toArray();
  };

  public func getMealRecordsByTenant(
    mealRecords : List.List<Ops.MealRecord>,
    tenantId : Common.TenantId,
  ) : [Ops.MealRecord] {
    mealRecords.filter(func(m) { m.tenantId == tenantId }).toArray();
  };

  public func calculateMonthlyMessCharge(
    mealRecords : List.List<Ops.MealRecord>,
    tenantId : Common.TenantId,
    month : Nat,
    year : Nat,
  ) : Nat {
    // A day falls in the given month/year if its timestamp is within that calendar month.
    // We determine month boundaries in nanoseconds.
    // Days in month: approximate — use 28-31 day range via simple calendar logic.
    let nanosPerDay : Int = 86_400_000_000_000;
    // January 1, 1970 is epoch. We calculate the start of the given month.
    let daysInMonths : [Nat] = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    // Compute days from epoch to start of given year
    let y = year;
    let leapYears = (y - 1970) / 4 - (y - 1970) / 100 + (y - 1970) / 400;
    let daysInYear = (y - 1970) * 365 + leapYears;
    // Days from start of year to start of given month
    var daysInPriorMonths = 0;
    var m2 = 1;
    while (m2 < month) {
      let idx = m2 - 1;
      let baseLen = daysInMonths[idx];
      // Feb in a leap year
      let isLeap = (y % 4 == 0 and y % 100 != 0) or (y % 400 == 0);
      let len = if (idx == 1 and isLeap) { baseLen + 1 } else { baseLen };
      daysInPriorMonths += len;
      m2 += 1;
    };
    let monthStartDay : Int = daysInYear + daysInPriorMonths;
    let monthStartNs : Int = monthStartDay * nanosPerDay;
    // Length of this month
    let thisMonthIdx = month - 1;
    let baseLen = daysInMonths[thisMonthIdx];
    let isLeap = (y % 4 == 0 and y % 100 != 0) or (y % 400 == 0);
    let monthLen = if (thisMonthIdx == 1 and isLeap) { baseLen + 1 } else { baseLen };
    let monthEndNs : Int = monthStartNs + monthLen * nanosPerDay;

    mealRecords.foldLeft<Nat, Ops.MealRecord>(0, func(acc, m) {
      if (m.tenantId == tenantId and m.isEating and m.date >= monthStartNs and m.date < monthEndNs) {
        acc + m.chargePerDay;
      } else { acc };
    });
  };

  // ── Staff Tasks ───────────────────────────────────────────────────────────────

  public func addStaffTask(
    staffTasks : List.List<Ops.StaffTask>,
    nextId : Nat,
    args : Ops.AddStaffTaskArgs,
  ) : Ops.StaffTask {
    let task : Ops.StaffTask = {
      id = nextId;
      title = args.title;
      assignedTo = args.assignedTo;
      status = #pending;
      dueDate = args.dueDate;
    };
    staffTasks.add(task);
    task;
  };

  public func updateTaskStatus(
    staffTasks : List.List<Ops.StaffTask>,
    id : Common.StaffTaskId,
    status : Common.TaskStatus,
  ) : Bool {
    var found = false;
    staffTasks.mapInPlace(func(t) {
      if (t.id == id) {
        found := true;
        { t with status = status };
      } else { t };
    });
    found;
  };

  public func getStaffTasks(staffTasks : List.List<Ops.StaffTask>) : [Ops.StaffTask] {
    staffTasks.toArray();
  };

  public func getPendingTasks(staffTasks : List.List<Ops.StaffTask>) : [Ops.StaffTask] {
    staffTasks.filter(func(t) { t.status == #pending }).toArray();
  };

  // ── Parcels ───────────────────────────────────────────────────────────────────

  public func addParcel(
    parcels : List.List<Ops.Parcel>,
    nextId : Nat,
    args : Ops.AddParcelArgs,
  ) : Ops.Parcel {
    let parcel : Ops.Parcel = {
      id = nextId;
      tenantId = args.tenantId;
      description = args.description;
      receivedAt = Time.now();
      isCollected = false;
    };
    parcels.add(parcel);
    parcel;
  };

  public func collectParcel(
    parcels : List.List<Ops.Parcel>,
    id : Common.ParcelId,
  ) : Bool {
    var found = false;
    parcels.mapInPlace(func(p) {
      if (p.id == id) {
        found := true;
        { p with isCollected = true };
      } else { p };
    });
    found;
  };

  public func getParcels(parcels : List.List<Ops.Parcel>) : [Ops.Parcel] {
    parcels.toArray();
  };

  public func getUncollectedParcels(parcels : List.List<Ops.Parcel>) : [Ops.Parcel] {
    parcels.filter(func(p) { not p.isCollected }).toArray();
  };

  // ── Micro-charges ─────────────────────────────────────────────────────────────

  public func addMicroCharge(
    microCharges : List.List<Ops.MicroCharge>,
    nextId : Nat,
    args : Ops.AddMicroChargeArgs,
  ) : Ops.MicroCharge {
    let charge : Ops.MicroCharge = {
      id = nextId;
      tenantId = args.tenantId;
      description = args.description;
      amount = args.amount;
      addedAt = Time.now();
      addedToRent = false;
    };
    microCharges.add(charge);
    charge;
  };

  public func markChargeAddedToRent(
    microCharges : List.List<Ops.MicroCharge>,
    id : Common.MicroChargeId,
  ) : Bool {
    var found = false;
    microCharges.mapInPlace(func(c) {
      if (c.id == id) {
        found := true;
        { c with addedToRent = true };
      } else { c };
    });
    found;
  };

  public func getMicroCharges(microCharges : List.List<Ops.MicroCharge>) : [Ops.MicroCharge] {
    microCharges.toArray();
  };

  public func getPendingMicroCharges(microCharges : List.List<Ops.MicroCharge>) : [Ops.MicroCharge] {
    microCharges.filter(func(c) { not c.addedToRent }).toArray();
  };

  // ── Guest Logs ────────────────────────────────────────────────────────────────

  public func addGuestLog(
    guestLogs : List.List<Ops.GuestLog>,
    nextId : Nat,
    args : Ops.AddGuestLogArgs,
  ) : Ops.GuestLog {
    let log : Ops.GuestLog = {
      id = nextId;
      tenantId = args.tenantId;
      guestName = args.guestName;
      checkIn = args.checkIn;
      checkOut = args.checkOut;
      extraCharge = args.extraCharge;
    };
    guestLogs.add(log);
    log;
  };

  public func getGuestLogs(guestLogs : List.List<Ops.GuestLog>) : [Ops.GuestLog] {
    guestLogs.toArray();
  };

  public func getGuestLogsByTenant(
    guestLogs : List.List<Ops.GuestLog>,
    tenantId : Common.TenantId,
  ) : [Ops.GuestLog] {
    guestLogs.filter(func(g) { g.tenantId == tenantId }).toArray();
  };

  // ── Dashboard Stats ───────────────────────────────────────────────────────────

  public func getDashboardStats(
    tenants : List.List<TenantTypes.Tenant>,
    rooms : List.List<PropertyTypes.Room>,
    beds : List.List<PropertyTypes.Bed>,
    payments : List.List<PaymentTypes.Payment>,
    complaints : List.List<Ops.Complaint>,
    expenses : List.List<Ops.Expense>,
  ) : Ops.DashboardStats {
    let totalTenants = tenants.size();
    let activeTenants = tenants.filter(func(t) { t.isActive }).size();
    let totalRooms = rooms.size();
    let occupiedBeds = beds.filter(func(b) { b.isOccupied }).size();
    let totalBeds = beds.size();
    let pendingPayments = payments.filter(func(p) { p.status == #pending }).size();
    let overduePayments = payments.filter(func(p) { p.status == #overdue }).size();
    let paidPayments = payments.filter(func(p) { p.status == #paid }).size();
    let openComplaints = complaints.filter(func(c) { c.status == #open }).size();
    let highRiskTenants = tenants.filter(func(t) { t.riskLevel == #high }).size();

    // Total expenses for current month
    let now = Time.now();
    let nanosPerDay : Int = 86_400_000_000_000;
    // Approximate current month/year from now (days since epoch)
    let daysSinceEpoch : Int = now / nanosPerDay;
    // Calculate approximate year and month
    let approxYear : Int = 1970 + daysSinceEpoch / 365;
    let daysInYear : Int = daysSinceEpoch - (approxYear - 1970) * 365;
    let daysInMonths : [Nat] = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var approxMonth : Int = 1;
    var daysLeft : Int = daysInYear;
    var mi = 0;
    while (mi < 12 and daysLeft >= daysInMonths[mi]) {
      daysLeft -= daysInMonths[mi];
      approxMonth += 1;
      mi += 1;
    };
    let currentMonth = approxMonth.toNat();
    let currentYear = approxYear.toNat();

    let totalExpensesThisMonth = expenses.foldLeft(0, func(acc, e) {
      if (e.month == currentMonth and e.year == currentYear) {
        acc + e.amount;
      } else { acc };
    });

    {
      totalTenants;
      activeTenants;
      totalRooms;
      occupiedBeds;
      totalBeds;
      pendingPayments;
      overduePayments;
      paidPayments;
      openComplaints;
      totalExpensesThisMonth;
      highRiskTenants;
    };
  };
};
