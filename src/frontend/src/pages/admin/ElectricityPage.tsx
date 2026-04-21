import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AirVent,
  Calculator,
  CheckCircle2,
  History,
  RefreshCw,
  Save,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Layout } from "../../components/Layout";
import { createActor } from "../../services/backend";
import { ExpenseCategory, SplitType } from "../../types";
import type { Expense, Room, Tenant } from "../../types";

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function calcCharges(
  rooms: Room[],
  tenants: Tenant[],
  totalBill: number,
  splitType: SplitType,
): Map<
  string,
  { tenantName: string; roomNumber: string; isAC: boolean; charge: number }
> {
  const result = new Map<
    string,
    { tenantName: string; roomNumber: string; isAC: boolean; charge: number }
  >();
  const activeByRoom = new Map<string, Tenant>();
  for (const t of tenants) {
    if (t.isActive) {
      activeByRoom.set(String(t.roomId), t);
    }
  }

  if (splitType === SplitType.equal) {
    const count = activeByRoom.size;
    if (count === 0) return result;
    const perTenant = Math.round(totalBill / count);
    for (const [roomId, tenant] of activeByRoom.entries()) {
      const room = rooms.find((r) => String(r.id) === roomId);
      result.set(String(tenant.id), {
        tenantName: tenant.name,
        roomNumber: room?.number ?? "—",
        isAC: room?.isAC ?? false,
        charge: perTenant,
      });
    }
  } else {
    // Weighted: AC rooms = 1.5x, Non-AC = 1x
    let totalUnits = 0;
    for (const [roomId, _] of activeByRoom.entries()) {
      const room = rooms.find((r) => String(r.id) === roomId);
      totalUnits += room?.isAC ? 1.5 : 1;
    }
    if (totalUnits === 0) return result;
    const unitValue = totalBill / totalUnits;
    for (const [roomId, tenant] of activeByRoom.entries()) {
      const room = rooms.find((r) => String(r.id) === roomId);
      const units = room?.isAC ? 1.5 : 1;
      result.set(String(tenant.id), {
        tenantName: tenant.name,
        roomNumber: room?.number ?? "—",
        isAC: room?.isAC ?? false,
        charge: Math.round(unitValue * units),
      });
    }
  }
  return result;
}

export default function ElectricityPage() {
  const { actor, isFetching } = useActor(createActor);
  const qc = useQueryClient();
  const today = new Date();
  const [selMonth, setSelMonth] = useState(today.getMonth() + 1);
  const [selYear, setSelYear] = useState(today.getFullYear());
  const [totalBill, setTotalBill] = useState("");
  const [splitType, setSplitType] = useState<SplitType>(SplitType.weighted);
  const [acOverrides, setAcOverrides] = useState<Map<string, boolean>>(
    new Map(),
  );

  const { data: rooms = [], isLoading: roomsLoading } = useQuery<Room[]>({
    queryKey: ["rooms"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRooms();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: tenants = [] } = useQuery<Tenant[]>({
    queryKey: ["tenants"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTenants();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: expenses = [], isLoading: expLoading } = useQuery<Expense[]>({
    queryKey: ["expenses"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getExpenses();
    },
    enabled: !!actor && !isFetching,
  });

  const { mutate: toggleRoomAC, isPending: togglingAC } = useMutation({
    mutationFn: async ({ room, isAC }: { room: Room; isAC: boolean }) => {
      if (!actor) throw new Error("Not ready");
      return actor.updateRoom({ ...room, isAC });
    },
    onSuccess: (_, { room, isAC }) => {
      toast.success(`Room ${room.number} set to ${isAC ? "AC" : "Non-AC"}`);
      qc.invalidateQueries({ queryKey: ["rooms"] });
      const next = new Map(acOverrides);
      next.delete(String(room.id));
      setAcOverrides(next);
    },
    onError: () => toast.error("Failed to update room type"),
  });

  const { mutate: saveExpense, isPending: saving } = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not ready");
      const amount = Number(totalBill);
      if (!amount || amount <= 0) throw new Error("Enter a valid amount");
      return actor.addExpense({
        category: ExpenseCategory.electricity,
        amount: BigInt(Math.round(amount)),
        month: BigInt(selMonth),
        year: BigInt(selYear),
        notes: `Electricity bill - ${MONTHS[selMonth - 1]} ${selYear}`,
        splitType,
      });
    },
    onSuccess: () => {
      toast.success("Electricity expense saved");
      qc.invalidateQueries({ queryKey: ["expenses"] });
      setTotalBill("");
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Failed to save expense"),
  });

  const roomsWithOverride = useMemo(
    () =>
      rooms.map((r) => ({
        ...r,
        isAC: acOverrides.has(String(r.id))
          ? (acOverrides.get(String(r.id)) ?? r.isAC)
          : r.isAC,
      })),
    [rooms, acOverrides],
  );

  const charges = useMemo(() => {
    const bill = Number(totalBill);
    if (!bill || bill <= 0) return new Map();
    return calcCharges(roomsWithOverride, tenants, bill, splitType);
  }, [roomsWithOverride, tenants, totalBill, splitType]);

  const elecExpenses = useMemo(
    () => expenses.filter((e) => e.category === ExpenseCategory.electricity),
    [expenses],
  );

  const yearOptions = Array.from(
    { length: 3 },
    (_, i) => today.getFullYear() - 1 + i,
  );

  const activeRooms = useMemo(() => {
    const occupiedRoomIds = new Set(
      tenants.filter((t) => t.isActive).map((t) => String(t.roomId)),
    );
    return roomsWithOverride.filter((r) => occupiedRoomIds.has(String(r.id)));
  }, [roomsWithOverride, tenants]);

  return (
    <Layout title="Electricity">
      <div className="space-y-6 animate-fade-in" data-ocid="electricity.page">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/15">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-foreground">
              Electricity
            </h2>
            <p className="text-xs text-muted-foreground">
              Smart bill splitting for AC &amp; Non-AC rooms
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Bill Entry + Room Config */}
          <div className="lg:col-span-2 space-y-5">
            {/* Month + Year Selector */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base text-card-foreground">
                  Billing Period
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div
                  className="flex gap-1 flex-wrap"
                  data-ocid="electricity.month_selector"
                >
                  {MONTH_SHORT.map((m, i) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setSelMonth(i + 1)}
                      data-ocid={`electricity.month_tab.${i + 1}`}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-smooth border ${
                        selMonth === i + 1
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1">
                  {yearOptions.map((y) => (
                    <button
                      type="button"
                      key={y}
                      onClick={() => setSelYear(y)}
                      data-ocid={`electricity.year_tab.${y}`}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-smooth border ${
                        selYear === y
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Bill Entry */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base text-card-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4 text-chart-2" />
                  Total Bill Amount
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    Electricity bill for {MONTHS[selMonth - 1]} {selYear} (₹)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                      ₹
                    </span>
                    <Input
                      type="number"
                      value={totalBill}
                      onChange={(e) => setTotalBill(e.target.value)}
                      placeholder="e.g. 4500"
                      className="pl-8 bg-muted/50 border-border text-foreground text-lg font-semibold h-12"
                      data-ocid="electricity.bill_input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    Split Method
                  </Label>
                  <Tabs
                    value={splitType}
                    onValueChange={(v) => setSplitType(v as SplitType)}
                  >
                    <TabsList className="bg-muted/60 border border-border w-full">
                      <TabsTrigger
                        value={SplitType.equal}
                        className="flex-1 text-sm"
                        data-ocid="electricity.split_equal"
                      >
                        Equal
                      </TabsTrigger>
                      <TabsTrigger
                        value={SplitType.weighted}
                        className="flex-1 text-sm"
                        data-ocid="electricity.split_weighted"
                      >
                        Weighted (AC 1.5×)
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <p className="text-xs text-muted-foreground">
                    {splitType === SplitType.equal
                      ? "Bill divided equally among all active tenants"
                      : "AC rooms pay 1.5× more than Non-AC rooms"}
                  </p>
                </div>

                <Button
                  className="w-full gap-2 bg-primary text-primary-foreground"
                  onClick={() => saveExpense()}
                  disabled={saving || !totalBill || !actor || isFetching}
                  data-ocid="electricity.save_expense_button"
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save as Expense
                </Button>
              </CardContent>
            </Card>

            {/* Room AC Toggle */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base text-card-foreground flex items-center gap-2">
                  <AirVent className="w-4 h-4 text-chart-4" />
                  Room Configuration
                  <span className="text-xs font-normal text-muted-foreground ml-auto">
                    {activeRooms.filter((r) => r.isAC).length} AC ·{" "}
                    {activeRooms.filter((r) => !r.isAC).length} Non-AC
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {roomsLoading ? (
                  <div
                    className="space-y-3"
                    data-ocid="electricity.rooms_loading_state"
                  >
                    {(["a", "b", "c"] as const).map((k) => (
                      <Skeleton key={k} className="h-12 w-full" />
                    ))}
                  </div>
                ) : activeRooms.length === 0 ? (
                  <div
                    className="py-8 text-center"
                    data-ocid="electricity.rooms_empty_state"
                  >
                    <p className="text-muted-foreground text-sm">
                      No active rooms with tenants found
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeRooms.map((room, i) => {
                      const tenant = tenants.find(
                        (t) =>
                          t.isActive && String(t.roomId) === String(room.id),
                      );
                      return (
                        <div
                          key={String(room.id)}
                          className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-muted/30 border border-border/50"
                          data-ocid={`electricity.room.${i + 1}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-primary">
                                {room.number}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {tenant?.name ?? "Occupied"}
                              </p>
                              <div className="flex items-center gap-1">
                                <Badge
                                  variant="outline"
                                  className={`text-xs h-4 px-1.5 ${
                                    room.isAC
                                      ? "bg-chart-4/15 text-chart-4 border-chart-4/30"
                                      : "bg-muted/50 text-muted-foreground border-border"
                                  }`}
                                >
                                  {room.isAC ? "AC" : "Non-AC"}
                                </Badge>
                                {charges.has(String(tenant?.id)) && (
                                  <span className="text-xs text-muted-foreground">
                                    · ₹
                                    {charges
                                      .get(String(tenant?.id))
                                      ?.charge.toLocaleString("en-IN")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-muted-foreground">
                              AC
                            </span>
                            <Switch
                              checked={room.isAC}
                              disabled={togglingAC}
                              onCheckedChange={(checked) =>
                                toggleRoomAC({
                                  room:
                                    rooms.find(
                                      (r) => String(r.id) === String(room.id),
                                    ) ?? room,
                                  isAC: checked,
                                })
                              }
                              data-ocid={`electricity.room_ac_toggle.${i + 1}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Calculated Charges + History */}
          <div className="space-y-5">
            {/* Per-tenant Charges */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base text-card-foreground flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-primary" />
                  Per-Tenant Charges
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!totalBill || Number(totalBill) <= 0 ? (
                  <div
                    className="py-8 text-center"
                    data-ocid="electricity.charges_empty_state"
                  >
                    <Calculator className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-muted-foreground text-xs">
                      Enter a bill amount to see per-tenant charges
                    </p>
                  </div>
                ) : charges.size === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground text-xs">
                      No active tenants found
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[...charges.entries()].map(([tenantId, info], i) => (
                      <div
                        key={tenantId}
                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 border border-border/50"
                        data-ocid={`electricity.charge.${i + 1}`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {info.tenantName}
                          </p>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">
                              Rm {info.roomNumber}
                            </span>
                            {info.isAC && (
                              <Badge
                                variant="outline"
                                className="text-xs h-4 px-1.5 bg-chart-4/15 text-chart-4 border-chart-4/30"
                              >
                                AC
                              </Badge>
                            )}
                          </div>
                        </div>
                        <span className="font-display font-bold text-foreground tabular-nums">
                          ₹{info.charge.toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Total
                      </span>
                      <span className="font-display font-bold text-primary tabular-nums">
                        ₹
                        {[...charges.values()]
                          .reduce((s, c) => s + c.charge, 0)
                          .toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Electricity Expense History */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base text-card-foreground flex items-center gap-2">
                  <History className="w-4 h-4 text-muted-foreground" />
                  Bill History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {expLoading ? (
                  <div
                    className="space-y-2"
                    data-ocid="electricity.history_loading_state"
                  >
                    {(["a", "b", "c"] as const).map((k) => (
                      <Skeleton key={k} className="h-10 w-full" />
                    ))}
                  </div>
                ) : elecExpenses.length === 0 ? (
                  <div
                    className="py-8 text-center"
                    data-ocid="electricity.history_empty_state"
                  >
                    <History className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-muted-foreground text-xs">
                      No electricity expenses saved yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {elecExpenses
                      .slice()
                      .sort((a, b) => {
                        const aT = Number(a.year) * 100 + Number(a.month);
                        const bT = Number(b.year) * 100 + Number(b.month);
                        return bT - aT;
                      })
                      .slice(0, 12)
                      .map((exp, i) => (
                        <div
                          key={String(exp.id)}
                          className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 border border-border/50"
                          data-ocid={`electricity.history_item.${i + 1}`}
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {MONTH_SHORT[Number(exp.month) - 1]}{" "}
                              {String(exp.year)}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {exp.splitType === SplitType.weighted
                                ? "Weighted"
                                : "Equal"}{" "}
                              split
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-display font-bold text-foreground tabular-nums">
                              ₹{Number(exp.amount).toLocaleString("en-IN")}
                            </p>
                            <Badge
                              variant="outline"
                              className="text-xs h-4 px-1.5 bg-chart-2/15 text-chart-2 border-chart-2/30"
                            >
                              <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                              Saved
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
