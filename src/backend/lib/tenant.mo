import List "mo:core/List";
import Common "../types/common";
import TenantTypes "../types/tenant";

module {
  public func addTenant(
    tenants : List.List<TenantTypes.Tenant>,
    nextId : { var val : Nat },
    args : TenantTypes.AddTenantArgs,
  ) : TenantTypes.Tenant {
    let id = nextId.val;
    nextId.val += 1;
    let tenant : TenantTypes.Tenant = {
      id;
      name = args.name;
      phone = args.phone;
      idProof = args.idProof;
      checkInDate = args.checkInDate;
      roomId = args.roomId;
      bedId = args.bedId;
      advancePaid = args.advancePaid;
      monthlyRent = args.monthlyRent;
      isActive = true;
      exitReason = null;
      riskLevel = args.riskLevel;
    };
    tenants.add(tenant);
    tenant;
  };

  public func updateTenant(
    tenants : List.List<TenantTypes.Tenant>,
    args : TenantTypes.UpdateTenantArgs,
  ) : Bool {
    var found = false;
    tenants.mapInPlace(func(t) {
      if (t.id == args.id) {
        found := true;
        {
          t with
          name = args.name;
          phone = args.phone;
          idProof = args.idProof;
          checkInDate = args.checkInDate;
          roomId = args.roomId;
          bedId = args.bedId;
          advancePaid = args.advancePaid;
          monthlyRent = args.monthlyRent;
          isActive = args.isActive;
          exitReason = args.exitReason;
          riskLevel = args.riskLevel;
        };
      } else { t };
    });
    found;
  };

  public func deleteTenant(
    tenants : List.List<TenantTypes.Tenant>,
    id : Common.TenantId,
    exitReason : ?Text,
  ) : Bool {
    var found = false;
    tenants.mapInPlace(func(t) {
      if (t.id == id) {
        found := true;
        { t with isActive = false; exitReason = exitReason };
      } else { t };
    });
    found;
  };

  public func getTenants(tenants : List.List<TenantTypes.Tenant>) : [TenantTypes.Tenant] {
    tenants.filter(func(t) { t.isActive }).toArray();
  };

  public func getInactiveTenants(tenants : List.List<TenantTypes.Tenant>) : [TenantTypes.Tenant] {
    tenants.filter(func(t) { not t.isActive }).toArray();
  };

  public func updateRiskLevel(
    tenants : List.List<TenantTypes.Tenant>,
    id : Common.TenantId,
    riskLevel : Common.RiskLevel,
  ) : Bool {
    var found = false;
    tenants.mapInPlace(func(t) {
      if (t.id == id) {
        found := true;
        { t with riskLevel = riskLevel };
      } else { t };
    });
    found;
  };

  public func computeRiskLevel(
    tenants : List.List<TenantTypes.Tenant>,
    id : Common.TenantId,
    latePaymentCount : Nat,
    complaintCount : Nat,
  ) : Bool {
    let level : Common.RiskLevel = if (latePaymentCount >= 3 or complaintCount >= 5) {
      #high;
    } else if (latePaymentCount >= 1 or complaintCount >= 2) {
      #medium;
    } else {
      #low;
    };
    updateRiskLevel(tenants, id, level);
  };
};
