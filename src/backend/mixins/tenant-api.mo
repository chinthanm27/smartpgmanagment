import List "mo:core/List";
import Common "../types/common";
import TenantTypes "../types/tenant";
import TenantLib "../lib/tenant";

mixin (
  tenants : List.List<TenantTypes.Tenant>,
  nextTenantId : { var val : Nat },
) {
  public shared func addTenant(args : TenantTypes.AddTenantArgs) : async TenantTypes.Tenant {
    TenantLib.addTenant(tenants, nextTenantId, args);
  };

  public shared func updateTenant(args : TenantTypes.UpdateTenantArgs) : async Bool {
    TenantLib.updateTenant(tenants, args);
  };

  public shared func deleteTenant(id : Common.TenantId, exitReason : ?Text) : async Bool {
    TenantLib.deleteTenant(tenants, id, exitReason);
  };

  public query func getTenants() : async [TenantTypes.Tenant] {
    TenantLib.getTenants(tenants);
  };

  public query func getInactiveTenants() : async [TenantTypes.Tenant] {
    TenantLib.getInactiveTenants(tenants);
  };

  public shared func updateRiskLevel(id : Common.TenantId, riskLevel : Common.RiskLevel) : async Bool {
    TenantLib.updateRiskLevel(tenants, id, riskLevel);
  };

  public shared func computeRiskLevel(id : Common.TenantId, latePaymentCount : Nat, complaintCount : Nat) : async Bool {
    TenantLib.computeRiskLevel(tenants, id, latePaymentCount, complaintCount);
  };
};
