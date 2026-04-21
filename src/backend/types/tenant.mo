import Common "common";

module {
  public type Tenant = {
    id : Common.TenantId;
    name : Text;
    phone : Text;
    idProof : Text;
    checkInDate : Common.Timestamp;
    roomId : Common.RoomId;
    bedId : Common.BedId;
    advancePaid : Nat;
    monthlyRent : Nat;
    isActive : Bool;
    exitReason : ?Text;
    riskLevel : Common.RiskLevel;
  };

  public type AddTenantArgs = {
    name : Text;
    phone : Text;
    idProof : Text;
    checkInDate : Common.Timestamp;
    roomId : Common.RoomId;
    bedId : Common.BedId;
    advancePaid : Nat;
    monthlyRent : Nat;
    riskLevel : Common.RiskLevel;
  };

  public type UpdateTenantArgs = {
    id : Common.TenantId;
    name : Text;
    phone : Text;
    idProof : Text;
    checkInDate : Common.Timestamp;
    roomId : Common.RoomId;
    bedId : Common.BedId;
    advancePaid : Nat;
    monthlyRent : Nat;
    isActive : Bool;
    exitReason : ?Text;
    riskLevel : Common.RiskLevel;
  };
};
