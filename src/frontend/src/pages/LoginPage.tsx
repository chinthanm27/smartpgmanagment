import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  Home,
  Loader2,
  Shield,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { login, loginStatus, identity } = useInternetIdentity();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"select" | "admin" | "tenant">("select");

  useEffect(() => {
    if (identity) {
      navigate({ to: "/admin/dashboard" });
    }
  }, [identity, navigate]);

  const isLoading = loginStatus === "logging-in";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-chart-1/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-slide-up relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4 shadow-elevated">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display font-bold text-3xl text-foreground">
            SmartPG
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Intelligent PG Management System
          </p>
        </div>

        {mode === "select" && (
          <Card
            className="bg-card border-border shadow-card"
            data-ocid="login.select.card"
          >
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="font-display text-xl text-center text-card-foreground">
                Who are you?
              </CardTitle>
              <CardDescription className="text-center text-muted-foreground">
                Choose your role to continue
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                type="button"
                onClick={() => setMode("admin")}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/30 hover:border-primary/50 hover:bg-primary/5 transition-smooth group"
                data-ocid="login.admin_option"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-smooth">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-foreground">PG Owner</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Full management access — dashboard, payments, tenants
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-smooth" />
              </button>

              <button
                type="button"
                onClick={() => navigate({ to: "/tenant/portal" })}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/30 hover:border-chart-1/50 hover:bg-chart-1/5 transition-smooth group"
                data-ocid="login.tenant_option"
              >
                <div className="w-12 h-12 rounded-xl bg-chart-1/15 flex items-center justify-center shrink-0 group-hover:bg-chart-1/20 transition-smooth">
                  <Users className="w-6 h-6 text-chart-1" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-foreground">Tenant</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    View your rent, dues, meals, and raise complaints
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-chart-1 transition-smooth" />
              </button>
            </CardContent>
          </Card>
        )}

        {mode === "admin" && (
          <Card
            className="bg-card border-border shadow-card"
            data-ocid="login.admin.card"
          >
            <CardHeader className="space-y-1 pb-4">
              <button
                type="button"
                onClick={() => setMode("select")}
                className="text-xs text-muted-foreground hover:text-foreground transition-smooth mb-1 flex items-center gap-1 w-fit"
                data-ocid="login.admin.back_button"
              >
                ← Back
              </button>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="font-display text-lg text-card-foreground">
                    Owner Login
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-xs">
                    Sign in securely with Internet Identity
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth font-semibold h-11"
                onClick={() => login()}
                disabled={isLoading}
                data-ocid="login.submit_button"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Sign in with Internet Identity
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </>
                )}
              </Button>

              <div className="rounded-lg bg-muted/40 border border-border p-3 text-xs text-muted-foreground leading-relaxed">
                <p className="font-medium text-foreground mb-1">
                  🔐 Secure &amp; Private
                </p>
                <p>
                  Internet Identity is a decentralized authentication system. No
                  passwords, no email — just your device.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tenant quick link if they somehow land here */}
        {mode === "select" && (
          <p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
            <Home className="w-3 h-3" />
            Tenants: use "Tenant" above for your portal
          </p>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
