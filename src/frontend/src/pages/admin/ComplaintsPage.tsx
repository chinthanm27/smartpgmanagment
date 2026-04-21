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
  Brush,
  CheckCircle2,
  Droplets,
  HelpCircle,
  MessageSquareWarning,
  Plus,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Layout } from "../../components/Layout";
import { createActor } from "../../services/backend";
import { ComplaintCategory, ComplaintStatus } from "../../types";
import type { Complaint, Tenant } from "../../types";

const CATEGORY_ICON = {
  [ComplaintCategory.water]: Droplets,
  [ComplaintCategory.electricity]: Zap,
  [ComplaintCategory.cleaning]: Brush,
  [ComplaintCategory.other]: HelpCircle,
};

const CATEGORY_COLOR: Record<ComplaintCategory, string> = {
  [ComplaintCategory.water]: "text-chart-4 bg-chart-4/15",
  [ComplaintCategory.electricity]: "text-chart-5 bg-chart-5/15",
  [ComplaintCategory.cleaning]: "text-chart-1 bg-chart-1/15",
  [ComplaintCategory.other]: "text-muted-foreground bg-muted/60",
};

const CATEGORY_BADGE: Record<ComplaintCategory, string> = {
  [ComplaintCategory.water]: "bg-chart-4/15 text-chart-4 border-chart-4/30",
  [ComplaintCategory.electricity]:
    "bg-chart-5/15 text-chart-5 border-chart-5/30",
  [ComplaintCategory.cleaning]: "bg-chart-1/15 text-chart-1 border-chart-1/30",
  [ComplaintCategory.other]: "bg-muted text-muted-foreground border-border",
};

type FilterType = "all" | ComplaintStatus;
type CategoryFilter = "all" | ComplaintCategory;

export default function ComplaintsPage() {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<FilterType>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    tenantId: "",
    category: ComplaintCategory.other as ComplaintCategory,
    description: "",
  });

  const { data: complaints = [], isLoading } = useQuery<Complaint[]>({
    queryKey: ["complaints"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getComplaints();
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

  const { mutate: resolveComplaint, isPending: resolving } = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateComplaintStatus(id, ComplaintStatus.resolved);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      toast.success("Complaint marked as resolved");
    },
    onError: () => toast.error("Failed to update complaint"),
  });

  const { mutate: addComplaint, isPending: adding } = useMutation({
    mutationFn: async () => {
      if (!actor || !form.tenantId) throw new Error("Actor not available");
      return actor.addComplaint({
        tenantId: BigInt(form.tenantId),
        category: form.category,
        description: form.description,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      toast.success("Complaint raised");
      setShowForm(false);
      setForm({
        tenantId: "",
        category: ComplaintCategory.other,
        description: "",
      });
    },
    onError: () => toast.error("Failed to raise complaint"),
  });

  const tenantMap = new Map(tenants.map((t) => [String(t.id), t]));

  const filtered = complaints.filter((c) => {
    const statusOk = statusFilter === "all" || c.status === statusFilter;
    const catOk = categoryFilter === "all" || c.category === categoryFilter;
    return statusOk && catOk;
  });

  const openCount = complaints.filter(
    (c) => c.status === ComplaintStatus.open,
  ).length;

  // Repeated issues detection: tenants or categories with 3+ complaints
  const categoryCount: Record<string, number> = {};
  const tenantComplaintCount: Record<string, number> = {};
  for (const c of complaints) {
    categoryCount[c.category] = (categoryCount[c.category] ?? 0) + 1;
    tenantComplaintCount[String(c.tenantId)] =
      (tenantComplaintCount[String(c.tenantId)] ?? 0) + 1;
  }
  const repeatedCategories = Object.entries(categoryCount).filter(
    ([, count]) => count >= 3,
  );
  const repeatedTenants = Object.entries(tenantComplaintCount)
    .filter(([, count]) => count >= 3)
    .map(([id, count]) => ({
      name: tenantMap.get(id)?.name ?? `Tenant #${id}`,
      count,
    }));
  const hasRepeated =
    repeatedCategories.length > 0 || repeatedTenants.length > 0;

  return (
    <Layout title="Complaints">
      <div className="space-y-5 animate-fade-in" data-ocid="complaints.page">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/15">
              <MessageSquareWarning className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-foreground">
                Complaints
              </h2>
              <p className="text-xs text-muted-foreground">
                {openCount} open · {complaints.length - openCount} resolved
              </p>
            </div>
          </div>
          <Button
            className="gap-2 bg-primary text-primary-foreground"
            onClick={() => setShowForm(true)}
            data-ocid="complaints.add_button"
          >
            <Plus className="w-4 h-4" />
            Raise Complaint
          </Button>
        </div>

        {/* Repeated issues warning */}
        {hasRepeated && (
          <Card
            className="bg-destructive/10 border-destructive/30"
            data-ocid="complaints.repeated_warning"
          >
            <CardContent className="p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  Repeated Issues Detected
                </p>
                <div className="flex flex-wrap gap-2">
                  {repeatedCategories.map(([cat, count]) => (
                    <Badge
                      key={cat}
                      variant="outline"
                      className="text-xs bg-destructive/15 text-destructive border-destructive/30"
                    >
                      {cat} · {count} complaints
                    </Badge>
                  ))}
                  {repeatedTenants.map(({ name, count }) => (
                    <Badge
                      key={name}
                      variant="outline"
                      className="text-xs bg-destructive/15 text-destructive border-destructive/30"
                    >
                      {name} · {count} complaints
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <Tabs
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as FilterType)}
          >
            <TabsList className="bg-muted/60 border border-border">
              <TabsTrigger value="all" data-ocid="complaints.filter.all">
                All ({complaints.length})
              </TabsTrigger>
              <TabsTrigger
                value={ComplaintStatus.open}
                data-ocid="complaints.filter.open"
              >
                Open ({openCount})
              </TabsTrigger>
              <TabsTrigger
                value={ComplaintStatus.resolved}
                data-ocid="complaints.filter.resolved"
              >
                Resolved ({complaints.length - openCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Select
            value={categoryFilter}
            onValueChange={(v) => setCategoryFilter(v as CategoryFilter)}
          >
            <SelectTrigger
              className="w-36 h-9 text-xs bg-card border-border"
              data-ocid="complaints.category_filter"
            >
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {Object.values(ComplaintCategory).map((cat) => (
                <SelectItem key={cat} value={cat} className="capitalize">
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3" data-ocid="complaints.loading_state">
            {(["a", "b", "c", "d"] as const).map((k) => (
              <Card key={k} className="bg-card border-border">
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-64 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card
            className="bg-card border-border"
            data-ocid="complaints.empty_state"
          >
            <CardContent className="py-16 text-center">
              <MessageSquareWarning className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                No complaints
              </h3>
              <p className="text-muted-foreground text-sm">
                {statusFilter === ComplaintStatus.open
                  ? "All complaints are resolved! 🎉"
                  : "No records found for this filter"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((c, i) => {
              const tenant = tenantMap.get(String(c.tenantId));
              const CatIcon = CATEGORY_ICON[c.category];
              const isOpen = c.status === ComplaintStatus.open;

              return (
                <Card
                  key={String(c.id)}
                  className="bg-card border-border hover:border-primary/30 transition-smooth"
                  data-ocid={`complaints.item.${i + 1}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg shrink-0 ${CATEGORY_COLOR[c.category]}`}
                      >
                        <CatIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-sm font-semibold text-card-foreground">
                            {tenant?.name ?? `Tenant #${String(c.tenantId)}`}
                          </p>
                          <Badge
                            variant="outline"
                            className={
                              isOpen
                                ? "text-xs bg-destructive/15 text-destructive border-destructive/30"
                                : "text-xs bg-chart-1/20 text-chart-1 border-chart-1/30"
                            }
                          >
                            {isOpen ? "Open" : "Resolved"}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-xs capitalize ${CATEGORY_BADGE[c.category]}`}
                          >
                            {c.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {c.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(
                            Number(c.createdAt) / 1_000_000,
                          ).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                      {isOpen && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs border-chart-1/40 text-chart-1 hover:bg-chart-1/10 shrink-0"
                          disabled={resolving}
                          onClick={() => resolveComplaint(c.id)}
                          data-ocid={`complaints.resolve_button.${i + 1}`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Complaint Dialog */}
      <Dialog open={showForm} onOpenChange={(o) => !adding && setShowForm(o)}>
        <DialogContent
          className="bg-card border-border max-w-md"
          data-ocid="complaints.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display">
              Raise New Complaint
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tenant</Label>
              <Select
                value={form.tenantId}
                onValueChange={(v) => setForm((f) => ({ ...f, tenantId: v }))}
              >
                <SelectTrigger
                  className="bg-background border-input"
                  data-ocid="complaints.tenant_select"
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
              <Label className="text-xs text-muted-foreground">Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    category: v as ComplaintCategory,
                  }))
                }
              >
                <SelectTrigger
                  className="bg-background border-input"
                  data-ocid="complaints.category_select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ComplaintCategory).map((cat) => (
                    <SelectItem key={cat} value={cat} className="capitalize">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Description
              </Label>
              <Textarea
                rows={3}
                placeholder="Describe the issue..."
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                className="bg-background border-input resize-none text-sm"
                data-ocid="complaints.description_input"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                className="border-border"
                onClick={() => setShowForm(false)}
                data-ocid="complaints.cancel_button"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button
                className="bg-primary text-primary-foreground"
                disabled={adding || !form.tenantId || !form.description.trim()}
                onClick={() => addComplaint()}
                data-ocid="complaints.submit_button"
              >
                {adding ? "Raising..." : "Raise Complaint"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
