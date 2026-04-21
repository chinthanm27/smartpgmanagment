import Common "common";

module {
  public type Room = {
    id : Common.RoomId;
    number : Text;
    capacity : Nat;
    isAC : Bool;
    floor : Nat;
  };

  public type Bed = {
    id : Common.BedId;
    roomId : Common.RoomId;
    bedLabel : Text;
    isOccupied : Bool;
    tenantId : ?Common.TenantId;
  };

  public type AddRoomArgs = {
    number : Text;
    capacity : Nat;
    isAC : Bool;
    floor : Nat;
  };

  public type UpdateRoomArgs = {
    id : Common.RoomId;
    number : Text;
    capacity : Nat;
    isAC : Bool;
    floor : Nat;
  };
};
