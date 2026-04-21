import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  BedDouble,
  CheckCircle2,
  Clock,
  CreditCard,
  IndianRupee,
  RefreshCw,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Layout } from "../../components/Layout";
import { createActor } from "../../services/backend";
import type { DashboardStats, Payment, Tenant } from "../../types";
import { PaymentStatus, RiskLevel } from "../../types";

// ─── Sub-components ───────────────────────────────────────────────

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = "default",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  accent?: "default" | "success" | "warning" | "destructive" | "info";
}) {
  const colors = {
    default: { text: "text-primary", bg: "bg-primary/10" },
    success: { text: "text-chart-1", bg: "bg-chart-1/10" },
    warning: { text: "text-chart-5", bg: "bg-chart-5/10" },
    destructive: { text: "text-destructive", bg: "bg-destructive/10" },
    info: { text: "text-chart-4", bg: "bg-chart-4/10" },
  };
  const { text, bg } = colors[accent];
  return (
    <Card className="bg-card border-border hover:border-primary/30 transition-smooth">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider truncate">
              {title}
            </p>
            <p className={`text-2xl font-display font-bold mt-1 ${text}`}>
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
          <div className={`p-2 rounded-lg ${bg} shrink-0`}>
            <Icon className={`w-5 h-5 ${text}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-5 pb-4">
        <Skeleton className="h-3 w-24 mb-2" />
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-2.5 w-20" />
      </CardContent>
    </Card>
  );
}

// ─── PG Health Score gauge ─────────────────────────────────────────

function HealthGauge({
  score,
  occupancyPct,
  collectionPct,
  complaintFactor,
}: {
  score: number;
  occupancyPct: number;
  collectionPct: number;
  complaintFactor: number;
}) {
  const radius = 54;
  const circumference = Math.PI * radius; // half circle
  const dashOffset = circumference * (1 - score / 100);
  const scoreClass =
    score >= 75
      ? "text-chart-1 stroke-chart-1"
      : score >= 50
        ? "text-chart-5 stroke-chart-5"
        : "text-destructive stroke-destructive";
  const badgeClass =
    score >= 75
      ? "bg-chart-1/15 text-chart-1 border-chart-1/30"
      : score >= 50
        ? "bg-chart-5/15 text-chart-5 border-chart-5/30"
        : "bg-destructive/15 text-destructive border-destructive/30";
  const label =
    score >= 75 ? "Healthy" : score >= 50 ? "Fair" : "Needs Attention";

  return (
    <div className="flex flex-col items-center gap-3">
      {/* SVG half-circle gauge */}
      <div className="relative" style={{ width: 140, height: 80 }}>
        <svg
          width="140"
          height="80"
          viewBox="0 0 140 80"
          role="img"
          aria-label={`PG Health Score: ${score}`}
        >
          <path
            d="M 10 70 A 60 60 0 0 1 130 70"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-muted/40"
            strokeLinecap="round"
          />
          <path
            d="M 10 70 A 60 60 0 0 1 130 70"
            fill="none"
            strokeWidth="12"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={`${dashOffset}`}
            strokeLinecap="round"
            className={scoreClass}
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className={`text-3xl font-display font-bold ${scoreClass}`}>
            {score}
          </span>
        </div>
      </div>
      <Badge
        variant="outline"
        className={`text-xs font-semibold px-3 py-0.5 ${badgeClass}`}
      >
        {label}
      </Badge>
      <div className="w-full space-y-2">
        <ScoreRow
          label="Occupancy (40%)"
          pct={occupancyPct}
          color="bg-chart-4"
        />
        <ScoreRow
          label="Payments (40%)"
          pct={collectionPct}
          color="bg-chart-1"
        />
        <ScoreRow
          label="Complaints (20%)"
          pct={complaintFactor}
          color="bg-chart-5"
        />
      </div>
    </div>
  );
}

function ScoreRow({
  label,
  pct,
  color,
}: { label: string; pct: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground font-medium">{pct}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-smooth`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Risk badge helper ─────────────────────────────────────────────

function RiskBadge({ level }: { level: RiskLevel }) {
  if (level === RiskLevel.high)
    return (
      <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-[10px]">
        HIGH
      </Badge>
    );
  if (level === RiskLevel.medium)
    return (
      <Badge className="bg-chart-5/15 text-chart-5 border-chart-5/30 text-[10px]">
        MED
      </Badge>
    );
  return (
    <Badge className="bg-chart-1/15 text-chart-1 border-chart-1/30 text-[10px]">
      LOW
    </Badge>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────

export default function DashboardPage() {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();

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

  const { data: tenants = [], isLoading: tenantsLoading } = useQuery<Tenant[]>({
    queryKey: ["tenants"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTenants();
    },
    enabled,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      const now = new Date();
      return actor.generateMonthlyPayments(
        BigInt(now.getMonth() + 1),
        BigInt(now.getFullYear()),
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      toast.success(`Generated ${data.length} payment records for this month`);
    },
    onError: () => toast.error("Failed to generate payments"),
  });

  const isLoading = statsLoading || paymentsLoading || tenantsLoading;

  // ── Computed values ──────────────────────────────────────────────

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const occupancyPct = stats
    ? Math.round(
        (Number(stats.occupiedBeds) / Math.max(Number(stats.totalBeds), 1)) *
          100,
      )
    : 0;

  const totalPayments =
    Number(stats?.pendingPayments ?? 0) +
    Number(stats?.paidPayments ?? 0) +
    Number(stats?.overduePayments ?? 0);
  const collectionPct =
    totalPayments > 0
      ? Math.round((Number(stats?.paidPayments ?? 0) / totalPayments) * 100)
      : 0;

  const openComplaintsCount = Number(stats?.openComplaints ?? 0);
  const complaintFactor = Math.max(0, 100 - openComplaintsCount * 10);

  const healthScore = Math.round(
    occupancyPct * 0.4 + collectionPct * 0.4 + complaintFactor * 0.2,
  );

  // Monthly income from paid payments this month
  const monthlyIncome = payments
    .filter(
      (p) =>
        Number(p.month) === currentMonth &&
        Number(p.year) === currentYear &&
        p.status === PaymentStatus.paid,
    )
    .reduce((sum, p) => sum + Number(p.amount), 0);

  // Vacant beds count
  const vacantBeds =
    Number(stats?.totalBeds ?? 0) - Number(stats?.occupiedBeds ?? 0);

  // Average rent across active tenants
  const activeTenants = tenants.filter((t) => t.isActive);
  const avgRent = activeTenants.length
    ? Math.round(
        activeTenants.reduce((s, t) => s + Number(t.monthlyRent), 0) /
          activeTenants.length,
      )
    : 8000;

  // Income leak
  const unpaidRentTotal = payments
    .filter(
      (p) =>
        Number(p.month) === currentMonth &&
        Number(p.year) === currentYear &&
        p.status !== PaymentStatus.paid,
    )
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const vacancyLoss = vacantBeds * avgRent;
  const totalLeak = unpaidRentTotal + vacancyLoss;

  // Recent 5 payments sorted by id desc
  const recentPayments = [...payments]
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 5);

  // Tenant map for name lookup
  const tenantMap = new Map(tenants.map((t) => [Number(t.id), t]));

  // Risky tenants
  const riskyTenants = tenants
    .filter((t) => t.isActive && t.riskLevel !== RiskLevel.low)
    .sort((a, b) => {
      const order = {
        [RiskLevel.high]: 0,
        [RiskLevel.medium]: 1,
        [RiskLevel.low]: 2,
      };
      return order[a.riskLevel] - order[b.riskLevel];
    });

  // Overdue payment alerts
  const overdueList = payments
    .filter((p) => p.status === PaymentStatus.overdue)
    .slice(0, 5);

  const timeStr = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <Layout title="Dashboard">
      <div className="space-y-6 animate-fade-in" data-ocid="dashboard.page">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-display font-bold text-2xl text-foreground">
              Namaste! 🙏
            </h2>
            <p className="text-muted-foreground text-sm mt-0.5">{timeStr}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => queryClient.invalidateQueries()}
              data-ocid="dashboard.refresh_button"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              size="sm"
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              data-ocid="dashboard.generate_payments_button"
            >
              <Zap className="w-4 h-4" />
              {generateMutation.isPending ? "Generating…" : "Generate Payments"}
            </Button>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          data-ocid="dashboard.stats.section"
        >
          {isLoading ? (
            ["a", "b", "c", "d", "e", "f", "g", "h"].map((k) => (
              <SkeletonCard key={k} />
            ))
          ) : (
            <>
              <StatCard
                title="Active Tenants"
                value={Number(stats?.activeTenants ?? 0)}
                subtitle={`of ${Number(stats?.totalTenants ?? 0)} total`}
                icon={Users}
                accent="default"
              />
              <StatCard
                title="Vacant Beds"
                value={vacantBeds}
                subtitle={`${Number(stats?.occupiedBeds ?? 0)} occupied of ${Number(stats?.totalBeds ?? 0)}`}
                icon={BedDouble}
                accent={vacantBeds > 3 ? "warning" : "success"}
              />
              <StatCard
                title="Monthly Income"
                value={`₹${monthlyIncome.toLocaleString("en-IN")}`}
                subtitle="paid this month"
                icon={IndianRupee}
                accent="success"
              />
              <StatCard
                title="Pending Payments"
                value={Number(stats?.pendingPayments ?? 0)}
                subtitle="awaiting collection"
                icon={Clock}
                accent="warning"
              />
              <StatCard
                title="Overdue"
                value={Number(stats?.overduePayments ?? 0)}
                subtitle="needs urgent action"
                icon={XCircle}
                accent="destructive"
              />
              <StatCard
                title="Paid This Month"
                value={Number(stats?.paidPayments ?? 0)}
                icon={CheckCircle2}
                accent="success"
              />
              <StatCard
                title="Open Complaints"
                value={Number(stats?.openComplaints ?? 0)}
                icon={AlertTriangle}
                accent={openComplaintsCount > 3 ? "destructive" : "warning"}
              />
              <StatCard
                title="High Risk Tenants"
                value={Number(stats?.highRiskTenants ?? 0)}
                icon={ShieldAlert}
                accent="destructive"
              />
            </>
          )}
        </div>

        {/* ── PG Health + Alerts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Health Score */}
          <Card
            className="bg-card border-border"
            data-ocid="dashboard.health_score.card"
          >
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base text-card-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                PG Health Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <Skeleton className="w-32 h-16 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                  <div className="w-full space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ) : (
                <HealthGauge
                  score={healthScore}
                  occupancyPct={occupancyPct}
                  collectionPct={collectionPct}
                  complaintFactor={complaintFactor}
                />
              )}
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card
            className="bg-card border-border lg:col-span-2"
            data-ocid="dashboard.alerts.card"
          >
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base text-card-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-chart-5" />
                Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3" data-ocid="dashboard.loading_state">
                  {["a", "b", "c"].map((k) => (
                    <Skeleton key={k} className="h-10 w-full" />
                  ))}
                </div>
              ) : overdueList.length === 0 && openComplaintsCount === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-6 gap-2"
                  data-ocid="dashboard.alerts.empty_state"
                >
                  <CheckCircle2 className="w-8 h-8 text-chart-1" />
                  <p className="text-sm text-muted-foreground">
                    No urgent alerts — PG is running smoothly!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {overdueList.map((p, i) => {
                    const tenant = tenantMap.get(Number(p.tenantId));
                    return (
                      <div
                        key={Number(p.id)}
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-destructive/8 border border-destructive/20"
                        data-ocid={`dashboard.alerts.item.${i + 1}`}
                      >
                        <XCircle className="w-4 h-4 text-destructive shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {tenant?.name ?? `Tenant #${Number(p.tenantId)}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Overdue · ₹
                            {Number(p.amount).toLocaleString("en-IN")}
                          </p>
                        </div>
                        <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-[10px] shrink-0">
                          OVERDUE
                        </Badge>
                      </div>
                    );
                  })}
                  {openComplaintsCount > 0 && (
                    <div
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-chart-5/8 border border-chart-5/20"
                      data-ocid="dashboard.alerts.complaints_row"
                    >
                      <AlertTriangle className="w-4 h-4 text-chart-5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          Open Complaints
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {openComplaintsCount} unresolved issues
                        </p>
                      </div>
                      <Badge className="bg-chart-5/15 text-chart-5 border-chart-5/30 text-[10px] shrink-0">
                        {openComplaintsCount} OPEN
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Income Leak + Recent Payments ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Income Leak */}
          <Card
            className="bg-card border-border"
            data-ocid="dashboard.income_leak.card"
          >
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base text-card-foreground flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-destructive" />
                Income Leak Detection
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg bg-muted/40 p-3 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Unpaid Rent (this month)
                      </p>
                      <p className="text-lg font-display font-bold text-chart-5">
                        ₹{unpaidRentTotal.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <CreditCard className="w-8 h-8 text-chart-5/40 shrink-0" />
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Vacancy Loss ({vacantBeds} beds × ₹
                        {avgRent.toLocaleString("en-IN")})
                      </p>
                      <p className="text-lg font-display font-bold text-destructive">
                        ₹{vacancyLoss.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <BedDouble className="w-8 h-8 text-destructive/40 shrink-0" />
                  </div>
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        Total Potential Leak
                      </p>
                      <p className="text-xl font-display font-bold text-destructive">
                        ₹{totalLeak.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-destructive/40 shrink-0" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card
            className="bg-card border-border"
            data-ocid="dashboard.recent_payments.card"
          >
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base text-card-foreground flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-primary" />
                Recent Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {["a", "b", "c", "d", "e"].map((k) => (
                    <Skeleton key={k} className="h-10 w-full" />
                  ))}
                </div>
              ) : recentPayments.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-6 gap-2"
                  data-ocid="dashboard.recent_payments.empty_state"
                >
                  <CreditCard className="w-7 h-7 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    No payments yet
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentPayments.map((p, i) => {
                    const tenant = tenantMap.get(Number(p.tenantId));
                    const isPaid = p.status === PaymentStatus.paid;
                    const isOverdue = p.status === PaymentStatus.overdue;
                    return (
                      <div
                        key={Number(p.id)}
                        className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0"
                        data-ocid={`dashboard.recent_payments.item.${i + 1}`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${isPaid ? "bg-chart-1" : isOverdue ? "bg-destructive" : "bg-chart-5"}`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {tenant?.name ?? `Tenant #${Number(p.tenantId)}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {
                              [
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
                              ][Number(p.month) - 1]
                            }{" "}
                            {Number(p.year)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold font-mono text-foreground">
                            ₹{Number(p.amount).toLocaleString("en-IN")}
                          </p>
                          <Badge
                            className={`text-[9px] px-1.5 py-0 ${isPaid ? "bg-chart-1/15 text-chart-1 border-chart-1/30" : isOverdue ? "bg-destructive/15 text-destructive border-destructive/30" : "bg-chart-5/15 text-chart-5 border-chart-5/30"}`}
                          >
                            {p.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Risky Tenants ── */}
        <Card
          className="bg-card border-border"
          data-ocid="dashboard.risky_tenants.card"
        >
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base text-card-foreground flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-destructive" />
              Risky Tenants
              {!isLoading && riskyTenants.length > 0 && (
                <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-xs ml-auto">
                  {riskyTenants.length} flagged
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {["a", "b", "c"].map((k) => (
                  <Skeleton key={k} className="h-16 w-full" />
                ))}
              </div>
            ) : riskyTenants.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-6 gap-2"
                data-ocid="dashboard.risky_tenants.empty_state"
              >
                <CheckCircle2 className="w-7 h-7 text-chart-1" />
                <p className="text-sm text-muted-foreground">
                  No risky tenants — all good!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {riskyTenants.map((t, i) => (
                  <div
                    key={Number(t.id)}
                    className={`rounded-lg border p-3 flex items-center gap-3 ${
                      t.riskLevel === RiskLevel.high
                        ? "bg-destructive/8 border-destructive/25"
                        : "bg-chart-5/8 border-chart-5/25"
                    }`}
                    data-ocid={`dashboard.risky_tenants.item.${i + 1}`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        t.riskLevel === RiskLevel.high
                          ? "bg-destructive/20 text-destructive"
                          : "bg-chart-5/20 text-chart-5"
                      }`}
                    >
                      {t.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {t.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {t.phone}
                      </p>
                    </div>
                    <RiskBadge level={t.riskLevel} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Property Overview bar ── */}
        <Card
          className="bg-card border-border"
          data-ocid="dashboard.occupancy.card"
        >
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base text-card-foreground">
              Property Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground">Bed Occupancy</span>
                    <span className="font-semibold text-foreground">
                      {Number(stats?.occupiedBeds ?? 0)} /{" "}
                      {Number(stats?.totalBeds ?? 0)} beds ({occupancyPct}%)
                    </span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-smooth"
                      style={{ width: `${occupancyPct}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    {
                      label: "Total Rooms",
                      value: Number(stats?.totalRooms ?? 0),
                      color: "text-foreground",
                    },
                    {
                      label: "Total Beds",
                      value: Number(stats?.totalBeds ?? 0),
                      color: "text-foreground",
                    },
                    {
                      label: "Occupied",
                      value: Number(stats?.occupiedBeds ?? 0),
                      color: "text-primary",
                    },
                    {
                      label: "Vacant",
                      value: vacantBeds,
                      color: vacantBeds > 3 ? "text-chart-5" : "text-chart-1",
                    },
                  ].map(({ label, value, color }) => (
                    <div
                      key={label}
                      className="rounded-lg bg-muted/40 p-3 text-center"
                    >
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p
                        className={`text-xl font-bold font-display ${color} mt-0.5`}
                      >
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
