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
import { Textarea } from "@/components/ui/textarea";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MoreHorizontal,
  Plus,
  Receipt,
  Settings,
  UserCheck,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Layout } from "../../components/Layout";
import { createActor } from "../../services/backend";
import { ExpenseCategory, SplitType } from "../../types";
import type { Expense, GuestLog, MicroCharge, Tenant } from "../../types";

const CATEGORY_CONFIG = {
  [ExpenseCategory.electricity]: {
    label: "Electricity",
    icon: Zap,
    color: "text-yellow-400 bg-yellow-400/15",
  },
  [ExpenseCategory.generator]: {
    label: "Generator",
    icon: Settings,
    color: "text-orange-400 bg-orange-400/15",
  },
  [ExpenseCategory.maintenance]: {
    label: "Maintenance",
    icon: Wrench,
    color: "text-blue-400 bg-blue-400/15",
  },
  [ExpenseCategory.other]: {
    label: "Other",
    icon: MoreHorizontal,
    color: "text-muted-foreground bg-muted/60",
  },
};

const MONTH_NAMES = [
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

const SHORT_MONTHS = [
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

export default function ExpensesPage() {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();
  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(String(now.getMonth() + 1));
  const [filterYear, setFilterYear] = useState(String(now.getFullYear()));
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: ExpenseCategory.other as ExpenseCategory,
    amount: "",
    month: String(now.getMonth() + 1),
    year: String(now.getFullYear()),
    notes: "",
    splitType: SplitType.equal as SplitType,
  });
  const [guestForm, setGuestForm] = useState({
    tenantId: "",
    guestName: "",
    checkIn: "",
    checkOut: "",
    extraCharge: "",
  });

  const { data: expenses = [], isLoading: expensesLoading } = useQuery<
    Expense[]
  >({
    queryKey: ["expenses"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getExpenses();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: guestLogs = [], isLoading: guestsLoading } = useQuery<
    GuestLog[]
  >({
    queryKey: ["guestlogs"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getGuestLogs();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: microCharges = [] } = useQuery<MicroCharge[]>({
    queryKey: ["microcharges"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMicroCharges();
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

  const { mutate: addExpense, isPending: addingExpense } = useMutation({
    mutationFn: async () => {
      if (!actor || !expenseForm.amount) throw new Error("Missing fields");
      return actor.addExpense({
        category: expenseForm.category,
        amount: BigInt(Math.round(Number(expenseForm.amount))),
        month: BigInt(Number(expenseForm.month)),
        year: BigInt(Number(expenseForm.year)),
        notes: expenseForm.notes,
        splitType: expenseForm.splitType,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense recorded");
      setShowExpenseForm(false);
      setExpenseForm({
        category: ExpenseCategory.other,
        amount: "",
        month: String(now.getMonth() + 1),
        year: String(now.getFullYear()),
        notes: "",
        splitType: SplitType.equal,
      });
    },
    onError: () => toast.error("Failed to add expense"),
  });

  const { mutate: addGuestLog, isPending: addingGuest } = useMutation({
    mutationFn: async () => {
      if (
        !actor ||
        !guestForm.tenantId ||
        !guestForm.guestName ||
        !guestForm.checkIn ||
        !guestForm.checkOut
      )
        throw new Error("Missing fields");
      return actor.addGuestLog({
        tenantId: BigInt(guestForm.tenantId),
        guestName: guestForm.guestName,
        checkIn:
          BigInt(new Date(guestForm.checkIn).getTime()) * BigInt(1_000_000),
        checkOut:
          BigInt(new Date(guestForm.checkOut).getTime()) * BigInt(1_000_000),
        extraCharge: BigInt(Math.round(Number(guestForm.extraCharge || "0"))),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guestlogs"] });
      toast.success("Guest log added");
      setShowGuestForm(false);
      setGuestForm({
        tenantId: "",
        guestName: "",
        checkIn: "",
        checkOut: "",
        extraCharge: "",
      });
    },
    onError: () => toast.error("Failed to add guest log"),
  });

  const tenantMap = new Map(tenants.map((t) => [String(t.id), t]));

  const filteredExpenses = expenses.filter(
    (e) =>
      Number(e.month) === Number(filterMonth) &&
      Number(e.year) === Number(filterYear),
  );
  const totalFiltered = filteredExpenses.reduce(
    (s, e) => s + Number(e.amount),
    0,
  );

  // Per-tenant expense summary: electricity share + mess + micro + guest
  const tenantSummary = tenants
    .filter((t) => t.isActive)
    .map((t) => {
      const tenantMicro = microCharges
        .filter((c) => String(c.tenantId) === String(t.id))
        .reduce((s, c) => s + Number(c.amount), 0);
      const tenantGuest = guestLogs
        .filter((g) => String(g.tenantId) === String(t.id))
        .reduce((s, g) => s + Number(g.extraCharge), 0);
      const totalElec = expenses
        .filter(
          (e) =>
            e.category === ExpenseCategory.electricity &&
            e.splitType === SplitType.equal,
        )
        .reduce((s, e) => s + Number(e.amount), 0);
      const elecShare =
        tenants.filter((x) => x.isActive).length > 0
          ? Math.round(totalElec / tenants.filter((x) => x.isActive).length)
          : 0;
      return {
        tenant: t,
        elecShare,
        microCharges: tenantMicro,
        guestCharges: tenantGuest,
        total: elecShare + tenantMicro + tenantGuest,
      };
    });

  const years = [
    now.getFullYear() - 1,
    now.getFullYear(),
    now.getFullYear() + 1,
  ];

  return (
    <Layout title="Expenses">
      <div className="space-y-6 animate-fade-in" data-ocid="expenses.page">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/15">
              <Receipt className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-foreground">
                Expenses
              </h2>
              <p className="text-xs text-muted-foreground">
                ₹{totalFiltered.toLocaleString("en-IN")} in{" "}
                {SHORT_MONTHS[Number(filterMonth) - 1]} {filterYear}
              </p>
            </div>
          </div>
          <Button
            className="gap-2 bg-primary text-primary-foreground"
            onClick={() => setShowExpenseForm(true)}
            data-ocid="expenses.add_button"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </Button>
        </div>

        {/* Month/Year Filters */}
        <div className="flex gap-2 flex-wrap">
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger
              className="w-36 h-9 text-xs bg-card border-border"
              data-ocid="expenses.month_filter"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTH_NAMES.map((m, idx) => (
                <SelectItem key={m} value={String(idx + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger
              className="w-24 h-9 text-xs bg-card border-border"
              data-ocid="expenses.year_filter"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Month Summary card */}
        {!expensesLoading && filteredExpenses.length > 0 && (
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="py-4 px-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  {MONTH_NAMES[Number(filterMonth) - 1]} {filterYear}
                </p>
                <p className="text-2xl font-display font-bold text-foreground">
                  ₹{totalFiltered.toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {filteredExpenses.length} entries
                </p>
              </div>
              <div className="text-right space-y-1">
                {Object.values(ExpenseCategory).map((cat) => {
                  const catTotal = filteredExpenses
                    .filter((e) => e.category === cat)
                    .reduce((s, e) => s + Number(e.amount), 0);
                  if (catTotal === 0) return null;
                  const cfg = CATEGORY_CONFIG[cat];
                  return (
                    <p key={cat} className="text-xs text-muted-foreground">
                      {cfg.label}:{" "}
                      <span className="font-semibold text-foreground">
                        ₹{catTotal.toLocaleString("en-IN")}
                      </span>
                    </p>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expenses List */}
        {expensesLoading ? (
          <div className="space-y-3" data-ocid="expenses.loading_state">
            {(["a", "b", "c", "d"] as const).map((k) => (
              <Card key={k} className="bg-card border-border">
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-40 mb-2" />
                  <Skeleton className="h-3 w-56" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredExpenses.length === 0 ? (
          <Card
            className="bg-card border-border"
            data-ocid="expenses.empty_state"
          >
            <CardContent className="py-16 text-center">
              <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                No expenses for {SHORT_MONTHS[Number(filterMonth) - 1]}{" "}
                {filterYear}
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                Track PG running costs here
              </p>
              <Button
                className="gap-2 bg-primary text-primary-foreground"
                onClick={() => setShowExpenseForm(true)}
                data-ocid="expenses.empty_add_button"
              >
                <Plus className="w-4 h-4" />
                Add Expense
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredExpenses.map((expense, i) => {
              const cfg = CATEGORY_CONFIG[expense.category];
              const CatIcon = cfg.icon;
              return (
                <Card
                  key={String(expense.id)}
                  className="bg-card border-border hover:border-primary/30 transition-smooth"
                  data-ocid={`expenses.item.${i + 1}`}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`p-2 rounded-lg shrink-0 ${cfg.color}`}>
                      <CatIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-card-foreground">
                        {cfg.label}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {expense.notes || "No notes"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {SHORT_MONTHS[Number(expense.month) - 1]}{" "}
                        {String(expense.year)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-display font-bold text-lg text-foreground">
                        ₹{Number(expense.amount).toLocaleString("en-IN")}
                      </p>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {expense.splitType}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Guest Logs Section */}
        <div className="border-t border-border pt-6">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/15">
                <UserCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display font-bold text-xl text-foreground">
                  Guest Logs
                </h2>
                <p className="text-xs text-muted-foreground">
                  {guestLogs.length} guest stays recorded
                </p>
              </div>
            </div>
            <Button
              className="gap-2 bg-primary text-primary-foreground"
              onClick={() => setShowGuestForm(true)}
              data-ocid="expenses.add_guest_button"
            >
              <Plus className="w-4 h-4" />
              Log Guest
            </Button>
          </div>

          {guestsLoading ? (
            <div
              className="space-y-3"
              data-ocid="expenses.guests_loading_state"
            >
              {(["a", "b"] as const).map((k) => (
                <Card key={k} className="bg-card border-border">
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-40 mb-2" />
                    <Skeleton className="h-3 w-48" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : guestLogs.length === 0 ? (
            <Card
              className="bg-card border-border"
              data-ocid="expenses.guests_empty_state"
            >
              <CardContent className="py-10 text-center">
                <UserCheck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No guest stays logged yet
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {guestLogs.map((log, i) => {
                const tenant = tenantMap.get(String(log.tenantId));
                const checkIn = new Date(Number(log.checkIn) / 1_000_000);
                const checkOut = new Date(Number(log.checkOut) / 1_000_000);
                return (
                  <Card
                    key={String(log.id)}
                    className="bg-card border-border hover:border-primary/30 transition-smooth"
                    data-ocid={`expenses.guest_item.${i + 1}`}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/15 shrink-0">
                        <UserCheck className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-card-foreground">
                          {log.guestName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Host:{" "}
                          {tenant?.name ?? `Tenant #${String(log.tenantId)}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {checkIn.toLocaleDateString("en-IN")} →{" "}
                          {checkOut.toLocaleDateString("en-IN")}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-display font-bold text-foreground">
                          ₹{Number(log.extraCharge).toLocaleString("en-IN")}
                        </p>
                        <p className="text-xs text-muted-foreground">extra</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Per-Tenant Expense Summary */}
        {tenantSummary.length > 0 && (
          <div className="border-t border-border pt-6">
            <h2 className="font-display font-bold text-lg text-foreground mb-4">
              Per-Tenant Expense Summary
            </h2>
            <Card
              className="bg-card border-border"
              data-ocid="expenses.tenant_summary"
            >
              <CardContent className="p-0">
                {tenantSummary.map((row, i) => (
                  <div
                    key={String(row.tenant.id)}
                    className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0"
                    data-ocid={`expenses.summary_row.${i + 1}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {row.tenant.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Elec share ₹{row.elecShare.toLocaleString("en-IN")} +
                        Micro ₹{row.microCharges.toLocaleString("en-IN")} +
                        Guest ₹{row.guestCharges.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <p className="font-display font-bold text-primary">
                      ₹{row.total.toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Add Expense Dialog */}
      <Dialog
        open={showExpenseForm}
        onOpenChange={(o) => !addingExpense && setShowExpenseForm(o)}
      >
        <DialogContent
          className="bg-card border-border max-w-md"
          data-ocid="expenses.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display">Add Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Category
                </Label>
                <Select
                  value={expenseForm.category}
                  onValueChange={(v) =>
                    setExpenseForm((f) => ({
                      ...f,
                      category: v as ExpenseCategory,
                    }))
                  }
                >
                  <SelectTrigger
                    className="bg-background border-input"
                    data-ocid="expenses.category_select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ExpenseCategory).map((cat) => (
                      <SelectItem key={cat} value={cat} className="capitalize">
                        {CATEGORY_CONFIG[cat].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Amount (₹)
                </Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="e.g. 3500"
                  value={expenseForm.amount}
                  onChange={(e) =>
                    setExpenseForm((f) => ({ ...f, amount: e.target.value }))
                  }
                  className="bg-background border-input"
                  data-ocid="expenses.amount_input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Month</Label>
                <Select
                  value={expenseForm.month}
                  onValueChange={(v) =>
                    setExpenseForm((f) => ({ ...f, month: v }))
                  }
                >
                  <SelectTrigger
                    className="bg-background border-input"
                    data-ocid="expenses.expense_month_select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES.map((m, idx) => (
                      <SelectItem key={m} value={String(idx + 1)}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Year</Label>
                <Select
                  value={expenseForm.year}
                  onValueChange={(v) =>
                    setExpenseForm((f) => ({ ...f, year: v }))
                  }
                >
                  <SelectTrigger
                    className="bg-background border-input"
                    data-ocid="expenses.expense_year_select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Split Type
              </Label>
              <Select
                value={expenseForm.splitType}
                onValueChange={(v) =>
                  setExpenseForm((f) => ({ ...f, splitType: v as SplitType }))
                }
              >
                <SelectTrigger
                  className="bg-background border-input"
                  data-ocid="expenses.split_type_select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SplitType.equal}>Equal split</SelectItem>
                  <SelectItem value={SplitType.weighted}>
                    Weighted (AC/Non-AC)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Notes</Label>
              <Textarea
                rows={2}
                placeholder="Optional notes..."
                value={expenseForm.notes}
                onChange={(e) =>
                  setExpenseForm((f) => ({ ...f, notes: e.target.value }))
                }
                className="bg-background border-input resize-none text-sm"
                data-ocid="expenses.notes_input"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                className="border-border"
                onClick={() => setShowExpenseForm(false)}
                data-ocid="expenses.cancel_button"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button
                className="bg-primary text-primary-foreground"
                disabled={addingExpense || !expenseForm.amount}
                onClick={() => addExpense()}
                data-ocid="expenses.submit_button"
              >
                {addingExpense ? "Adding..." : "Add Expense"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Guest Log Dialog */}
      <Dialog
        open={showGuestForm}
        onOpenChange={(o) => !addingGuest && setShowGuestForm(o)}
      >
        <DialogContent
          className="bg-card border-border max-w-md"
          data-ocid="expenses.guest_dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display">Log Guest Stay</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Host Tenant
              </Label>
              <Select
                value={guestForm.tenantId}
                onValueChange={(v) =>
                  setGuestForm((f) => ({ ...f, tenantId: v }))
                }
              >
                <SelectTrigger
                  className="bg-background border-input"
                  data-ocid="expenses.guest_tenant_select"
                >
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((t) => (
                    <SelectItem key={String(t.id)} value={String(t.id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Guest Name
              </Label>
              <Input
                placeholder="e.g. Ramesh Kumar"
                value={guestForm.guestName}
                onChange={(e) =>
                  setGuestForm((f) => ({ ...f, guestName: e.target.value }))
                }
                className="bg-background border-input"
                data-ocid="expenses.guest_name_input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Check In
                </Label>
                <Input
                  type="date"
                  value={guestForm.checkIn}
                  onChange={(e) =>
                    setGuestForm((f) => ({ ...f, checkIn: e.target.value }))
                  }
                  className="bg-background border-input"
                  data-ocid="expenses.guest_checkin_input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Check Out
                </Label>
                <Input
                  type="date"
                  value={guestForm.checkOut}
                  onChange={(e) =>
                    setGuestForm((f) => ({ ...f, checkOut: e.target.value }))
                  }
                  className="bg-background border-input"
                  data-ocid="expenses.guest_checkout_input"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Extra Charge (₹)
              </Label>
              <Input
                type="number"
                min={0}
                placeholder="e.g. 200"
                value={guestForm.extraCharge}
                onChange={(e) =>
                  setGuestForm((f) => ({ ...f, extraCharge: e.target.value }))
                }
                className="bg-background border-input"
                data-ocid="expenses.guest_charge_input"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                className="border-border"
                onClick={() => setShowGuestForm(false)}
                data-ocid="expenses.guest_cancel_button"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button
                className="bg-primary text-primary-foreground"
                disabled={
                  addingGuest ||
                  !guestForm.tenantId ||
                  !guestForm.guestName.trim() ||
                  !guestForm.checkIn ||
                  !guestForm.checkOut
                }
                onClick={() => addGuestLog()}
                data-ocid="expenses.guest_submit_button"
              >
                {addingGuest ? "Logging..." : "Log Guest"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
