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
  Coins,
  IndianRupee,
  Package,
  PackageCheck,
  Plus,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Layout } from "../../components/Layout";
import { createActor } from "../../services/backend";
import type { MicroCharge, Parcel, Tenant } from "../../types";

type ParcelTab = "pending" | "all";

export default function ParcelsPage() {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();
  const [parcelTab, setParcelTab] = useState<ParcelTab>("pending");
  const [showParcelForm, setShowParcelForm] = useState(false);
  const [showMicroForm, setShowMicroForm] = useState(false);
  const [parcelForm, setParcelForm] = useState({
    tenantId: "",
    description: "",
  });
  const [microForm, setMicroForm] = useState({
    tenantId: "",
    description: "",
    amount: "",
  });

  const { data: parcels = [], isLoading: parcelsLoading } = useQuery<Parcel[]>({
    queryKey: ["parcels"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getParcels();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: microCharges = [], isLoading: chargesLoading } = useQuery<
    MicroCharge[]
  >({
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

  const { mutate: collectParcel, isPending: collecting } = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.collectParcel(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parcels"] });
      toast.success("Parcel marked as collected");
    },
    onError: () => toast.error("Failed to update parcel"),
  });

  const { mutate: addParcel, isPending: addingParcel } = useMutation({
    mutationFn: async () => {
      if (!actor || !parcelForm.tenantId || !parcelForm.description)
        throw new Error("Missing fields");
      return actor.addParcel({
        tenantId: BigInt(parcelForm.tenantId),
        description: parcelForm.description,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parcels"] });
      toast.success("Parcel logged");
      setShowParcelForm(false);
      setParcelForm({ tenantId: "", description: "" });
    },
    onError: () => toast.error("Failed to log parcel"),
  });

  const { mutate: addMicroCharge, isPending: addingCharge } = useMutation({
    mutationFn: async () => {
      if (!actor || !microForm.tenantId || !microForm.amount)
        throw new Error("Missing fields");
      return actor.addMicroCharge({
        tenantId: BigInt(microForm.tenantId),
        description: microForm.description,
        amount: BigInt(Math.round(Number(microForm.amount))),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["microcharges"] });
      toast.success("Micro-charge added");
      setShowMicroForm(false);
      setMicroForm({ tenantId: "", description: "", amount: "" });
    },
    onError: () => toast.error("Failed to add micro-charge"),
  });

  const { mutate: addToRent, isPending: addingToRent } = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.markChargeAddedToRent(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["microcharges"] });
      toast.success("Charge added to rent");
    },
    onError: () => toast.error("Failed to add to rent"),
  });

  const tenantMap = new Map(tenants.map((t) => [String(t.id), t]));
  const pendingParcels = parcels.filter((p) => !p.isCollected);
  const displayedParcels = parcelTab === "pending" ? pendingParcels : parcels;
  const pendingCharges = microCharges.filter((c) => !c.addedToRent);

  return (
    <Layout title="Parcels & Charges">
      <div className="space-y-6 animate-fade-in" data-ocid="parcels.page">
        {/* Parcels Section */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/15">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-foreground">
                Parcels
              </h2>
              <p className="text-xs text-muted-foreground">
                {pendingParcels.length} awaiting collection
              </p>
            </div>
          </div>
          <Button
            className="gap-2 bg-primary text-primary-foreground"
            onClick={() => setShowParcelForm(true)}
            data-ocid="parcels.add_button"
          >
            <Plus className="w-4 h-4" />
            Log Parcel
          </Button>
        </div>

        <Tabs
          value={parcelTab}
          onValueChange={(v) => setParcelTab(v as ParcelTab)}
        >
          <TabsList className="bg-muted/60 border border-border">
            <TabsTrigger value="pending" data-ocid="parcels.tab.pending">
              Pending ({pendingParcels.length})
            </TabsTrigger>
            <TabsTrigger value="all" data-ocid="parcels.tab.all">
              All ({parcels.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {parcelsLoading ? (
          <div className="space-y-3" data-ocid="parcels.loading_state">
            {(["a", "b", "c"] as const).map((k) => (
              <Card key={k} className="bg-card border-border">
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-40 mb-2" />
                  <Skeleton className="h-3 w-56" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : displayedParcels.length === 0 ? (
          <Card
            className="bg-card border-border"
            data-ocid="parcels.empty_state"
          >
            <CardContent className="py-12 text-center">
              <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {parcelTab === "pending"
                  ? "No parcels awaiting collection"
                  : "No parcels logged yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {displayedParcels.map((parcel, i) => {
              const tenant = tenantMap.get(String(parcel.tenantId));
              const received = new Date(Number(parcel.receivedAt) / 1_000_000);
              return (
                <Card
                  key={String(parcel.id)}
                  className="bg-card border-border hover:border-primary/30 transition-smooth"
                  data-ocid={`parcels.item.${i + 1}`}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${parcel.isCollected ? "bg-chart-1/20" : "bg-primary/15"}`}
                    >
                      {parcel.isCollected ? (
                        <PackageCheck className="w-4 h-4 text-chart-1" />
                      ) : (
                        <Package className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-card-foreground truncate">
                        {tenant?.name ?? `Tenant #${String(parcel.tenantId)}`}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {parcel.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Received: {received.toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className={
                          parcel.isCollected
                            ? "text-xs bg-chart-1/20 text-chart-1 border-chart-1/30"
                            : "text-xs bg-primary/20 text-primary border-primary/30"
                        }
                      >
                        {parcel.isCollected ? "Collected" : "Pending"}
                      </Badge>
                      {!parcel.isCollected && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={collecting}
                          className="text-xs gap-1 border-chart-1/40 text-chart-1 hover:bg-chart-1/10"
                          onClick={() => collectParcel(parcel.id)}
                          data-ocid={`parcels.collect_button.${i + 1}`}
                        >
                          <PackageCheck className="w-3 h-3" />
                          Collect
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Micro-Charges Section */}
        <div className="border-t border-border pt-6">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/15">
                <Coins className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display font-bold text-xl text-foreground">
                  Micro-Charges
                </h2>
                <p className="text-xs text-muted-foreground">
                  {pendingCharges.length} pending · not yet added to rent
                </p>
              </div>
            </div>
            <Button
              className="gap-2 bg-primary text-primary-foreground"
              onClick={() => setShowMicroForm(true)}
              data-ocid="parcels.add_charge_button"
            >
              <Plus className="w-4 h-4" />
              Add Charge
            </Button>
          </div>

          {chargesLoading ? (
            <div
              className="space-y-3"
              data-ocid="parcels.charges_loading_state"
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
          ) : microCharges.length === 0 ? (
            <Card
              className="bg-card border-border"
              data-ocid="parcels.charges_empty_state"
            >
              <CardContent className="py-10 text-center">
                <Coins className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No micro-charges recorded
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {/* Pending charges first */}
              {pendingCharges.length > 0 && (
                <Card className="bg-amber-500/5 border-amber-500/20">
                  <CardHeader className="pb-2 pt-3">
                    <CardTitle className="text-xs font-semibold text-amber-400">
                      Pending — Not yet added to rent
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3 space-y-2">
                    {pendingCharges.map((charge, i) => {
                      const tenant = tenantMap.get(String(charge.tenantId));
                      return (
                        <div
                          key={String(charge.id)}
                          className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                          data-ocid={`parcels.charge_item.${i + 1}`}
                        >
                          <IndianRupee className="w-4 h-4 text-amber-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {tenant?.name ??
                                `Tenant #${String(charge.tenantId)}`}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {charge.description}
                            </p>
                          </div>
                          <p className="font-display font-bold text-amber-400 shrink-0">
                            ₹{Number(charge.amount).toLocaleString("en-IN")}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={addingToRent}
                            className="text-xs border-chart-1/40 text-chart-1 hover:bg-chart-1/10 shrink-0"
                            onClick={() => addToRent(charge.id)}
                            data-ocid={`parcels.add_to_rent_button.${i + 1}`}
                          >
                            Add to Rent
                          </Button>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* All charges history */}
              {microCharges.some((c) => c.addedToRent) && (
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2 pt-3">
                    <CardTitle className="text-xs font-semibold text-muted-foreground">
                      Added to Rent
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3 space-y-2">
                    {microCharges
                      .filter((c) => c.addedToRent)
                      .map((charge, i) => {
                        const tenant = tenantMap.get(String(charge.tenantId));
                        return (
                          <div
                            key={String(charge.id)}
                            className="flex items-center gap-3 py-2 border-b border-border last:border-0 opacity-60"
                            data-ocid={`parcels.added_charge.${i + 1}`}
                          >
                            <IndianRupee className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground line-through">
                                {tenant?.name ??
                                  `Tenant #${String(charge.tenantId)}`}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {charge.description}
                              </p>
                            </div>
                            <p className="font-display font-bold text-muted-foreground shrink-0">
                              ₹{Number(charge.amount).toLocaleString("en-IN")}
                            </p>
                            <Badge
                              variant="outline"
                              className="text-xs bg-chart-1/20 text-chart-1 border-chart-1/30 shrink-0"
                            >
                              Added
                            </Badge>
                          </div>
                        );
                      })}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Log Parcel Dialog */}
      <Dialog
        open={showParcelForm}
        onOpenChange={(o) => !addingParcel && setShowParcelForm(o)}
      >
        <DialogContent
          className="bg-card border-border max-w-md"
          data-ocid="parcels.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display">Log New Parcel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tenant</Label>
              <Select
                value={parcelForm.tenantId}
                onValueChange={(v) =>
                  setParcelForm((f) => ({ ...f, tenantId: v }))
                }
              >
                <SelectTrigger
                  className="bg-background border-input"
                  data-ocid="parcels.tenant_select"
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
                Description
              </Label>
              <Textarea
                rows={2}
                placeholder="e.g. Amazon package, blue bag"
                value={parcelForm.description}
                onChange={(e) =>
                  setParcelForm((f) => ({ ...f, description: e.target.value }))
                }
                className="bg-background border-input resize-none text-sm"
                data-ocid="parcels.description_input"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                className="border-border"
                onClick={() => setShowParcelForm(false)}
                data-ocid="parcels.cancel_button"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button
                className="bg-primary text-primary-foreground"
                disabled={
                  addingParcel ||
                  !parcelForm.tenantId ||
                  !parcelForm.description.trim()
                }
                onClick={() => addParcel()}
                data-ocid="parcels.submit_button"
              >
                {addingParcel ? "Logging..." : "Log Parcel"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Micro-Charge Dialog */}
      <Dialog
        open={showMicroForm}
        onOpenChange={(o) => !addingCharge && setShowMicroForm(o)}
      >
        <DialogContent
          className="bg-card border-border max-w-md"
          data-ocid="parcels.charge_dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display">Add Micro-Charge</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tenant</Label>
              <Select
                value={microForm.tenantId}
                onValueChange={(v) =>
                  setMicroForm((f) => ({ ...f, tenantId: v }))
                }
              >
                <SelectTrigger
                  className="bg-background border-input"
                  data-ocid="parcels.charge_tenant_select"
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
                Description
              </Label>
              <Input
                placeholder="e.g. Extra gas cylinder, AC remote battery"
                value={microForm.description}
                onChange={(e) =>
                  setMicroForm((f) => ({ ...f, description: e.target.value }))
                }
                className="bg-background border-input"
                data-ocid="parcels.charge_description_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Amount (₹)
              </Label>
              <Input
                type="number"
                min={1}
                placeholder="e.g. 150"
                value={microForm.amount}
                onChange={(e) =>
                  setMicroForm((f) => ({ ...f, amount: e.target.value }))
                }
                className="bg-background border-input"
                data-ocid="parcels.charge_amount_input"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                className="border-border"
                onClick={() => setShowMicroForm(false)}
                data-ocid="parcels.charge_cancel_button"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button
                className="bg-primary text-primary-foreground"
                disabled={
                  addingCharge || !microForm.tenantId || !microForm.amount
                }
                onClick={() => addMicroCharge()}
                data-ocid="parcels.charge_submit_button"
              >
                {addingCharge ? "Adding..." : "Add Charge"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
