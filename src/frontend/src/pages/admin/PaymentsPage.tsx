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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import jsPDF from "jspdf";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileText,
  IndianRupee,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  Settings,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Layout } from "../../components/Layout";
import { createActor } from "../../services/backend";
import { PaymentMethod, PaymentStatus } from "../../types";
import type { Payment, Tenant } from "../../types";

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

const STATUS_CONFIG = {
  [PaymentStatus.paid]: {
    label: "Paid",
    badgeClass: "bg-chart-1/20 text-chart-1 border-chart-1/40 font-semibold",
    cardClass: "border-chart-1/30 bg-chart-1/5",
    icon: CheckCircle2,
    iconClass: "text-chart-1",
  },
  [PaymentStatus.pending]: {
    label: "Pending",
    badgeClass: "bg-chart-2/20 text-chart-2 border-chart-2/40 font-semibold",
    cardClass: "border-chart-2/30 bg-chart-2/5",
    icon: Clock,
    iconClass: "text-chart-2",
  },
  [PaymentStatus.overdue]: {
    label: "Overdue",
    badgeClass:
      "bg-destructive/20 text-destructive border-destructive/40 font-semibold",
    cardClass: "border-destructive/30 bg-destructive/5",
    icon: XCircle,
    iconClass: "text-destructive",
  },
};

// ─── PDF Receipt Generator ────────────────────────────────────────────────────

function generateReceipt(
  payment: Payment,
  tenant: Tenant | undefined,
  rooms?: Map<string, string>,
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });
  const pageW = 148;
  const margin = 15;
  const contentW = pageW - margin * 2;

  // ── Header band ──────────────────────────────────────────────────
  doc.setFillColor(22, 101, 52); // dark green
  doc.rect(0, 0, pageW, 32, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("SmartPG", margin, 14);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Intelligent PG Management System", margin, 20);
  doc.text("Koramangala, Bangalore – 560034  |  +91 98765 43210", margin, 25);

  // ── Receipt title ────────────────────────────────────────────────
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT RECEIPT", pageW / 2, 42, { align: "center" });

  // Thin rule
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, 46, pageW - margin, 46);

  // ── Receipt meta ─────────────────────────────────────────────────
  const receiptNo = `RCPT-${String(payment.id).padStart(5, "0")}`;
  const paidDateMs = payment.paidDate
    ? Number(payment.paidDate) / 1_000_000
    : Date.now();
  const paidDateStr = new Date(paidDateMs).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const metaY = 54;
  const lineH = 7;
  doc.setFontSize(9);

  const rows: [string, string][] = [
    ["Receipt No.", receiptNo],
    ["Tenant Name", tenant?.name ?? `Tenant #${String(payment.tenantId)}`],
    ["Phone", tenant?.phone ?? "—"],
    ["Room / Bed", rooms?.get(String(payment.tenantId)) ?? "—"],
    [
      "Payment Month",
      `${MONTHS[Number(payment.month) - 1]} ${String(payment.year)}`,
    ],
    ["Payment Date", paidDateStr],
    ["Payment Method", payment.method ? payment.method.toUpperCase() : "—"],
  ];

  rows.forEach(([label, value], i) => {
    const y = metaY + i * lineH;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(label, margin, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(value, margin + 45, y);
  });

  // ── Amount box ───────────────────────────────────────────────────
  const amtY = metaY + rows.length * lineH + 6;
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(22, 163, 74);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, amtY, contentW, 18, 3, 3, "FD");

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(22, 101, 52);
  doc.text("Amount Paid", margin + 6, amtY + 7);

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Rs. ${Number(payment.amount).toLocaleString("en-IN")}`,
    pageW - margin - 6,
    amtY + 10,
    { align: "right" },
  );

  // ── PAID stamp ───────────────────────────────────────────────────
  const stampY = amtY + 26;
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(22, 163, 74);
  doc.text("✓ PAID", pageW / 2, stampY, { align: "center" });

  // ── Footer rule + note ───────────────────────────────────────────
  const footerY = stampY + 12;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY, pageW - margin, footerY);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(130, 130, 130);
  doc.text(
    "This is a computer-generated receipt and does not require a signature.",
    pageW / 2,
    footerY + 6,
    { align: "center" },
  );
  doc.text(
    "SmartPG  |  support@smartpg.in  |  Koramangala, Bangalore",
    pageW / 2,
    footerY + 11,
    { align: "center" },
  );

  const tenantName = tenant?.name ?? `Tenant${String(payment.tenantId)}`;
  const monthStr = MONTH_SHORT[Number(payment.month) - 1];
  const yearStr = String(payment.year);
  doc.save(
    `${tenantName.replace(/\s+/g, "-")}-receipt-${monthStr}-${yearStr}.pdf`,
  );
}

// ─── WhatsApp Setup Modal ────────────────────────────────────────────────────

function WhatsAppSetupModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { actor, isFetching } = useActor(createActor);
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [accessToken, setAccessToken] = useState("");

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not ready");
      return actor.setWhatsAppConfig(phoneNumberId.trim(), accessToken.trim());
    },
    onSuccess: () => {
      toast.success("WhatsApp configured successfully!");
      onSaved();
      onClose();
    },
    onError: () => toast.error("Failed to save WhatsApp config"),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="bg-card border-border max-w-sm"
        data-ocid="payments.whatsapp_setup_dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-foreground flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#25D366]" />
            WhatsApp Setup
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-1">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-chart-2" />
              WhatsApp Business API Required
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              To send rent reminders via WhatsApp, enter your Meta Business API
              credentials. Get these from{" "}
              <span className="text-primary font-medium">
                business.facebook.com
              </span>
              .
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Phone Number ID
              </Label>
              <Input
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
                placeholder="e.g. 123456789012345"
                className="h-9 text-sm bg-muted/40 border-input"
                data-ocid="payments.whatsapp_phone_id_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Access Token
              </Label>
              <Input
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="Bearer token from Meta"
                type="password"
                className="h-9 text-sm bg-muted/40 border-input"
                data-ocid="payments.whatsapp_access_token_input"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1 border-border"
              onClick={onClose}
              data-ocid="payments.whatsapp_setup_cancel_button"
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-[#25D366] text-white hover:bg-[#20b858]"
              onClick={() => save()}
              disabled={
                isPending ||
                !actor ||
                isFetching ||
                !phoneNumberId.trim() ||
                !accessToken.trim()
              }
              data-ocid="payments.whatsapp_setup_save_button"
            >
              {isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <MessageCircle className="w-4 h-4 mr-1" />
              )}
              Save &amp; Enable
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Summary Card ────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  sub,
  accent,
  index,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "green" | "amber" | "red";
  index: number;
}) {
  const accentClass =
    accent === "green"
      ? "text-chart-1"
      : accent === "amber"
        ? "text-chart-2"
        : accent === "red"
          ? "text-destructive"
          : "text-foreground";
  return (
    <Card
      className="bg-card border-border"
      data-ocid={`payments.summary.${index}`}
    >
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className={`font-display font-bold text-2xl ${accentClass}`}>
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Mark Paid Modal ──────────────────────────────────────────────────────────

function MarkPaidModal({
  payment,
  tenant,
  open,
  onClose,
}: {
  payment: Payment | null;
  tenant: Tenant | undefined;
  open: boolean;
  onClose: () => void;
}) {
  const { actor, isFetching } = useActor(createActor);
  const qc = useQueryClient();
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.upi);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!actor || !payment) throw new Error("Not ready");
      const now = BigInt(Date.now()) * 1_000_000n;
      return actor.updatePaymentStatus(
        payment.id,
        PaymentStatus.paid,
        method,
        now,
      );
    },
    onSuccess: () => {
      toast.success(`Payment marked as paid via ${method.toUpperCase()}`);
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["payments-month"] });
      onClose();
    },
    onError: () => toast.error("Failed to update payment status"),
  });

  if (!payment) return null;
  const tenantName = tenant?.name ?? `Tenant #${String(payment.tenantId)}`;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="bg-card border-border max-w-sm"
        data-ocid="payments.mark_paid_dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">
            Mark as Paid
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="rounded-lg bg-muted/50 p-3 space-y-1">
            <p className="font-semibold text-foreground">{tenantName}</p>
            <p className="text-sm text-muted-foreground">
              {MONTH_SHORT[Number(payment.month) - 1]} {String(payment.year)} ·{" "}
              <span className="font-bold text-foreground">
                ₹{Number(payment.amount).toLocaleString("en-IN")}
              </span>
            </p>
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              Payment Method
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {([PaymentMethod.upi, PaymentMethod.cash] as const).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMethod(m)}
                  data-ocid={`payments.method_${m}`}
                  className={`py-2.5 rounded-lg border text-sm font-semibold transition-smooth ${
                    method === m
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {m === PaymentMethod.upi ? "📱 UPI" : "💵 Cash"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1 border-border"
              onClick={onClose}
              data-ocid="payments.mark_paid_cancel_button"
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-chart-1 text-primary-foreground hover:bg-chart-1/90"
              onClick={() => mutate()}
              disabled={isPending || !actor || isFetching}
              data-ocid="payments.mark_paid_confirm_button"
            >
              {isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-1" />
              )}
              Confirm Paid
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Payment Status Card ──────────────────────────────────────────────────────

function PaymentStatusCard({
  payment,
  tenant,
  index,
  onMarkPaid,
  onRemind,
  onReceipt,
}: {
  payment: Payment;
  tenant: Tenant | undefined;
  index: number;
  onMarkPaid: (p: Payment) => void;
  onRemind: (p: Payment, t: Tenant | undefined) => void;
  onReceipt: (p: Payment, t: Tenant | undefined) => void;
}) {
  const cfg = STATUS_CONFIG[payment.status];
  const StatusIcon = cfg.icon;
  const initials = tenant
    ? tenant.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <Card
      className={`border transition-smooth hover:shadow-md ${cfg.cardClass}`}
      data-ocid={`payments.item.${index}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary font-bold text-sm">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-card-foreground truncate">
              {tenant?.name ?? `Tenant #${String(payment.tenantId)}`}
            </p>
            <p className="text-xs text-muted-foreground">
              {payment.method
                ? payment.method === PaymentMethod.upi
                  ? "via UPI"
                  : "via Cash"
                : ""}
              {payment.paidDate
                ? ` · ${new Date(Number(payment.paidDate) / 1_000_000).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                : ""}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-display font-bold text-xl text-foreground">
              ₹{Number(payment.amount).toLocaleString("en-IN")}
            </p>
            <Badge
              variant="outline"
              className={`text-xs mt-1 ${cfg.badgeClass}`}
            >
              <StatusIcon className={`w-3 h-3 mr-1 ${cfg.iconClass}`} />
              {cfg.label}
            </Badge>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          {payment.status !== PaymentStatus.paid && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10 flex-1"
              onClick={() => onRemind(payment, tenant)}
              data-ocid={`payments.send_reminder_button.${index}`}
            >
              <Send className="w-3 h-3" />
              Remind
            </Button>
          )}
          {payment.status === PaymentStatus.paid ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs border-border flex-1"
              onClick={() => onReceipt(payment, tenant)}
              data-ocid={`payments.download_receipt_button.${index}`}
            >
              <Download className="w-3 h-3" />
              Receipt
            </Button>
          ) : (
            <Button
              size="sm"
              className="gap-1.5 text-xs bg-chart-1 text-primary-foreground hover:bg-chart-1/90 flex-1"
              onClick={() => onMarkPaid(payment)}
              data-ocid={`payments.mark_paid_button.${index}`}
            >
              <CheckCircle2 className="w-3 h-3" />
              Mark Paid
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const { actor, isFetching } = useActor(createActor);
  const qc = useQueryClient();
  const today = new Date();
  const [selMonth, setSelMonth] = useState(today.getMonth() + 1);
  const [selYear, setSelYear] = useState(today.getFullYear());
  const [tabFilter, setTabFilter] = useState<"all" | PaymentStatus>("all");
  const [search, setSearch] = useState("");
  const [markPaidPayment, setMarkPaidPayment] = useState<Payment | null>(null);
  const [showWASetup, setShowWASetup] = useState(false);
  const [waConfigured, setWaConfigured] = useState<boolean | null>(null);

  const { data: monthPayments = [], isLoading: pLoading } = useQuery<Payment[]>(
    {
      queryKey: ["payments-month", selMonth, selYear],
      queryFn: async () => {
        if (!actor) return [];
        return actor.getPaymentsByMonth(BigInt(selMonth), BigInt(selYear));
      },
      enabled: !!actor && !isFetching,
    },
  );

  const { data: allPayments = [], isLoading: histLoading } = useQuery<
    Payment[]
  >({
    queryKey: ["payments"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPayments();
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

  const { mutate: generatePayments, isPending: isGenerating } = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not ready");
      return actor.generateMonthlyPayments(BigInt(selMonth), BigInt(selYear));
    },
    onSuccess: (results) => {
      toast.success(`Generated ${results.length} payment records`);
      qc.invalidateQueries({ queryKey: ["payments-month"] });
      qc.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: () => toast.error("Failed to generate payments"),
  });

  const tenantMap = useMemo(
    () => new Map(tenants.map((t) => [String(t.id), t])),
    [tenants],
  );

  // Build room info map: tenantId → "Room 101 · Bed A"
  const tenantRoomInfo = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tenants) {
      map.set(
        String(t.id),
        `Room ${String(t.roomId)} · Bed ${String(t.bedId)}`,
      );
    }
    return map;
  }, [tenants]);

  const summary = useMemo(() => {
    const paid = monthPayments
      .filter((p) => p.status === PaymentStatus.paid)
      .reduce((s, p) => s + Number(p.amount), 0);
    const total = monthPayments.reduce((s, p) => s + Number(p.amount), 0);
    const rate = total > 0 ? Math.round((paid / total) * 100) : 0;
    return {
      paid,
      total,
      rate,
      paidCount: monthPayments.filter((p) => p.status === PaymentStatus.paid)
        .length,
      pendingCount: monthPayments.filter(
        (p) => p.status === PaymentStatus.pending,
      ).length,
      overdueCount: monthPayments.filter(
        (p) => p.status === PaymentStatus.overdue,
      ).length,
    };
  }, [monthPayments]);

  const filteredBoard = useMemo(() => {
    return tabFilter === "all"
      ? monthPayments
      : monthPayments.filter((p) => p.status === tabFilter);
  }, [monthPayments, tabFilter]);

  const filteredHistory = useMemo(() => {
    if (!search.trim()) return allPayments;
    const q = search.toLowerCase();
    return allPayments.filter((p) => {
      const name = tenantMap.get(String(p.tenantId))?.name?.toLowerCase() ?? "";
      const monthStr = MONTH_SHORT[Number(p.month) - 1].toLowerCase();
      return (
        name.includes(q) || monthStr.includes(q) || String(p.year).includes(q)
      );
    });
  }, [allPayments, search, tenantMap]);

  const yearOptions = Array.from(
    { length: 3 },
    (_, i) => today.getFullYear() - 1 + i,
  );

  // ── WhatsApp send handler ──────────────────────────────────────────
  async function handleRemind(payment: Payment, tenant: Tenant | undefined) {
    if (!actor) return;
    // Check if configured
    let configured = waConfigured;
    if (configured === null) {
      configured = await actor.getWhatsAppConfigured();
      setWaConfigured(configured);
    }
    if (!configured) {
      setShowWASetup(true);
      return;
    }
    if (!tenant) {
      toast.error("Tenant details not found");
      return;
    }
    const monthStr = `${MONTHS[Number(payment.month) - 1]} ${String(payment.year)}`;
    try {
      const result = await actor.sendWhatsAppReminder(
        tenant.phone,
        tenant.name,
        payment.amount,
        monthStr,
      );
      if (result.ok) {
        toast.success(`WhatsApp reminder sent to ${tenant.name}!`, {
          icon: "📱",
        });
      } else {
        toast.error(`Failed to send: ${result.message}`);
      }
    } catch {
      toast.error("Failed to send WhatsApp reminder");
    }
  }

  // ── Receipt download handler ───────────────────────────────────────
  function handleReceipt(payment: Payment, tenant: Tenant | undefined) {
    generateReceipt(payment, tenant, tenantRoomInfo);
    toast.success("Receipt downloaded!", { icon: "📄" });
  }

  return (
    <Layout title="Payments">
      <div className="space-y-6 animate-fade-in" data-ocid="payments.page">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/15">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-foreground">
                Payments
              </h2>
              <p className="text-xs text-muted-foreground">
                {MONTHS[selMonth - 1]} {selYear} ·{" "}
                <span className="text-destructive font-medium">
                  {summary.overdueCount} overdue
                </span>{" "}
                ·{" "}
                <span className="text-chart-2 font-medium">
                  {summary.pendingCount} pending
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10"
              onClick={() => setShowWASetup(true)}
              data-ocid="payments.whatsapp_settings_button"
            >
              <Settings className="w-3.5 h-3.5" />
              WhatsApp
            </Button>
            <Button
              className="gap-2 bg-primary text-primary-foreground"
              onClick={() => generatePayments()}
              disabled={isGenerating || !actor || isFetching}
              data-ocid="payments.generate_button"
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Generate Monthly
            </Button>
          </div>
        </div>

        {/* Month + Year Selector */}
        <div
          className="flex gap-2 flex-wrap"
          data-ocid="payments.month_selector"
        >
          <div className="flex gap-1 flex-wrap">
            {MONTH_SHORT.map((m, i) => (
              <button
                type="button"
                key={m}
                onClick={() => setSelMonth(i + 1)}
                data-ocid={`payments.month_tab.${i + 1}`}
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
                data-ocid={`payments.year_tab.${y}`}
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
        </div>

        {/* Summary Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard
            label="Collected"
            value={`₹${summary.paid.toLocaleString("en-IN")}`}
            sub={`${summary.paidCount} tenants paid`}
            accent="green"
            index={1}
          />
          <SummaryCard
            label="Expected"
            value={`₹${summary.total.toLocaleString("en-IN")}`}
            sub={`${monthPayments.length} total`}
            index={2}
          />
          <SummaryCard
            label="Collection Rate"
            value={`${summary.rate}%`}
            sub="of expected rent"
            accent={
              summary.rate >= 80
                ? "green"
                : summary.rate >= 50
                  ? "amber"
                  : "red"
            }
            index={3}
          />
          <SummaryCard
            label="Outstanding"
            value={`₹${(summary.total - summary.paid).toLocaleString("en-IN")}`}
            sub={`${summary.pendingCount + summary.overdueCount} unpaid`}
            accent={summary.overdueCount > 0 ? "red" : "amber"}
            index={4}
          />
        </div>

        {/* Status Board */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-foreground">
              Status Board
            </h3>
            <Tabs
              value={tabFilter}
              onValueChange={(v) => setTabFilter(v as typeof tabFilter)}
            >
              <TabsList className="bg-muted/60 border border-border h-8">
                <TabsTrigger
                  value="all"
                  className="text-xs h-7 px-2"
                  data-ocid="payments.filter.all"
                >
                  All ({monthPayments.length})
                </TabsTrigger>
                <TabsTrigger
                  value={PaymentStatus.overdue}
                  className="text-xs h-7 px-2"
                  data-ocid="payments.filter.overdue"
                >
                  Overdue ({summary.overdueCount})
                </TabsTrigger>
                <TabsTrigger
                  value={PaymentStatus.pending}
                  className="text-xs h-7 px-2"
                  data-ocid="payments.filter.pending"
                >
                  Pending ({summary.pendingCount})
                </TabsTrigger>
                <TabsTrigger
                  value={PaymentStatus.paid}
                  className="text-xs h-7 px-2"
                  data-ocid="payments.filter.paid"
                >
                  Paid ({summary.paidCount})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {pLoading ? (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              data-ocid="payments.loading_state"
            >
              {(["a", "b", "c", "d", "e", "f"] as const).map((k) => (
                <Card key={k} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Skeleton className="h-8 flex-1" />
                      <Skeleton className="h-8 flex-1" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredBoard.length === 0 ? (
            <Card
              className="bg-card border-border"
              data-ocid="payments.board_empty_state"
            >
              <CardContent className="py-14 text-center">
                <TrendingUp className="w-10 h-10 text-chart-1 mx-auto mb-3 opacity-60" />
                <h3 className="font-display font-semibold text-foreground mb-1">
                  {tabFilter === PaymentStatus.paid
                    ? "No payments collected yet"
                    : tabFilter === "all"
                      ? "No payments for this month"
                      : `No ${tabFilter} payments`}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {tabFilter === "all"
                    ? 'Click "Generate Monthly" to create payment records for all active tenants'
                    : "Looking good! Nothing here."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBoard.map((payment, i) => (
                <PaymentStatusCard
                  key={String(payment.id)}
                  payment={payment}
                  tenant={tenantMap.get(String(payment.tenantId))}
                  index={i + 1}
                  onMarkPaid={setMarkPaidPayment}
                  onRemind={handleRemind}
                  onReceipt={handleReceipt}
                />
              ))}
            </div>
          )}
        </div>

        {/* Payment History Table */}
        <div>
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <h3 className="font-display font-semibold text-foreground">
              Payment History
            </h3>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by tenant or month…"
                className="pl-8 h-8 text-sm w-52 bg-muted/50 border-border"
                data-ocid="payments.search_input"
              />
            </div>
          </div>

          <Card className="bg-card border-border overflow-hidden">
            {histLoading ? (
              <CardContent
                className="p-4 space-y-3"
                data-ocid="payments.history_loading_state"
              >
                {(["a", "b", "c"] as const).map((k) => (
                  <Skeleton key={k} className="h-10 w-full" />
                ))}
              </CardContent>
            ) : filteredHistory.length === 0 ? (
              <CardContent
                className="py-12 text-center"
                data-ocid="payments.history_empty_state"
              >
                <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">
                  {search ? "No results found" : "No payment records yet"}
                </p>
              </CardContent>
            ) : (
              <div className="overflow-x-auto">
                <table
                  className="w-full text-sm"
                  data-ocid="payments.history_table"
                >
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">
                        Tenant
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">
                        Period
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">
                        Amount
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">
                        Status
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">
                        Method
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">
                        Paid Date
                      </th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.slice(0, 50).map((p, i) => {
                      const tenant = tenantMap.get(String(p.tenantId));
                      const cfg = STATUS_CONFIG[p.status];
                      const StatusIcon = cfg.icon;
                      return (
                        <tr
                          key={String(p.id)}
                          className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                          data-ocid={`payments.history_row.${i + 1}`}
                        >
                          <td className="px-4 py-3 font-medium text-foreground">
                            {tenant?.name ?? `Tenant #${String(p.tenantId)}`}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {MONTH_SHORT[Number(p.month) - 1]} {String(p.year)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-foreground tabular-nums">
                            ₹{Number(p.amount).toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge
                              variant="outline"
                              className={`text-xs ${cfg.badgeClass}`}
                            >
                              <StatusIcon
                                className={`w-3 h-3 mr-1 ${cfg.iconClass}`}
                              />
                              {cfg.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground capitalize">
                            {p.method ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {p.paidDate
                              ? new Date(
                                  Number(p.paidDate) / 1_000_000,
                                ).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "2-digit",
                                })
                              : "—"}
                          </td>
                          <td className="px-4 py-3">
                            {p.status === PaymentStatus.paid ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                                onClick={() => handleReceipt(p, tenant)}
                                data-ocid={`payments.history_receipt_button.${i + 1}`}
                              >
                                <Download className="w-3 h-3" />
                                Receipt
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs gap-1 text-chart-1 hover:text-chart-1"
                                onClick={() => setMarkPaidPayment(p)}
                                data-ocid={`payments.history_mark_paid_button.${i + 1}`}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                Pay
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredHistory.length > 50 && (
                  <div className="px-4 py-3 text-center text-xs text-muted-foreground border-t border-border">
                    Showing 50 of {filteredHistory.length} records. Use search
                    to narrow down.
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      <MarkPaidModal
        payment={markPaidPayment}
        tenant={
          markPaidPayment
            ? tenantMap.get(String(markPaidPayment.tenantId))
            : undefined
        }
        open={!!markPaidPayment}
        onClose={() => setMarkPaidPayment(null)}
      />

      <WhatsAppSetupModal
        open={showWASetup}
        onClose={() => setShowWASetup(false)}
        onSaved={() => setWaConfigured(true)}
      />
    </Layout>
  );
}
