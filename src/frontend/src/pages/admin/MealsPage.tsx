import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Coffee, IndianRupee, UtensilsCrossed } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Layout } from "../../components/Layout";
import { createActor } from "../../services/backend";
import type { MealRecord, Tenant } from "../../types";

const DAYS_IN_MONTH = (month: number, year: number) =>
  new Date(year, month, 0).getDate();

export default function MealsPage() {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const [chargePerDay, setChargePerDay] = useState(60);

  const { data: meals = [], isLoading: mealsLoading } = useQuery<MealRecord[]>({
    queryKey: ["meals"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMealRecords();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: tenants = [], isLoading: tenantsLoading } = useQuery<Tenant[]>({
    queryKey: ["tenants"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTenants();
    },
    enabled: !!actor && !isFetching,
  });

  const { mutate: toggleMeal } = useMutation({
    mutationFn: async ({
      tenantId,
      date,
      isEating,
    }: { tenantId: bigint; date: bigint; isEating: boolean }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.toggleMeal({
        tenantId,
        date,
        isEating,
        chargePerDay: BigInt(chargePerDay),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meals"] });
    },
    onError: () => toast.error("Failed to toggle meal"),
  });

  const activeTenants = tenants.filter((t) => t.isActive);
  const daysInMonth = DAYS_IN_MONTH(currentMonth, currentYear);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Build a set of "tenantId-date" for quick lookup
  const mealSet = useMemo(() => {
    const set = new Set<string>();
    for (const m of meals) {
      if (m.isEating) {
        const d = new Date(Number(m.date) / 1_000_000);
        if (
          d.getMonth() + 1 === currentMonth &&
          d.getFullYear() === currentYear
        ) {
          set.add(`${String(m.tenantId)}-${d.getDate()}`);
        }
      }
    }
    return set;
  }, [meals, currentMonth, currentYear]);

  const isLoading = mealsLoading || tenantsLoading;

  const messCharges = useMemo(() => {
    return activeTenants.map((t) => {
      let daysEating = 0;
      for (let d = 1; d <= daysInMonth; d++) {
        if (mealSet.has(`${String(t.id)}-${d}`)) daysEating++;
      }
      return { tenant: t, daysEating, total: daysEating * chargePerDay };
    });
  }, [activeTenants, mealSet, daysInMonth, chargePerDay]);

  const handleToggle = (tenantId: bigint, day: number) => {
    const date = new Date(currentYear, currentMonth - 1, day);
    const ts = BigInt(date.getTime()) * BigInt(1_000_000);
    const key = `${String(tenantId)}-${day}`;
    const isEating = !mealSet.has(key);
    toggleMeal({ tenantId, date: ts, isEating });
  };

  return (
    <Layout title="Meals">
      <div className="space-y-6 animate-fade-in" data-ocid="meals.page">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/15">
              <UtensilsCrossed className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-foreground">
                Meals & Mess
              </h2>
              <p className="text-xs text-muted-foreground">
                Toggle daily meal participation for each tenant
              </p>
            </div>
          </div>
          {/* Charge per day setting */}
          <div
            className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2"
            data-ocid="meals.charge_input"
          >
            <IndianRupee className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex flex-col">
              <Label className="text-xs text-muted-foreground leading-none mb-1">
                Charge/day
              </Label>
              <Input
                type="number"
                min={1}
                value={chargePerDay}
                onChange={(e) => setChargePerDay(Number(e.target.value))}
                className="h-6 w-20 text-sm border-0 p-0 bg-transparent focus-visible:ring-0 font-semibold"
                data-ocid="meals.charge_per_day_input"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3" data-ocid="meals.loading_state">
            {(["a", "b", "c"] as const).map((k) => (
              <Card key={k} className="bg-card border-border">
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-32 mb-3" />
                  <div className="flex gap-1 flex-wrap">
                    {(
                      [
                        "1",
                        "2",
                        "3",
                        "4",
                        "5",
                        "6",
                        "7",
                        "8",
                        "9",
                        "10",
                      ] as const
                    ).map((n) => (
                      <Skeleton
                        key={`sk-${k}-${n}`}
                        className="h-7 w-7 rounded"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : activeTenants.length === 0 ? (
          <Card className="bg-card border-border" data-ocid="meals.empty_state">
            <CardContent className="py-16 text-center">
              <Coffee className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                No active tenants
              </h3>
              <p className="text-muted-foreground text-sm">
                Add tenants to manage meal toggles
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Meal Toggle Grid */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-foreground">
                  {new Date(currentYear, currentMonth - 1).toLocaleString(
                    "en-IN",
                    { month: "long", year: "numeric" },
                  )}{" "}
                  — Daily Meal Toggles
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto pb-4">
                <div className="min-w-max">
                  {/* Day headers */}
                  <div className="flex gap-1 mb-2 pl-36">
                    {days.map((d) => (
                      <div
                        key={`day-${d}`}
                        className="w-7 text-center text-[10px] text-muted-foreground font-mono"
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                  {/* Tenant rows */}
                  <div className="space-y-1.5">
                    {activeTenants.map((tenant, ti) => (
                      <div
                        key={String(tenant.id)}
                        className="flex items-center gap-1"
                        data-ocid={`meals.tenant_row.${ti + 1}`}
                      >
                        <div className="w-32 shrink-0 text-xs font-medium text-foreground truncate pr-2">
                          {tenant.name}
                        </div>
                        {days.map((d) => {
                          const eating = mealSet.has(
                            `${String(tenant.id)}-${d}`,
                          );
                          return (
                            <button
                              key={`cell-${String(tenant.id)}-${d}`}
                              type="button"
                              onClick={() => handleToggle(tenant.id, d)}
                              title={
                                eating
                                  ? "Eating — click to opt out"
                                  : "Not eating — click to opt in"
                              }
                              aria-label={`${tenant.name} day ${d}: ${eating ? "eating" : "not eating"}`}
                              className={`w-7 h-7 rounded text-[10px] font-bold transition-smooth border ${
                                eating
                                  ? "bg-amber-500/80 border-amber-500/60 text-amber-50 hover:bg-amber-400"
                                  : "bg-muted/40 border-border text-muted-foreground hover:bg-muted"
                              }`}
                              data-ocid={`meals.cell.${ti + 1}.${d}`}
                            >
                              {eating ? "✓" : ""}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Mess Charges */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-primary" />
                  Monthly Mess Charges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {messCharges.map((row, i) => (
                    <div
                      key={String(row.tenant.id)}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                      data-ocid={`meals.charge_row.${i + 1}`}
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {row.tenant.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {row.daysEating} days × ₹{chargePerDay}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          row.total > 0
                            ? "bg-amber-500/15 text-amber-400 border-amber-500/30 font-mono text-sm px-3"
                            : "bg-muted text-muted-foreground border-border font-mono text-sm px-3"
                        }
                      >
                        ₹{row.total.toLocaleString("en-IN")}
                      </Badge>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-sm font-semibold text-foreground">
                      Total Mess Revenue
                    </p>
                    <p className="font-display font-bold text-lg text-primary">
                      ₹
                      {messCharges
                        .reduce((s, r) => s + r.total, 0)
                        .toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}
