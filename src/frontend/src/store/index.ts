import { create } from "zustand";
import type {
  Bed,
  Complaint,
  DashboardStats,
  Expense,
  GuestLog,
  MealRecord,
  MicroCharge,
  Parcel,
  Payment,
  Room,
  StaffTask,
  Tenant,
} from "../types";

interface AppStore {
  tenants: Tenant[];
  rooms: Room[];
  beds: Bed[];
  payments: Payment[];
  complaints: Complaint[];
  expenses: Expense[];
  meals: MealRecord[];
  tasks: StaffTask[];
  parcels: Parcel[];
  microCharges: MicroCharge[];
  guestLogs: GuestLog[];
  dashboardStats: DashboardStats | null;
  sidebarOpen: boolean;

  setTenants: (tenants: Tenant[]) => void;
  setRooms: (rooms: Room[]) => void;
  setBeds: (beds: Bed[]) => void;
  setPayments: (payments: Payment[]) => void;
  setComplaints: (complaints: Complaint[]) => void;
  setExpenses: (expenses: Expense[]) => void;
  setMeals: (meals: MealRecord[]) => void;
  setTasks: (tasks: StaffTask[]) => void;
  setParcels: (parcels: Parcel[]) => void;
  setMicroCharges: (microCharges: MicroCharge[]) => void;
  setGuestLogs: (guestLogs: GuestLog[]) => void;
  setDashboardStats: (stats: DashboardStats) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  tenants: [],
  rooms: [],
  beds: [],
  payments: [],
  complaints: [],
  expenses: [],
  meals: [],
  tasks: [],
  parcels: [],
  microCharges: [],
  guestLogs: [],
  dashboardStats: null,
  sidebarOpen: false,

  setTenants: (tenants) => set({ tenants }),
  setRooms: (rooms) => set({ rooms }),
  setBeds: (beds) => set({ beds }),
  setPayments: (payments) => set({ payments }),
  setComplaints: (complaints) => set({ complaints }),
  setExpenses: (expenses) => set({ expenses }),
  setMeals: (meals) => set({ meals }),
  setTasks: (tasks) => set({ tasks }),
  setParcels: (parcels) => set({ parcels }),
  setMicroCharges: (microCharges) => set({ microCharges }),
  setGuestLogs: (guestLogs) => set({ guestLogs }),
  setDashboardStats: (dashboardStats) => set({ dashboardStats }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
