import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Link, useLocation } from "@tanstack/react-router";
import {
  BarChart3,
  BedDouble,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  MessageSquareWarning,
  Package,
  Receipt,
  Users,
  UtensilsCrossed,
  X,
  Zap,
} from "lucide-react";
import { useAppStore } from "../store";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Tenants", path: "/admin/tenants", icon: Users },
  { label: "Rooms & Beds", path: "/admin/rooms", icon: BedDouble },
  { label: "Payments", path: "/admin/payments", icon: CreditCard },
  { label: "Electricity", path: "/admin/electricity", icon: Zap },
  { label: "Meals", path: "/admin/meals", icon: UtensilsCrossed },
  {
    label: "Complaints",
    path: "/admin/complaints",
    icon: MessageSquareWarning,
  },
  { label: "Staff Tasks", path: "/admin/staff", icon: ClipboardList },
  { label: "Parcels", path: "/admin/parcels", icon: Package },
  { label: "Expenses", path: "/admin/expenses", icon: Receipt },
  { label: "Analytics", path: "/admin/analytics", icon: BarChart3 },
];

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useAppStore();
  const location = useLocation();
  const { identity } = useInternetIdentity();

  const principalShort = identity
    ? `${identity.getPrincipal().toString().slice(0, 12)}…`
    : "Loading…";

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setSidebarOpen(false);
          }}
          onKeyUp={(e) => {
            if (e.key === "Enter" || e.key === " ") setSidebarOpen(false);
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        data-ocid="sidebar"
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-smooth",
          sidebarOpen ? "w-64" : "w-16",
          "lg:relative lg:translate-x-0",
          !sidebarOpen && "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-sidebar-border shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-primary-foreground" />
            </div>
            {sidebarOpen && (
              <span className="font-display font-bold text-lg text-sidebar-foreground truncate">
                SmartPG
              </span>
            )}
          </div>
          {sidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto shrink-0 text-muted-foreground hover:text-sidebar-foreground lg:flex hidden"
              onClick={toggleSidebar}
              data-ocid="sidebar.toggle"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
          {/* Mobile close */}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto shrink-0 text-muted-foreground hover:text-sidebar-foreground lg:hidden"
            onClick={() => setSidebarOpen(false)}
            data-ocid="sidebar.close_button"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-ocid={`sidebar.nav.${item.label.toLowerCase().replace(/\s+/g, "_")}`}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-smooth text-sm font-medium group",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    "w-4.5 h-4.5 shrink-0",
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground group-hover:text-sidebar-accent-foreground",
                  )}
                  style={{ width: "18px", height: "18px" }}
                />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop) */}
        {!sidebarOpen && (
          <div className="px-2 pb-2 hidden lg:block">
            <Button
              variant="ghost"
              size="icon"
              className="w-full text-muted-foreground hover:text-sidebar-foreground"
              onClick={toggleSidebar}
              data-ocid="sidebar.expand"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* User footer */}
        <div className="border-t border-sidebar-border p-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary font-bold text-xs">
              PG
            </div>
            {sidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-sidebar-foreground truncate">
                  Owner
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {principalShort}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
