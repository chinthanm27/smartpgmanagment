import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  CreditCard,
  IndianRupee,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { Layout } from "../../components/Layout";
import { createActor } from "../../services/backend";
import type { DashboardStats, Expense, Payment, Tenant } from "../../types";
import { PaymentStatus, RiskLevel } from "../../types";

const MONTH_NAMES = [
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

// ─── KPI Card ──────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  colorClass,
  ocid,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  colorClass: string;
  ocid?: string;
}) {
  return (
    <Card
      className="bg-card border-border hover:border-primary/30 transition-smooth"
      data-ocid={ocid}
    >
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
              {label}
            </p>
            <p className={`text-2xl font-display font-bold mt-1 ${colorClass}`}>
              {value}
            </p>
            {sub && (
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            )}
          </div>
          <div className="p-2 rounded-lg bg-muted/60 shrink-0">
            <Icon className={`w-5 h-5 ${colorClass}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Bar column (existing chart) ──────────────────────────────────

function BarColumn({
  label,
  revenue,
  expense,
  maxValue,
}: {
  label: string;
  revenue: number;
  expense: number;
  maxValue: number;
}) {
  const revH = maxValue > 0 ? Math.round((revenue / maxValue) * 100) : 0;
  const expH = maxValue > 0 ? Math.round((expense / maxValue) * 100) : 0;
  return (
    <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
      <div className="w-full flex gap-0.5 items-end h-36">
        <div
          className="flex-1 bg-primary/70 rounded-t-sm transition-smooth hover:bg-primary cursor-default"
          style={{ height: `${revH}%`, minHeight: revenue > 0 ? "4px" : "0" }}
          title={`Revenue ₹${revenue.toLocaleString("en-IN")}`}
        />
        <div
          className="flex-1 bg-destructive/60 rounded-t-sm transition-smooth hover:bg-destructive/80 cursor-default"
          style={{ height: `${expH}%`, minHeight: expense > 0 ? "4px" : "0" }}
          title={`Expenses ₹${expense.toLocaleString("en-IN")}`}
        />
      </div>
      <span className="text-xs text-muted-foreground truncate">{label}</span>
    </div>
  );
}

// ─── Income Trend Column (grouped bar + net indicator) ─────────────

function TrendColumn({
  label,
  income,
  expense,
  maxValue,
}: {
  label: string;
  income: number;
  expense: number;
  maxValue: number;
}) {
  const incH =
    maxValue > 0
      ? Math.max(Math.round((income / maxValue) * 100), income > 0 ? 3 : 0)
      : 0;
  const expH =
    maxValue > 0
      ? Math.max(Math.round((expense / maxValue) * 100), expense > 0 ? 3 : 0)
      : 0;
  const net = income - expense;
  const netColor = net >= 0 ? "#22c55e" : "#ef4444";

  return (
    <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
      {/* Net indicator */}
      <span
        className="text-[9px] font-bold tabular-nums"
        style={{ color: net !== 0 ? netColor : "#6b7280" }}
      >
        {net === 0
          ? "—"
          : `${net > 0 ? "+" : ""}${net >= 1000 ? `${(net / 1000).toFixed(0)}k` : net}`}
      </span>

      {/* Bars */}
      <div className="w-full flex gap-0.5 items-end h-28">
        <div
          className="flex-1 rounded-t-sm cursor-default transition-smooth hover:opacity-90"
          style={{
            height: `${incH}%`,
            minHeight: income > 0 ? "4px" : "0",
            background: "rgb(34 197 94 / 0.7)",
          }}
          title={`Income ₹${income.toLocaleString("en-IN")}`}
        />
        <div
          className="flex-1 rounded-t-sm cursor-default transition-smooth hover:opacity-90"
          style={{
            height: `${expH}%`,
            minHeight: expense > 0 ? "4px" : "0",
            background: "rgb(239 68 68 / 0.65)",
          }}
          title={`Expenses ₹${expense.toLocaleString("en-IN")}`}
        />
      </div>

      <span className="text-[10px] text-muted-foreground truncate font-medium">
        {label}
      </span>
    </div>
  );
}

// ─── Occupancy Donut ───────────────────────────────────────────────

function OccupancyDonut({ pct }: { pct: number }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);
  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width="110"
        height="110"
        viewBox="0 0 110 110"
        aria-label={`Occupancy: ${pct}%`}
        role="img"
      >
        <circle
          cx="55"
          cy="55"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          className="text-muted/40"
        />
        <circle
          cx="55"
          cy="55"
          r={r}
          fill="none"
          stroke="oklch(var(--primary))"
          strokeWidth="12"
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease-out" }}
        />
        <text
          x="55"
          y="58"
          textAnchor="middle"
          className="text-foreground"
          fontSize="18"
          fontWeight="700"
          fill="currentColor"
        >
          {pct}%
        </text>
      </svg>
      <p className="text-xs text-muted-foreground">Occupancy Rate</p>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { actor, isFetching } = useActor(createActor);
  const enabled = !!actor && !isFetching;

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getDashboardStats();
    },
    enabled,
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<
    Payment[]
  >({
    queryKey: ["payments"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPayments();
    },
    enabled,
  });

  const { data: expenses = [], isLoading: expensesLoading } = useQuery<
    Expense[]
  >({
    queryKey: ["expenses"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getExpenses();
    },
    enabled,
  });

  const { data: tenants = [], isLoading: tenantsLoading } = useQuery<Tenant[]>({
    queryKey: ["tenants"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTenants();
    },
    enabled,
  });

  const isLoading =
    statsLoading || paymentsLoading || expensesLoading || tenantsLoading;

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const paidPayments = payments.filter((p) => p.status === PaymentStatus.paid);
  const totalRevenue = paidPayments.reduce((s, p) => s + Number(p.amount), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const netIncome = totalRevenue - totalExpenses;

  const collectionRate = payments.length
    ? Math.round((paidPayments.length / payments.length) * 100)
    : 0;

  const occupancyRate = stats
    ? Math.round(
        (Number(stats.occupiedBeds) / Math.max(Number(stats.totalBeds), 1)) *
          100,
      )
    : 0;

  // Month-wise data last 6 months (for existing Revenue vs Expenses chart)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(currentYear, currentMonth - 1 - (5 - i), 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const revenue = payments
      .filter(
        (p) =>
          Number(p.month) === m &&
          Number(p.year) === y &&
          p.status === PaymentStatus.paid,
      )
      .reduce((s, p) => s + Number(p.amount), 0);
    const expense = expenses
      .filter((e) => Number(e.month) === m && Number(e.year) === y)
      .reduce((s, e) => s + Number(e.amount), 0);
    return { label: MONTH_NAMES[m - 1], revenue, expense };
  });

  const maxValue = Math.max(
    ...monthlyData.map((d) => Math.max(d.revenue, d.expense)),
    1,
  );

  // Income vs Expense Trend (12 months)
  const trendData = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(currentYear, currentMonth - 1 - (11 - i), 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const income = payments
      .filter(
        (p) =>
          Number(p.month) === m &&
          Number(p.year) === y &&
          p.status === PaymentStatus.paid,
      )
      .reduce((s, p) => s + Number(p.amount), 0);
    const expense = expenses
      .filter((e) => Number(e.month) === m && Number(e.year) === y)
      .reduce((s, e) => s + Number(e.amount), 0);
    return { label: MONTH_NAMES[m - 1], income, expense };
  });

  const trendMax = Math.max(
    ...trendData.map((d) => Math.max(d.income, d.expense)),
    1,
  );

  const totalTrendIncome = trendData.reduce((s, d) => s + d.income, 0);
  const totalTrendExpense = trendData.reduce((s, d) => s + d.expense, 0);
  const avgMonthlyProfit = Math.round(
    (totalTrendIncome - totalTrendExpense) / 12,
  );

  // This month breakdown
  const thisMonthPaid = payments
    .filter(
      (p) =>
        Number(p.month) === currentMonth &&
        Number(p.year) === currentYear &&
        p.status === PaymentStatus.paid,
    )
    .reduce((s, p) => s + Number(p.amount), 0);
  const thisMonthPending = payments
    .filter(
      (p) =>
        Number(p.month) === currentMonth &&
        Number(p.year) === currentYear &&
        p.status === PaymentStatus.pending,
    )
    .reduce((s, p) => s + Number(p.amount), 0);
  const thisMonthOverdue = payments
    .filter(
      (p) =>
        Number(p.month) === currentMonth &&
        Number(p.year) === currentYear &&
        p.status === PaymentStatus.overdue,
    )
    .reduce((s, p) => s + Number(p.amount), 0);

  // Risk distribution
  const activeT = tenants.filter((t) => t.isActive);
  const highRisk = activeT.filter((t) => t.riskLevel === RiskLevel.high).length;
  const medRisk = activeT.filter(
    (t) => t.riskLevel === RiskLevel.medium,
  ).length;
  const lowRisk = activeT.filter((t) => t.riskLevel === RiskLevel.low).length;
  const avgRent = activeT.length
    ? Math.round(
        activeT.reduce((s, t) => s + Number(t.monthlyRent), 0) / activeT.length,
      )
    : 0;

  return (
    <Layout title="Analytics">
      <div className="space-y-6 animate-fade-in" data-ocid="analytics.page">
        {/* Page header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/15">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-foreground">
              Analytics
            </h2>
            <p className="text-xs text-muted-foreground">
              Financial overview and PG insights
            </p>
          </div>
          <Badge className="ml-auto bg-muted text-muted-foreground border-border text-xs">
            {MONTH_NAMES[currentMonth - 1]} {currentYear}
          </Badge>
        </div>

        {/* ── KPI Cards ── */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          data-ocid="analytics.kpi.section"
        >
          {isLoading ? (
            ["a", "b", "c", "d"].map((k) => (
              <Card key={k} className="bg-card border-border">
                <CardContent className="pt-5 pb-4">
                  <Skeleton className="h-3 w-24 mb-2" />
                  <Skeleton className="h-8 w-20 mb-1" />
                  <Skeleton className="h-2.5 w-16" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <KpiCard
                label="Total Revenue"
                value={`₹${totalRevenue.toLocaleString("en-IN")}`}
                sub="all time paid"
                icon={IndianRupee}
                colorClass="text-primary"
                ocid="analytics.total_revenue.card"
              />
              <KpiCard
                label="Total Expenses"
                value={`₹${totalExpenses.toLocaleString("en-IN")}`}
                sub="all recorded"
                icon={TrendingDown}
                colorClass="text-destructive"
              />
              <KpiCard
                label="Net Income"
                value={`₹${netIncome.toLocaleString("en-IN")}`}
                sub={netIncome >= 0 ? "profitable" : "in deficit"}
                icon={TrendingUp}
                colorClass={
                  netIncome >= 0 ? "text-chart-1" : "text-destructive"
                }
              />
              <KpiCard
                label="Collection Rate"
                value={`${collectionRate}%`}
                sub="payments collected"
                icon={CreditCard}
                colorClass="text-chart-5"
              />
            </>
          )}
        </div>

        {/* ── Chart + Occupancy ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card
            className="bg-card border-border lg:col-span-2"
            data-ocid="analytics.revenue_chart.card"
          >
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base text-card-foreground">
                Revenue vs Expenses — Last 6 Months
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div
                  className="h-44 flex items-end gap-3"
                  data-ocid="analytics.loading_state"
                >
                  {["a", "b", "c", "d", "e", "f"].map((k) => (
                    <div
                      key={k}
                      className="flex-1 flex flex-col gap-1 items-center"
                    >
                      <Skeleton
                        className="w-full rounded-sm"
                        style={{ height: "60px" }}
                      />
                      <Skeleton className="h-3 w-8" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex items-end gap-2 h-40">
                    {monthlyData.map((d) => (
                      <BarColumn
                        key={d.label}
                        label={d.label}
                        revenue={d.revenue}
                        expense={d.expense}
                        maxValue={maxValue}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-primary/70 inline-block" />
                      Revenue
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-destructive/60 inline-block" />
                      Expenses
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card
            className="bg-card border-border"
            data-ocid="analytics.occupancy.card"
          >
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base text-card-foreground">
                Occupancy
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              {isLoading ? (
                <Skeleton className="w-28 h-28 rounded-full" />
              ) : (
                <>
                  <OccupancyDonut pct={occupancyRate} />
                  <div className="w-full grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-muted/40 p-2.5 text-center">
                      <p className="text-xs text-muted-foreground">Occupied</p>
                      <p className="text-lg font-bold font-display text-primary">
                        {Number(stats?.occupiedBeds ?? 0)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-2.5 text-center">
                      <p className="text-xs text-muted-foreground">Vacant</p>
                      <p className="text-lg font-bold font-display text-chart-5">
                        {Number(stats?.totalBeds ?? 0) -
                          Number(stats?.occupiedBeds ?? 0)}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Income vs Expense Trend (12 months) ── */}
        <Card
          className="bg-card border-border"
          data-ocid="analytics.income_trend.card"
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="font-display text-base text-card-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-chart-1" />
                Income vs Expense Trend — Last 12 Months
              </CardTitle>
              {!isLoading && (
                <div className="flex items-center gap-3 text-xs">
                  <span
                    className={`font-semibold ${avgMonthlyProfit >= 0 ? "text-chart-1" : "text-destructive"}`}
                  >
                    Avg. Monthly Net: {avgMonthlyProfit >= 0 ? "+" : ""}₹
                    {Math.abs(avgMonthlyProfit).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-44 flex items-end gap-1.5">
                {[
                  "jan",
                  "feb",
                  "mar",
                  "apr",
                  "may",
                  "jun",
                  "jul",
                  "aug",
                  "sep",
                  "oct",
                  "nov",
                  "dec",
                ].map((k) => (
                  <div
                    key={k}
                    className="flex-1 flex flex-col gap-1 items-center"
                  >
                    <Skeleton
                      className="w-full rounded-sm"
                      style={{ height: "55px" }}
                    />
                    <Skeleton className="h-2.5 w-6" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="flex items-end gap-1.5 h-36 pb-1">
                  {trendData.map((d) => (
                    <TrendColumn
                      key={`${d.label}-trend`}
                      label={d.label}
                      income={d.income}
                      expense={d.expense}
                      maxValue={trendMax}
                    />
                  ))}
                </div>

                {/* Summary row */}
                <div className="mt-4 pt-3 border-t border-border grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-chart-1/10 border border-chart-1/20 px-3 py-2.5 text-center">
                    <p className="text-[10px] text-chart-1/70 uppercase tracking-wide font-medium mb-0.5">
                      Total Income
                    </p>
                    <p className="font-display font-bold text-sm text-chart-1">
                      ₹{totalTrendIncome.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-center">
                    <p className="text-[10px] text-destructive/70 uppercase tracking-wide font-medium mb-0.5">
                      Total Expense
                    </p>
                    <p className="font-display font-bold text-sm text-destructive">
                      ₹{totalTrendExpense.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div
                    className={`rounded-lg px-3 py-2.5 text-center border ${totalTrendIncome - totalTrendExpense >= 0 ? "bg-chart-1/10 border-chart-1/20" : "bg-destructive/10 border-destructive/20"}`}
                  >
                    <p
                      className={`text-[10px] uppercase tracking-wide font-medium mb-0.5 ${totalTrendIncome - totalTrendExpense >= 0 ? "text-chart-1/70" : "text-destructive/70"}`}
                    >
                      Net Profit
                    </p>
                    <p
                      className={`font-display font-bold text-sm ${totalTrendIncome - totalTrendExpense >= 0 ? "text-chart-1" : "text-destructive"}`}
                    >
                      ₹
                      {Math.abs(
                        totalTrendIncome - totalTrendExpense,
                      ).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-5 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-sm inline-block"
                      style={{ background: "rgb(34 197 94 / 0.7)" }}
                    />
                    Income (rent collected)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-sm inline-block"
                      style={{ background: "rgb(239 68 68 / 0.65)" }}
                    />
                    Expenses
                  </span>
                  <span className="flex items-center gap-1.5 ml-auto">
                    <span className="font-bold text-chart-1">+123</span> =
                    monthly net profit
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* ── This Month + Risk Distribution ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card
            className="bg-card border-border"
            data-ocid="analytics.this_month.card"
          >
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base text-card-foreground">
                This Month — {MONTH_NAMES[currentMonth - 1]} {currentYear}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {["a", "b", "c"].map((k) => (
                    <Skeleton key={k} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    {
                      label: "Collected",
                      amount: thisMonthPaid,
                      color: "bg-chart-1",
                      textColor: "text-chart-1",
                    },
                    {
                      label: "Pending",
                      amount: thisMonthPending,
                      color: "bg-chart-5",
                      textColor: "text-chart-5",
                    },
                    {
                      label: "Overdue",
                      amount: thisMonthOverdue,
                      color: "bg-destructive",
                      textColor: "text-destructive",
                    },
                  ].map(({ label, amount, color, textColor }) => {
                    const total =
                      thisMonthPaid + thisMonthPending + thisMonthOverdue;
                    const pct =
                      total > 0 ? Math.round((amount / total) * 100) : 0;
                    return (
                      <div key={label}>
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span className="text-muted-foreground">{label}</span>
                          <span
                            className={`font-semibold font-mono ${textColor}`}
                          >
                            ₹{amount.toLocaleString("en-IN")} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${color} rounded-full transition-smooth`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-1 border-t border-border flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Avg. Rent / Tenant
                    </span>
                    <span className="font-semibold text-foreground font-mono">
                      ₹{avgRent.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card
            className="bg-card border-border"
            data-ocid="analytics.risk_distribution.card"
          >
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base text-card-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Tenant Risk Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {["a", "b", "c"].map((k) => (
                    <Skeleton key={k} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {[
                    {
                      label: "Low Risk",
                      count: lowRisk,
                      total: activeT.length,
                      color: "bg-chart-1",
                      textColor: "text-chart-1",
                      badge: "bg-chart-1/15 text-chart-1",
                    },
                    {
                      label: "Medium Risk",
                      count: medRisk,
                      total: activeT.length,
                      color: "bg-chart-5",
                      textColor: "text-chart-5",
                      badge: "bg-chart-5/15 text-chart-5",
                    },
                    {
                      label: "High Risk",
                      count: highRisk,
                      total: activeT.length,
                      color: "bg-destructive",
                      textColor: "text-destructive",
                      badge: "bg-destructive/15 text-destructive",
                    },
                  ].map(({ label, count, total, color, badge }) => {
                    const pct =
                      total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-muted-foreground">
                            {label}
                          </span>
                          <Badge className={`${badge} text-[10px] px-2`}>
                            {count} tenants
                          </Badge>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${color} rounded-full transition-smooth`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 text-right">
                          {pct}% of active
                        </p>
                      </div>
                    );
                  })}
                  <div className="pt-1 border-t border-border flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Active Tenants
                    </span>
                    <span className="font-semibold text-foreground">
                      {activeT.length}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
