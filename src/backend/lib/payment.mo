import List "mo:core/List";
import Common "../types/common";
import PaymentTypes "../types/payment";
import TenantTypes "../types/tenant";

module {
  public func addPayment(
    payments : List.List<PaymentTypes.Payment>,
    nextId : { var val : Nat },
    args : PaymentTypes.AddPaymentArgs,
  ) : PaymentTypes.Payment {
    let id = nextId.val;
    nextId.val += 1;
    let payment : PaymentTypes.Payment = {
      id;
      tenantId = args.tenantId;
      month = args.month;
      year = args.year;
      amount = args.amount;
      status = args.status;
      method = args.method;
      paidDate = args.paidDate;
    };
    payments.add(payment);
    payment;
  };

  public func updatePaymentStatus(
    payments : List.List<PaymentTypes.Payment>,
    id : Common.PaymentId,
    status : Common.PaymentStatus,
    method : ?Common.PaymentMethod,
    paidDate : ?Common.Timestamp,
  ) : Bool {
    var found = false;
    payments.mapInPlace(func(p) {
      if (p.id == id) {
        found := true;
        { p with status = status; method = method; paidDate = paidDate };
      } else { p };
    });
    found;
  };

  public func getPayments(payments : List.List<PaymentTypes.Payment>) : [PaymentTypes.Payment] {
    payments.toArray();
  };

  public func getPaymentsByTenant(
    payments : List.List<PaymentTypes.Payment>,
    tenantId : Common.TenantId,
  ) : [PaymentTypes.Payment] {
    payments.filter(func(p) { p.tenantId == tenantId }).toArray();
  };

  public func getPaymentsByMonth(
    payments : List.List<PaymentTypes.Payment>,
    month : Nat,
    year : Nat,
  ) : [PaymentTypes.Payment] {
    payments.filter(func(p) { p.month == month and p.year == year }).toArray();
  };

  public func generateMonthlyPayments(
    payments : List.List<PaymentTypes.Payment>,
    nextId : { var val : Nat },
    tenants : List.List<TenantTypes.Tenant>,
    month : Nat,
    year : Nat,
  ) : [PaymentTypes.Payment] {
    let activeTenants = tenants.filter(func(t) { t.isActive });
    let generated = List.empty<PaymentTypes.Payment>();
    activeTenants.forEach(func(t) {
      // Only create if no payment already exists for this tenant/month/year
      let exists = payments.find(func(p) {
        p.tenantId == t.id and p.month == month and p.year == year
      });
      switch (exists) {
        case null {
          let id = nextId.val;
          nextId.val += 1;
          let payment : PaymentTypes.Payment = {
            id;
            tenantId = t.id;
            month;
            year;
            amount = t.monthlyRent;
            status = #pending;
            method = null;
            paidDate = null;
          };
          payments.add(payment);
          generated.add(payment);
        };
        case (?_) {};
      };
    });
    generated.toArray();
  };
};
