import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  BedDouble,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Home,
  IndianRupee,
  KeyRound,
  Loader2,
  LogOut,
  MessageSquarePlus,
  MessageSquareWarning,
  Phone,
  RefreshCw,
  Shield,
  Thermometer,
  User,
  UtensilsCrossed,
  Wifi,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { backendInterface } from "../../backend";
import { createActor } from "../../services/backend";
import {
  type Complaint,
  ComplaintCategory,
  ComplaintStatus,
  type MealRecord,
  type Payment,
  PaymentStatus,
  type Room,
  type Tenant,
} from "../../types";

// ── helpers ──────────────────────────────────────────────────────────────────

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

function today(): bigint {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return BigInt(d.getTime()) * 1_000_000n; // ns
}

function formatRupee(n: bigint): string {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

function paymentStatusVariant(s: PaymentStatus): {
  label: string;
  bg: string;
  text: string;
  icon: React.ElementType;
} {
  if (s === PaymentStatus.paid)
    return {
      label: "Paid",
      bg: "bg-chart-1/15",
      text: "text-chart-1",
      icon: CheckCircle2,
    };
  if (s === PaymentStatus.overdue)
    return {
      label: "Overdue",
      bg: "bg-destructive/15",
      text: "text-destructive",
      icon: XCircle,
    };
  return {
    label: "Pending",
    bg: "bg-chart-5/15",
    text: "text-chart-5",
    icon: Clock,
  };
}

const COMPLAINT_CATEGORIES = [
  { value: ComplaintCategory.water, label: "Water", emoji: "💧" },
  { value: ComplaintCategory.electricity, label: "Electricity", emoji: "⚡" },
  { value: ComplaintCategory.cleaning, label: "Cleaning", emoji: "🧹" },
  { value: ComplaintCategory.other, label: "Other", emoji: "📋" },
] as const;

// ── sub-components ────────────────────────────────────────────────────────────

interface SectionCardProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  ocid?: string;
}

function SectionCard({ title, icon: Icon, children, ocid }: SectionCardProps) {
  return (
    <Card className="bg-card border-border" data-ocid={ocid}>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="font-display text-sm font-semibold text-card-foreground flex items-center gap-2">
          <span className="w-7 h-7 rounded-md bg-primary/15 flex items-center justify-center">
            <Icon className="w-3.5 h-3.5 text-primary" />
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">{children}</CardContent>
    </Card>
  );
}

// ── Tenant Login — 3-tab lookup ───────────────────────────────────────────────

type LoginTab = "phone" | "username" | "identity";

interface TenantLoginProps {
  tenants: Tenant[];
  onMatch: (tenant: Tenant) => void;
  onLogout: () => void;
}

function TenantLogin({ tenants, onMatch, onLogout }: TenantLoginProps) {
  const [tab, setTab] = useState<LoginTab>("phone");

  // Phone tab state
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Username/PIN tab state
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [usernameError, setUsernameError] = useState("");

  // Internet Identity tab state
  const { login, loginStatus, identity } = useInternetIdentity();
  const [iiError, setIiError] = useState("");
  const isLoggingIn = loginStatus === "logging-in";

  function handlePhoneFind() {
    const cleaned = phone.replace(/\D/g, "");
    const match = tenants.find(
      (t) => t.phone.replace(/\D/g, "") === cleaned && t.isActive,
    );
    if (match) {
      onMatch(match);
    } else {
      setPhoneError(
        "No active tenant found with this phone number. Please check and try again.",
      );
    }
  }

  function handleUsernameFind() {
    const cleanedPin = pin.replace(/\D/g, "");
    const match = tenants.find((t) => {
      const nameMatch =
        t.name.trim().toLowerCase() === username.trim().toLowerCase();
      const last4 = t.phone.replace(/\D/g, "").slice(-4);
      return nameMatch && last4 === cleanedPin && t.isActive;
    });
    if (match) {
      onMatch(match);
    } else {
      setUsernameError(
        "No tenant found. Check your name and last 4 digits of your phone.",
      );
    }
  }

  function handleIdentityFind() {
    if (!identity) return;
    const principalStr = identity.getPrincipal().toString();
    // Match by principal stored in tenant record (if available) or fall back gracefully
    const match = tenants.find(
      (t) =>
        "principal" in t &&
        (t as Tenant & { principal?: string }).principal === principalStr &&
        t.isActive,
    );
    if (match) {
      onMatch(match);
    } else {
      setIiError(
        "No tenant account is linked to this Internet Identity. Please use phone or username login instead.",
      );
    }
  }

  const TABS: { id: LoginTab; label: string; icon: React.ElementType }[] = [
    { id: "phone", label: "Phone", icon: Phone },
    { id: "username", label: "Username", icon: User },
    { id: "identity", label: "Internet ID", icon: Shield },
  ];

  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      data-ocid="tenant_portal.lookup.page"
    >
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Building2 className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="font-display font-bold text-sm text-foreground">
              SmartPG
            </p>
            <p className="text-xs text-muted-foreground">Tenant Portal</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={onLogout}
          data-ocid="tenant_portal.lookup.logout_button"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">Sign Out</span>
        </Button>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm space-y-7">
          {/* Icon + heading */}
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto">
              <Home className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-display font-bold text-2xl text-foreground">
              Tenant Login
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to access your personal dashboard
            </p>
          </div>

          {/* Tab switcher */}
          <div
            className="grid grid-cols-3 gap-1 p-1 bg-muted/60 rounded-xl border border-border"
            data-ocid="tenant_portal.lookup.tab"
          >
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setTab(id);
                  setPhoneError("");
                  setUsernameError("");
                  setIiError("");
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-medium transition-smooth ${
                  tab === id
                    ? "bg-card text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-ocid={`tenant_portal.lookup.tab.${id}`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Tab: Phone */}
          {tab === "phone" && (
            <div
              className="space-y-4"
              data-ocid="tenant_portal.lookup.phone.panel"
            >
              <div className="space-y-2">
                <Label
                  htmlFor="phone-input"
                  className="text-sm font-medium text-foreground"
                >
                  Registered Mobile Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone-input"
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setPhoneError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handlePhoneFind()}
                    className="pl-10 bg-card border-input h-11 text-base"
                    data-ocid="tenant_portal.lookup.phone_input"
                  />
                </div>
                {phoneError && (
                  <div
                    className="flex items-start gap-2 text-destructive text-xs"
                    data-ocid="tenant_portal.lookup.error_state"
                  >
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{phoneError}</span>
                  </div>
                )}
              </div>
              <Button
                className="w-full h-11 font-semibold gap-2"
                onClick={handlePhoneFind}
                disabled={phone.trim().length < 6}
                data-ocid="tenant_portal.lookup.submit_button"
              >
                Find My Dashboard
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Tab: Username + PIN */}
          {tab === "username" && (
            <div
              className="space-y-4"
              data-ocid="tenant_portal.lookup.username.panel"
            >
              <div className="space-y-2">
                <Label
                  htmlFor="username-input"
                  className="text-sm font-medium text-foreground"
                >
                  Your Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username-input"
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setUsernameError("");
                    }}
                    className="pl-10 bg-card border-input h-11 text-base"
                    data-ocid="tenant_portal.lookup.username_input"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="pin-input"
                  className="text-sm font-medium text-foreground"
                >
                  Last 4 Digits of Phone (PIN)
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="pin-input"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="e.g. 3210"
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
                      setUsernameError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleUsernameFind()}
                    className="pl-10 bg-card border-input h-11 text-base tracking-[0.4em]"
                    data-ocid="tenant_portal.lookup.pin_input"
                  />
                </div>
                {usernameError && (
                  <div
                    className="flex items-start gap-2 text-destructive text-xs"
                    data-ocid="tenant_portal.lookup.username.error_state"
                  >
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{usernameError}</span>
                  </div>
                )}
              </div>
              <Button
                className="w-full h-11 font-semibold gap-2"
                onClick={handleUsernameFind}
                disabled={username.trim().length < 2 || pin.length < 4}
                data-ocid="tenant_portal.lookup.username.submit_button"
              >
                Sign In
                <ChevronRight className="w-4 h-4" />
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Your PIN is the last 4 digits of your registered phone number
              </p>
            </div>
          )}

          {/* Tab: Internet Identity */}
          {tab === "identity" && (
            <div
              className="space-y-4"
              data-ocid="tenant_portal.lookup.identity.panel"
            >
              {!identity ? (
                <>
                  <Button
                    className="w-full h-11 font-semibold gap-2"
                    onClick={() => {
                      setIiError("");
                      login();
                    }}
                    disabled={isLoggingIn}
                    data-ocid="tenant_portal.lookup.identity.login_button"
                  >
                    {isLoggingIn ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Connecting…
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        Login with Internet Identity
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      </>
                    )}
                  </Button>
                  <div className="rounded-lg bg-muted/40 border border-border p-3 text-xs text-muted-foreground leading-relaxed">
                    <p className="font-medium text-foreground mb-1">
                      🔐 Secure &amp; Decentralised
                    </p>
                    <p>
                      Internet Identity is a privacy-preserving login — no
                      password, no email. Works like Google or Apple sign-in but
                      on the Internet Computer.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-lg bg-muted/40 border border-border p-3 space-y-2">
                    <p className="text-xs font-medium text-foreground">
                      Logged in as
                    </p>
                    <p className="text-xs font-mono text-muted-foreground break-all">
                      {identity.getPrincipal().toString()}
                    </p>
                  </div>
                  {iiError && (
                    <div
                      className="flex items-start gap-2 text-destructive text-xs"
                      data-ocid="tenant_portal.lookup.identity.error_state"
                    >
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>{iiError}</span>
                    </div>
                  )}
                  <Button
                    className="w-full h-11 font-semibold gap-2"
                    onClick={handleIdentityFind}
                    data-ocid="tenant_portal.lookup.identity.submit_button"
                  >
                    <Shield className="w-4 h-4" />
                    Access My Dashboard
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="text-center py-4 text-xs text-muted-foreground">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}

// ── Rent Status Card ──────────────────────────────────────────────────────────

function RentStatusCard({ payments }: { payments: Payment[] }) {
  const now = new Date();
  const curMonth = BigInt(now.getMonth() + 1);
  const curYear = BigInt(now.getFullYear());

  const currentPayment = payments.find(
    (p) => p.month === curMonth && p.year === curYear,
  );

  const unpaid = payments.filter((p) => p.status !== PaymentStatus.paid);
  const totalOutstanding = unpaid.reduce((acc, p) => acc + p.amount, 0n);

  return (
    <SectionCard
      title="Rent Status"
      icon={CreditCard}
      ocid="tenant_portal.rent.card"
    >
      {/* Current month highlight */}
      <div className="rounded-lg bg-muted/40 p-3 mb-3">
        <p className="text-xs text-muted-foreground mb-1 font-medium">
          {MONTH_NAMES[now.getMonth()]} {now.getFullYear()}
        </p>
        {currentPayment ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(() => {
                const v = paymentStatusVariant(currentPayment.status);
                const Icon = v.icon;
                return (
                  <>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${v.bg} ${v.text}`}
                      data-ocid="tenant_portal.rent.current_status"
                    >
                      <Icon className="w-3 h-3" />
                      {v.label}
                    </span>
                  </>
                );
              })()}
            </div>
            <span className="font-display font-bold text-lg text-foreground">
              {formatRupee(currentPayment.amount)}
            </span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No payment record for this month
          </p>
        )}
      </div>

      {/* Total outstanding */}
      {totalOutstanding > 0n && (
        <div
          className="flex items-center justify-between rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 mb-3"
          data-ocid="tenant_portal.rent.outstanding"
        >
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">
              Total Outstanding
            </span>
          </div>
          <span className="font-display font-bold text-destructive">
            {formatRupee(totalOutstanding)}
          </span>
        </div>
      )}

      {/* My Dues list */}
      {unpaid.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Dues
          </p>
          {unpaid.map((p, idx) => {
            const v = paymentStatusVariant(p.status);
            const Icon = v.icon;
            return (
              <div
                key={String(p.id)}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
                data-ocid={`tenant_portal.rent.due.${idx + 1}`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 shrink-0 ${v.text}`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {MONTH_NAMES[Number(p.month) - 1]} {String(p.year)}
                    </p>
                    <span className={`text-xs font-medium ${v.text}`}>
                      {v.label}
                    </span>
                  </div>
                </div>
                <span className="font-display font-semibold text-foreground">
                  {formatRupee(p.amount)}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className="flex items-center gap-2 text-chart-1 text-sm py-1"
          data-ocid="tenant_portal.rent.all_clear"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>All payments are up to date!</span>
        </div>
      )}
    </SectionCard>
  );
}

// ── Meal Section ──────────────────────────────────────────────────────────────

interface MealSectionProps {
  tenant: Tenant;
  meals: MealRecord[];
  actor: backendInterface | null;
}

function MealSection({ tenant, meals, actor }: MealSectionProps) {
  const queryClient = useQueryClient();
  const todayNs = today();

  // Last 7 days in ms-comparable form
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return {
      label: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()],
      dateNs: BigInt(d.getTime()) * 1_000_000n,
    };
  });

  const todayRecord = meals.find((m) => {
    const diff = m.date > todayNs ? m.date - todayNs : todayNs - m.date;
    return diff < 86_400_000_000_000n; // within 24h in ns
  });

  const isEatingToday = todayRecord?.isEating ?? true;

  const toggleMutation = useMutation({
    mutationFn: async (eating: boolean) => {
      if (!actor) throw new Error("No connection");
      return actor.toggleMeal({
        tenantId: tenant.id,
        date: todayNs,
        isEating: eating,
        chargePerDay: todayRecord?.chargePerDay ?? tenant.monthlyRent / 30n,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meals", tenant.id] });
      toast.success("Meal preference updated!");
    },
    onError: () => {
      toast.error("Failed to update meal preference. Try again.");
    },
  });

  function getMealForDay(dateNs: bigint): boolean | null {
    const record = meals.find((m) => {
      const diff = m.date > dateNs ? m.date - dateNs : dateNs - m.date;
      return diff < 86_400_000_000_000n;
    });
    return record ? record.isEating : null;
  }

  return (
    <SectionCard
      title="Meal Status"
      icon={UtensilsCrossed}
      ocid="tenant_portal.meals.card"
    >
      {/* Today's toggle */}
      <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-3 mb-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Today's Meal</p>
          <p className="text-xs text-muted-foreground">
            Toggle your meal for today
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isEatingToday ? "default" : "outline"}
            className="h-8 px-3 text-xs gap-1.5"
            onClick={() => toggleMutation.mutate(true)}
            disabled={toggleMutation.isPending}
            data-ocid="tenant_portal.meals.eating_button"
          >
            {toggleMutation.isPending ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3 h-3" />
            )}
            Eating
          </Button>
          <Button
            size="sm"
            variant={!isEatingToday ? "default" : "outline"}
            className="h-8 px-3 text-xs gap-1.5"
            onClick={() => toggleMutation.mutate(false)}
            disabled={toggleMutation.isPending}
            data-ocid="tenant_portal.meals.skipping_button"
          >
            <XCircle className="w-3 h-3" />
            Skip
          </Button>
        </div>
      </div>

      {/* Last 7 days strip */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Last 7 Days
        </p>
        <div className="grid grid-cols-7 gap-1">
          {last7.map((day) => {
            const status = getMealForDay(day.dateNs);
            const isToday = day === last7[last7.length - 1];
            return (
              <div
                key={day.label + String(day.dateNs)}
                className="flex flex-col items-center gap-1"
                data-ocid={`tenant_portal.meals.day.${isToday ? "today" : day.label.toLowerCase()}`}
              >
                <span
                  className={`text-[10px] font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}
                >
                  {day.label}
                </span>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs
                    ${
                      status === true
                        ? "bg-chart-1/20 text-chart-1"
                        : status === false
                          ? "bg-muted text-muted-foreground"
                          : "bg-muted/40 text-muted-foreground/40"
                    }`}
                >
                  {status === true ? "✓" : status === false ? "–" : "·"}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-chart-1/20 inline-block" />{" "}
            Eating
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-muted inline-block" />{" "}
            Skipped
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-muted/40 inline-block" />{" "}
            No record
          </span>
        </div>
      </div>
    </SectionCard>
  );
}

// ── Complaint Section ─────────────────────────────────────────────────────────

interface ComplaintSectionProps {
  tenant: Tenant;
  complaints: Complaint[];
  actor: backendInterface | null;
}

function ComplaintSection({
  tenant,
  complaints,
  actor,
}: ComplaintSectionProps) {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<ComplaintCategory>(
    ComplaintCategory.other,
  );
  const [description, setDescription] = useState("");
  const [showForm, setShowForm] = useState(false);

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No connection");
      return actor.addComplaint({
        tenantId: tenant.id,
        category,
        description: description.trim(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints", tenant.id] });
      setDescription("");
      setShowForm(false);
      toast.success("Complaint raised successfully!");
    },
    onError: () => {
      toast.error("Failed to raise complaint. Please try again.");
    },
  });

  return (
    <SectionCard
      title="Complaints"
      icon={MessageSquareWarning}
      ocid="tenant_portal.complaints.card"
    >
      {/* Raise new */}
      {!showForm ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 h-9 border-dashed"
          onClick={() => setShowForm(true)}
          data-ocid="tenant_portal.complaints.raise_button"
        >
          <MessageSquarePlus className="w-4 h-4" />
          Raise a Complaint
        </Button>
      ) : (
        <div
          className="space-y-3 mb-4"
          data-ocid="tenant_portal.complaints.form"
        >
          <div className="grid grid-cols-2 gap-2">
            {COMPLAINT_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-smooth
                  ${
                    category === cat.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-border/80"
                  }`}
                data-ocid={`tenant_portal.complaints.category.${cat.value}`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
          <Textarea
            placeholder="Describe the issue in detail…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="bg-card border-input resize-none text-sm"
            data-ocid="tenant_portal.complaints.description_input"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 h-9"
              onClick={() => addMutation.mutate()}
              disabled={description.trim().length < 5 || addMutation.isPending}
              data-ocid="tenant_portal.complaints.submit_button"
            >
              {addMutation.isPending ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : null}
              Submit
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 px-4"
              onClick={() => {
                setShowForm(false);
                setDescription("");
              }}
              data-ocid="tenant_portal.complaints.cancel_button"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Existing complaints */}
      {complaints.length > 0 && (
        <div className="mt-3 space-y-2">
          {complaints.map((c, idx) => {
            const catMeta = COMPLAINT_CATEGORIES.find(
              (cat) => cat.value === c.category,
            );
            return (
              <div
                key={String(c.id)}
                className="flex items-start gap-2.5 py-2.5 border-b border-border last:border-0"
                data-ocid={`tenant_portal.complaints.item.${idx + 1}`}
              >
                <span className="text-base shrink-0 mt-0.5">
                  {catMeta?.emoji ?? "📋"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground capitalize">
                    {catMeta?.label ?? c.category}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {c.description}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    c.status === ComplaintStatus.open
                      ? "text-xs shrink-0 bg-chart-5/15 text-chart-5 border-chart-5/30"
                      : "text-xs shrink-0 bg-chart-1/15 text-chart-1 border-chart-1/30"
                  }
                >
                  {c.status === ComplaintStatus.open ? "Open" : "Resolved"}
                </Badge>
              </div>
            );
          })}
        </div>
      )}

      {complaints.length === 0 && !showForm && (
        <p
          className="text-xs text-muted-foreground text-center mt-3"
          data-ocid="tenant_portal.complaints.empty_state"
        >
          No complaints raised yet
        </p>
      )}
    </SectionCard>
  );
}

// ── Room Info Card ────────────────────────────────────────────────────────────

interface RoomCardProps {
  tenant: Tenant;
  rooms: Room[];
}

function RoomCard({ tenant, rooms }: RoomCardProps) {
  const room = rooms.find((r) => r.id === tenant.roomId);

  return (
    <SectionCard
      title="My Room"
      icon={BedDouble}
      ocid="tenant_portal.room.card"
    >
      {room ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/40 px-3 py-2.5">
            <p className="text-xs text-muted-foreground mb-0.5">Room</p>
            <p className="font-display font-bold text-lg text-foreground">
              {room.number}
            </p>
          </div>
          <div className="rounded-lg bg-muted/40 px-3 py-2.5">
            <p className="text-xs text-muted-foreground mb-0.5">Floor</p>
            <p className="font-display font-bold text-lg text-foreground">
              {String(room.floor)}
            </p>
          </div>
          <div className="rounded-lg bg-muted/40 px-3 py-2.5 col-span-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {room.isAC ? (
                <Thermometer className="w-4 h-4 text-chart-4" />
              ) : (
                <Wifi className="w-4 h-4 text-muted-foreground" />
              )}
              <span className="text-sm font-medium text-foreground">
                {room.isAC ? "AC Room" : "Non-AC Room"}
              </span>
            </div>
            <Badge
              variant="outline"
              className={
                room.isAC
                  ? "text-xs bg-chart-4/15 text-chart-4 border-chart-4/30"
                  : "text-xs bg-muted text-muted-foreground border-border"
              }
            >
              {room.isAC ? "AC" : "Fan"}
            </Badge>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-3">
          Room details unavailable
        </p>
      )}
    </SectionCard>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

interface DashboardProps {
  tenant: Tenant;
  onSwitchTenant: () => void;
  onLogout: () => void;
  actor: backendInterface | null;
  isFetchingActor: boolean;
}

function TenantDashboard({
  tenant,
  onSwitchTenant,
  onLogout,
  actor,
  isFetchingActor,
}: DashboardProps) {
  const { data: payments = [], isLoading: paymentsLoading } = useQuery<
    Payment[]
  >({
    queryKey: ["payments", tenant.id],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPaymentsByTenant(tenant.id);
    },
    enabled: !!actor && !isFetchingActor,
  });

  const { data: meals = [], isLoading: mealsLoading } = useQuery<MealRecord[]>({
    queryKey: ["meals", tenant.id],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMealRecordsByTenant(tenant.id);
    },
    enabled: !!actor && !isFetchingActor,
  });

  const { data: complaints = [], isLoading: complaintsLoading } = useQuery<
    Complaint[]
  >({
    queryKey: ["complaints", tenant.id],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getComplaintsByTenant(tenant.id);
    },
    enabled: !!actor && !isFetchingActor,
  });

  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ["rooms"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRooms();
    },
    enabled: !!actor && !isFetchingActor,
  });

  const isLoading = paymentsLoading || mealsLoading || complaintsLoading;

  const initials = tenant.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="min-h-screen bg-background"
      data-ocid="tenant_portal.dashboard.page"
    >
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between gap-3 sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Building2 className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="font-display font-bold text-sm text-foreground">
              SmartPG
            </p>
            <p className="text-xs text-muted-foreground">Tenant Portal</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={onLogout}
          data-ocid="tenant_portal.dashboard.logout_button"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">Sign Out</span>
        </Button>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-4 pb-10">
        {/* Profile Card */}
        <Card
          className="bg-card border-border"
          data-ocid="tenant_portal.profile.card"
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-bold text-lg text-foreground truncate">
                {tenant.name}
              </h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <IndianRupee className="w-3 h-3" />
                {Number(tenant.monthlyRent).toLocaleString("en-IN")}/month
              </p>
              <p className="text-xs text-muted-foreground">{tenant.phone}</p>
            </div>
            <button
              type="button"
              onClick={onSwitchTenant}
              className="text-xs text-primary hover:underline shrink-0"
              data-ocid="tenant_portal.profile.switch_button"
            >
              Not me?
            </button>
          </CardContent>
        </Card>

        {/* Main sections */}
        {isLoading ? (
          <div className="space-y-4">
            {(["a", "b", "c", "d"] as const).map((k) => (
              <Card key={k} className="bg-card border-border">
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <RentStatusCard payments={payments} />
            <MealSection tenant={tenant} meals={meals} actor={actor} />
            <ComplaintSection
              tenant={tenant}
              complaints={complaints}
              actor={actor}
            />
            <RoomCard tenant={tenant} rooms={rooms} />

            {/* WhatsApp stub */}
            <Card
              className="bg-card border-border"
              data-ocid="tenant_portal.whatsapp.card"
            >
              <CardContent className="p-4">
                <Button
                  variant="outline"
                  className="w-full gap-2 h-11 border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10 hover:text-[#25D366]"
                  onClick={() =>
                    toast.info("WhatsApp integration coming soon!")
                  }
                  data-ocid="tenant_portal.whatsapp.button"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4 fill-current"
                    aria-hidden="true"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Contact PG Owner on WhatsApp
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  WhatsApp integration coming soon
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      <footer className="text-center py-4 text-xs text-muted-foreground">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function TenantPortalPage() {
  const { clear: clearIdentity } = useInternetIdentity();
  const { actor, isFetching } = useActor(createActor);
  const [matchedTenant, setMatchedTenant] = useState<Tenant | null>(null);

  const { data: tenants = [], isLoading: tenantsLoading } = useQuery<Tenant[]>({
    queryKey: ["tenants"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTenants();
    },
    enabled: !!actor && !isFetching,
  });

  function handleLogout() {
    clearIdentity();
    setMatchedTenant(null);
  }

  // Loading state while actor initialises
  if (isFetching || tenantsLoading) {
    return (
      <div
        className="min-h-screen bg-background flex flex-col items-center justify-center gap-4"
        data-ocid="tenant_portal.loading_state"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-primary" />
        </div>
        <div className="space-y-2 text-center">
          <Skeleton className="h-4 w-36 mx-auto" />
          <Skeleton className="h-3 w-24 mx-auto" />
        </div>
      </div>
    );
  }

  if (!matchedTenant) {
    return (
      <TenantLogin
        tenants={tenants}
        onMatch={setMatchedTenant}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <TenantDashboard
      tenant={matchedTenant}
      onSwitchTenant={() => setMatchedTenant(null)}
      onLogout={handleLogout}
      actor={actor}
      isFetchingActor={isFetching}
    />
  );
}
