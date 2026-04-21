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
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  Plus,
  Settings,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Layout } from "../../components/Layout";
import { createActor } from "../../services/backend";
import { ExpenseCategory, SplitType, TaskStatus } from "../../types";
import type { StaffTask, Tenant } from "../../types";

export default function StaffPage() {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showGeneratorForm, setShowGeneratorForm] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    assignedTo: "",
    dueDate: "",
  });
  const [generatorForm, setGeneratorForm] = useState({
    amount: "",
    notes: "",
  });

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const { data: tasks = [], isLoading } = useQuery<StaffTask[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getStaffTasks();
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

  const { mutate: toggleTask, isPending: toggling } = useMutation({
    mutationFn: async ({
      id,
      current,
    }: { id: bigint; current: TaskStatus }) => {
      if (!actor) throw new Error("Actor not available");
      const next =
        current === TaskStatus.pending ? TaskStatus.done : TaskStatus.pending;
      return actor.updateTaskStatus(id, next);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task status updated");
    },
    onError: () => toast.error("Failed to update task"),
  });

  const { mutate: addTask, isPending: addingTask } = useMutation({
    mutationFn: async () => {
      if (
        !actor ||
        !taskForm.title ||
        !taskForm.assignedTo ||
        !taskForm.dueDate
      )
        throw new Error("Missing fields");
      const dueDate =
        BigInt(new Date(taskForm.dueDate).getTime()) * BigInt(1_000_000);
      return actor.addStaffTask({
        title: taskForm.title,
        assignedTo: taskForm.assignedTo,
        dueDate,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task added");
      setShowTaskForm(false);
      setTaskForm({ title: "", assignedTo: "", dueDate: "" });
    },
    onError: () => toast.error("Failed to add task"),
  });

  const { mutate: addGeneratorCost, isPending: addingGenerator } = useMutation({
    mutationFn: async () => {
      if (!actor || !generatorForm.amount) throw new Error("Missing fields");
      return actor.addExpense({
        category: ExpenseCategory.generator,
        amount: BigInt(Math.round(Number(generatorForm.amount))),
        month: BigInt(currentMonth),
        year: BigInt(currentYear),
        notes: generatorForm.notes || "Generator / backup cost",
        splitType: SplitType.equal,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Generator cost logged and split equally among tenants");
      setShowGeneratorForm(false);
      setGeneratorForm({ amount: "", notes: "" });
    },
    onError: () => toast.error("Failed to log generator cost"),
  });

  const activeTenants = tenants.filter((t) => t.isActive);
  const tenantCount = activeTenants.length;
  const pending = tasks.filter((t) => t.status === TaskStatus.pending);
  const done = tasks.filter((t) => t.status === TaskStatus.done);
  const generatorAmount = generatorForm.amount
    ? Number(generatorForm.amount)
    : 0;
  const perTenantShare =
    tenantCount > 0 ? Math.round(generatorAmount / tenantCount) : 0;

  return (
    <Layout title="Staff Tasks">
      <div className="space-y-6 animate-fade-in" data-ocid="staff.page">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/15">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-foreground">
                Staff Tasks
              </h2>
              <p className="text-xs text-muted-foreground">
                {pending.length} pending · {done.length} done
              </p>
            </div>
          </div>
          <Button
            className="gap-2 bg-primary text-primary-foreground"
            onClick={() => setShowTaskForm(true)}
            data-ocid="staff.add_button"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        </div>

        {/* Task list */}
        {isLoading ? (
          <div className="space-y-3" data-ocid="staff.loading_state">
            {(["a", "b", "c", "d"] as const).map((k) => (
              <Card key={k} className="bg-card border-border">
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <Card className="bg-card border-border" data-ocid="staff.empty_state">
            <CardContent className="py-16 text-center">
              <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                No tasks yet
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                Add staff tasks to track daily operations
              </p>
              <Button
                className="gap-2 bg-primary text-primary-foreground"
                onClick={() => setShowTaskForm(true)}
                data-ocid="staff.empty_add_button"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tasks.map((task, i) => {
              const isPending = task.status === TaskStatus.pending;
              const due = new Date(Number(task.dueDate) / 1_000_000);
              return (
                <Card
                  key={String(task.id)}
                  className="bg-card border-border hover:border-primary/30 transition-smooth"
                  data-ocid={`staff.item.${i + 1}`}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <button
                      type="button"
                      disabled={toggling}
                      onClick={() =>
                        toggleTask({ id: task.id, current: task.status })
                      }
                      className="shrink-0 transition-smooth hover:scale-110"
                      data-ocid={`staff.toggle.${i + 1}`}
                      aria-label={
                        isPending ? "Mark as done" : "Mark as pending"
                      }
                    >
                      {isPending ? (
                        <Clock className="w-5 h-5 text-amber-400" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-chart-1" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-semibold ${isPending ? "text-card-foreground" : "text-muted-foreground line-through"}`}
                      >
                        {task.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Assigned to: {task.assignedTo} · Due:{" "}
                        {due.toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        isPending
                          ? "text-xs bg-amber-400/15 text-amber-400 border-amber-400/30"
                          : "text-xs bg-chart-1/20 text-chart-1 border-chart-1/30"
                      }
                    >
                      {isPending ? "Pending" : "Done"}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Generator / Backup Cost Section */}
        <Card
          className="bg-card border-border"
          data-ocid="staff.generator_section"
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Generator & Backup Costs
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs border-border"
                onClick={() => setShowGeneratorForm(true)}
                data-ocid="staff.generator_add_button"
              >
                <Plus className="w-3.5 h-3.5" />
                Log Cost
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border">
              <Settings className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Generator costs are logged as expenses with{" "}
                <span className="text-foreground font-medium">equal split</span>{" "}
                across all {tenantCount} active tenants. Use the "Log Cost"
                button to record generator or backup power expenses for this
                month.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Task Dialog */}
      <Dialog
        open={showTaskForm}
        onOpenChange={(o) => !addingTask && setShowTaskForm(o)}
      >
        <DialogContent
          className="bg-card border-border max-w-md"
          data-ocid="staff.task_dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display">Add Staff Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Task Title
              </Label>
              <Input
                placeholder="e.g. Clean common area"
                value={taskForm.title}
                onChange={(e) =>
                  setTaskForm((f) => ({ ...f, title: e.target.value }))
                }
                className="bg-background border-input"
                data-ocid="staff.task_title_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Assigned To
              </Label>
              <Input
                placeholder="e.g. Ramu, House Keeper"
                value={taskForm.assignedTo}
                onChange={(e) =>
                  setTaskForm((f) => ({ ...f, assignedTo: e.target.value }))
                }
                className="bg-background border-input"
                data-ocid="staff.assigned_to_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Due Date</Label>
              <Input
                type="date"
                value={taskForm.dueDate}
                onChange={(e) =>
                  setTaskForm((f) => ({ ...f, dueDate: e.target.value }))
                }
                className="bg-background border-input"
                data-ocid="staff.due_date_input"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                className="border-border"
                onClick={() => setShowTaskForm(false)}
                data-ocid="staff.task_cancel_button"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button
                className="bg-primary text-primary-foreground"
                disabled={
                  addingTask ||
                  !taskForm.title.trim() ||
                  !taskForm.assignedTo.trim() ||
                  !taskForm.dueDate
                }
                onClick={() => addTask()}
                data-ocid="staff.task_submit_button"
              >
                {addingTask ? "Adding..." : "Add Task"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generator Cost Dialog */}
      <Dialog
        open={showGeneratorForm}
        onOpenChange={(o) => !addingGenerator && setShowGeneratorForm(o)}
      >
        <DialogContent
          className="bg-card border-border max-w-md"
          data-ocid="staff.generator_dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display">
              Log Generator Cost
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Total Amount (₹)
              </Label>
              <Input
                type="number"
                min={1}
                placeholder="e.g. 2400"
                value={generatorForm.amount}
                onChange={(e) =>
                  setGeneratorForm((f) => ({ ...f, amount: e.target.value }))
                }
                className="bg-background border-input"
                data-ocid="staff.generator_amount_input"
              />
            </div>
            {tenantCount > 0 && generatorAmount > 0 && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-xs text-muted-foreground">
                  Per-tenant share ({tenantCount} tenants):
                </p>
                <p className="text-sm font-display font-bold text-primary">
                  ₹{perTenantShare.toLocaleString("en-IN")} / tenant
                </p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Notes</Label>
              <Input
                placeholder="Optional notes"
                value={generatorForm.notes}
                onChange={(e) =>
                  setGeneratorForm((f) => ({ ...f, notes: e.target.value }))
                }
                className="bg-background border-input"
                data-ocid="staff.generator_notes_input"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                className="border-border"
                onClick={() => setShowGeneratorForm(false)}
                data-ocid="staff.generator_cancel_button"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button
                className="bg-primary text-primary-foreground"
                disabled={addingGenerator || !generatorForm.amount}
                onClick={() => addGeneratorCost()}
                data-ocid="staff.generator_submit_button"
              >
                {addingGenerator ? "Logging..." : "Log Cost"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
