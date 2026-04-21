import List "mo:core/List";
import Common "../types/common";
import PaymentTypes "../types/payment";
import TenantTypes "../types/tenant";
import PaymentLib "../lib/payment";

mixin (
  payments : List.List<PaymentTypes.Payment>,
  tenants : List.List<TenantTypes.Tenant>,
  nextPaymentId : { var val : Nat },
) {
  public shared func addPayment(args : PaymentTypes.AddPaymentArgs) : async PaymentTypes.Payment {
    PaymentLib.addPayment(payments, nextPaymentId, args);
  };

  public shared func updatePaymentStatus(
    id : Common.PaymentId,
    status : Common.PaymentStatus,
    method : ?Common.PaymentMethod,
    paidDate : ?Common.Timestamp,
  ) : async Bool {
    PaymentLib.updatePaymentStatus(payments, id, status, method, paidDate);
  };

  public query func getPayments() : async [PaymentTypes.Payment] {
    PaymentLib.getPayments(payments);
  };

  public query func getPaymentsByTenant(tenantId : Common.TenantId) : async [PaymentTypes.Payment] {
    PaymentLib.getPaymentsByTenant(payments, tenantId);
  };

  public query func getPaymentsByMonth(month : Nat, year : Nat) : async [PaymentTypes.Payment] {
    PaymentLib.getPaymentsByMonth(payments, month, year);
  };

  public shared func generateMonthlyPayments(month : Nat, year : Nat) : async [PaymentTypes.Payment] {
    PaymentLib.generateMonthlyPayments(payments, nextPaymentId, tenants, month, year);
  };
};
