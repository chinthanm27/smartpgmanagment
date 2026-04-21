import List "mo:core/List";
import Common "../types/common";
import PropertyTypes "../types/property";

module {
  // Bed label letters for auto-creation
  let bedLabels = ["A", "B", "C", "D", "E", "F"];

  public func addRoom(
    rooms : List.List<PropertyTypes.Room>,
    beds : List.List<PropertyTypes.Bed>,
    nextRoomId : { var val : Nat },
    nextBedId : { var val : Nat },
    args : PropertyTypes.AddRoomArgs,
  ) : PropertyTypes.Room {
    let roomId = nextRoomId.val;
    nextRoomId.val += 1;
    let room : PropertyTypes.Room = {
      id = roomId;
      number = args.number;
      capacity = args.capacity;
      isAC = args.isAC;
      floor = args.floor;
    };
    rooms.add(room);
    // Auto-create beds up to capacity (max 6, using A/B/C/D/E/F labels)
    let count = if (args.capacity <= 6) { args.capacity } else { 6 };
    var i = 0;
    while (i < count) {
      let bedId = nextBedId.val;
      nextBedId.val += 1;
      let bed : PropertyTypes.Bed = {
        id = bedId;
        roomId;
        bedLabel = bedLabels[i];
        isOccupied = false;
        tenantId = null;
      };
      beds.add(bed);
      i += 1;
    };
    room;
  };

  public func updateRoom(
    rooms : List.List<PropertyTypes.Room>,
    args : PropertyTypes.UpdateRoomArgs,
  ) : Bool {
    var found = false;
    rooms.mapInPlace(func(r) {
      if (r.id == args.id) {
        found := true;
        {
          r with
          number = args.number;
          capacity = args.capacity;
          isAC = args.isAC;
          floor = args.floor;
        };
      } else { r };
    });
    found;
  };

  public func getRooms(rooms : List.List<PropertyTypes.Room>) : [PropertyTypes.Room] {
    rooms.toArray();
  };

  public func getBeds(beds : List.List<PropertyTypes.Bed>) : [PropertyTypes.Bed] {
    beds.toArray();
  };

  public func assignBed(
    beds : List.List<PropertyTypes.Bed>,
    bedId : Common.BedId,
    tenantId : ?Common.TenantId,
  ) : Bool {
    var found = false;
    beds.mapInPlace(func(b) {
      if (b.id == bedId) {
        found := true;
        { b with isOccupied = true; tenantId = tenantId };
      } else { b };
    });
    found;
  };

  public func freeBed(
    beds : List.List<PropertyTypes.Bed>,
    bedId : Common.BedId,
  ) : Bool {
    var found = false;
    beds.mapInPlace(func(b) {
      if (b.id == bedId) {
        found := true;
        { b with isOccupied = false; tenantId = null };
      } else { b };
    });
    found;
  };
};
