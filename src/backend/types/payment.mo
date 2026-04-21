import Common "common";

module {
  public type Payment = {
    id : Common.PaymentId;
    tenantId : Common.TenantId;
    month : Nat;
    year : Nat;
    amount : Nat;
    status : Common.PaymentStatus;
    method : ?Common.PaymentMethod;
    paidDate : ?Common.Timestamp;
  };

  public type AddPaymentArgs = {
    tenantId : Common.TenantId;
    month : Nat;
    year : Nat;
    amount : Nat;
    status : Common.PaymentStatus;
    method : ?Common.PaymentMethod;
    paidDate : ?Common.Timestamp;
  };
};
