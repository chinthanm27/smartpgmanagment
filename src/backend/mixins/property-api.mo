import List "mo:core/List";
import Common "../types/common";
import PropertyTypes "../types/property";
import PropertyLib "../lib/property";

mixin (
  rooms : List.List<PropertyTypes.Room>,
  beds : List.List<PropertyTypes.Bed>,
  nextRoomId : { var val : Nat },
  nextBedId : { var val : Nat },
) {
  public query func getRooms() : async [PropertyTypes.Room] {
    PropertyLib.getRooms(rooms);
  };

  public shared func addRoom(args : PropertyTypes.AddRoomArgs) : async PropertyTypes.Room {
    PropertyLib.addRoom(rooms, beds, nextRoomId, nextBedId, args);
  };

  public shared func updateRoom(args : PropertyTypes.UpdateRoomArgs) : async Bool {
    PropertyLib.updateRoom(rooms, args);
  };

  public query func getBeds() : async [PropertyTypes.Bed] {
    PropertyLib.getBeds(beds);
  };

  public shared func assignBed(bedId : Common.BedId, tenantId : ?Common.TenantId) : async Bool {
    PropertyLib.assignBed(beds, bedId, tenantId);
  };

  public shared func freeBed(bedId : Common.BedId) : async Bool {
    PropertyLib.freeBed(beds, bedId);
  };
};
