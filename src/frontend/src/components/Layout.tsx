import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import { Bell, LogOut, Menu } from "lucide-react";
import type { ReactNode } from "react";
import { useAppStore } from "../store";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export function Layout({ children, title }: LayoutProps) {
  const { setSidebarOpen } = useAppStore();
  const { clear: logout, identity } = useInternetIdentity();
  const navigate = useNavigate();

  const principalShort = identity
    ? `${identity.getPrincipal().toString().slice(0, 10)}…`
    : "Admin";

  async function handleLogout() {
    logout();
    navigate({ to: "/login" });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      {/* Main content */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 overflow-hidden transition-smooth",
        )}
      >
        {/* Header */}
        <header className="h-16 bg-card border-b border-border flex items-center px-4 gap-3 shrink-0 shadow-xs z-20">
          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-muted-foreground"
            onClick={() => setSidebarOpen(true)}
            data-ocid="header.menu_button"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Page title */}
          {title && (
            <h1 className="font-display font-semibold text-lg text-foreground truncate">
              {title}
            </h1>
          )}

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              data-ocid="header.notifications_button"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
            </Button>

            {/* Principal badge (hidden on very small screens) */}
            <span
              className="hidden md:inline-flex items-center text-xs text-muted-foreground bg-muted/60 border border-border rounded-md px-2 py-1 font-mono select-none"
              title={identity?.getPrincipal().toString()}
            >
              {principalShort}
            </span>

            {/* Logout */}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-smooth h-8 px-2 sm:px-3"
              onClick={handleLogout}
              data-ocid="header.logout_button"
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs font-medium">
                Logout
              </span>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
