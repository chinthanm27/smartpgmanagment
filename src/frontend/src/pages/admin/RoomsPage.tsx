import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BedDouble,
  Building,
  DollarSign,
  Pencil,
  Plus,
  Thermometer,
  TrendingDown,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Layout } from "../../components/Layout";
import { createActor } from "../../services/backend";
import type {
  AddRoomArgs,
  Bed,
  Room,
  Tenant,
  UpdateRoomArgs,
} from "../../types";

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtINR(val: number) {
  return `₹${val.toLocaleString("en-IN")}`;
}

const FLOORS = ["Ground", "1st", "2nd", "3rd", "4th", "5th"];
const floorLabel = (n: bigint) => FLOORS[Number(n)] ?? `Floor ${String(n)}`;

// ── Add/Edit Room form ────────────────────────────────────────────────────────

type RoomFormData = {
  number: string;
  floor: string;
  isAC: boolean;
  capacity: string;
};

const EMPTY_ROOM_FORM: RoomFormData = {
  number: "",
  floor: "1",
  isAC: false,
  capacity: "3",
};

function roomToForm(r: Room): RoomFormData {
  return {
    number: r.number,
    floor: String(r.floor),
    isAC: r.isAC,
    capacity: String(r.capacity),
  };
}

function RoomFormFields({
  form,
  onChange,
}: { form: RoomFormData; onChange: (f: RoomFormData) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="rf-number">Room Number *</Label>
        <Input
          id="rf-number"
          value={form.number}
          onChange={(e) => onChange({ ...form, number: e.target.value })}
          placeholder="e.g. 101"
          data-ocid="rooms.form.number_input"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rf-floor">Floor</Label>
        <Select
          value={form.floor}
          onValueChange={(v) => onChange({ ...form, floor: v })}
        >
          <SelectTrigger id="rf-floor" data-ocid="rooms.form.floor_select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FLOORS.map((label, i) => (
              <SelectItem key={label} value={String(i)}>
                {label} Floor
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rf-capacity">Capacity (beds)</Label>
        <Select
          value={form.capacity}
          onValueChange={(v) => onChange({ ...form, capacity: v })}
        >
          <SelectTrigger
            id="rf-capacity"
            data-ocid="rooms.form.capacity_select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} Bed{n > 1 ? "s" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between space-y-0 pt-6">
        <Label htmlFor="rf-ac" className="cursor-pointer">
          Air Conditioned
        </Label>
        <Switch
          id="rf-ac"
          checked={form.isAC}
          onCheckedChange={(v) => onChange({ ...form, isAC: v })}
          data-ocid="rooms.form.ac_switch"
        />
      </div>
    </div>
  );
}

// ── Assign Bed Dialog ─────────────────────────────────────────────────────────

function AssignBedDialog({
  bed,
  tenants,
  onAssign,
  onFree,
  onClose,
}: {
  bed: Bed;
  tenants: Tenant[];
  onAssign: (bedId: bigint, tenantId: bigint) => void;
  onFree: (bedId: bigint) => void;
  onClose: () => void;
}) {
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const unassigned = tenants.filter(
    (t) => t.isActive && (!t.bedId || t.bedId === bed.id),
  );

  return (
    <DialogContent className="max-w-sm" data-ocid="rooms.assign_dialog">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <BedDouble className="w-5 h-5 text-primary" />
          Bed {bed.bedLabel}
        </DialogTitle>
      </DialogHeader>
      {bed.isOccupied ? (
        <>
          <p className="text-sm text-muted-foreground">
            This bed is currently occupied. Free it to reassign.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              data-ocid="rooms.assign_cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => onFree(bed.id)}
              data-ocid="rooms.free_bed_button"
            >
              Free Bed
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-1.5">
            <Label>Assign to Tenant</Label>
            <Select value={selectedTenant} onValueChange={setSelectedTenant}>
              <SelectTrigger data-ocid="rooms.assign_tenant_select">
                <SelectValue placeholder="Select tenant" />
              </SelectTrigger>
              <SelectContent>
                {unassigned.map((t) => (
                  <SelectItem key={String(t.id)} value={String(t.id)}>
                    {t.name} · {t.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {unassigned.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No unassigned active tenants available.
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              data-ocid="rooms.assign_cancel_button"
            >
              <X className="w-4 h-4 mr-1.5" />
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary text-primary-foreground"
              disabled={!selectedTenant}
              onClick={() => onAssign(bed.id, BigInt(selectedTenant))}
              data-ocid="rooms.assign_confirm_button"
            >
              Assign
            </Button>
          </div>
        </>
      )}
    </DialogContent>
  );
}

// ── Room Card ─────────────────────────────────────────────────────────────────

function RoomCard({
  room,
  beds,
  tenants,
  index,
  onEdit,
  onBedClick,
}: {
  room: Room;
  beds: Bed[];
  tenants: Tenant[];
  index: number;
  onEdit: (r: Room) => void;
  onBedClick: (b: Bed) => void;
}) {
  const roomBeds = beds.filter((b) => b.roomId === room.id);
  const occupied = roomBeds.filter((b) => b.isOccupied).length;
  const pct =
    Number(room.capacity) > 0 ? (occupied / Number(room.capacity)) * 100 : 0;

  const tenantName = (b: Bed) => {
    if (!b.isOccupied || !b.tenantId) return null;
    const t = tenants.find((t) => t.id === b.tenantId);
    return t?.name ?? "Occupied";
  };

  return (
    <Card
      className="bg-card border-border hover:border-primary/40 transition-smooth"
      data-ocid={`rooms.item.${index}`}
    >
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <CardTitle className="font-display text-base text-card-foreground">
              Room {room.number}
            </CardTitle>
            <Badge variant="secondary" className="text-xs shrink-0">
              {floorLabel(room.floor)}
            </Badge>
            {room.isAC && (
              <Badge
                variant="outline"
                className="text-xs bg-primary/10 text-primary border-primary/30 shrink-0"
              >
                <Thermometer className="w-3 h-3 mr-1" />
                AC
              </Badge>
            )}
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => onEdit(room)}
            data-ocid={`rooms.edit_button.${index}`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pb-4 space-y-3">
        {/* Occupancy bar */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Occupancy</span>
            <span
              className={`font-medium ${occupied === Number(room.capacity) ? "text-chart-1" : "text-foreground"}`}
            >
              {occupied}/{Number(room.capacity)}
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-smooth"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Bed slots */}
        {roomBeds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {roomBeds.map((bed) => {
              const tName = tenantName(bed);
              return (
                <button
                  key={String(bed.id)}
                  type="button"
                  className={`
                    group relative px-2.5 py-1.5 rounded-lg text-xs font-medium
                    border transition-smooth text-left min-w-[60px]
                    ${
                      bed.isOccupied
                        ? "bg-primary/15 text-primary border-primary/30 hover:bg-primary/25"
                        : "bg-muted text-muted-foreground border-border hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                    }
                  `}
                  onClick={() => onBedClick(bed)}
                  title={
                    bed.isOccupied
                      ? `${tName} — click to manage`
                      : "Vacant — click to assign"
                  }
                  data-ocid={`rooms.bed_slot.${index}`}
                >
                  <div className="font-semibold">{bed.bedLabel}</div>
                  {tName && (
                    <div className="text-[10px] opacity-80 truncate max-w-[80px]">
                      {tName}
                    </div>
                  )}
                  {!bed.isOccupied && (
                    <div className="text-[10px] opacity-60">Vacant</div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Vacancy Loss Tracker ───────────────────────────────────────────────────────

function VacancyLossCard({
  beds,
  tenants,
}: { beds: Bed[]; tenants: Tenant[] }) {
  const stats = useMemo(() => {
    const totalBeds = beds.length;
    const occupiedBeds = beds.filter((b) => b.isOccupied).length;
    const vacantBeds = totalBeds - occupiedBeds;

    const avgRent =
      tenants.length > 0
        ? tenants.reduce((s, t) => s + Number(t.monthlyRent), 0) /
          tenants.length
        : 6000;

    const daysInMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0,
    ).getDate();

    const vacancyLoss = vacantBeds * avgRent;
    const vacancyLossPct = totalBeds > 0 ? (vacantBeds / totalBeds) * 100 : 0;

    return {
      totalBeds,
      occupiedBeds,
      vacantBeds,
      avgRent,
      daysInMonth,
      vacancyLoss,
      vacancyLossPct,
    };
  }, [beds, tenants]);

  return (
    <Card className="bg-card border-border" data-ocid="rooms.vacancy_loss_card">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-sm font-semibold text-card-foreground flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-destructive" />
          Vacancy Loss Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-muted/60 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold font-display text-foreground">
              {stats.totalBeds}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Total Beds</p>
          </div>
          <div className="bg-chart-1/15 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold font-display text-chart-1">
              {stats.occupiedBeds}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Occupied</p>
          </div>
          <div className="bg-destructive/15 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold font-display text-destructive">
              {stats.vacantBeds}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Vacant</p>
          </div>
          <div className="bg-chart-5/15 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold font-display text-chart-5">
              {stats.vacancyLossPct.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Vacancy Rate</p>
          </div>
        </div>

        <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          <DollarSign className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-destructive">
              Est. Monthly Vacancy Loss: {fmtINR(Math.round(stats.vacancyLoss))}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {stats.vacantBeds} vacant beds × avg{" "}
              {fmtINR(Math.round(stats.avgRent))} rent
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RoomsPage() {
  const { actor, isFetching } = useActor(createActor);
  const qc = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [assignBed, setAssignBed] = useState<Bed | null>(null);
  const [roomForm, setRoomForm] = useState<RoomFormData>(EMPTY_ROOM_FORM);

  const enabled = !!actor && !isFetching;

  const { data: rooms = [], isLoading: roomsLoading } = useQuery<Room[]>({
    queryKey: ["rooms"],
    queryFn: () => (actor ? actor.getRooms() : []),
    enabled,
  });

  const { data: beds = [], isLoading: bedsLoading } = useQuery<Bed[]>({
    queryKey: ["beds"],
    queryFn: () => (actor ? actor.getBeds() : []),
    enabled,
  });

  const { data: tenants = [] } = useQuery<Tenant[]>({
    queryKey: ["tenants"],
    queryFn: () => (actor ? actor.getTenants() : []),
    enabled,
  });

  const isLoading = roomsLoading || bedsLoading;
  const totalBeds = beds.length;
  const occupiedBeds = beds.filter((b) => b.isOccupied).length;

  // mutations
  const addRoomMutation = useMutation({
    mutationFn: async (f: RoomFormData) => {
      if (!actor) throw new Error("Not connected");
      const args: AddRoomArgs = {
        number: f.number,
        floor: BigInt(f.floor),
        isAC: f.isAC,
        capacity: BigInt(f.capacity),
      };
      return actor.addRoom(args);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms"] });
      qc.invalidateQueries({ queryKey: ["beds"] });
      setAddOpen(false);
      setRoomForm(EMPTY_ROOM_FORM);
      toast.success("Room added with beds");
    },
    onError: () => toast.error("Failed to add room"),
  });

  const editRoomMutation = useMutation({
    mutationFn: async (f: RoomFormData) => {
      if (!actor || !editRoom) throw new Error("Not connected");
      const args: UpdateRoomArgs = {
        id: editRoom.id,
        number: f.number,
        floor: BigInt(f.floor),
        isAC: f.isAC,
        capacity: BigInt(f.capacity),
      };
      return actor.updateRoom(args);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms"] });
      setEditRoom(null);
      toast.success("Room updated");
    },
    onError: () => toast.error("Failed to update room"),
  });

  const assignBedMutation = useMutation({
    mutationFn: async ({
      bedId,
      tenantId,
    }: { bedId: bigint; tenantId: bigint }) => {
      if (!actor) throw new Error("Not connected");
      return actor.assignBed(bedId, tenantId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["beds"] });
      qc.invalidateQueries({ queryKey: ["tenants"] });
      setAssignBed(null);
      toast.success("Bed assigned");
    },
    onError: () => toast.error("Failed to assign bed"),
  });

  const freeBedMutation = useMutation({
    mutationFn: async (bedId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.freeBed(bedId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["beds"] });
      qc.invalidateQueries({ queryKey: ["tenants"] });
      setAssignBed(null);
      toast.success("Bed freed");
    },
    onError: () => toast.error("Failed to free bed"),
  });

  const openEdit = (r: Room) => {
    setRoomForm(roomToForm(r));
    setEditRoom(r);
  };

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <Layout title="Rooms & Beds">
      <div className="space-y-5 animate-fade-in" data-ocid="rooms.page">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/15">
              <BedDouble className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-foreground">
                Rooms &amp; Beds
              </h2>
              <p className="text-xs text-muted-foreground">
                {rooms.length} rooms · {occupiedBeds}/{totalBeds} beds occupied
              </p>
            </div>
          </div>
          <Button
            className="gap-2 bg-primary text-primary-foreground"
            onClick={() => {
              setRoomForm(EMPTY_ROOM_FORM);
              setAddOpen(true);
            }}
            data-ocid="rooms.add_button"
          >
            <Plus className="w-4 h-4" />
            Add Room
          </Button>
        </div>

        {/* Vacancy Loss Tracker */}
        {!isLoading && (beds.length > 0 || rooms.length > 0) && (
          <VacancyLossCard beds={beds} tenants={tenants} />
        )}

        {/* Room grid */}
        {isLoading ? (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            data-ocid="rooms.loading_state"
          >
            {(["a", "b", "c", "d", "e", "f"] as const).map((k) => (
              <Card key={k} className="bg-card border-border">
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-2 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <Card className="bg-card border-border" data-ocid="rooms.empty_state">
            <CardContent className="py-16 text-center">
              <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                No rooms yet
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                Add your first room to begin tracking occupancy
              </p>
              <Button
                className="gap-2 bg-primary text-primary-foreground"
                onClick={() => {
                  setRoomForm(EMPTY_ROOM_FORM);
                  setAddOpen(true);
                }}
                data-ocid="rooms.empty_add_button"
              >
                <Plus className="w-4 h-4" />
                Add Room
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room, i) => (
              <RoomCard
                key={String(room.id)}
                room={room}
                beds={beds}
                tenants={tenants}
                index={i + 1}
                onEdit={openEdit}
                onBedClick={setAssignBed}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Add Room Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm" data-ocid="rooms.add_dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Add Room
            </DialogTitle>
          </DialogHeader>
          <RoomFormFields form={roomForm} onChange={setRoomForm} />
          <p className="text-xs text-muted-foreground">
            Beds A–
            {String.fromCharCode(
              64 + Math.min(Number.parseInt(roomForm.capacity) || 1, 6),
            )}{" "}
            will be created automatically.
          </p>
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setAddOpen(false)}
              data-ocid="rooms.add_cancel_button"
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary text-primary-foreground"
              disabled={!roomForm.number || addRoomMutation.isPending}
              onClick={() => addRoomMutation.mutate(roomForm)}
              data-ocid="rooms.add_submit_button"
            >
              {addRoomMutation.isPending ? "Adding…" : "Add Room"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Room Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={!!editRoom} onOpenChange={(o) => !o && setEditRoom(null)}>
        <DialogContent className="max-w-sm" data-ocid="rooms.edit_dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-primary" />
              Edit Room {editRoom?.number}
            </DialogTitle>
          </DialogHeader>
          <RoomFormFields form={roomForm} onChange={setRoomForm} />
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setEditRoom(null)}
              data-ocid="rooms.edit_cancel_button"
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary text-primary-foreground"
              disabled={!roomForm.number || editRoomMutation.isPending}
              onClick={() => editRoomMutation.mutate(roomForm)}
              data-ocid="rooms.edit_submit_button"
            >
              {editRoomMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Assign Bed Dialog ────────────────────────────────────────────────── */}
      {assignBed && (
        <Dialog
          open={!!assignBed}
          onOpenChange={(o) => !o && setAssignBed(null)}
        >
          <AssignBedDialog
            bed={assignBed}
            tenants={tenants}
            onAssign={(bedId, tenantId) =>
              assignBedMutation.mutate({ bedId, tenantId })
            }
            onFree={(bedId) => freeBedMutation.mutate(bedId)}
            onClose={() => setAssignBed(null)}
          />
        </Dialog>
      )}
    </Layout>
  );
}
