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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Building2,
  IndianRupee,
  Pencil,
  Phone,
  PlusCircle,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  TrendingDown,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Layout } from "../../components/Layout";
import { createActor } from "../../services/backend";
import {
  type AddTenantArgs,
  type Bed,
  type Payment,
  type PaymentStatus,
  RiskLevel,
  type Room,
  type Tenant,
  type UpdateTenantArgs,
} from "../../types";

// ── helpers ──────────────────────────────────────────────────────────────────

const RISK_META: Record<
  RiskLevel,
  { label: string; className: string; Icon: React.ElementType }
> = {
  [RiskLevel.low]: {
    label: "Low",
    className: "bg-chart-1/20 text-chart-1 border-chart-1/30",
    Icon: ShieldCheck,
  },
  [RiskLevel.medium]: {
    label: "Medium",
    className: "bg-chart-5/20 text-chart-5 border-chart-5/30",
    Icon: Shield,
  },
  [RiskLevel.high]: {
    label: "High Risk",
    className: "bg-destructive/20 text-destructive border-destructive/30",
    Icon: ShieldAlert,
  },
};

const EXIT_TAGS: Record<string, string> = {
  food: "Food",
  rent: "Rent",
  personal: "Personal",
  other: "Other",
};

function parseExitTags(text: string): string[] {
  const lower = text.toLowerCase();
  return Object.keys(EXIT_TAGS).filter((tag) => lower.includes(tag));
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function fmtINR(val: bigint) {
  return `₹${Number(val).toLocaleString("en-IN")}`;
}

function fmtDate(ts: bigint) {
  return new Date(Number(ts)).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Deposit & Settlement card ─────────────────────────────────────────────────

function SettlementCard({
  tenant,
  payments,
}: { tenant: Tenant; payments: Payment[] }) {
  const tenantPayments = payments.filter((p) => p.tenantId === tenant.id);
  const dues = tenantPayments
    .filter((p) => (p.status as PaymentStatus) !== ("paid" as PaymentStatus))
    .reduce((sum, p) => sum + p.amount, 0n);
  const settlement = tenant.advancePaid - dues;

  return (
    <Card className="bg-card border-border" data-ocid="tenants.settlement.card">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
            {initials(tenant.name)}
          </div>
          <span className="font-semibold text-sm text-foreground truncate">
            {tenant.name}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-muted rounded-lg p-2">
            <p className="text-xs text-muted-foreground">Advance</p>
            <p className="font-semibold text-xs text-chart-1 mt-0.5">
              {fmtINR(tenant.advancePaid)}
            </p>
          </div>
          <div className="bg-muted rounded-lg p-2">
            <p className="text-xs text-muted-foreground">Dues</p>
            <p className="font-semibold text-xs text-destructive mt-0.5">
              {fmtINR(dues)}
            </p>
          </div>
          <div
            className={`rounded-lg p-2 ${settlement >= 0n ? "bg-chart-1/15" : "bg-destructive/15"}`}
          >
            <p className="text-xs text-muted-foreground">Net</p>
            <p
              className={`font-semibold text-xs mt-0.5 ${settlement >= 0n ? "text-chart-1" : "text-destructive"}`}
            >
              {fmtINR(settlement >= 0n ? settlement : -settlement)}
              {settlement < 0n ? " owed" : " refund"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Tenant Form ───────────────────────────────────────────────────────────────

type TenantFormData = {
  name: string;
  phone: string;
  idProof: string;
  checkInDate: string;
  roomId: string;
  bedId: string;
  advancePaid: string;
  monthlyRent: string;
  riskLevel: RiskLevel;
};

const EMPTY_FORM: TenantFormData = {
  name: "",
  phone: "",
  idProof: "",
  checkInDate: new Date().toISOString().split("T")[0],
  roomId: "",
  bedId: "",
  advancePaid: "0",
  monthlyRent: "6000",
  riskLevel: RiskLevel.low,
};

function tenantToForm(t: Tenant): TenantFormData {
  return {
    name: t.name,
    phone: t.phone,
    idProof: t.idProof,
    checkInDate: new Date(Number(t.checkInDate)).toISOString().split("T")[0],
    roomId: String(t.roomId),
    bedId: String(t.bedId),
    advancePaid: String(Number(t.advancePaid)),
    monthlyRent: String(Number(t.monthlyRent)),
    riskLevel: t.riskLevel,
  };
}

function TenantForm({
  form,
  onChange,
  rooms,
  beds,
  editingId,
}: {
  form: TenantFormData;
  onChange: (f: TenantFormData) => void;
  rooms: Room[];
  beds: Bed[];
  editingId?: bigint;
}) {
  const set = (key: keyof TenantFormData, value: string) =>
    onChange({ ...form, [key]: value });

  const roomBeds = useMemo(
    () =>
      beds.filter((b) => {
        if (!form.roomId) return false;
        const rid = BigInt(form.roomId);
        return b.roomId === rid && (!b.isOccupied || b.tenantId === editingId);
      }),
    [beds, form.roomId, editingId],
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="tf-name">Full Name *</Label>
        <Input
          id="tf-name"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Rahul Sharma"
          data-ocid="tenants.form.name_input"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="tf-phone">Phone *</Label>
        <Input
          id="tf-phone"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="e.g. 9876543210"
          data-ocid="tenants.form.phone_input"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="tf-id">ID Proof *</Label>
        <Input
          id="tf-id"
          value={form.idProof}
          onChange={(e) => set("idProof", e.target.value)}
          placeholder="Aadhaar / PAN / Passport"
          data-ocid="tenants.form.id_input"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="tf-date">Check-in Date *</Label>
        <Input
          id="tf-date"
          type="date"
          value={form.checkInDate}
          onChange={(e) => set("checkInDate", e.target.value)}
          data-ocid="tenants.form.date_input"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Room *</Label>
        <Select
          value={form.roomId}
          onValueChange={(v) => onChange({ ...form, roomId: v, bedId: "" })}
        >
          <SelectTrigger data-ocid="tenants.form.room_select">
            <SelectValue placeholder="Select room" />
          </SelectTrigger>
          <SelectContent>
            {rooms.map((r) => (
              <SelectItem key={String(r.id)} value={String(r.id)}>
                Room {r.number} · Floor {String(r.floor)}
                {r.isAC ? " · AC" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Bed *</Label>
        <Select
          value={form.bedId}
          onValueChange={(v) => set("bedId", v)}
          disabled={!form.roomId}
        >
          <SelectTrigger data-ocid="tenants.form.bed_select">
            <SelectValue placeholder="Select bed" />
          </SelectTrigger>
          <SelectContent>
            {roomBeds.map((b) => (
              <SelectItem key={String(b.id)} value={String(b.id)}>
                Bed {b.bedLabel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="tf-advance">Advance Paid (₹)</Label>
        <Input
          id="tf-advance"
          type="number"
          value={form.advancePaid}
          onChange={(e) => set("advancePaid", e.target.value)}
          data-ocid="tenants.form.advance_input"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="tf-rent">Monthly Rent (₹) *</Label>
        <Input
          id="tf-rent"
          type="number"
          value={form.monthlyRent}
          onChange={(e) => set("monthlyRent", e.target.value)}
          data-ocid="tenants.form.rent_input"
        />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label>Risk Level</Label>
        <Select
          value={form.riskLevel}
          onValueChange={(v) =>
            onChange({ ...form, riskLevel: v as RiskLevel })
          }
        >
          <SelectTrigger data-ocid="tenants.form.risk_select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={RiskLevel.low}>Low Risk</SelectItem>
            <SelectItem value={RiskLevel.medium}>Medium Risk</SelectItem>
            <SelectItem value={RiskLevel.high}>High Risk</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ── Tenant Row/Card ───────────────────────────────────────────────────────────

function TenantCard({
  tenant,
  index,
  rooms,
  onEdit,
  onDelete,
  onRiskChange,
}: {
  tenant: Tenant;
  index: number;
  rooms: Room[];
  onEdit: (t: Tenant) => void;
  onDelete: (t: Tenant) => void;
  onRiskChange: (id: bigint, r: RiskLevel) => void;
}) {
  const risk = RISK_META[tenant.riskLevel];
  const room = rooms.find((r) => r.id === tenant.roomId);

  return (
    <Card
      className="bg-card border-border hover:border-primary/40 transition-smooth"
      data-ocid={`tenants.item.${index}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary font-bold text-sm">
            {initials(tenant.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1.5 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-semibold text-sm text-card-foreground">
                  {tenant.name}
                </h3>
                {!tenant.isActive && (
                  <Badge variant="secondary" className="text-xs">
                    Inactive
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => onEdit(tenant)}
                  data-ocid={`tenants.edit_button.${index}`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(tenant)}
                  data-ocid={`tenants.delete_button.${index}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <Phone className="w-3 h-3 shrink-0" />
              <span>{tenant.phone}</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
              <Building2 className="w-3 h-3 shrink-0" />
              <span>
                {room ? `Room ${room.number}` : `Room ${String(tenant.roomId)}`}{" "}
                · Bed {String(tenant.bedId)}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
              <IndianRupee className="w-3 h-3 shrink-0" />
              <span>
                <span className="text-foreground font-medium">
                  {fmtINR(tenant.monthlyRent)}
                </span>{" "}
                / month · Since {fmtDate(tenant.checkInDate)}
              </span>
            </div>
            <div className="mt-2">
              <Select
                value={tenant.riskLevel}
                onValueChange={(v) => onRiskChange(tenant.id, v as RiskLevel)}
              >
                <SelectTrigger
                  className={`h-7 text-xs border w-36 ${risk.className}`}
                  data-ocid={`tenants.risk_select.${index}`}
                >
                  <risk.Icon className="w-3 h-3 mr-1.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={RiskLevel.low}>Low Risk</SelectItem>
                  <SelectItem value={RiskLevel.medium}>Medium Risk</SelectItem>
                  <SelectItem value={RiskLevel.high}>High Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TenantsPage() {
  const { actor, isFetching } = useActor(createActor);
  const qc = useQueryClient();

  // state
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"active" | "inactive" | "settlement" | "exit">(
    "active",
  );
  const [addOpen, setAddOpen] = useState(false);
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);
  const [deleteTenant, setDeleteTenant] = useState<Tenant | null>(null);
  const [exitReason, setExitReason] = useState("");
  const [form, setForm] = useState<TenantFormData>(EMPTY_FORM);

  // queries
  const enabled = !!actor && !isFetching;

  const { data: tenants = [], isLoading: tenantsLoading } = useQuery<Tenant[]>({
    queryKey: ["tenants"],
    queryFn: () => (actor ? actor.getTenants() : []),
    enabled,
  });

  const { data: inactiveTenants = [], isLoading: inactiveLoading } = useQuery<
    Tenant[]
  >({
    queryKey: ["inactiveTenants"],
    queryFn: () => (actor ? actor.getInactiveTenants() : []),
    enabled,
  });

  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ["rooms"],
    queryFn: () => (actor ? actor.getRooms() : []),
    enabled,
  });

  const { data: beds = [] } = useQuery<Bed[]>({
    queryKey: ["beds"],
    queryFn: () => (actor ? actor.getBeds() : []),
    enabled,
  });

  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ["payments"],
    queryFn: () => (actor ? actor.getPayments() : []),
    enabled,
  });

  const isLoading = tenantsLoading || inactiveLoading;

  // mutations
  const addMutation = useMutation({
    mutationFn: async (f: TenantFormData) => {
      if (!actor) throw new Error("Not connected");
      const args: AddTenantArgs = {
        name: f.name,
        phone: f.phone,
        idProof: f.idProof,
        checkInDate: BigInt(new Date(f.checkInDate).getTime()),
        roomId: BigInt(f.roomId),
        bedId: BigInt(f.bedId),
        advancePaid: BigInt(f.advancePaid || "0"),
        monthlyRent: BigInt(f.monthlyRent),
        riskLevel: f.riskLevel,
      };
      return actor.addTenant(args);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenants"] });
      qc.invalidateQueries({ queryKey: ["beds"] });
      setAddOpen(false);
      setForm(EMPTY_FORM);
      toast.success("Tenant added successfully");
    },
    onError: () => toast.error("Failed to add tenant"),
  });

  const editMutation = useMutation({
    mutationFn: async (f: TenantFormData) => {
      if (!actor || !editTenant) throw new Error("Not connected");
      const args: UpdateTenantArgs = {
        id: editTenant.id,
        name: f.name,
        phone: f.phone,
        idProof: f.idProof,
        checkInDate: BigInt(new Date(f.checkInDate).getTime()),
        roomId: BigInt(f.roomId),
        bedId: BigInt(f.bedId),
        advancePaid: BigInt(f.advancePaid || "0"),
        monthlyRent: BigInt(f.monthlyRent),
        riskLevel: f.riskLevel,
        isActive: editTenant.isActive,
        exitReason: editTenant.exitReason,
      };
      return actor.updateTenant(args);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenants"] });
      qc.invalidateQueries({ queryKey: ["beds"] });
      setEditTenant(null);
      toast.success("Tenant updated");
    },
    onError: () => toast.error("Failed to update tenant"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !deleteTenant) throw new Error("Not connected");
      return actor.deleteTenant(deleteTenant.id, exitReason.trim() || null);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenants"] });
      qc.invalidateQueries({ queryKey: ["inactiveTenants"] });
      qc.invalidateQueries({ queryKey: ["beds"] });
      setDeleteTenant(null);
      setExitReason("");
      toast.success("Tenant deactivated");
    },
    onError: () => toast.error("Failed to deactivate tenant"),
  });

  const riskMutation = useMutation({
    mutationFn: async ({
      id,
      riskLevel,
    }: { id: bigint; riskLevel: RiskLevel }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateRiskLevel(id, riskLevel);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Risk level updated");
    },
  });

  // derived
  const allActive = tenants;
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = tab === "inactive" ? inactiveTenants : allActive;
    if (!q) return list;
    return list.filter(
      (t) => t.name.toLowerCase().includes(q) || t.phone.includes(q),
    );
  }, [tab, allActive, inactiveTenants, search]);

  const highRisk = allActive.filter((t) => t.riskLevel === RiskLevel.high);

  // exit analyzer
  const exitCounts = useMemo(() => {
    const all = [...inactiveTenants];
    const counts: Record<string, number> = {
      food: 0,
      rent: 0,
      personal: 0,
      other: 0,
    };
    for (const t of all) {
      if (!t.exitReason) continue;
      const tags = parseExitTags(t.exitReason);
      if (tags.length === 0) counts.other++;
      else for (const tag of tags) counts[tag]++;
    }
    return counts;
  }, [inactiveTenants]);
  const totalExits = Object.values(exitCounts).reduce((s, v) => s + v, 0);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setAddOpen(true);
  };
  const openEdit = (t: Tenant) => {
    setForm(tenantToForm(t));
    setEditTenant(t);
  };

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <Layout title="Tenants">
      <div className="space-y-5 animate-fade-in" data-ocid="tenants.page">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/15">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-foreground">
                Tenants
              </h2>
              <p className="text-xs text-muted-foreground">
                {allActive.length} active · {highRisk.length} high risk
              </p>
            </div>
          </div>
          <Button
            className="gap-2 bg-primary text-primary-foreground"
            onClick={openAdd}
            data-ocid="tenants.add_button"
          >
            <UserPlus className="w-4 h-4" />
            Add Tenant
          </Button>
        </div>

        {/* High risk alert */}
        {highRisk.length > 0 && (
          <Card className="bg-destructive/10 border-destructive/30">
            <CardContent className="py-3 px-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive font-medium">
                {highRisk.length} tenant
                {highRisk.length > 1 ? "s" : ""} flagged as High Risk —{" "}
                {highRisk.map((t) => t.name).join(", ")}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Tabs
            value={tab}
            onValueChange={(v) =>
              setTab(v as "active" | "inactive" | "settlement" | "exit")
            }
          >
            <TabsList>
              <TabsTrigger value="active" data-ocid="tenants.active_tab">
                <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                Active ({allActive.length})
              </TabsTrigger>
              <TabsTrigger value="inactive" data-ocid="tenants.inactive_tab">
                <UserMinus className="w-3.5 h-3.5 mr-1.5" />
                Inactive ({inactiveTenants.length})
              </TabsTrigger>
              <TabsTrigger
                value="settlement"
                data-ocid="tenants.settlement_tab"
              >
                <IndianRupee className="w-3.5 h-3.5 mr-1.5" />
                Settlement
              </TabsTrigger>
              <TabsTrigger value="exit" data-ocid="tenants.exit_tab">
                <TrendingDown className="w-3.5 h-3.5 mr-1.5" />
                Exit Analysis
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {(tab === "active" || tab === "inactive") && (
            <div className="relative sm:ml-auto sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by name or phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-ocid="tenants.search_input"
              />
            </div>
          )}
        </div>

        {/* Settlement tab */}
        {tab === "settlement" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Deposit vs dues breakdown for each active tenant.
            </p>
            {allActive.length === 0 ? (
              <Card
                className="bg-card border-border"
                data-ocid="tenants.settlement.empty_state"
              >
                <CardContent className="py-12 text-center">
                  <IndianRupee className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">
                    No active tenants
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allActive.map((t) => (
                  <SettlementCard
                    key={String(t.id)}
                    tenant={t}
                    payments={payments}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Exit Analysis tab */}
        {tab === "exit" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Why tenants left — parsed from exit reason text.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(EXIT_TAGS).map(([tag, label]) => {
                const count = exitCounts[tag] ?? 0;
                const pct = totalExits > 0 ? (count / totalExits) * 100 : 0;
                return (
                  <Card
                    key={tag}
                    className="bg-card border-border"
                    data-ocid={`tenants.exit_tag.${tag}`}
                  >
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold font-display text-primary">
                        {count}
                      </p>
                      <p className="text-sm text-foreground font-medium">
                        {label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {pct.toFixed(0)}% of exits
                      </p>
                      <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-smooth"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {totalExits === 0 && (
              <Card
                className="bg-card border-border"
                data-ocid="tenants.exit.empty_state"
              >
                <CardContent className="py-12 text-center">
                  <TrendingDown className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">
                    No exit data yet
                  </p>
                </CardContent>
              </Card>
            )}
            {inactiveTenants.filter((t) => t.exitReason).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">
                  Exit Reasons
                </h4>
                {inactiveTenants
                  .filter((t) => t.exitReason)
                  .map((t, i) => (
                    <Card
                      key={String(t.id)}
                      className="bg-card border-border"
                      data-ocid={`tenants.exit_reason.${i + 1}`}
                    >
                      <CardContent className="py-3 px-4 flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                          {initials(t.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {t.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {t.exitReason}
                          </p>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {parseExitTags(t.exitReason ?? "").map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs"
                              >
                                {EXIT_TAGS[tag]}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Active / Inactive list */}
        {(tab === "active" || tab === "inactive") && (
          <div>
            {isLoading ? (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                data-ocid="tenants.loading_state"
              >
                {(["a", "b", "c", "d", "e", "f"] as const).map((k) => (
                  <Card key={k} className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-3 w-28" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <Card
                className="bg-card border-border"
                data-ocid="tenants.empty_state"
              >
                <CardContent className="py-16 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                    {search ? "No results found" : "No tenants yet"}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {search
                      ? "Try a different name or phone number"
                      : "Add your first tenant to get started"}
                  </p>
                  {!search && tab === "active" && (
                    <Button
                      className="gap-2 bg-primary text-primary-foreground"
                      onClick={openAdd}
                      data-ocid="tenants.empty_add_button"
                    >
                      <UserPlus className="w-4 h-4" />
                      Add Tenant
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((tenant, i) => (
                  <TenantCard
                    key={String(tenant.id)}
                    tenant={tenant}
                    index={i + 1}
                    rooms={rooms}
                    onEdit={openEdit}
                    onDelete={setDeleteTenant}
                    onRiskChange={(id, r) =>
                      riskMutation.mutate({ id, riskLevel: r })
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Add Tenant Dialog ─────────────────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="tenants.add_dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Add New Tenant
            </DialogTitle>
          </DialogHeader>
          <TenantForm
            form={form}
            onChange={setForm}
            rooms={rooms}
            beds={beds}
          />
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setAddOpen(false)}
              data-ocid="tenants.add_cancel_button"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary text-primary-foreground"
              disabled={
                !form.name ||
                !form.phone ||
                !form.roomId ||
                !form.bedId ||
                addMutation.isPending
              }
              onClick={() => addMutation.mutate(form)}
              data-ocid="tenants.add_submit_button"
            >
              {addMutation.isPending ? "Adding…" : "Add Tenant"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Tenant Dialog ─────────────────────────────────────────────── */}
      <Dialog
        open={!!editTenant}
        onOpenChange={(o) => !o && setEditTenant(null)}
      >
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="tenants.edit_dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-primary" />
              Edit Tenant
            </DialogTitle>
          </DialogHeader>
          <TenantForm
            form={form}
            onChange={setForm}
            rooms={rooms}
            beds={beds}
            editingId={editTenant?.id}
          />
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setEditTenant(null)}
              data-ocid="tenants.edit_cancel_button"
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary text-primary-foreground"
              disabled={
                !form.name ||
                !form.phone ||
                !form.roomId ||
                !form.bedId ||
                editMutation.isPending
              }
              onClick={() => editMutation.mutate(form)}
              data-ocid="tenants.edit_submit_button"
            >
              {editMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete / Deactivate Confirmation Dialog ────────────────────────── */}
      <Dialog
        open={!!deleteTenant}
        onOpenChange={(o) => {
          if (!o) {
            setDeleteTenant(null);
            setExitReason("");
          }
        }}
      >
        <DialogContent className="max-w-sm" data-ocid="tenants.delete_dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Deactivate Tenant
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will deactivate{" "}
            <span className="text-foreground font-medium">
              {deleteTenant?.name}
            </span>{" "}
            and free their bed. This action can be reviewed but not undone.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="exit-reason">Exit Reason (optional)</Label>
            <Textarea
              id="exit-reason"
              value={exitReason}
              onChange={(e) => setExitReason(e.target.value)}
              placeholder="e.g. Moving out due to rent hike, found accommodation closer to office…"
              rows={3}
              data-ocid="tenants.delete_exit_reason_textarea"
            />
            <p className="text-xs text-muted-foreground">
              Tip: mention food / rent / personal to auto-tag in Exit Analysis
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setDeleteTenant(null);
                setExitReason("");
              }}
              data-ocid="tenants.delete_cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
              data-ocid="tenants.delete_confirm_button"
            >
              {deleteMutation.isPending ? "Deactivating…" : "Deactivate"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
