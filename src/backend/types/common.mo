module {
  public type Timestamp = Int;
  public type TenantId = Nat;
  public type RoomId = Nat;
  public type BedId = Nat;
  public type PaymentId = Nat;
  public type ComplaintId = Nat;
  public type ExpenseId = Nat;
  public type MealRecordId = Nat;
  public type StaffTaskId = Nat;
  public type ParcelId = Nat;
  public type MicroChargeId = Nat;
  public type GuestLogId = Nat;

  public type RiskLevel = { #low; #medium; #high };
  public type PaymentStatus = { #paid; #pending; #overdue };
  public type PaymentMethod = { #upi; #cash };
  public type ComplaintCategory = { #water; #electricity; #cleaning; #other };
  public type ComplaintStatus = { #open; #resolved };
  public type ExpenseCategory = { #electricity; #generator; #maintenance; #other };
  public type SplitType = { #equal; #weighted };
  public type TaskStatus = { #pending; #done };
};
