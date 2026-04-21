import { Toaster } from "@/components/ui/sonner";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import LoginPage from "./pages/LoginPage";
import AnalyticsPage from "./pages/admin/AnalyticsPage";
import ComplaintsPage from "./pages/admin/ComplaintsPage";
import DashboardPage from "./pages/admin/DashboardPage";
import ElectricityPage from "./pages/admin/ElectricityPage";
import ExpensesPage from "./pages/admin/ExpensesPage";
import MealsPage from "./pages/admin/MealsPage";
import ParcelsPage from "./pages/admin/ParcelsPage";
import PaymentsPage from "./pages/admin/PaymentsPage";
import RoomsPage from "./pages/admin/RoomsPage";
import StaffPage from "./pages/admin/StaffPage";
import TenantsPage from "./pages/admin/TenantsPage";
import TenantPortalPage from "./pages/tenant/TenantPortalPage";

// Root route
const rootRoute = createRootRoute();

// Login route
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

// Index redirect
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/login" });
  },
  component: () => null,
});

// Admin routes
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/dashboard",
  component: DashboardPage,
});

const tenantsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/tenants",
  component: TenantsPage,
});

const roomsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/rooms",
  component: RoomsPage,
});

const paymentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/payments",
  component: PaymentsPage,
});

const electricityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/electricity",
  component: ElectricityPage,
});

const mealsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/meals",
  component: MealsPage,
});

const complaintsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/complaints",
  component: ComplaintsPage,
});

const staffRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/staff",
  component: StaffPage,
});

const parcelsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/parcels",
  component: ParcelsPage,
});

const expensesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/expenses",
  component: ExpensesPage,
});

const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/analytics",
  component: AnalyticsPage,
});

const tenantPortalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tenant/portal",
  component: TenantPortalPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  dashboardRoute,
  tenantsRoute,
  roomsRoute,
  paymentsRoute,
  electricityRoute,
  mealsRoute,
  complaintsRoute,
  staffRoute,
  parcelsRoute,
  expensesRoute,
  analyticsRoute,
  tenantPortalRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </>
  );
}
